import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
  // Netlify Scheduled Function - runs automatically every 4 hours
  // Configured in netlify.toml with schedule = "0 */4 * * *"
  
  try {
    // For scheduled functions, the request body contains next_run timestamp
    let next_run = null;
    try {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      next_run = body?.next_run;
      if (next_run) {
        console.log('Scheduled function triggered. Next run at:', next_run);
      }
    } catch (e) {
      // Handle cases where event.body might not be JSON (manual invocation)
      console.log('Function triggered manually or without next_run data');
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key for admin access
    const buyUpvotesApiKey = process.env.VITE_BUYUPVOTES_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !buyUpvotesApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all orders that need status checking
    const { data: orders, error: fetchError } = await supabase
      .from('upvote_orders')
      .select('id, external_order_id, status, last_status_check, created_at')
      .not('external_order_id', 'is', null)
      .in('status', ['In progress', 'Pending'])
      .order('created_at', { ascending: false })
      .limit(100); // Limit to prevent overwhelming the API

    if (fetchError) {
      console.error('Error fetching orders:', fetchError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Database error' }) };
    }

    if (!orders || orders.length === 0) {
      console.log('No orders to check');
      return { statusCode: 200, body: JSON.stringify({ message: 'No orders to check' }) };
    }

    console.log(`Checking status for ${orders.length} orders`);

    let updated = 0;
    let errors = 0;
    const results = [];

    // Process orders in small batches to be respectful to the API
    const batchSize = 5;
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);

      for (const order of batch) {
        try {
          // Skip if checked recently (less than 2 hours ago)
          if (order.last_status_check) {
            const lastCheck = new Date(order.last_status_check);
            const hoursSinceLastCheck = (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastCheck < 2) {
              continue;
            }
          }

          console.log(`Checking order ${order.id} with external ID: ${order.external_order_id}`);

          // Call BuyUpvotes.io API
          const response = await fetch('https://api.buyupvotes.io/upvote_order/status/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': buyUpvotesApiKey,
            },
            body: JSON.stringify({ order_number: order.external_order_id }),
          });

          const statusData = await response.json();

          if (!response.ok) {
            console.error(`API error for order ${order.id}:`, statusData);
            errors++;
            continue;
          }

          // Update the order in our database
          const updateData = {
            status: statusData.status,
            votes_delivered: statusData.votes_delivered || 0,
            last_status_check: new Date().toISOString(),
          };

          const { error: updateError } = await supabase
            .from('upvote_orders')
            .update(updateData)
            .eq('id', order.id);

          if (updateError) {
            console.error(`Database update error for order ${order.id}:`, updateError);
            errors++;
          } else {
            console.log(`Updated order ${order.id}: ${order.status} -> ${statusData.status}`);
            updated++;
            results.push({
              orderId: order.id,
              oldStatus: order.status,
              newStatus: statusData.status,
              votesDelivered: statusData.votes_delivered
            });
          }

        } catch (error) {
          console.error(`Error processing order ${order.id}:`, error);
          errors++;
        }
      }

      // Wait between batches to be respectful to the API
      if (i + batchSize < orders.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }

    const summary = {
      totalChecked: orders.length,
      updated,
      errors,
      timestamp: new Date().toISOString(),
      results: results.slice(0, 10) // Include first 10 results for debugging
    };

    console.log('Status check completed:', summary);

    return {
      statusCode: 200,
      body: JSON.stringify(summary)
    };

  } catch (error) {
    console.error('Scheduled status check failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}; 