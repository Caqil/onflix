
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useUser } from '@/app/Contexts/UserContext';

export function useSubscription() {
  const { isAuthenticated } = useAuth();
  const userContext = useUser();
  const [stripeLoaded, setStripeLoaded] = useState(false);

  // Load Stripe when needed
  useEffect(() => {
    if (typeof window !== 'undefined' && !stripeLoaded) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => setStripeLoaded(true);
      document.head.appendChild(script);
    }
  }, [stripeLoaded]);

  // Helper to check subscription status
  const checkSubscriptionAccess = (requiredPlan?: string) => {
    if (!userContext.subscription) return false;
    
    const { status, plan } = userContext.subscription;
    const isActive = status === 'active';
    
    if (!isActive) return false;
    if (!requiredPlan) return true;
    
    // Check if current plan meets requirements
    const planHierarchy = ['basic', 'standard', 'premium'];
    const currentPlanIndex = planHierarchy.indexOf(plan?.name?.toLowerCase() || '');
    const requiredPlanIndex = planHierarchy.indexOf(requiredPlan.toLowerCase());
    
    return currentPlanIndex >= requiredPlanIndex;
  };

  // Helper to handle payment method setup with Stripe
  const setupPaymentMethod = async () => {
    if (!stripeLoaded || !window.Stripe) {
      throw new Error('Stripe not loaded');
    }

    const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    
    // This would typically involve creating a setup intent on your backend
    // and using Stripe Elements to collect payment information
    const { error, setupIntent } = await stripe.confirmCardSetup(
      // You'd get this client secret from your backend
      'seti_1234567890_secret_abcd'
    );

    if (error) {
      throw error;
    }

    if (setupIntent?.payment_method) {
      await userContext.addPaymentMethod(setupIntent.payment_method.id);
    }
  };

  // Helper to cancel subscription with confirmation
  const cancelWithConfirmation = async (reason?: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will lose access to premium content at the end of your billing period.'
    );
    
    if (confirmed) {
      try {
        await userContext.cancelSubscription();
        // Optionally send cancellation reason to backend
        console.log('Subscription cancelled:', reason);
      } catch (error) {
        console.error('Failed to cancel subscription:', error);
        throw error;
      }
    }
  };

  return {
    ...userContext,
    stripeLoaded,
    checkSubscriptionAccess,
    setupPaymentMethod,
    cancelWithConfirmation,
    // Computed values
    canStreamContent: checkSubscriptionAccess(),
    canDownloadContent: checkSubscriptionAccess('standard'),
    canStream4K: checkSubscriptionAccess('premium'),
    hasActiveSubscription: userContext.subscription?.status === 'active',
    subscriptionEndsAt: userContext.subscription?.current_period_end,
    nextBillingDate: userContext.subscription?.current_period_end,
    billingAmount: userContext.subscription?.plan?.price || 0,
  };
}

