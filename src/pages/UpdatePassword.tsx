
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const ensureSessionFromUrl = async () => {
      // 1) PKCE flow: ?code=...
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelled) {
            toast({
              title: 'Invalid or expired link',
              description: error.message || 'Please request a new password reset link.',
              variant: 'destructive',
            });
            navigate('/auth', { replace: true });
          }
          return;
        }
      }

      // 2) Implicit flow: #access_token=...&refresh_token=...&type=recovery
      const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      }

      // 3) Final check: do we have a session?
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) {
          toast({
            title: 'Invalid or expired link',
            description: 'Please request a new password reset link.',
            variant: 'destructive',
          });
          navigate('/auth', { replace: true });
        }
      }
    };

    // If AuthContext already has a session, we're good. Otherwise try to hydrate from URL.
    if (!session) {
      ensureSessionFromUrl();
    }

    return () => {
      cancelled = true;
    };
  }, [session, navigate, toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: 'Error updating password', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success!', description: 'Your password has been updated.' });
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50 px-6">
      <Card className="w-full max-w-md border-stone-200">
        <CardHeader>
          <CardTitle className="font-display text-2xl font-black text-stone-900">Update Password</CardTitle>
          <CardDescription className="text-stone-500">Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-stone-200 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePassword;
