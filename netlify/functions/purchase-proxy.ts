import { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const proxycheapApiKey = process.env.VITE_PROXYCHEAP_API_KEY_1!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PurchaseProxyRequest {
  orderId: string;
  planType: 'residential' | 'datacenter' | 'mobile';
  country: string;
  bandwidth: string;
  quantity: number;
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { orderId, planType, country, bandwidth, quantity }: PurchaseProxyRequest = JSON.parse(event.body || '{}');

    if (!orderId || !planType || !country || !bandwidth || !quantity) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Get the order from database to verify it exists and is pending
    const { data: order, error: orderError } = await supabase
      .from('proxy_orders')
      .select('*')
      .eq('id', orderId)
      .eq('status', 'Pending')
      .single();

    if (orderError || !order) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Order not found or already processed' }),
      };
    }

    // Map our plan types to ProxyCheap network types
    const networkTypeMap: Record<string, string> = {
      'residential': 'RESIDENTIAL',
      'datacenter': 'DATACENTER',
      'mobile': 'MOBILE'
    };

    // Convert country name to 2-letter code (simplified mapping)
    const countryCodeMap: Record<string, string> = {
      'United States': 'US',
      'United Kingdom': 'GB',
      'Germany': 'DE',
      'France': 'FR',
      'Canada': 'CA',
      'Netherlands': 'NL',
      'Spain': 'ES'
    };

    const countryCode = countryCodeMap[country] || 'US';

    // Parse bandwidth (e.g., "1 GB" -> 1)
    const bandwidthAmount = parseInt(bandwidth.split(' ')[0]);

    // Make ProxyCheap API request
    const proxycheapResponse = await fetch('https://api.proxy-cheap.com/v1/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${proxycheapApiKey}`
      },
      body: JSON.stringify({
        networkType: networkTypeMap[planType],
        country: countryCode,
        quantity: quantity,
        bandwidth: bandwidthAmount,
        proxyProtocol: 'HTTP',
        authType: 'USERNAME_PASSWORD',
        ipVersion: 'IPv4'
      })
    });

    if (!proxycheapResponse.ok) {
      const errorData = await proxycheapResponse.json().catch(() => ({}));
      console.error('ProxyCheap API error:', errorData);

      // Update order status to failed
      await supabase
        .from('proxy_orders')
        .update({ status: 'Cancelled' })
        .eq('id', orderId);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to purchase proxies from ProxyCheap',
          details: errorData
        }),
      };
    }

    const proxycheapData = await proxycheapResponse.json();

    // Get proxy details from ProxyCheap
    const proxyDetailsResponse = await fetch(`https://api.proxy-cheap.com/v1/proxies/${proxycheapData.id}`, {
      headers: {
        'Authorization': `Bearer ${proxycheapApiKey}`
      }
    });

    let proxyCredentials = {};
    if (proxyDetailsResponse.ok) {
      const proxyDetails = await proxyDetailsResponse.json();
      proxyCredentials = {
        host: proxyDetails.host,
        port: proxyDetails.port,
        username: proxyDetails.username,
        password: proxyDetails.password,
        protocol: proxyDetails.protocol,
        expiresAt: proxyDetails.expiresAt
      };
    }

    // Update order with proxy credentials
    const { error: updateError } = await supabase
      .from('proxy_orders')
      .update({
        status: 'Active',
        proxy_credentials: proxyCredentials,
        proxycheap_order_id: proxycheapData.id,
        expires_at: proxycheapData.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update order with credentials' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        orderId: orderId,
        proxyCredentials: proxyCredentials
      }),
    };

  } catch (error: any) {
    console.error('Purchase proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
