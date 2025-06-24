"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import { Content } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  content: Content;
}

export function HeroSection({ content }: HeroSectionProps) {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={content.backdrop}
          alt={content.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {content.title}
            </h1>
            <p className="text-lg text-gray-300 mb-6 line-clamp-3">
              {content.description}
            </p>

            <div className="flex items-center gap-2 text-sm text-gray-300 mb-8">
              <span>{new Date(content.releaseDate).getFullYear()}</span>
              <span>•</span>
              <span className="uppercase">
                {content.type.replace("_", " ")}
              </span>
              {content.rating && (
                <>
                  <span>•</span>
                  <span>★ {content.rating.toFixed(1)}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-200"
                asChild
              >
                <Link href={`/watch/${content.id}`}>
                  <Play className="h-5 w-5 mr-2" />
                  Play
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black"
                asChild
              >
                <Link href={`/content/${content.id}`}>
                  <Info className="h-5 w-5 mr-2" />
                  More Info
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Volume Control */}
        <div className="absolute bottom-24 right-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="border-white/20 bg-black/20 hover:bg-black/40"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-white" />
            ) : (
              <Volume2 className="h-4 w-4 text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
