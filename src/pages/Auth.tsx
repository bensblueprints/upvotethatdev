import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PasswordStrength } from '@/components/ui/password-strength';
import { calculatePasswordStrength } from '@/utils/passwordStrength';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, EyeOff, ArrowUp, ArrowDown, TrendingUp, Check } from 'lucide-react';
import v2Logo from '../../resources/upvotethatv2.png';

// Falling icon component
const FallingIcon = ({ 
  icon: Icon, 
  delay, 
  duration, 
  left, 
  size,
  opacity 
}: { 
  icon: any; 
  delay: number; 
  duration: number; 
  left: number;
  size: number;
  opacity: number;
}) => (
  <div
    className="absolute auth-anim-fall pointer-events-none"
    style={{
      left: `${left}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      opacity,
    }}
  >
    <Icon 
      className="text-white/25" 
      style={{ width: size, height: size }}
    />
  </div>
);

// Reddit-style icon
const RedditIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    style={style}
  >
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fallingIcons, setFallingIcons] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Generate falling icons on mount
  useEffect(() => {
    const icons = [];
    const iconTypes = [ArrowUp, ArrowDown, RedditIcon, TrendingUp];
    
    for (let i = 0; i < 25; i++) {
      icons.push({
        id: i,
        icon: iconTypes[Math.floor(Math.random() * iconTypes.length)],
        delay: Math.random() * 10,
        duration: 10 + Math.random() * 15,
        left: Math.random() * 100,
        size: 16 + Math.random() * 28,
        opacity: 0.15 + Math.random() * 0.2,
      });
    }
    setFallingIcons(icons);
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordStrength = calculatePasswordStrength(password);
    if (passwordStrength.score < 60) {
      toast({ 
        title: 'Password Too Weak', 
        description: `Password strength is ${passwordStrength.score}/100. Minimum required is 60.`,
        variant: 'destructive' 
      });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast({ title: 'Sign-up Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success!', description: 'Please check your email for a verification link.' });
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast({ title: 'Sign-in Error', description: error.message, variant: 'destructive' });
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formEmail = new FormData(e.currentTarget).get('reset-email');
    const rawEmail = typeof formEmail === 'string' ? formEmail : resetEmail;
    const trimmedEmail = (rawEmail || '').trim();
    if (!trimmedEmail) {
      toast({ title: 'Error', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    const publicSiteUrl = (import.meta as any)?.env?.VITE_PUBLIC_SITE_URL as string | undefined;
    const base =
      publicSiteUrl && /^https?:\/\//i.test(publicSiteUrl.trim())
        ? publicSiteUrl.trim().replace(/\/+$/, '')
        : window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${base}/update-password`,
    });
    if (error) {
      const msg = error.message || 'Failed to send password reset email.';
      const looksLikeRedirectIssue =
        msg.toLowerCase().includes('redirect') ||
        msg.toLowerCase().includes('not allowed') ||
        msg.toLowerCase().includes('additional redirect');

      toast({
        title: 'Error',
        description: looksLikeRedirectIssue
          ? `${msg} (Check Supabase Auth “Additional Redirect URLs” includes ${base}/update-password)`
          : msg,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Check your email',
        description: 'If an account exists for that email, we sent a password reset link.',
      });
      setResetEmail('');
      setResetDialogOpen(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-stone-50">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-stone-950">
        {/* Soft accent blobs (solid colors, blurred) */}
        <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 w-[560px] h-[560px] rounded-full bg-indigo-500/10 blur-3xl" />
        
        {/* Falling Icons Container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {fallingIcons.map((iconProps) => (
            <FallingIcon key={iconProps.id} {...iconProps} />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          {/* Logo */}
          <div className="auth-anim-float mb-10">
          <img 
            src={v2Logo}
            alt="UpvoteThat"
              className="h-12 xl:h-14 w-auto bg-white rounded-xl p-3 shadow-2xl"
          />
        </div>
        
          {/* Headline */}
          <h1 className="font-display text-4xl xl:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
            Boost Your Reddit<br />Presence Today
          </h1>
          
          {/* Subheadline */}
          <p className="font-body text-lg xl:text-xl text-stone-200 mb-8 leading-relaxed max-w-md">
            Get high-quality upvotes starting at just{' '}
            <span className="font-bold text-white">$0.04 per vote</span>. 
            Trusted by thousands of marketers and businesses.
          </p>
          
          {/* Feature List */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="font-body">Real Reddit accounts with history</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="font-body">Post and comment upvotes</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="font-body">10,000+ orders delivered</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="font-body">Fast delivery, reliable service</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - White Background with Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo (shown only on small screens) */}
          <div className="lg:hidden flex justify-center mb-8">
            <img 
              src={v2Logo}
              alt="UpvoteThat"
              className="h-12 w-auto"
            />
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="font-display text-3xl font-black text-stone-900 mb-2 tracking-tight">
              Get Started
            </h2>
            <p className="font-body text-stone-500">
              Create an account or sign in to start ordering upvotes
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-stone-100 p-1 rounded-xl">
              <TabsTrigger 
                value="signup"
                className="font-body font-semibold data-[state=active]:bg-stone-900 data-[state=active]:text-white rounded-lg transition-all"
              >
                Sign Up
              </TabsTrigger>
              <TabsTrigger 
                value="signin"
                className="font-body font-semibold data-[state=active]:bg-stone-900 data-[state=active]:text-white rounded-lg transition-all"
              >
                Sign In
              </TabsTrigger>
        </TabsList>
            
            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4 mt-0">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email-in" className="font-body text-stone-700 font-medium">
                    Email Address
                  </Label>
                  <Input 
                    id="email-in" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                    className="font-body h-12 border-stone-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-in" className="font-body text-stone-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input 
                      id="password-in" 
                      type={showPassword ? 'text' : 'password'}
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required
                      className="font-body h-12 border-stone-200 focus:border-orange-500 focus:ring-orange-500 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-stone-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-stone-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-sm">
                  <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                      <button type="button" className="font-body font-medium text-orange-600 hover:text-orange-700">
                        Forgot your password?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <form onSubmit={handlePasswordReset}>
                        <DialogHeader>
                          <DialogTitle className="font-display">Reset Password</DialogTitle>
                          <DialogDescription className="font-body">
                            Enter your email address and we'll send you a link to reset your password.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email" className="font-body">Email</Label>
                            <Input
                              id="reset-email"
                              name="reset-email"
                              type="email"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              className="font-body"
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={loading} className="font-body bg-orange-500 hover:bg-orange-600">
                            {loading ? 'Sending...' : 'Send Reset Link'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <Button 
                  type="submit" 
                  className="font-body w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300" 
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
        </TabsContent>
            
            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4 mt-0">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email-up" className="font-body text-stone-700 font-medium">
                    Email Address
                  </Label>
                  <Input 
                    id="email-up" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                    className="font-body h-12 border-stone-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-up" className="font-body text-stone-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input 
                      id="password-up" 
                      type={showPassword ? 'text' : 'password'}
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required
                      className="font-body h-12 border-stone-200 focus:border-orange-500 focus:ring-orange-500 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-stone-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-stone-400" />
                      )}
                    </Button>
                  </div>
                  <PasswordStrength password={password} />
                </div>
                <Button 
                  type="submit" 
                  className="font-body w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300" 
                  disabled={loading || calculatePasswordStrength(password).score < 60}
                >
                  {loading ? 'Creating Account...' : 'Create Free Account'}
                </Button>
              </form>
              
              {/* Benefits on mobile */}
              <div className="lg:hidden pt-6 border-t border-stone-200">
                <p className="font-body text-sm text-stone-500 mb-3">What you get:</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-stone-600">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-4 h-4 text-orange-500" />
                    <span className="font-body">Post Upvotes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowDown className="w-4 h-4 text-orange-500" />
                    <span className="font-body">Downvotes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-4 h-4 text-orange-500" />
                    <span className="font-body">Comment Votes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="font-body">Fast Delivery</span>
                  </div>
                </div>
              </div>
        </TabsContent>
      </Tabs>

          {/* Bottom Text */}
          <p className="font-body mt-8 text-center text-sm text-stone-500">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
