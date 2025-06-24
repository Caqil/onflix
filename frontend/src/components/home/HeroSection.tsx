"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Volume2, VolumeX, Plus, ThumbsUp } from "lucide-react";
import { Content } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeroSectionProps {
  content: Content;
}

export function HeroSection({ content }: HeroSectionProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Video/Image */}
      <div className="absolute inset-0">
        <Image
          src={content.backdrop}
          alt={content.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            {/* Badges */}
            <div className="flex items-center gap-3 mb-4">
              {content.isOriginal && (
                <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1">
                  ONFLIX ORIGINAL
                </Badge>
              )}
              {content.featured && (
                <Badge variant="outline" className="border-white/30 text-white">
                  Featured
                </Badge>
              )}
              <Badge variant="outline" className="border-white/30 text-white">
                {content.maturityRating || "PG-13"}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {content.title}
            </h1>

            {/* Description */}
            <p className="text-lg lg:text-xl text-gray-200 mb-6 line-clamp-3 leading-relaxed">
              {content.description}
            </p>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-300 mb-8">
              <span className="flex items-center gap-1">
                <span className="text-green-500">★</span>
                {content.rating?.toFixed(1) || "N/A"}
              </span>
              <span>{new Date(content.releaseDate).getFullYear()}</span>
              <span className="uppercase tracking-wide font-medium">
                {content.type.replace("_", " ")}
              </span>
              {content.duration && (
                <span>
                  {Math.floor(content.duration / 60)}h {content.duration % 60}m
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-200 font-semibold px-8 py-3 text-lg"
                asChild
              >
                <Link href={`/watch/${content.id}`}>
                  <Play className="h-6 w-6 mr-2 fill-current" />
                  Play
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-black/20 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-3 text-lg"
                asChild
              >
                <Link href={`/content/${content.id}`}>
                  <Info className="h-5 w-5 mr-2" />
                  More Info
                </Link>
              </Button>

              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 p-3 rounded-full"
              >
                <Plus className="h-6 w-6" />
              </Button>

              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 p-3 rounded-full"
              >
                <ThumbsUp className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Volume Control */}
        <div
          className={`absolute bottom-8 right-8 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
          onMouseEnter={() => setShowControls(true)}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="border border-white/20 bg-black/20 hover:bg-white/10 backdrop-blur-sm text-white p-3 rounded-full"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
