export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const orderData = JSON.parse(event.body);
    const API_KEY = process.env.BUYUPVOTES_API_KEY || process.env.VITE_BUYUPVOTES_API_KEY;

    if (!API_KEY) {
      throw new Error('API key not configured');
    }

    console.log('Submitting comment order to BuyUpvotes.io:', orderData);

    const response = await fetch('https://api.buyupvotes.io/comment_order/submit/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(orderData),
    });

    const responseData = await response.json();
    console.log('BuyUpvotes.io comment order response:', responseData);

    if (!response.ok) {
      throw new Error(responseData.message || 'API request failed');
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
        // BuyUpvotes returns { message, order_number } at the top-level
        data: {
          message: responseData?.message,
          order_number: responseData?.order_number ?? responseData?.data?.order_number,
        },
      }),
    };

  } catch (error) {
    console.error('Comment order function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        message: error.message || 'Internal server error',
      }),
    };
  }
}; 