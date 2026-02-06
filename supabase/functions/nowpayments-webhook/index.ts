import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHash, createHmac } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const nowpaymentsSecret = Deno.env.get("NOWPAYMENTS_IPN_SECRET");
    
    if (!nowpaymentsSecret) {
      console.error("NowPayments IPN secret not configured");
      return new Response("IPN secret not configured", { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.text();
    const hmacHeader = req.headers.get("x-nowpayments-sig");

    if (!hmacHeader) {
      console.error("Missing NowPayments signature");
      return new Response("Missing signature", { status: 400 });
    }

    // Verify the webhook signature
    const hmac = createHmac("sha512", nowpaymentsSecret);
    hmac.update(body);
    const expectedSignature = hmac.toString();

    if (hmacHeader !== expectedSignature) {
      console.error("Invalid NowPayments signature");
      return new Response("Invalid signature", { status: 400 });
    }

    const webhookData = JSON.parse(body);
    console.log("Received NowPayments webhook:", webhookData);

    // Find the order by nowpayments_payment_id
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('nowpayments_payment_id', webhookData.payment_id)
      .single();

    if (orderError || !order) {
      console.error("Order not found for payment:", webhookData.payment_id, orderError);
      return new Response("Order not found", { status: 404 });
    }

    if (order.status === 'succeeded') {
      console.log("Order already processed:", order.id);
      return new Response("Order already processed", { status: 200 });
    }

    // Handle payment status changes
    if (webhookData.payment_status === 'finished') {
      const amountInDollars = order.amount_total / 100; // Convert from cents
      
      console.log(`Processing crypto payment for user ${order.user_id}: $${amountInDollars}`);

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
            description: `Crypto payment deposit - Payment ${webhookData.payment_id}`,
            status: 'completed'
          });

        if (transactionError) {
          console.error("Failed to create transaction record:", transactionError);
          // Don't fail the webhook for this, balance was updated successfully
        }

        console.log(`Successfully processed crypto payment: User ${order.user_id} balance increased by $${amountInDollars}`);
      }
    } else if (['failed', 'refunded', 'expired'].includes(webhookData.payment_status)) {
      console.log("Payment failed, status:", webhookData.payment_status);
      
      // Update order status to failed
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
    } else {
      console.log("Payment status update:", webhookData.payment_status);
      
      // Update order with current status but don't process balance yet
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: webhookData.payment_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("NowPayments webhook processing error:", error);
    return new Response(`Webhook Error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
}); 