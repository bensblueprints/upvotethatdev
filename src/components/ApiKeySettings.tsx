import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export const ApiKeySettings: React.FC = () => {
  const [show, setShow] = useState(false);
  const { toast } = useToast();

  // Get the API key from environment variables
  const apiKey = import.meta.env.VITE_BUYUPVOTES_API_KEY || '6ca5f0ce27d54d5a84d6cb91bb55d0f2';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast({ 
        title: 'Copied!', 
        description: 'API key copied to clipboard.' 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to copy API key to clipboard.', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>BuyUpvotes API Key</CardTitle>
      </CardHeader>
      <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type={show ? 'text' : 'password'}
                value={apiKey}
              readOnly
              className="w-full font-mono"
              />
              <Button type="button" variant="outline" onClick={() => setShow(s => !s)}>
              {show ? 'Hide' : 'Show'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCopy}>
              Copy
              </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This API key is configured via environment variables. To change it, update your .env.local file.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 