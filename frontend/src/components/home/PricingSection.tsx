"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PricingSection() {
  const plans = [
    {
      name: "Basic",
      price: 8.99,
      description:
        "Good video quality in SD (480p). Watch on 1 screen at a time.",
      features: [
        "Unlimited movies & TV shows",
        "Watch on 1 screen at a time",
        "SD (480p) video quality",
        "Download on 1 device",
      ],
      popular: false,
    },
    {
      name: "Standard",
      price: 13.99,
      description:
        "Great video quality in HD (1080p). Watch on 2 screens at a time.",
      features: [
        "Unlimited movies & TV shows",
        "Watch on 2 screens at a time",
        "HD (1080p) video quality",
        "Download on 2 devices",
      ],
      popular: true,
    },
    {
      name: "Premium",
      price: 17.99,
      description:
        "Our best video quality in 4K + HDR. Watch on 4 screens at a time.",
      features: [
        "Unlimited movies & TV shows",
        "Watch on 4 screens at a time",
        "4K + HDR video quality",
        "Download on 4 devices",
        "Spatial audio support",
      ],
      popular: false,
    },
  ];

  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            No contracts, no cancellation fees. Switch plans or cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative bg-gray-900 border-gray-700 hover:scale-105 transition-all duration-300 ${
                plan.popular ? "ring-2 ring-red-600 transform scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </CardTitle>
                <div className="text-4xl font-bold text-white mb-2">
                  ${plan.price}
                  <span className="text-lg text-gray-400 font-normal">
                    /month
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-gray-300"
                    >
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                  asChild
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">Already have an account?</p>
          <Button
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800"
            asChild
          >
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
