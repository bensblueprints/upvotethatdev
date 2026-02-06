import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CopyBlock, dracula } from 'react-code-blocks';

// Get API key from environment variable with actual fallback
const apiKey = import.meta.env.VITE_BUYUPVOTES_API_KEY || '6ca5f0ce27d54d5a84d6cb91bb55d0f2';

const endpoints = [
  {
    title: 'Submit Upvote Order',
    method: 'POST',
    url: 'https://api.buyupvotes.io/upvote_order/submit/',
    description: 'Submit an upvote or downvote order for a Reddit post or comment.',
    request: `{
  "link": "<valid Reddit link>",
  "quantity": 5,
  "service": 1,
  "speed": 180
}`,
    response: `{
  "message": "Order submitted successfully",
  "order_number": "1891780"
}`
  },
  {
    title: 'Upvote Order Status',
    method: 'POST',
    url: 'https://api.buyupvotes.io/upvote_order/status/',
    description: 'Retrieve the status of a submitted upvote/downvote order.',
    request: `{
  "order_number": "1891780"
}`,
    response: `{
  "order_number": "1891780",
  "service": "Post upvotes",
  "status": "Completed",
  "vote_quantity": 5,
  "votes_delivered": 5
}`
  },
  {
    title: 'Cancel Upvote Order',
    method: 'POST',
    url: 'https://api.buyupvotes.io/upvote_order/cancel/',
    description: 'Cancel an upvote/downvote order that is in progress.',
    request: `{
  "order_number": "1891780"
}`,
    response: `{
  "message": "Order canceled successfully"
}`
  },
  {
    title: 'Submit Comment Order',
    method: 'POST',
    url: 'https://api.buyupvotes.io/comment_order/submit/',
    description: 'Submit an order to make a comment on a Reddit post or reply to another comment.',
    request: `{
  "link": "<valid Reddit link>",
  "content": "The text of the comment"
}`,
    response: `{
  "message": "Comment order submitted successfully",
  "order_number": "1891780"
}`
  },
  {
    title: 'Comment Order Status',
    method: 'POST',
    url: 'https://api.buyupvotes.io/comment_order/status/',
    description: 'Retrieve the status of a submitted comment order.',
    request: `{
  "order_number": "1891783"
}`,
    response: `{
  "order_number": "1891783",
  "status": "Completed"
}`
  }
];

export default function ApiDocs() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Integrate your bot with our network and get paid automatically for every order you fulfill.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-2">Authentication</h2>
            <p>All requests require your API key in the <code>X-API-Key</code> header.</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">{apiKey}</span>
              <span className="text-xs text-gray-500">(Your API Key)</span>
            </div>
          </div>
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-2">Payouts</h2>
            <p>Your account is credited automatically for every order you fulfill. Withdraw anytime from your dashboard.</p>
          </div>
          <Tabs defaultValue="0" className="w-full">
            <TabsList>
              {endpoints.map((ep, i) => (
                <TabsTrigger key={ep.title} value={String(i)}>{ep.title}</TabsTrigger>
              ))}
            </TabsList>
            {endpoints.map((ep, i) => (
              <TabsContent key={ep.title} value={String(i)}>
                <div className="mt-6">
                  <h3 className="font-bold text-md mb-1">{ep.method} <span className="text-blue-600">{ep.url}</span></h3>
                  <p className="mb-2 text-gray-700">{ep.description}</p>
                  <div className="mb-2">
                    <span className="font-semibold">Request Example:</span>
                    <CopyBlock text={ep.request} language="json" theme={dracula} />
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Response Example:</span>
                    <CopyBlock text={ep.response} language="json" theme={dracula} />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 