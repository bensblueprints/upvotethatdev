import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Resend configuration
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
// This must be a verified sender/domain in Resend.
const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'UpvoteThat Support <support@upvotethat.com>';
// Where support emails should be delivered (can be a group inbox).
const SUPPORT_TO_EMAIL = Deno.env.get('SUPPORT_TO_EMAIL') || 'support@upvotethat.com';

interface SupportRequest {
  name: string;
  email: string;
  issueType: string;
  orderNumber?: string;
  description: string;
  userId?: string;
  userBalance?: number;
}

function json(status: number, payload: any) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supportRequest: SupportRequest = await req.json()
    
    // Validate required fields
    if (!supportRequest.name || !supportRequest.email || !supportRequest.issueType || !supportRequest.description) {
      return json(400, { ok: false, code: 'MISSING_FIELDS', message: 'Missing required fields' });
    }

    if (!RESEND_API_KEY) {
      return json(500, {
        ok: false,
        code: 'RESEND_NOT_CONFIGURED',
        message: 'Missing RESEND_API_KEY in Edge Function environment.',
      });
    }

    // Format issue type for display
    const issueTypeMap: { [key: string]: string } = {
      'order': 'Issue Regarding an Order',
      'payment': 'Issue Regarding a Payment', 
      'other': 'Something Else'
    };

    const issueTypeDisplay = issueTypeMap[supportRequest.issueType] || supportRequest.issueType;
    
    // Format email content
    const emailSubject = `Support Request: ${issueTypeDisplay} - ${supportRequest.name}`;
    
    const emailBody = `
New Support Request Received

Customer Details:
- Name: ${supportRequest.name}
- Email: ${supportRequest.email}
- User ID: ${supportRequest.userId || 'Not logged in'}
- Account Balance: $${supportRequest.userBalance || 0}

Issue Information:
- Type: ${issueTypeDisplay}
${supportRequest.orderNumber ? `- Order Number: ${supportRequest.orderNumber}` : ''}
- Submitted: ${new Date().toLocaleString()}

Issue Description:
${supportRequest.description}

---
This support request was automatically generated from the UpvoteThat.com support form.
Reply directly to this email to respond to the customer.
    `.trim();

    const emailHtml = emailBody.replace(/\n/g, '<br>');

    // Send email using Resend
    const emailResponse = await sendEmail({
      to: SUPPORT_TO_EMAIL,
      replyTo: supportRequest.email,
      subject: emailSubject,
      text: emailBody,
      html: emailHtml,
    });

    if (!emailResponse.success) {
      throw new Error(emailResponse.error);
    }

    return json(200, {
      ok: true,
      message: 'Support request sent successfully',
      ticketId: `TICKET-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      provider: 'resend',
      provider_id: emailResponse.id || null,
    });

  } catch (error) {
    console.error('Error sending support email:', error)
    return json(500, {
      ok: false,
      code: 'FAILED',
      message: (error as any)?.message || 'Failed to send support request',
    });
  }
})

// Resend email function
async function sendEmail({ to, replyTo, subject, text, html }: {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        text,
        html,
        reply_to: replyTo,
      })
    });

    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      throw new Error(`Resend API error (${response.status}): ${raw || response.statusText}`);
    }

    const result = await response.json().catch(() => ({} as any));
    return { success: true, message: 'Email sent successfully via Resend', id: (result as any)?.id };
    
  } catch (error) {
    console.error('Resend Error:', error);
    return { 
      success: false, 
      error: `Failed to send email: ${(error as any)?.message || String(error)}` 
    };
  }
}

/* Add these lines to your Supabase Edge Functions environment:
RESEND_API_KEY=your-resend-api-key
RESEND_FROM=UpvoteThat Support <support@upvotethat.com>
SUPPORT_TO_EMAIL=support@upvotethat.com
*/ 