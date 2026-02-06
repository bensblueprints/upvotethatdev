import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    console.log("Starting crypto payment creation...");
    
    const { amount, currency = 'USDT' } = await req.json();
    console.log("Payment request:", { amount, currency });

    if (!amount || amount < 1) {
      throw new Error("Minimum deposit amount is $1.");
    }

    const apiKey = Deno.env.get("NOWPAYMENTS_API_KEY");
    console.log("API Key exists:", !!apiKey);
    if (!apiKey) {
      throw new Error("NowPayments API key not configured");
    }

    // Some environments / clients may omit the Origin header. NowPayments can reject invalid URLs,
    // so always provide a sane fallback.
    const originHeader = req.headers.get("origin");
    const fallbackOrigin = Deno.env.get("PUBLIC_SITE_URL") || "https://www.upvotethat.com";
    const origin = originHeader || fallbackOrigin;
    console.log("Origin:", { originHeader, origin });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    console.log("User auth:", { userId: user?.id, error: userError });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get current NowPayments rate
    console.log("Getting NowPayments estimate...");
    const estimateResponse = await fetch(`https://api.nowpayments.io/v1/estimate?amount=${amount}&currency_from=usd&currency_to=${currency}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    console.log("Estimate response status:", estimateResponse.status);
    if (!estimateResponse.ok) {
      const errorText = await estimateResponse.text();
      console.error('NowPayments estimate error:', errorText);
      throw new Error(`Failed to get crypto conversion rate: ${errorText}`);
    }

    const estimate = await estimateResponse.json();
    console.log("Estimate result:", estimate);

    // Create payment with NowPayments
    const paymentData = {
      price_amount: amount,
      price_currency: 'usd',
      pay_currency: currency,
      ipn_callback_url: `https://kuuulgjkgyhgzkjyembj.supabase.co/functions/v1/nowpayments-webhook`,
      order_id: `order_${Date.now()}_${user?.id?.slice(0, 8) || 'guest'}`,
      order_description: `Wallet deposit - $${amount}`,
      success_url: `${origin}/dashboard?payment_status=success&amount=${amount}`,
      cancel_url: `${origin}/dashboard?payment_status=cancelled`,
    };

    console.log("Creating payment with data:", paymentData);
    const paymentResponse = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    console.log("Payment response status:", paymentResponse.status);
    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.text();
      console.error('NowPayments payment error:', errorData);
      throw new Error(`Failed to create crypto payment: ${errorData}`);
    }

    const payment = await paymentResponse.json();
    console.log("Payment created:", { payment_id: payment.payment_id, payment_url: payment.payment_url });

    // Store order in database
    console.log("Inserting order into database...");
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user ? user.id : null,
        nowpayments_payment_id: payment.payment_id,
        amount_total: Math.round(amount * 100), // Store in cents like Stripe
        currency: 'usd',
        status: 'pending',
        payment_method: 'crypto',
      });

    if (orderError) {
      console.error('Database insert error:', orderError);
      throw new Error(`Failed to save order details: ${orderError.message}`);
    }

    console.log("Order saved successfully");
    return new Response(JSON.stringify({ 
      payment_url: payment.payment_url,
      payment_id: payment.payment_id,
      crypto_amount: estimate.estimated_amount,
      crypto_currency: currency
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Crypto payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 