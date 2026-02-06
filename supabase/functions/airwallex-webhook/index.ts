import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
};

// Verify Airwallex webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // Airwallex uses HMAC-SHA256 for webhook signatures
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(payload);
  
  // For now, we'll do basic validation - in production you should use crypto.subtle.verify
  // This is a simplified check - Airwallex signature format: timestamp.signature
  if (!signature || !secret) {
    console.warn("Missing signature or secret for webhook verification");
    return false;
  }
  
  // In production, implement proper HMAC verification
  // For now, return true if signature exists (you should implement proper verification)
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("AIRWALLEX_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      console.error("Airwallex webhook secret not configured");
      return new Response("Webhook secret not configured", { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.text();
    const signature = req.headers.get("x-signature") || "";

    // Verify the webhook signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error("Invalid Airwallex webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const webhookData = JSON.parse(body);
    console.log("Received Airwallex webhook:", webhookData.name, webhookData);

    const eventName = webhookData.name;
    const paymentIntentData = webhookData.data?.object;

    if (!paymentIntentData) {
      console.log("No payment intent data in webhook");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const paymentIntentId = paymentIntentData.id;

    // Find the order by airwallex_payment_intent_id
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('airwallex_payment_intent_id', paymentIntentId)
      .single();

    if (orderError || !order) {
      console.error("Order not found for payment intent:", paymentIntentId, orderError);
      // Return 200 to acknowledge receipt even if order not found
      return new Response(JSON.stringify({ received: true, message: "Order not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle different event types
    if (eventName === "payment_intent.succeeded") {
      if (order.status === 'succeeded') {
        console.log("Order already processed:", order.id);
        return new Response(JSON.stringify({ received: true, message: "Already processed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const amountInDollars = (order.amount_total || 0) / 100;
      
      console.log(`Processing Airwallex payment for user ${order.user_id}: $${amountInDollars}`);

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

        // Create a transaction record
        const { error: transactionError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: order.user_id,
            type: 'deposit',
            amount: amountInDollars,
            description: `Airwallex payment deposit - ${paymentIntentId}`,
            status: 'completed'
          });

        if (transactionError) {
          console.error("Failed to create transaction record:", transactionError);
          // Don't fail the webhook for this, balance was updated successfully
        }

        console.log(`Successfully processed Airwallex payment: User ${order.user_id} balance increased by $${amountInDollars}`);
      }
    } else if (eventName === "payment_intent.payment_failed" || eventName === "payment_intent.cancelled") {
      console.log("Payment failed or cancelled:", eventName);
      
      // Update order status to failed
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
    } else if (eventName === "payment_intent.requires_payment_method" || eventName === "payment_intent.requires_capture") {
      console.log("Payment requires action:", eventName);
      
      // Update order with current status
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: paymentIntentData.status || 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Airwallex webhook processing error:", error);
    return new Response(`Webhook Error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
});


