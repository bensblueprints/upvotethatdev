import React, { useState, useEffect } from 'react';
import v2Logo from '../../resources/upvotethatv2.png';
import separatorIcon from '../../resources/seperator.png';
import upvoteImg from '../../resources/upvote.jpg';
import downvoteImg from '../../resources/Downvote.jpg';
import commentImg from '../../resources/Comment.jpg';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Users,
  MessageSquare,
  Link2,
  Rocket,
  Headphones,
  Sparkles,
  ShoppingCart,
  CreditCard,
  Bitcoin,
  Loader2,
  Phone,
  Mail,
  Check,
} from 'lucide-react';

// Hero animation component (sequenced: upvotes -> downvotes -> comments)
const HeroAnimation = () => {
  const [active, setActive] = useState<0 | 1 | 2>(0);
  const [manualUntil, setManualUntil] = useState<number>(0);
  const [upvoteCount, setUpvoteCount] = useState(847);
  const [downvoteCount, setDownvoteCount] = useState(156);
  const [showComment, setShowComment] = useState(false);
  const [commentIndex, setCommentIndex] = useState(0);

  const comments = [
    { user: "marketing_pro", text: "This actually works great" },
    { user: "growth_hacker", text: "Solid results, recommended" },
    { user: "startup_founder", text: "Game changer for visibility" },
  ];

  useEffect(() => {
    const step = window.setInterval(() => {
      if (Date.now() < manualUntil) return;
      setActive((prev) => (prev === 2 ? 0 : ((prev + 1) as 0 | 1 | 2)));
    }, 2400);
    return () => window.clearInterval(step);
  }, [manualUntil]);

  useEffect(() => {
    if (active !== 0) return;
    const upvoteInterval = window.setInterval(() => {
      setUpvoteCount((prev) => (prev >= 920 ? 847 : prev + 1));
    }, 60);
    return () => window.clearInterval(upvoteInterval);
  }, [active]);

  useEffect(() => {
    if (active !== 1) return;
    const downvoteInterval = window.setInterval(() => {
      setDownvoteCount((prev) => (prev <= 80 ? 156 : prev - 1));
    }, 70);
    return () => window.clearInterval(downvoteInterval);
  }, [active]);

  useEffect(() => {
    if (active !== 2) {
      setShowComment(false);
      return;
    }
    setCommentIndex((prev) => (prev + 1) % comments.length);
    const t = window.setTimeout(() => setShowComment(true), 120);
    return () => window.clearTimeout(t);
  }, [active]);

  const cardBase =
    "group relative w-full text-left bg-white rounded-2xl p-5 border shadow-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20 cursor-pointer";
  const cardInactive = "border-stone-200 hover:border-stone-300";
  const cardActive = "border-stone-900 ring-2 ring-stone-900/10";

  const activate = (idx: 0 | 1 | 2, ms: number) => {
    setActive(idx);
    setManualUntil(Date.now() + ms);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        aria-pressed={active === 0}
        onMouseEnter={() => activate(0, 3500)}
        onClick={() => activate(0, 15000)}
        className={`${cardBase} ${active === 0 ? cardActive : cardInactive}`}
      >
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#ff4500] shadow-sm">
                <img src={upvoteImg} alt="" aria-hidden="true" className="w-full h-full object-cover" />
              </div>
              <div className={`w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center shadow-sm ${
                active === 0 ? 'v2-anim-bounce-up' : ''
              }`}>
                <ChevronUp className="w-6 h-6 text-stone-900" strokeWidth={2.6} />
              </div>
            </div>
            {active === 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Buy Upvotes</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-stone-900 v2-tabular-nums tracking-tight">
                {upvoteCount.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-green-600">+{upvoteCount - 847}</span>
            </div>
          </div>
          <ChevronUp className={`w-5 h-5 ${active === 0 ? 'text-green-600 v2-anim-bounce-up' : 'text-stone-300'}`} />
        </div>
      </button>

      <button
        type="button"
        aria-pressed={active === 1}
        onMouseEnter={() => activate(1, 3500)}
        onClick={() => activate(1, 15000)}
        className={`${cardBase} ${active === 1 ? cardActive : cardInactive}`}
      >
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#ff4500] shadow-sm">
                <img src={downvoteImg} alt="" aria-hidden="true" className="w-full h-full object-cover" />
              </div>
              <div className={`w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center shadow-sm ${
                active === 1 ? 'v2-anim-bounce-down' : ''
              }`}>
                <ChevronDown className="w-6 h-6 text-stone-900" strokeWidth={2.6} />
              </div>
            </div>
            {active === 1 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Buy Downvotes</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-stone-900 v2-tabular-nums tracking-tight">
                {downvoteCount}
              </span>
              <span className="text-sm font-medium text-blue-700">-{156 - downvoteCount}</span>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 ${active === 1 ? 'text-blue-700 v2-anim-bounce-down' : 'text-stone-300'}`} />
        </div>
      </button>

      <button
        type="button"
        aria-pressed={active === 2}
        onMouseEnter={() => activate(2, 3500)}
        onClick={() => activate(2, 15000)}
        className={`${cardBase} ${active === 2 ? cardActive : cardInactive}`}
      >
        <div className="flex items-start gap-5">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#ff4500] shadow-sm">
              <img src={commentImg} alt="" aria-hidden="true" className="w-full h-full object-cover" />
            </div>
            <div className={`w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center shadow-sm ${
              active === 2 ? 'v2-anim-pulse-soft' : ''
            }`}>
              <MessageSquare className="w-5 h-5 text-stone-900" strokeWidth={2.4} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Buy Comments</p>
            {showComment && (
              <div className="v2-anim-fade-slide">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-stone-200" />
                  <span className="text-sm font-semibold text-stone-700">u/{comments[commentIndex].user}</span>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed">{comments[commentIndex].text}</p>
              </div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
};

const TapeRibbons = () => {
  const units = Array.from({ length: 18 });

  const Sep = ({ isLast }: { isLast?: boolean }) => (
    <span className={`inline-flex items-center justify-center rounded-full bg-[#ff4500] overflow-hidden ${isLast ? 'ml-3' : 'mx-3'} w-6 h-6`}>
      <img
        src={separatorIcon}
        alt=""
        aria-hidden="true"
        className="w-full h-full object-cover scale-110"
      />
    </span>
  );

  const Unit = () => (
    <span className="inline-flex items-center whitespace-nowrap">
      <span className="whitespace-nowrap">Buy Upvotes</span>
      <Sep />
      <span className="whitespace-nowrap">Buy Downvotes</span>
      <Sep />
      <span className="whitespace-nowrap">Order Custom Comments</span>
      <Sep isLast />
    </span>
  );

  const Row = ({ ariaHidden }: { ariaHidden?: boolean }) => (
    <div className="v2-tape-row" aria-hidden={ariaHidden ? 'true' : undefined}>
      {units.map((_, i) => (
        <Unit key={i} />
      ))}
    </div>
  );

  return (
    <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden bg-white">
      <div className="relative h-24 md:h-28">
        {/* Orange tape */}
        <div className="absolute left-1/2 top-[45%] w-[220%] -translate-x-1/2 -translate-y-1/2 rotate-[1.5deg]">
          <div className="bg-orange-500 text-black">
            <div className="py-3">
              <div className="v2-tape-track v2-tape-track--slow">
                {[
                  <div key="o1" className="v2-tape-text text-[11px] md:text-xs tracking-[0.08em]">
                    <Row />
                  </div>,
                  <div key="o2" className="v2-tape-text text-[11px] md:text-xs tracking-[0.08em]">
                    <Row ariaHidden />
                  </div>,
                ]}
              </div>
            </div>
          </div>
        </div>

        {/* Black tape */}
        <div className="absolute left-1/2 top-[55%] w-[220%] -translate-x-1/2 -translate-y-1/2 rotate-[-1.5deg]">
          <div className="bg-stone-950 text-white">
            <div className="py-3">
              <div className="v2-tape-track v2-tape-track--reverse">
                {[
                  <div key="b1" className="v2-tape-text text-[11px] md:text-xs tracking-[0.08em]">
                    <Row />
                  </div>,
                  <div key="b2" className="v2-tape-text text-[11px] md:text-xs tracking-[0.08em]">
                    <Row ariaHidden />
                  </div>,
                ]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HomepageV2() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState<number>(0);
  const [checkoutLabel, setCheckoutLabel] = useState<string>('');
  const [checkoutMethod, setCheckoutMethod] = useState<'card' | 'crypto'>('card');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutPassword, setCheckoutPassword] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const pricingTiers = [
    { upvotes: '100', price: '10', perVote: '0.10' },
    { upvotes: '275', price: '25', perVote: '0.08' },
    { upvotes: '625', price: '50', perVote: '0.07', popular: true },
    { upvotes: '1333', price: '100', perVote: '0.065' },
    { upvotes: '2857', price: '200', perVote: '0.06' },
    { upvotes: '8333', price: '500', perVote: '0.05', consultation: true },
    { upvotes: '20000', price: '1000', perVote: '0.04', consultation: true },
    { upvotes: '75000', price: '3000', perVote: '0.035', consultation: true },
  ];

  const features = [
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Real & Authentic Engagement',
      description: 'Our network consists of real, active Reddit users, ensuring genuine engagement that looks natural.',
    },
    {
      icon: <Rocket className="w-5 h-5" />,
      title: 'Blazing Fast Delivery',
      description: 'Receive your upvotes and comments swiftly, helping your posts gain traction when it matters most.',
    },
    {
      icon: <Headphones className="w-5 h-5" />,
      title: '24/7 Customer Support',
      description: 'Our dedicated support team is always available to assist you with any questions or issues.',
    },
  ];

  const faqItems = [
    {
      q: 'How does UpvoteThat.com ensure authentic engagement?',
      a: "We utilize a network of real, established Reddit users to provide upvotes and comments. This ensures the engagement appears natural and organic, crucial for maintaining your post's integrity on Reddit.",
    },
    {
      q: 'What is your delivery timeframe?',
      a: 'Delivery typically begins within minutes of your order confirmation and is completed within a few hours, depending on the volume purchased. Our goal is to provide rapid results.',
    },
    {
      q: 'Can I purchase upvotes for any subreddit?',
      a: "Yes, you can purchase upvotes for posts in any public subreddit. We recommend ensuring your content adheres to the specific subreddit's rules for optimal results.",
    },
    {
      q: 'Is my Reddit account safe when using your services?',
      a: "Your account's safety is our top priority. We do not require your login credentials, only the public link to your post. Our methods are designed to be discreet and minimize any risk.",
    },
    {
      q: 'What types of comments can I receive?',
      a: 'For comments, you can specify themes or keywords, and our network will provide natural-sounding, relevant comments to enhance discussion and authenticity on your post.',
    },
    {
      q: 'Do you offer a money-back guarantee?',
      a: 'We do not offer direct refunds. However, if upvotes are not delivered as promised, the equivalent value will be credited to your wallet for future use on our services.',
    },
    {
      q: "What's included in a custom strategy consultation?",
      a: 'Our consultations provide a personalized Reddit marketing strategy, including content creation tips, timing optimization, subreddit targeting, and long-term engagement tactics tailored to your objectives.',
    },
    {
      q: 'How can I contact customer support?',
      a: 'Our customer support team is available 24/7 via email at support@upvotethat.com, or you can reach out to @upvotethat for specific inquiries.',
    },
  ];

  const openCheckout = (opts: { amount: number; label: string }) => {
    setCheckoutAmount(opts.amount);
    setCheckoutLabel(opts.label);
    setCheckoutMethod('card');
    setCheckoutEmail('');
    setCheckoutPassword('');
    setCheckoutLoading(false);
    setCheckoutOpen(true);
  };

  const ensureSessionWithEmailPassword = async (email: string, password: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      throw new Error('Please enter your email and password.');
    }

    const signInResult = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (!signInResult.error) return;

    const msg = (signInResult.error.message || '').toLowerCase();
    const shouldTryCreate =
      msg.includes('invalid login credentials') || msg.includes('invalid') || msg.includes('not found');

    if (!shouldTryCreate) {
      throw new Error(signInResult.error.message || 'Unable to sign in.');
    }

    // Create a confirmed user server-side so we can continue to checkout immediately.
    const { data, error } = await supabase.functions.invoke('instant-signup', {
      body: { email: trimmedEmail, password },
    });

    if (error) {
      const status = (error as any)?.context?.status;
      if (status === 409) {
        throw new Error('Account already exists. Please double-check your password.');
      }
      throw new Error(error.message || 'Unable to create account. Please try again.');
    }

    if (!data?.ok) {
      if (data?.code === 'USER_EXISTS') {
        throw new Error('Account already exists. Please double-check your password.');
      }
      throw new Error(data?.message || 'Unable to create account. Please try again.');
    }

    // Now sign in again (should succeed because the account is confirmed).
    const signInAfter = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
    if (signInAfter.error) {
      throw new Error(signInAfter.error.message || 'Unable to sign in.');
    }
  };

  const startCardCheckout = async (amount: number) => {
    const { data, error } = await supabase.functions.invoke('create-airwallex-checkout', {
      body: { amount: Math.round(amount * 100) },
    });

    if (error) throw new Error(error.message);
    if (!data?.intent_id || !data?.client_secret) throw new Error('Could not create payment session.');

    const { init } = await import('@airwallex/components-sdk');
    const { payments } = await init({
      env: import.meta.env.VITE_AIRWALLEX_ENV === 'demo' ? 'demo' : 'prod',
      enabledElements: ['payments'],
    });

    if (!payments) throw new Error('Failed to initialize card checkout.');

    await payments.redirectToCheckout({
      intent_id: data.intent_id,
      client_secret: data.client_secret,
      currency: data.currency || 'USD',
      country_code: 'US',
      successUrl: `${window.location.origin}/dashboard?payment_status=success&amount=${data.amount}&method=card`,
    });
  };

  const startCryptoCheckout = async (amount: number) => {
    const { data, error } = await supabase.functions.invoke('create-crypto-payment', {
      body: { amount },
    });

    if (error) throw new Error(error.message);
    if (!data?.payment_url) throw new Error('Could not retrieve crypto payment URL.');

    window.location.href = data.payment_url;
  };

  const handleCheckoutContinue = async () => {
    if (!checkoutAmount || checkoutAmount < 1) {
      toast({
        title: 'Invalid amount',
        description: 'Minimum checkout amount is $1.',
        variant: 'destructive',
      });
      return;
    }

    setCheckoutLoading(true);
    try {
      await ensureSessionWithEmailPassword(checkoutEmail, checkoutPassword);

      if (checkoutMethod === 'card') {
        await startCardCheckout(checkoutAmount);
      } else {
        await startCryptoCheckout(checkoutAmount);
      }
    } catch (err: any) {
      toast({
        title: 'Checkout error',
        description: err?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-body antialiased overflow-x-hidden">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200/70">
        <nav className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <a href="/v2" className="flex items-center">
              <img src={v2Logo} alt="UpvoteThat" className="h-9 w-auto" />
            </a>

            <div className="hidden md:flex items-center gap-1">
              <a href="#dfy" className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors">
                Done For You
              </a>
              <a href="#pricing" className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors">
                Pricing
              </a>
              <div className="w-px h-6 bg-stone-200 mx-2" />
              <a
                href="/auth"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors"
              >
                Login
              </a>
            </div>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-stone-600 hover:text-stone-900">
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-stone-100">
              <div className="flex flex-col gap-1">
                <a href="#dfy" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 rounded-lg">Done For You</a>
                <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 rounded-lg">Pricing</a>
                <a
                  href="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-2 px-4 py-3 text-sm font-semibold text-white bg-stone-900 rounded-lg text-center"
                >
                  Login
                </a>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-20 md:pt-32 md:pb-28 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-full mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Trusted by 50,000+ marketers</span>
              </div>
              
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-stone-900 leading-[1.05] tracking-tight">
                Reddit marketing,
                <br />
                <span className="text-orange-600">simplified.</span>
              </h1>
              
              <p className="mt-6 text-lg text-stone-500 leading-relaxed">
                Real upvotes, downvotes, and comments from established accounts. 
                Boost visibility. Drive engagement. Grow your presence.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-stone-900 rounded-xl hover:bg-stone-800 shadow-lg shadow-stone-900/10 transition-all hover:shadow-xl hover:shadow-stone-900/20 hover:-translate-y-0.5"
                >
                  Start Free
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
                >
                  View Pricing
                </a>
              </div>

              <div className="mt-10 flex items-center gap-6">
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-stone-500 mt-0.5">4.9/5 from 2,400+ reviews</p>
                </div>
              </div>
            </div>

            <div className="lg:pl-4">
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Criss-cross tape ribbons */}
      <TapeRibbons />

      {/* Logos/Stats */}
      <section className="py-12 border-y border-stone-200/60 bg-stone-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10M+', label: 'Upvotes delivered' },
              { value: '50K+', label: 'Active users' },
              { value: '99.9%', label: 'Success rate' },
              { value: '<5min', label: 'Avg. start time' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-2xl sm:text-3xl font-bold text-stone-900">{stat.value}</div>
                <div className="text-sm text-stone-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIY Platform */}
      <section id="diy" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-end mb-12">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                DIY Upvote and Comment Platform
              </h2>
              <p className="mt-4 text-lg text-stone-500">
                Self-serve ordering with fast starts and simple tracking.
              </p>
            </div>
            <div className="lg:text-right">
              <a
                href="/auth"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors"
              >
                Open the platform
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-7 hover:border-stone-300 hover:shadow-lg transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center mb-5">
                <ChevronUp className="w-6 h-6 text-white stroke-[2.5]" />
              </div>
              <h3 className="font-display text-lg font-semibold text-stone-900 mb-2">Reddit Upvotes</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">
                Increase visibility and ranking with upvotes from real accounts.
              </p>
              <a href="/auth" className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700">
                Buy upvotes <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-7 hover:border-stone-300 hover:shadow-lg transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center mb-5">
                <MessageSquare className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <h3 className="font-display text-lg font-semibold text-stone-900 mb-2">Reddit Comments</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">
                Drive discussion and social proof with natural, contextual comments.
              </p>
              <button
                type="button"
                onClick={() => openCheckout({ amount: 15, label: 'Comments credit' })}
                className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-7 hover:border-stone-300 hover:shadow-lg transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-stone-900 flex items-center justify-center mb-5">
                <Users className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <h3 className="font-display text-lg font-semibold text-stone-900 mb-2">Aged Accounts</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">
                High-karma accounts ready to use for marketing and engagement.
              </p>
              <a href="/auth" className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700">
                Browse accounts <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Done For You */}
      <section id="dfy" className="py-20 md:py-28 bg-orange-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Done For You Campaigns
            </h2>
            <p className="mt-4 text-lg text-stone-500">
              Hands-off campaigns using our network of aged accounts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-7 hover:border-stone-300 hover:shadow-lg transition-all duration-300">
              <h3 className="font-display text-xl font-semibold text-stone-900 mb-2">Custom Reddit Posting</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">
                We publish your content from established accounts for maximum credibility.
              </p>
              <a href="https://t.me/upvotethat" className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700">
                Message us on Telegram <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-7 hover:border-stone-300 hover:shadow-lg transition-all duration-300">
              <h3 className="font-display text-xl font-semibold text-stone-900 mb-2">Custom Commenting</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">
                Add natural comments to your thread or relevant discussions to drive trust.
              </p>
              <a href="https://t.me/upvotethat" className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700">
                Request pricing <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 bg-indigo-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Why Choose <span className="text-orange-500">UpvoteThat.com</span>?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="group p-6 bg-white rounded-2xl border border-stone-200/80 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-stone-500 max-w-xl mx-auto">
              Start small or go big. Volume discounts built in.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pricingTiers.map((tier, i) => (
              <div
                key={i}
                className={`relative p-6 rounded-2xl transition-all duration-300 ${
                  tier.popular
                    ? 'bg-stone-900 text-white ring-4 ring-stone-900/10 scale-[1.02]'
                    : 'bg-white border border-stone-200 hover:border-stone-300 hover:shadow-lg'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                    Popular
                  </div>
                )}
                <div className="mb-5">
                  <p className={`text-sm font-medium ${tier.popular ? 'text-stone-400' : 'text-stone-500'}`}>
                    {tier.upvotes} upvotes
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold">${tier.price}</span>
                    <span className={`text-sm ${tier.popular ? 'text-stone-400' : 'text-stone-500'}`}>
                      / ${tier.perVote} each
                    </span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {[
                    'Real accounts',
                    'Fast delivery',
                    'Order tracking',
                    ...(tier.consultation ? ['Custom strategy consultation'] : []),
                  ].map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className={`w-4 h-4 ${tier.popular ? 'text-orange-400' : 'text-green-500'}`} />
                      <span className={tier.popular ? 'text-stone-300' : 'text-stone-600'}>{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => openCheckout({ amount: Number(tier.price), label: `${tier.upvotes} upvotes` })}
                  className={`block w-full py-2.5 text-center text-sm font-semibold rounded-lg transition-colors ${
                    tier.popular
                      ? 'bg-white text-stone-900 hover:bg-stone-100'
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                >
                  Get started
                </button>
              </div>
            ))}
          </div>

          <p className="text-center mt-10 text-stone-500">
            Need more?{' '}
            <a href="https://t.me/upvotethat" className="text-stone-900 font-medium hover:underline">
              Contact us for enterprise pricing
            </a>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 md:py-28 bg-emerald-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto items-stretch">
            {[
              {
                n: "1",
                title: "Select Your Service",
                desc: "Choose the upvote or comment package that fits your needs from our offerings.",
                icon: ShoppingCart,
                accent: 'text-orange-600',
                iconBg: 'bg-orange-500/10',
              },
              {
                n: "2",
                title: "Provide Your Link",
                desc: "Simply give us the URL to your Reddit post or comment you wish to boost.",
                icon: Link2,
                accent: 'text-indigo-700',
                iconBg: 'bg-indigo-500/10',
              },
              {
                n: "3",
                title: "Watch Your Post Rise",
                desc: "See your content gain traction and rise in visibility within minutes!",
                icon: Rocket,
                accent: 'text-emerald-700',
                iconBg: 'bg-emerald-500/10',
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className={`relative w-full h-full bg-white/85 backdrop-blur border border-stone-200/80 rounded-3xl p-6 sm:p-7 overflow-hidden hover:border-stone-300 hover:shadow-lg transition-all duration-300 ${
                    i === 2 ? 'sm:col-span-2 sm:justify-self-center lg:col-span-1' : ''
                  }`}
                >
                  <div className={`pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full ${step.iconBg}`} />
                  <Icon className={`pointer-events-none absolute -right-4 -top-4 w-24 h-24 sm:w-28 sm:h-28 opacity-[0.10] ${step.accent}`} aria-hidden="true" />

                  <div className="flex items-start gap-4">
                    <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${step.iconBg} border border-stone-200/60 bg-white/40`}>
                      <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${step.accent}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black tracking-[0.18em] text-stone-400">
                        STEP {step.n}
                      </p>
                      <h3 className="font-display text-lg font-semibold text-stone-900 mt-1">
                        {step.title}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-4 text-stone-600 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-28 bg-stone-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              What Our Customers Are Saying
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                quote:
                  '"Absolutely incredible! My post reached the front page in hours, something I never thought possible. UpvoteThat.com is the real deal."',
                name: '— Jessica L., Small Business Owner',
              },
              {
                quote:
                  "\"I've tried other services, but the quality of engagement here is unmatched. Real comments and a noticeable boost. Highly recommend!\"",
                name: '— Mark T., Digital Marketer',
              },
            ].map((t, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-2xl p-7">
                <p className="text-lg italic text-stone-700 mb-4">{t.quote}</p>
                <p className="font-semibold text-orange-500">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Full-service Reddit marketing
            </h2>
            <p className="mt-4 text-lg text-stone-500">
              Everything you need to succeed. DIY or done-for-you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              { title: 'Comments', desc: 'Authentic, contextual comments from aged accounts.', cta: 'Order comments', href: '/auth' },
              { title: 'Aged Accounts', desc: 'High-karma accounts ready to use. From $12.', cta: 'Browse accounts', href: '/auth' },
              { title: 'Custom Posting', desc: 'We post from our trusted high-karma network.', cta: 'Learn more', href: 'https://t.me/upvotethat' },
              { title: 'Managed Campaigns', desc: 'Full strategy and execution. You set the goals.', cta: 'Get a quote', href: 'https://t.me/upvotethat' },
            ].map((service, i) => (
              <div key={i} className="flex items-start gap-5 p-6 bg-white rounded-2xl border border-stone-200/80 hover:border-stone-300 hover:shadow-lg transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-stone-900">{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-stone-900 mb-1">{service.title}</h3>
                  <p className="text-stone-500 text-sm mb-3">{service.desc}</p>
                  {service.title === 'Comments' && service.href === '/auth' ? (
                    <button
                      type="button"
                      onClick={() => openCheckout({ amount: 15, label: 'Comments credit' })}
                      className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
                    >
                      {service.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <a href={service.href} className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700">
                      {service.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick checkout modal */}
      <Dialog open={checkoutOpen} onOpenChange={(open) => !checkoutLoading && setCheckoutOpen(open)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="font-display">Checkout</DialogTitle>
            <DialogDescription>Create your account (or sign in) to continue to payment.</DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-5">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate">{checkoutLabel || 'Order'}</p>
                  <p className="text-xs text-stone-500 mt-0.5">Wallet credit is added after successful payment.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-500">Total</p>
                  <p className="text-2xl font-bold text-stone-900">${checkoutAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="checkout-email">Email</Label>
                <Input
                  id="checkout-email"
                  type="email"
                  placeholder="you@example.com"
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  disabled={checkoutLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkout-password">Password</Label>
                <Input
                  id="checkout-password"
                  type="password"
                  value={checkoutPassword}
                  onChange={(e) => setCheckoutPassword(e.target.value)}
                  disabled={checkoutLoading}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-stone-900 mb-2">Payment method</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutMethod('card')}
                  disabled={checkoutLoading}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    checkoutMethod === 'card'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutMethod('crypto')}
                  disabled={checkoutLoading}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    checkoutMethod === 'crypto'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Bitcoin className="w-4 h-4" />
                  Crypto
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setCheckoutOpen(false)} disabled={checkoutLoading}>
              Cancel
            </Button>
            <Button type="button" className="bg-orange-500 hover:bg-orange-600" onClick={handleCheckoutContinue} disabled={checkoutLoading}>
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting…
                </>
              ) : (
                'Continue to payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ebook */}
      <section className="py-20 md:py-28 bg-orange-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                Reddit Psychological Warfare: Your Tactical Guide to Viral Marketing Domination
              </h2>
              <p className="mt-4 text-lg text-stone-500 leading-relaxed">
                Unlock the power of Reddit. This isn't just a forum; it's a dynamic ecosystem and a goldmine for savvy marketers. This guide is your comprehensive blueprint to understanding, navigating, and ultimately conquering the Reddit landscape. Master the subtle art of influence and orchestrate viral content with precision.
              </p>
              <div className="mt-7 flex items-center gap-5">
                <p className="text-5xl font-extrabold mb-0 text-stone-900">$7</p>
                <a
                  href="https://reddit.rootaccess.design/pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-orange-600 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                  Purchase Now
                  <ShoppingCart className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="lg:justify-self-end">
              <a href="https://reddit.rootaccess.design/pdf" target="_blank" rel="noopener noreferrer">
                <img
                  src="/homepage/ebook-cover.jpg"
                  alt="Reddit Psychological Warfare Ebook Cover"
                  className="w-64 sm:w-80 h-auto rounded-2xl border border-stone-200 shadow-lg"
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* AI Marketing Bot */}
      <section id="ai-marketing-bot" className="py-20 md:py-28 bg-indigo-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              AI-Powered Reddit Marketing: Your Personal Content Creator
            </h2>
            <p className="mt-4 text-lg text-stone-500 mb-10 max-w-3xl mx-auto">
              Leverage our custom Chat GPT marketing bot to effortlessly craft compelling Reddit posts, insightful comments, and engaging sub-comments. Get precise, tailored content ideas for each aged account, ensuring your message resonates perfectly with Reddit communities.
            </p>
            <a
              href="/auth"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors"
            >
              Craft your first post: Sign up for free trial today <Sparkles className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 bg-indigo-50">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="border border-stone-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-50 transition-colors"
                >
                  <span className="font-medium text-stone-900">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${openFaqIndex === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaqIndex === i && (
                  <div className="px-5 pb-4 text-stone-500 text-sm">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 md:py-28 bg-stone-50 border-t border-stone-200/70">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                Ready to launch your next post?
              </h2>
              <p className="mt-4 text-lg text-stone-500 leading-relaxed">
                Use the DIY platform for instant ordering, or message us for done-for-you campaigns.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <a
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors"
                >
                  Open the platform
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  See pricing
                </a>
              </div>

              <p className="mt-6 text-sm text-stone-500">
                Support is available 24/7 via Telegram or email.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <a
                href="https://t.me/upvotethat"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-stone-50 border border-stone-200 rounded-2xl p-5 hover:border-stone-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center mb-4">
                  <MessageSquare className="w-5 h-5 text-stone-900" />
                </div>
                <p className="font-display font-semibold text-stone-900">Telegram</p>
                <p className="text-sm text-stone-500 mt-1">Message us</p>
              </a>

              <a
                href="mailto:support@upvotethat.com"
                className="bg-stone-50 border border-stone-200 rounded-2xl p-5 hover:border-stone-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5 text-stone-900" />
                </div>
                <p className="font-display font-semibold text-stone-900">Email</p>
                <p className="text-sm text-stone-500 mt-1 break-all">support@upvotethat.com</p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img src={v2Logo} alt="UpvoteThat" className="h-8 w-auto" />
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-stone-500">
              <a href="#" className="hover:text-stone-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-stone-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-stone-900 transition-colors">Refunds</a>
            </div>

            <div className="flex items-center gap-3">
              <a href="https://t.me/upvotethat" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-900 transition-colors">
                <MessageSquare className="w-4 h-4" />
              </a>
              <a href="mailto:support@upvotethat.com" className="w-9 h-9 flex items-center justify-center rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-900 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-stone-100 text-center text-sm text-stone-400">
            {new Date().getFullYear()} UpvoteThat.com. Not affiliated with Reddit Inc.
          </div>
        </div>
      </footer>

    </div>
  );
}
