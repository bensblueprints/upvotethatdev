import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, AlertCircle, Package, CreditCard, HelpCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

interface SupportFormData {
  name: string;
  email: string;
  issueType: string;
  orderNumber: string;
  description: string;
}

export const Support = () => {
  const [formData, setFormData] = useState<SupportFormData>({
    name: '',
    email: '',
    issueType: '',
    orderNumber: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: profile } = useProfile();
  usePageTitle('Support');

  // Auto-fill email when profile loads
  useEffect(() => {
    if (profile?.email && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: profile.email
      }));
    }
  }, [profile?.email, formData.email]);

  const issueTypes = [
    { 
      value: 'order', 
      label: 'Issue Regarding an Order', 
      icon: Package,
      description: 'Problems with upvote orders, comment orders, or delivery'
    },
    { 
      value: 'payment', 
      label: 'Issue Regarding a Payment', 
      icon: CreditCard,
      description: 'Payment problems, refunds, or billing questions'
    },
    { 
      value: 'other', 
      label: 'Something Else', 
      icon: HelpCircle,
      description: 'Account issues, feature requests, or general questions'
    }
  ];

  const handleInputChange = (field: keyof SupportFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your name.',
        variant: 'destructive',
      });
      return;
    }

    const trimmedEmail = (formData.email || '').trim();
    if (!trimmedEmail) {
      toast({
        title: 'Validation Error',
        description: 'Email is missing. Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.issueType) {
      toast({
        title: 'Validation Error',
        description: 'Please select an issue type.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please describe your issue.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.description.length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Please provide more details about your issue (at least 10 characters).',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-support-email', {
        body: {
          name: formData.name.trim(),
          email: trimmedEmail,
          issueType: formData.issueType,
          orderNumber: formData.orderNumber.trim() || null,
          description: formData.description.trim(),
          userId: profile?.id || null,
          userBalance: profile?.balance || 0
        },
      });

      if (error) {
        // Supabase wraps Edge Function non-2xx as FunctionsHttpError.
        const maybeBody = (error as any)?.context?.body;
        if (maybeBody) {
          try {
            const parsed = typeof maybeBody === 'string' ? JSON.parse(maybeBody) : maybeBody;
            throw new Error(parsed?.message || parsed?.error || (error as any)?.message || 'Failed to send support request');
          } catch {
            throw new Error((error as any)?.message || 'Failed to send support request');
          }
        }
        throw error;
      }

      if ((data as any)?.error) throw new Error((data as any).error);
      if ((data as any)?.ok === false) throw new Error((data as any)?.message || 'Failed to send support request');

      toast({
        title: 'Support Request Sent!',
        description: 'We\'ve received your support request and will respond within 24 hours.',
      });

      // Reset form
      setFormData({
        name: '',
        email: profile?.email || '',
        issueType: '',
        orderNumber: '',
        description: ''
      });

    } catch (error: any) {
      console.error('Error sending support request:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send support request. Please try again or contact us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedIssueType = issueTypes.find(type => type.value === formData.issueType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display text-stone-900">Support</h1>
        <p className="text-stone-500 mt-2">Need help? We're here to assist you with any questions or issues.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Submit Support Request
              </CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Email Field (Auto-filled) */}
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    readOnly={!!profile?.email}
                    className={!!profile?.email ? "bg-stone-50 text-stone-600" : undefined}
                  />
                  <p className="text-xs text-stone-500 mt-1">
                    {profile?.email ? 'Email is auto-filled from your account' : 'Enter the email address you want us to reply to'}
                  </p>
                </div>

                {/* Issue Type Dropdown */}
                <div>
                  <Label htmlFor="issueType">What is your issue regarding? *</Label>
                  <Select value={formData.issueType} onValueChange={(value) => handleInputChange('issueType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-stone-500">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Number Field (conditional) */}
                {formData.issueType === 'order' && (
                  <div>
                    <Label htmlFor="orderNumber">Order Number (Optional)</Label>
                    <Input
                      id="orderNumber"
                      type="text"
                      value={formData.orderNumber}
                      onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                      placeholder="e.g., #123, order_1234567890, or leave blank if unknown"
                    />
                    <p className="text-xs text-stone-500 mt-1">
                      If you know the specific order number, please include it to help us assist you faster
                    </p>
                  </div>
                )}

                {/* Description Field */}
                <div>
                  <Label htmlFor="description">Describe Your Issue *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Please provide as much detail as possible about your issue..."
                    rows={6}
                    required
                  />
                  <p className="text-xs text-stone-500 mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Support Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Support Information Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-stone-900">Response Time</h4>
                <p className="text-sm text-stone-600">Within 24 hours</p>
              </div>
              <div>
                <h4 className="font-semibold text-stone-900">Support Hours</h4>
                <p className="text-sm text-stone-600">Monday - Friday, 9 AM - 6 PM EST</p>
              </div>
              <div>
                <h4 className="font-semibold text-stone-900">Email</h4>
                <p className="text-sm text-stone-600">support@upvotethat.com</p>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Common Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Payment Issues</h4>
                <ul className="text-xs text-stone-600 space-y-1">
                  <li>• Crypto payments take 10-15 minutes to confirm</li>
                  <li>• Check your email for payment confirmations</li>
                  <li>• Balance updates automatically after confirmation</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Order Issues</h4>
                <ul className="text-xs text-stone-600 space-y-1">
                  <li>• Orders are processed within 24-48 hours</li>
                  <li>• Check order status in Order Tracking</li>
                  <li>• Ensure your Reddit links are valid</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Current Issue Context */}
          {selectedIssueType && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <selectedIssueType.icon className="w-5 h-5 text-orange-600" />
                  {selectedIssueType.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-800">
                  {selectedIssueType.description}
                </p>
                {formData.issueType === 'order' && (
                  <div className="mt-3 p-3 bg-white rounded border border-orange-200">
                    <p className="text-xs text-stone-600">
                      💡 <strong>Tip:</strong> You can find your order numbers in the "Order Tracking" section of your dashboard.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}; 