import React, { useState, Component } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  Users,
  Rocket,
  Headphones,
  ShoppingCart,
  ArrowRight,
  Menu,
  X,
  ArrowDown,
  Plane,
  Info,
  Send,
  MessageSquarePlus, // For comments
  FilePlus2, // For posts
  Mail, // For email icon
  MessageSquare, // For Telegram icon
  // Phone, // WhatsApp removed
  Sparkles // For AI bot section
} from 'lucide-react';

// ErrorBoundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error: ", error, errorInfo);
    this.setState({ errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-800 p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong.</h1>
            <p className="text-lg mb-4">We're sorry, but there was an error rendering this section of the page.</p>
            <details className="text-left bg-red-200 p-4 rounded-md mt-4">
              <summary className="font-semibold cursor-pointer">Error Details</summary>
              <pre className="whitespace-pre-wrap text-sm mt-2">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-red-600 text-white py-2 px-6 rounded-full font-semibold hover:bg-red-700 transition duration-300"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


export default function Homepage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqItems, setOpenFaqItems] = useState<number[]>([]);
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false); // State for Posting modal
  const [isCommentingModalOpen, setIsCommentingModalOpen] = useState(false); // State for Commenting modal
  const [showPurchaseInstructions, setShowPurchaseInstructions] = useState(false); // State to show purchase instructions
  const [showRedirectMessage, setShowRedirectMessage] = useState(false); // New state for redirect message
  const [redirectingPackage, setRedirectingPackage] = useState(null); // State to store package info for redirect message
  const [selectedPackageText, setSelectedPackageText] = useState(''); // State to store text for auto-filled messages

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleFaqItem = (index: number) => {
    setOpenFaqItems(prev =>
      prev.includes(index)
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  const openPostingModal = () => {
    setIsPostingModalOpen(true);
    setShowPurchaseInstructions(false); // Reset instructions when opening
  };
  const closePostingModal = () => setIsPostingModalOpen(false);

  const openCommentingModal = () => {
    setIsCommentingModalOpen(true);
    setShowPurchaseInstructions(false); // Reset instructions when opening
  };
  const closeCommentingModal = () => setIsCommentingModalOpen(false);

  const handlePurchaseClick = (packageName, packagePrice) => {
    setSelectedPackageText(`I'd like to order ${packageName} for ${packagePrice}.`);
    setShowPurchaseInstructions(true);
  };

  const handleDiyOrderNowClick = (pkg) => {
    setRedirectingPackage(pkg);
    setShowRedirectMessage(true);
    setTimeout(() => {
      window.location.href = "https://www.upvotethat.com/auth";
    }, 3000); // Redirect after 3 seconds
  };

  const faqItems = [
    {
      question: "How does UpvoteThat.com ensure authentic engagement?",
      answer: "We utilize a network of real, established Reddit users to provide upvotes and comments. This ensures the engagement appears natural and organic, crucial for maintaining your post's integrity on Reddit."
    },
    {
      question: "What is your delivery timeframe?",
      answer: "Delivery typically begins within minutes of your order confirmation and is completed within a few hours, depending on the volume purchased. Our goal is to provide rapid results."
    },
    {
      question: "Can I purchase upvotes for any subreddit?",
      answer: "Yes, you can purchase upvotes for posts in any public subreddit. We recommend ensuring your content adheres to the specific subreddit's rules for optimal results."
    },
    {
      question: "Is my Reddit account safe when using your services?",
      answer: "Your account's safety is our top priority. We do not require your login credentials, only the public link to your post. Our methods are designed to be discreet and minimize any risk."
    },
    {
      question: "What types of comments can I receive?",
      answer: "For comments, you can specify themes or keywords, and our network will provide natural-sounding, relevant comments to enhance discussion and authenticity on your post."
    },
    {
      question: "Do you offer a money-back guarantee?",
      answer: "We do not offer direct refunds. However, if upvotes are not delivered as promised, the equivalent value will be credited to your wallet for future use on our services."
    },
    {
      question: "What's included in a custom strategy consultation?",
      answer: "Our consultations provide a personalized Reddit marketing strategy, including content creation tips, timing optimization, subreddit targeting, and long-term engagement tactics tailored to your objectives."
    },
    {
      question: "How can I contact customer support?",
      answer: "Our customer support team is available 24/7 via email at support@upvotethat.com, or you can reach out to @upvotethat for specific inquiries."
    }
  ];

  const pricingPackages = [
    { price: "$10", perUpvote: "$0.10", upvotes: "100", description: "for 100 Upvotes" },
    { price: "$25", perUpvote: "$0.08", upvotes: "275", description: "for 275 Upvotes" },
    { price: "$50", perUpvote: "$0.07", upvotes: "625", description: "for 625 Upvotes", popular: true },
    { price: "$100", perUpvote: "$0.065", upvotes: "1333", description: "for 1333 Upvotes" },
    { price: "$200", perUpvote: "$0.06", upvotes: "2857", description: "for 2857 Upvotes" },
    { price: "$500", perUpvote: "$0.05", upvotes: "8333", description: "for 8333 Upvotes", consultation: true },
    { price: "$1000", perUpvote: "$0.04", upvotes: "20000", description: "for 20000 Upvotes", consultation: true },
    { price: "$3000", perUpvote: "$0.035", upvotes: "75000", description: "for 75000 Upvotes", consultation: true }
  ];

  const postingPackages = [
    { posts: "1 Post", price: "$50" },
    { posts: "5 Posts", price: "$150" },
    { posts: "10 Posts", price: "$250" },
  ];

  const commentingPackages = [
    { comments: "1 Comment", price: "$20 Each", type: "with link" },
    { comments: "5 Comments", price: "$100", type: "with link" },
    { comments: "10 Comments", price: "$200", type: "with link" },
    { comments: "1 Comment", price: "$10 Each", type: "without link" },
    { comments: "5 Comments", price: "$50", type: "without link" },
    { comments: "10 Comments", price: "$100", type: "without link" },
  ];

  return (
    <ErrorBoundary> {/* Wrap the entire component content with ErrorBoundary */}
      <div className="min-h-screen bg-gray-50 font-inter"> {/* Added font-inter for consistent typography */}
        {/* Header */}
        <header className="bg-black text-white p-4 shadow-lg sticky top-0 z-50">
          <nav className="container mx-auto flex justify-between items-center py-2">
            <div className="flex items-center space-x-3">
              {/* Updated alt text for logo */}
              <img src="/black-bg-logo.png" alt="UpvoteThat.com Logo" className="h-24 w-auto" />
            </div>
            <div className="hidden md:flex space-x-4 items-center">
              {/* Navigation for DIY and DFY services */}
              <a href="/auth" className="text-white hover:text-orange-300 transition duration-300 font-semibold px-3 py-2 rounded-md">
                DIY Upvote Platform
              </a>
              <a href="#custom-campaigns" className="text-white hover:text-orange-300 transition duration-300 font-semibold px-3 py-2 rounded-md">
                Done For You Campaigns
              </a>
              <a href="#contact" className="bg-orange-500 text-white py-2 px-6 rounded-full font-semibold hover:bg-orange-600 transition duration-300 shadow-md">
                Book A Consultation
              </a>
            </div>
            <button className="md:hidden text-white focus:outline-none" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-black px-4 py-2 rounded-lg shadow-inner mt-2">
              <a
                href="/auth"
                className="block text-white text-center py-2 px-6 rounded-full font-semibold hover:bg-gray-800 transition duration-300 mt-4"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                DIY Upvote Platform
              </a>
              <a
                href="#custom-campaigns"
                className="block text-white text-center py-2 px-6 rounded-full font-semibold hover:bg-gray-800 transition duration-300 mt-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Done For You Campaigns
              </a>
              <a
                href="#contact"
                className="block bg-orange-500 text-white text-center py-2 px-6 rounded-full font-semibold hover:bg-orange-600 transition duration-300 mt-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Book A Consultation
              </a>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="bg-black text-white py-24 md:py-36 flex items-center justify-center min-h-screen">
          <div className="container mx-auto text-center px-4 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Dominate Reddit: <span className="text-orange-500">DIY or Done For You?</span>
            </h1>
            <p className="text-lg md:text-xl mb-10 opacity-90">
              Whether you prefer hands-on control or a fully managed service, UpvoteThat.com has the perfect solution to elevate your Reddit presence.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="/auth" className="inline-flex items-center bg-orange-500 text-white font-bold py-5 px-10 rounded-full shadow-lg hover:bg-orange-600 transition duration-300 transform hover:scale-105 text-2xl">
                DIY Upvote Platform <ArrowRight className="ml-3 w-6 h-6" />
              </a>
              <a href="#custom-campaigns" className="inline-flex items-center bg-blue-600 text-white font-bold py-5 px-10 rounded-full shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 text-2xl">
                Done For You Campaigns <ArrowRight className="ml-3 w-6 h-6" />
              </a>
            </div>
          </div>
        </section>

        {/* DIY Services Section (Renamed from Services Section) */}
        <section id="diy-services" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-12 text-black">Our DIY Upvote & Comment Platform</h2>
            <p className="text-lg md:text-xl mb-10 text-gray-600 max-w-3xl mx-auto">
              Take control of your Reddit marketing with our easy-to-use self-service panel. Get instant upvotes and comments whenever you need them.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {/* Reddit Upvotes */}
              <Card className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center text-center transition duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl">
                <div className="text-orange-500 text-6xl mb-6">
                  <ChevronDown className="w-16 h-16 rotate-180" />
                </div>
                <CardTitle className="text-2xl font-bold mb-4">Reddit Upvotes</CardTitle>
                <CardContent className="p-0">
                  <p className="text-gray-600 mb-6">Increase your post's visibility and ranking instantly with high-quality upvotes from real users.</p>
                  <a href="/auth" className="inline-flex items-center bg-orange-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-orange-600 transition duration-300 transform hover:scale-105">
                    Buy Upvotes <ShoppingCart className="ml-2 w-4 h-4" />
                  </a>
                </CardContent>
              </Card>

              {/* Reddit Comments */}
              <Card className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center text-center transition duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl">
                <div className="text-blue-600 text-6xl mb-6">
                  <Send className="w-16 h-16" />
                </div>
                <CardTitle className="text-2xl font-bold mb-4">Reddit Comments</CardTitle>
                <CardContent className="p-0">
                  <p className="text-gray-600 mb-6">Drive engaging discussions and add authenticity to your posts with genuine comments.</p>
                  <a href="/auth" className="inline-flex items-center bg-orange-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-orange-600 transition duration-300 transform hover:scale-105">
                    Buy Comments <ShoppingCart className="ml-2 w-4 h-4" />
                  </a>
                </CardContent>
              </Card>

              {/* Aged Reddit Accounts */}
              <Card className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center text-center transition duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl">
                <div className="text-blue-600 text-6xl mb-6">
                  <Users className="w-16 h-16" />
                </div>
                <CardTitle className="text-2xl font-bold mb-4">Aged Reddit Accounts</CardTitle>
                <CardContent className="p-0">
                  <p className="text-gray-600 mb-6">Access high-karma, aged Reddit accounts for various marketing needs and community engagement.</p>
                  <a href="/auth" className="inline-flex items-center bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105">
                    Inquire Now <Info className="ml-2 w-4 h-4" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section (for DIY Upvotes) */}
        <section className="py-16 bg-black text-white" id="pricing">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-12">Flexible Pricing for DIY Upvotes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {pricingPackages.map((pkg, index) => (
                <Card key={index} className={`p-8 rounded-2xl shadow-xl flex flex-col items-center transition duration-300 transform hover:scale-105 relative ${pkg.popular ? 'bg-orange-500 text-white border-b-8 border-white' : 'bg-white text-black border-t-8 border-orange-500'}`}>
                  {pkg.popular && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-2xl font-bold">{pkg.price} Package</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 text-center">
                    <p className="text-4xl font-extrabold mb-2">{pkg.perUpvote}/Upvote</p>
                    <p className="text-lg mb-6">{pkg.description}</p>
                    {pkg.consultation && (
                      <p className="text-md font-semibold text-green-600 mt-4">Includes 30-min Reddit Consultation</p>
                    )}
                    <a href="/auth" className={`w-full inline-block text-center py-3 px-6 rounded-full font-bold transition duration-300 mt-auto ${pkg.popular ? 'bg-white text-orange-500 hover:bg-gray-100' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                      Order Now
                    </a>
                  </CardContent>
                </Card>
              ))}

              {/* Enterprise Package */}
              <Card className="bg-blue-600 text-white p-8 rounded-2xl shadow-xl flex flex-col items-center border-b-8 border-white transition duration-300 transform hover:scale-105 relative col-span-full lg:col-span-4">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-3xl font-bold">Enterprise Package</CardTitle>
                </CardHeader>
                <CardContent className="p-0 text-center">
                  <p className="text-5xl font-extrabold mb-2">$5000+</p>
                  <p className="text-lg mb-6">Custom solutions for large-scale needs.</p>
                  <p className="text-md font-semibold text-white mt-4">Includes dedicated strategy and support.</p>
                  <a href="https://t.me/upvotethat" className="w-full max-w-md mx-auto inline-flex items-center justify-center bg-white text-blue-600 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-gray-100 transition duration-300 mt-4">
                    Let's Talk <Send className="ml-2 w-4 h-4" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Done For You: Custom Campaigns Section */}
        <section id="custom-campaigns" className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-12 text-black">
              ✨ Done For You: Custom Reddit Campaigns
            </h2>
            <p className="text-lg md:text-xl mb-10 text-gray-600 max-w-3xl mx-auto">
              Let our experts handle your Reddit marketing from start to finish. We craft and execute tailored campaigns using our high-authority accounts for maximum impact.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
              {/* Custom Posting Card */}
              <Card className="bg-gray-100 p-8 rounded-2xl shadow-md transition duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl">
                <div className="text-orange-500 text-5xl mb-4 flex justify-center">
                  <FilePlus2 className="w-12 h-12" />
                </div>
                <CardTitle className="text-2xl font-bold mb-4">Custom Reddit Posting</CardTitle>
                <CardContent className="p-0">
                  <p className="text-gray-600 mb-6">
                    We publish your content directly from our network of aged, high-karma Reddit accounts. Ideal for product launches, announcements, or thought leadership.
                  </p>
                  <Button
                    onClick={openPostingModal}
                    className="inline-flex items-center bg-orange-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-orange-600 transition duration-300"
                  >
                    View Posting Packages <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Custom Commenting Card */}
              <Card className="bg-gray-100 p-8 rounded-2xl shadow-md transition duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl">
                <div className="text-blue-600 text-5xl mb-4 flex justify-center">
                  <MessageSquarePlus className="w-12 h-12" />
                </div>
                <CardTitle className="text-2xl font-bold mb-4">Custom Reddit Commenting</CardTitle>
                <CardContent className="p-0">
                  <p className="text-gray-600 mb-6">
                    We add natural, context-rich comments to your posts or relevant discussions. Drive conversations and provide authentic third-party validation.
                  </p>
                  <Button
                    onClick={openCommentingModal}
                    className="inline-flex items-center bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-blue-700 transition duration-300"
                  >
                    View Commenting Prices <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-4 text-black">Ready for a Fully Managed Strategy?</h3>
              <p className="text-lg text-gray-600 mb-8">
                For a personalized approach tailored to your specific goals, message us on <a href="https://t.me/upvotethat" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Telegram</a> or email us at <a href="mailto:support@upvotethat.com" className="text-blue-600 hover:underline font-semibold">support@upvotethat.com</a>.
              </p>
            </div>
          </div>
        </section>

        {/* Aged Reddit Accounts Section */}
        <section id="aged-accounts" className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-12 text-black">
              🔥 Aged Reddit Accounts for Sale — Starting at Just $12
            </h2>
            <p className="text-lg md:text-xl mb-10 text-gray-600 max-w-3xl mx-auto">
              Looking to skip the warm-up phase and hit the ground running on Reddit? We've got aged accounts ready to go — from 6 months to 15+ years old.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
              <Card className="bg-gray-100 p-8 rounded-2xl shadow-md transition duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl">
                <div className="text-orange-500 text-5xl mb-4 flex justify-center">
                  <Rocket className="w-12 h-12" />
                </div>
                <CardTitle className="text-2xl font-bold mb-4">Instant Access – Best Price, Limited Selection</CardTitle>
                <CardContent className="p-0">
                  <p className="text-gray-600 mb-6">
                    Get aged accounts at the best possible price from our live feed. The selection rotates fast, so act quick. Just pick from the list, and we'll handle the rest.
                  </p>
                  <a href="/auth" className="inline-flex items-center bg-orange-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-orange-600 transition duration-300">
                    Check Live Stock <ArrowRight className="ml-2 w-4 h-4" />
                  </a>
                </CardContent>
              </Card>
              <Card className="bg-gray-100 p-8 rounded-2xl shadow-md transition duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl">
                <div className="text-blue-600 text-5xl mb-4 flex justify-center">
                  <Users className="w-12 h-12" />
                </div>
                <CardTitle className="text-2xl font-bold mb-4">Custom Request – Tell Us What You Want</CardTitle>
                <CardContent className="p-0">
                  <p className="text-gray-600 mb-6">
                    Need something specific? Username style, karma range, age bracket — tell us your vibe. We'll shop the underground Reddit streets for you.
                  </p>
                  <a href="https://t.me/upvotethat" target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-blue-700 transition duration-300">
                    Make a Custom Request <Send className="ml-2 w-4 h-4" />
                  </a>
                </CardContent>
              </Card>
            </div>
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-4 text-black">🧠 How to Order:</h3>
              <p className="text-lg text-gray-600 mb-8">
                Just message us on <a href="https://t.me/upvotethat" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Telegram</a>. We'll walk you through it.
              </p>
              <p className="text-gray-500 text-sm italic">
                💬 Trusted by hundreds of stealthy marketers, spinners, and shillers.
              </p>
            </div>
          </div>
        </section>

        {/* Ebook Section */}
        <section id="ebook-offer" className="py-16 bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-8">
              📚 Reddit Psychological Warfare: Your Tactical Guide to Viral Marketing Domination
            </h2>
            <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
              Unlock the power of Reddit. This isn't just a forum; it's a dynamic ecosystem and a goldmine for savvy marketers. This guide is your comprehensive blueprint to understanding, navigating, and ultimately conquering the Reddit landscape. Master the subtle art of influence and orchestrate viral content with precision.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="flex-shrink-0">
                <a href="https://reddit.rootaccess.design/pdf" target="_blank" rel="noopener noreferrer"><img
                  src="/homepage/ebook-cover.jpg"
                  alt="Reddit Psychological Warfare Ebook Cover"
                  className="w-48 md:w-64 h-auto rounded-lg shadow-2xl transform hover:scale-105 transition duration-300"
                /></a>
              </div>
              <div className="text-center md:text-center">
                <p className="text-5xl font-extrabold mb-4">$7</p>
                <a
                  href="https://reddit.rootaccess.design/pdf"
                  className="inline-flex items-center bg-white text-orange-500 font-bold py-4 px-10 rounded-full shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105 text-xl"
                >
                  Purchase Now <ShoppingCart className="ml-3 w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* AI Marketing Bot Section */}
        <section id="ai-marketing-bot" className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-8">
              🤖 AI-Powered Reddit Marketing: Your Personal Content Creator
            </h2>
            <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto">
              Leverage our custom Chat GPT marketing bot to effortlessly craft compelling Reddit posts, insightful comments, and engaging sub-comments. Get precise, tailored content ideas for each aged account, ensuring your message resonates perfectly with Reddit communities.
            </p>
            <a
              href="/auth"
              className="inline-flex items-center bg-white text-blue-600 font-bold py-4 px-10 rounded-full shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105 text-xl"
            >
              Craft your first post: Sign up for free trial today <Sparkles className="ml-3 w-6 h-6" />
            </a>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-12 text-black">Why Choose <span className="text-orange-500">UpvoteThat.com</span>?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-lg text-center">
                <Users className="text-orange-500 w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Real & Authentic Engagement</h3>
                <p className="text-gray-600">Our network consists of real, active Reddit users, ensuring genuine engagement that looks natural.</p>
              </div>
              <div className="p-6 rounded-lg text-center">
                <Rocket className="text-blue-600 w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Blazing Fast Delivery</h3>
                <p className="text-gray-600">Receive your upvotes and comments swiftly, helping your posts gain traction when it matters most.</p>
              </div>
              <div className="p-6 rounded-lg text-center">
                <Headphones className="text-green-500 w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">24/7 Customer Support</h3>
                <p className="text-gray-600">Our dedicated support team is always available to assist you with any questions or issues.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-12 text-black">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="flex flex-col items-center">
                <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg">1</div>
                <h3 className="text-xl font-semibold mb-2">Select Your Service</h3>
                <p className="text-gray-600">Choose the upvote or comment package that fits your needs from our offerings.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg">2</div>
                <h3 className="text-xl font-semibold mb-2">Provide Your Link</h3>
                <p className="text-gray-600">Simply give us the URL to your Reddit post or comment you wish to boost.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-black text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg">3</div>
                <h3 className="text-xl font-semibold mb-2">Watch Your Post Rise</h3>
                <p className="text-gray-600">See your content gain traction and rise in visibility within minutes!</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-center mb-12 text-black">What Our Customers Are Saying</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-white p-8 rounded-2xl shadow-md">
                <CardContent className="p-0">
                  <p className="text-lg italic text-gray-700 mb-4">"Absolutely incredible! My post reached the front page in hours, something I never thought possible. UpvoteThat.com is the real deal."</p>
                  <p className="font-semibold text-orange-500">— Jessica L., Small Business Owner</p>
                </CardContent>
              </Card>
              <Card className="bg-white p-8 rounded-2xl shadow-md">
                <CardContent className="p-0">
                  <p className="text-lg italic text-gray-700 mb-4">"I've tried other services, but the quality of engagement here is unmatched. Real comments and a noticeable boost. Highly recommend!"</p>
                  <p className="font-semibold text-orange-500">— Mark T., Digital Marketer</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-center mb-12 text-black">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-5xl mx-auto">
              {faqItems.map((item, index) => (
                <div key={index} className="bg-gray-100 rounded-lg shadow-sm">
                  <button
                    onClick={() => toggleFaqItem(index)}
                    className="flex justify-between items-center p-5 w-full text-left cursor-pointer text-lg font-semibold text-black hover:bg-gray-200 transition duration-200 rounded-lg"
                  >
                    {item.question}
                    <ChevronDown className={`w-5 h-5 transform transition-transform duration-300 ${openFaqItems.includes(index) ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaqItems.includes(index) ? 'max-h-screen' : 'max-h-0'}`}>
                    <div className="p-5 pt-0 text-gray-600">
                      <div className="pt-2 border-t border-gray-200">
                        {item.answer}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 bg-orange-500 text-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Ready to Dominate Reddit?</h2>
            <p className="text-xl mb-10">Contact us today for a free consultation or to discuss your specific needs.</p>
            <a href="/auth" className="inline-flex items-center bg-white text-orange-500 font-bold py-4 px-10 rounded-full shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105 text-xl">
              Get Started Now <Plane className="ml-2 w-5 h-5" />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <div className="mb-4 space-x-4 flex flex-wrap justify-center items-center">
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
              <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
              <a href="#" className="text-blue-600 hover:underline">Refund Policy</a>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <a
                href="https://t.me/upvotethat"
                className="inline-flex items-center text-white hover:text-blue-400 transition duration-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare className="mr-2 w-5 h-5" /> Telegram
              </a>
              <a
                href="mailto:support@upvotethat.com"
                className="inline-flex items-center text-white hover:text-gray-400 transition duration-300"
              >
                <Mail className="mr-2 w-5 h-5" /> Email
              </a>
            </div>
            <p className="text-gray-400 mt-4">&copy; 2025 UpvoteThat.com. All rights reserved. Not affiliated with Reddit Inc.</p>
          </div>
        </footer>

        {/* Global Redirect Message */}
        {showRedirectMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white text-black rounded-lg shadow-xl p-8 max-w-sm w-full text-center">
              <h3 className="text-2xl font-bold mb-4">Redirecting to Signup...</h3>
              <p className="text-lg text-gray-700">
                Please sign up for a free account to proceed with your purchase of the {redirectingPackage?.price} {redirectingPackage?.description || redirectingPackage?.posts || redirectingPackage?.comments} package.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                You will be redirected in a few seconds.
              </p>
            </div>
          </div>
        )}

        {/* Posting Packages Modal */}
        {isPostingModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={closePostingModal}>
            <div className="bg-white text-black rounded-lg shadow-xl p-8 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={closePostingModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition duration-200"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-3xl font-bold text-center mb-6 text-black">Done For You: Reddit Posting Packages</h3>

              <div className="mb-8">
                <ul className="space-y-3 text-lg text-gray-800">
                  {postingPackages.map((pkg, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                      <span>{pkg.posts}</span>
                      <span className="font-bold text-xl">{pkg.price}</span>
                      <Button
                        onClick={() => handlePurchaseClick(pkg.posts, pkg.price)}
                        className="ml-4 bg-orange-500 text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-orange-600 transition duration-300 text-sm"
                      >
                        Purchase
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>

              {showPurchaseInstructions && (
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-left">
                  <p className="text-red-700 font-semibold mb-2">
                    Please note: Once your post is live in the subreddit, we are not responsible for its subsequent removal by moderators.
                  </p>
                  <p className="text-gray-800 mb-3">
                    To proceed with your purchase, please create an account on our platform: <a href="/auth" className="text-blue-600 hover:underline">/auth</a>
                  </p>
                  <p className="text-gray-800 mb-3">
                    After creating your account, message us on Telegram or Email with your order details:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mb-3">
                    <a
                      href={`https://t.me/upvotethat?text=${encodeURIComponent(selectedPackageText)}`}
                      className="inline-flex items-center justify-center bg-blue-500 text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-blue-600 transition duration-300 text-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="mr-2 w-4 h-4" /> Telegram
                    </a>
                    <a
                      href={`mailto:support@upvotethat.com?subject=Order Inquiry&body=${encodeURIComponent(selectedPackageText)}`}
                      className="inline-flex items-center justify-center bg-gray-700 text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-gray-800 transition duration-300 text-sm"
                    >
                      <Mail className="mr-2 w-4 h-4" /> Email
                    </a>
                  </div>
                  <p className="text-gray-800 text-sm">
                    Alternatively, if you prefer to work through Upwork, a 10% surcharge will apply.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commenting Packages Modal */}
        {isCommentingModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={closeCommentingModal}>
            <div className="bg-white text-black rounded-lg shadow-xl p-8 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={closeCommentingModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition duration-200"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-3xl font-bold text-center mb-6 text-black">Done For You: Reddit Commenting Packages</h3>

              <div className="mb-8">
                <h4 className="text-2xl font-semibold mb-4 text-orange-500">Comments with Link:</h4>
                <ul className="space-y-3 text-lg text-gray-800 mb-6">
                  {commentingPackages.filter(p => p.type === "with link").map((pkg, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                      <span>{pkg.comments}</span>
                      <span className="font-bold text-xl">{pkg.price}</span>
                      <Button
                        onClick={() => handlePurchaseClick(`${pkg.comments} (${pkg.type})`, pkg.price)}
                        className="ml-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-blue-700 transition duration-300 text-sm"
                      >
                        Purchase
                      </Button>
                    </li>
                  ))}
                </ul>

                <h4 className="text-2xl font-semibold mb-4 text-blue-600">Comments without Link:</h4>
                <ul className="space-y-3 text-lg text-gray-800">
                  {commentingPackages.filter(p => p.type === "without link").map((pkg, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                      <span>{pkg.comments}</span>
                      <span className="font-bold text-xl">{pkg.price}</span>
                      <Button
                        onClick={() => handlePurchaseClick(`${pkg.comments} (${pkg.type})`, pkg.price)}
                        className="ml-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-blue-700 transition duration-300 text-sm"
                      >
                        Purchase
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>

              {showPurchaseInstructions && (
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-left">
                  <p className="text-red-700 font-semibold mb-2">
                    Please note: Once your comment is live in the subreddit, we are not responsible for its subsequent removal by moderators.
                  </p>
                  <p className="text-gray-800 mb-3">
                    To proceed with your purchase, please create an account on our platform: <a href="/auth" className="text-blue-600 hover:underline">/auth</a>
                  </p>
                  <p className="text-gray-800 mb-3">
                    After creating your account, message us on Telegram or Email with your order details:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mb-3">
                    <a
                      href={`https://t.me/upvotethat?text=${encodeURIComponent(selectedPackageText)}`}
                      className="inline-flex items-center justify-center bg-blue-500 text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-blue-600 transition duration-300 text-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="mr-2 w-4 h-4" /> Telegram
                    </a>
                    <a
                      href={`mailto:support@upvotethat.com?subject=Order Inquiry&body=${encodeURIComponent(selectedPackageText)}`}
                      className="inline-flex items-center justify-center bg-gray-700 text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-gray-800 transition duration-300 text-sm"
                    >
                      <Mail className="mr-2 w-4 h-4" /> Email
                    </a>
                  </div>
                  <p className="text-gray-800 text-sm">
                    Alternatively, if you prefer to work through Upwork, a 10% surcharge will apply.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
} 