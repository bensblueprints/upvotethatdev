import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      console.error("Missing stripe signature or webhook secret");
      return new Response("Missing signature or webhook secret", { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log("Received webhook event:", event.type);

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processing completed checkout session:", session.id);

      // Find the order by stripe_session_id
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('stripe_session_id', session.id)
        .single();

      if (orderError || !order) {
        console.error("Order not found for session:", session.id, orderError);
        return new Response("Order not found", { status: 404 });
      }

      if (order.status === 'succeeded') {
        console.log("Order already processed:", order.id);
        return new Response("Order already processed", { status: 200 });
      }

      // Verify the payment was successful
      if (session.payment_status === 'paid') {
        const amountInDollars = (session.amount_total || 0) / 100;
        
        console.log(`Processing payment for user ${order.user_id}: $${amountInDollars}`);

        // Update the order status
        const { error: updateOrderError } = await supabaseAdmin
          .from('orders')
          .update({ 
            status: 'succeeded',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (updateOrderError) {
          console.error("Failed to update order status:", updateOrderError);
          return new Response("Failed to update order", { status: 500 });
        }

        if (order.user_id) {
          // Get current balance and update it
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('balance')
            .eq('id', order.user_id)
            .single();

          if (profileError) {
            console.error("Failed to get user profile:", profileError);
            return new Response("Failed to get user profile", { status: 500 });
          }

          // Update user balance directly
          const { error: balanceError } = await supabaseAdmin
            .from('profiles')
            .update({ 
              balance: (profile.balance || 0) + amountInDollars
            })
            .eq('id', order.user_id);

          if (balanceError) {
            console.error("Failed to update user balance:", balanceError);
            return new Response("Failed to update balance", { status: 500 });
          }

          // Create a transaction record directly
          const { error: transactionError } = await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: order.user_id,
              type: 'deposit',
              amount: amountInDollars,
              description: `Stripe payment deposit - Session ${session.id}`,
              status: 'completed'
            });

          if (transactionError) {
            console.error("Failed to create transaction record:", transactionError);
            // Don't fail the webhook for this, balance was updated successfully
          }

          console.log(`Successfully processed payment: User ${order.user_id} balance increased by $${amountInDollars}`);
        }
      } else {
        console.log("Payment not completed, status:", session.payment_status);
        
        // Update order status to failed
        await supabaseAdmin
          .from('orders')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(`Webhook Error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
}); 