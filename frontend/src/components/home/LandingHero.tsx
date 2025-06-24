"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Unlimited movies, TV shows, and more",
      subtitle: "Watch anywhere. Cancel anytime.",
      background:
        "https://images.unsplash.com/photo-1489599514482-cf40e0b9e9c9?w=1920&h=1080&fit=crop",
    },
    {
      title: "Download your shows to watch offline",
      subtitle:
        "Save your favorites easily and always have something to watch.",
      background:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=1080&fit=crop",
    },
    {
      title: "Watch everywhere",
      subtitle:
        "Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.",
      background:
        "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=1920&h=1080&fit=crop",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-red-600 text-3xl font-bold">ONFLIX</div>
          <div className="space-x-4">
            <Button
              variant="ghost"
              className="text-white hover:text-gray-300"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Background Slideshow */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url("${slide.background}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex items-center justify-center text-center">
        <div className="max-w-4xl px-6">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            {slides[currentSlide].title}
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-200 mb-8 font-light">
            {slides[currentSlide].subtitle}
          </p>

          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:items-center sm:justify-center">
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 text-lg w-full sm:w-auto"
              asChild
            >
              <Link href="/register">Get Started</Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black font-semibold px-8 py-4 text-lg w-full sm:w-auto"
              asChild
            >
              <Link href="/browse">
                <Play className="h-5 w-5 mr-2" />
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-2 mt-12">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-red-600 scale-110"
                    : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <ChevronDown className="h-8 w-8" />
      </div>
    </section>
  );
}
