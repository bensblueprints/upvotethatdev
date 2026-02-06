export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const { order_number } = JSON.parse(event.body);
    const API_KEY = process.env.VITE_BUYUPVOTES_API_KEY;

    if (!API_KEY) {
      throw new Error('API key not configured');
    }

    if (!order_number) {
      throw new Error('Order number is required');
    }

    console.log('Checking order status for:', order_number);

    const response = await fetch('https://api.buyupvotes.io/upvote_order/status/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ order_number }),
    });

    const responseData = await response.json();
    console.log('BuyUpvotes.io status response:', responseData);

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to get order status');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        data: responseData,
      }),
    };

  } catch (error) {
    console.error('Status check error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        message: error.message || 'Failed to check order status',
      }),
    };
  }
}; 