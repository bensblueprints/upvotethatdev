const handler = async (event, context) => {
  // Handle CORS preflight request
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: false, 
        message: 'Method not allowed. Only POST requests are supported.' 
      }),
    };
  }

  try {
    console.log('💬 Comment Status Check Function Called');
    console.log('Request body:', event.body);

    const requestData = JSON.parse(event.body);
    console.log('Parsed request data:', requestData);

    if (!requestData.order_number) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          message: 'Missing order_number parameter'
        }),
      };
    }

    // Get API key from environment variables
    // Support both names since other functions historically used VITE_BUYUPVOTES_API_KEY
    const API_KEY = process.env.BUYUPVOTES_API_KEY || process.env.VITE_BUYUPVOTES_API_KEY;
    
    if (!API_KEY) {
      console.error('❌ Missing BUYUPVOTES_API_KEY environment variable');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          message: 'Server configuration error: API key not found'
        }),
      };
    }

    console.log('🔑 Using API key (first 8 chars):', API_KEY.substring(0, 8) + '...');

    // Make request to BuyUpvotes.io comment status API
    // Docs: /comment_order/status/ is hosted on api.buyupvotes.io
    const apiUrl = 'https://api.buyupvotes.io/comment_order/status/';
    console.log('🌐 Making request to:', apiUrl);
    console.log('📋 Request payload:', requestData);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(requestData),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const responseData = await response.json().catch(() => ({}));

    console.log('✅ API Response Status:', response.status);
    console.log('📡 API Response Data:', responseData);

    // Return the API response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        data: responseData,
      }),
    };

  } catch (error) {
    console.error('❌ Error in comment status check:', error);

    let errorMessage = 'Failed to check comment order status';
    let statusCode = 500;

    if (error?.name === 'AbortError') {
      errorMessage = 'Request timeout - API server took too long to respond';
      statusCode = 504;
    } else {
      errorMessage = `Request error: ${error?.message || String(error)}`;
    }

    return {
      statusCode: statusCode >= 400 && statusCode < 600 ? statusCode : 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        message: errorMessage,
        error: error?.message || String(error),
      }),
    };
  }
};

export { handler }; 