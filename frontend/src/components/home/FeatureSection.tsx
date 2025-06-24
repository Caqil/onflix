"use client";

import { Play, Download, Monitor, Users } from "lucide-react";

export function FeatureSection() {
  const features = [
    {
      icon: Play,
      title: "Stream Anywhere",
      description:
        "Watch on your TV, laptop, phone, or tablet. No extra fees, no contracts.",
    },
    {
      icon: Download,
      title: "Download & Go",
      description:
        "Download movies and shows to watch offline. Perfect for travel or commuting.",
    },
    {
      icon: Monitor,
      title: "4K Ultra HD",
      description:
        "Enjoy your favorite content in stunning 4K Ultra HD with Dolby Atmos sound.",
    },
    {
      icon: Users,
      title: "Family Profiles",
      description:
        "Create profiles for kids with content just for them. Parental controls included.",
    },
  ];

  return (
    <section className="py-24 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Why Choose Onflix?
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Experience entertainment like never before with our cutting-edge
            streaming platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-red-500 transition-colors">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
