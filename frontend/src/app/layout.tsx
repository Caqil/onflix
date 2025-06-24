import React from "react";
import "./globals.css";

const { useState, useEffect } = React;

export const metadata = {
  title: "OnFlix - Stream Movies & TV Shows",
  description: "Your ultimate streaming platform for movies and TV shows",
  keywords: "streaming, movies, tv shows, entertainment",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-white font-inter antialiased">
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
