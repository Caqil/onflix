"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export function Footer() {
  const footerLinks = {
    Company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
      { name: "Blog", href: "/blog" },
    ],
    Support: [
      { name: "Help Center", href: "/help" },
      { name: "Contact Us", href: "/contact" },
      { name: "Supported Devices", href: "/devices" },
      { name: "System Status", href: "/status" },
    ],
    Legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Preferences", href: "/cookies" },
      { name: "Content Guidelines", href: "/guidelines" },
    ],
  };

  return (
    <footer className="bg-black border-t border-gray-800">
      <div className="container mx-auto px-6 py-12">
        {/* Social Links */}
        <div className="flex justify-center space-x-6 mb-8">
          {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
            <Link
              key={index}
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Icon className="h-6 w-6" />
            </Link>
          ))}
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-red-600 text-2xl font-bold mb-4 md:mb-0">
            ONFLIX
          </div>
          <div className="text-gray-400 text-sm text-center md:text-right">
            <p>&copy; 2024 Onflix, Inc. All rights reserved.</p>
            <p className="mt-1">Made with ❤️ for movie lovers worldwide</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
