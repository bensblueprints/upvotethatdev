import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Airwallex API endpoints
const AIRWALLEX_API_URL = Deno.env.get("AIRWALLEX_API_URL") || "https://api.airwallex.com"; // Use https://api-demo.airwallex.com for sandbox

async function getAirwallexAccessToken(): Promise<string> {
  const clientId = Deno.env.get("AIRWALLEX_CLIENT_ID");
  const apiKey = Deno.env.get("AIRWALLEX_API_KEY");
  const accountId = Deno.env.get("AIRWALLEX_ACCOUNT_ID"); // Required for scoped API keys

  if (!clientId || !apiKey) {
    throw new Error("Airwallex credentials not configured");
  }

  // Build headers - x-login-as is required for scoped API keys
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-client-id": clientId,
    "x-api-key": apiKey,
  };

  // Add x-login-as header if account ID is provided (required for scoped keys)
  if (accountId) {
    headers["x-login-as"] = accountId;
  }

  console.log("Authenticating with Airwallex...", { clientId, hasAccountId: !!accountId });

  const response = await fetch(`${AIRWALLEX_API_URL}/api/v1/authentication/login`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Airwallex auth error:", errorText);
    throw new Error(`Failed to authenticate with Airwallex: ${response.status}`);
  }

  const data = await response.json();
  return data.token;
}

async function createPaymentIntent(
  accessToken: string,
  amount: number,
  currency: string,
  orderId: string,
  returnUrl: string
): Promise<{ id: string; client_secret: string }> {
  const response = await fetch(`${AIRWALLEX_API_URL}/api/v1/pa/payment_intents/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      request_id: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      amount: amount,
      currency: currency,
      merchant_order_id: orderId,
      return_url: returnUrl,
      metadata: {
        order_id: orderId,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Airwallex create payment intent error:", errorText);
    throw new Error(`Failed to create payment intent: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    client_secret: data.client_secret,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount } = await req.json();

    if (!amount || amount < 100) { // Min $1 in cents
      throw new Error("Minimum deposit amount is $1.");
    }

    const amountInDollars = amount / 100;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const origin = req.headers.get("origin") || "https://www.upvotethat.com";
    const orderId = `order_${Date.now()}_${user?.id?.slice(0, 8) || 'guest'}`;

    // Step 1: Get Airwallex access token
    console.log("Getting Airwallex access token...");
    const accessToken = await getAirwallexAccessToken();

    // Step 2: Create PaymentIntent
    console.log("Creating Airwallex PaymentIntent...");
    const paymentIntent = await createPaymentIntent(
      accessToken,
      amountInDollars,
      "USD",
      orderId,
      `${origin}/dashboard?payment_status=success&amount=${amountInDollars}`
    );

    console.log("PaymentIntent created:", paymentIntent.id);

    // Step 3: Store order in database
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user ? user.id : null,
        airwallex_payment_intent_id: paymentIntent.id,
        amount_total: amount,
        currency: 'usd',
        status: 'pending',
        payment_method: 'card',
      });

    if (orderError) {
      console.error('Error inserting order:', orderError);
      throw new Error('Failed to save order details.');
    }

    // Return the PaymentIntent details; frontend should use Airwallex SDK (redirectToCheckout).
    return new Response(JSON.stringify({
      intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      currency: "USD",
      amount: amountInDollars,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Airwallex checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});


