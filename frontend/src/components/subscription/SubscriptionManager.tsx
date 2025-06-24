"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionPlan } from "@/lib/types";

export default function SubscriptionManager() {
  const {
    subscription,
    paymentMethods,
    isLoading,
    isProcessing,
    error,
    loadPaymentMethods,
    isActive,
    isPaused,
    isCancelled,
    currentPlan,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Mock plans - in real app, these would come from your backend
  const availablePlans: SubscriptionPlan[] = [
    {
      id: "basic",
      name: "Basic",
      description: "HD streaming on 2 devices",
      price: 999,
      currency: "usd",
      interval: "month",
      interval_count: 1,
      features: ["HD streaming", "2 devices", "No downloads"],
      max_devices: 2,
      max_quality: "720p",
      max_downloads: 0,
      concurrent_streams: 1,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "standard",
      name: "Standard",
      description: "Full HD streaming on 4 devices with downloads",
      price: 1599,
      currency: "usd",
      interval: "month",
      interval_count: 1,
      features: ["Full HD streaming", "4 devices", "Downloads", "Ad-free"],
      max_devices: 4,
      max_quality: "1080p",
      max_downloads: 100,
      concurrent_streams: 2,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "premium",
      name: "Premium",
      description: "4K streaming on unlimited devices",
      price: 2199,
      currency: "usd",
      interval: "month",
      interval_count: 1,
      features: [
        "4K streaming",
        "Unlimited devices",
        "Unlimited downloads",
        "Early access",
      ],
      max_devices: -1,
      max_quality: "4k",
      max_downloads: -1,
      concurrent_streams: 4,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ];

  const handlePlanChange = async () => {
    if (!selectedPlan || selectedPlan === currentPlan?.id) return;

    try {
      await updateSubscription(selectedPlan);
      setSelectedPlan("");
    } catch (error) {
      console.error("Failed to update subscription:", error);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription();
      setShowCancelConfirm(false);
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    }
  };

  const handlePause = async () => {
    try {
      await pauseSubscription();
    } catch (error) {
      console.error("Failed to pause subscription:", error);
    }
  };

  const handleResume = async () => {
    try {
      await resumeSubscription();
    } catch (error) {
      console.error("Failed to resume subscription:", error);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return <div className="p-6">Loading subscription details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Subscription Management</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded mb-6">
          {error}
        </div>
      )}

      {/* Current Subscription Status */}
      {subscription && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current Subscription</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="font-medium">{currentPlan?.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p
                className={`font-medium ${
                  isActive
                    ? "text-green-600"
                    : isPaused
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {subscription.status.charAt(0).toUpperCase() +
                  subscription.status.slice(1)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Next Billing Date</p>
              <p className="font-medium">
                {formatDate(subscription.current_period_end)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-medium">
                {formatPrice(
                  currentPlan?.price || 0,
                  currentPlan?.currency || "usd"
                )}
                /{currentPlan?.interval}
              </p>
            </div>
          </div>

          {/* Subscription Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            {isActive && (
              <>
                <button
                  onClick={handlePause}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Pause Subscription"}
                </button>

                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Cancel Subscription
                </button>
              </>
            )}

            {isPaused && (
              <button
                onClick={handleResume}
                disabled={isProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Resume Subscription"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plan Selection */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {availablePlans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedPlan === plan.id
                  ? "border-blue-500 bg-blue-50"
                  : currentPlan?.id === plan.id
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{plan.name}</h3>
                {currentPlan?.id === plan.id && (
                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                    Current
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3">{plan.description}</p>

              <p className="text-lg font-bold mb-3">
                {formatPrice(plan.price, plan.currency)}
                <span className="text-sm font-normal text-gray-600">
                  /{plan.interval}
                </span>
              </p>

              <ul className="text-sm space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {selectedPlan && selectedPlan !== currentPlan?.id && (
          <button
            onClick={handlePlanChange}
            disabled={isProcessing}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Change Plan"}
          </button>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Cancel Subscription</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll lose
              access to premium features at the end of your current billing
              period.
            </p>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Cancel Subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
