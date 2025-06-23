import React from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Globe,
  Download,
  Smartphone,
} from "lucide-react";
import { APP_NAME, APP_VERSION } from "../../utils/constants";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
      { name: "Blog", href: "/blog" },
      { name: "Investors", href: "/investors" },
    ],
    support: [
      { name: "Help Center", href: "/help" },
      { name: "Contact Us", href: "/contact" },
      { name: "System Status", href: "/status" },
      { name: "Device Support", href: "/devices" },
      { name: "Accessibility", href: "/accessibility" },
    ],
    legal: [
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Content Guidelines", href: "/guidelines" },
      { name: "Copyright", href: "/copyright" },
    ],
    features: [
      { name: "Gift Cards", href: "/gift-cards" },
      { name: "Redeem Gift Card", href: "/redeem" },
      { name: "Download App", href: "/download" },
      { name: "Chromecast", href: "/chromecast" },
      { name: "Smart TV Apps", href: "/smart-tv" },
    ],
  };

  const socialLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      href: "https://facebook.com/streamflix",
    },
    { name: "Twitter", icon: Twitter, href: "https://twitter.com/streamflix" },
    {
      name: "Instagram",
      icon: Instagram,
      href: "https://instagram.com/streamflix",
    },
    { name: "YouTube", icon: Youtube, href: "https://youtube.com/streamflix" },
  ];

  const appStoreLinks = [
    {
      name: "Download for iOS",
      icon: Smartphone,
      href: "#",
      subtitle: "Available on the App Store",
    },
    {
      name: "Download for Android",
      icon: Download,
      href: "#",
      subtitle: "Get it on Google Play",
    },
  ];

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    // Handle newsletter subscription
    console.log("Newsletter subscription:", email);
    // You would typically send this to your API
  };

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Brand & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Play className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">{APP_NAME}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Stream unlimited movies, TV shows, and documentaries. Watch
              anywhere, anytime, on any device. Start your entertainment journey
              today.
            </p>

            {/* Newsletter Signup */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Stay Updated</h4>
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex space-x-2"
              >
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="flex-1"
                  required
                />
                <Button type="submit" size="sm">
                  Subscribe
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">
                Get the latest movies, shows, and platform updates.
              </p>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Features</h4>
            <ul className="space-y-2">
              {footerLinks.features.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* App Download Section */}
        <div className="border-t pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Mobile Apps */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Download Our Apps</h4>
              <div className="space-y-3">
                {appStoreLinks.map((app) => (
                  <a
                    key={app.name}
                    href={app.href}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <app.icon className="h-8 w-8" />
                    <div>
                      <p className="text-sm font-medium">{app.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.subtitle}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>support@streamflix.com</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>1-800-STREAM (1-800-787-3261)</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>123 Streaming Ave, Los Angeles, CA 90210</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>Available in 190+ countries</span>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border rounded-lg hover:bg-accent transition-colors"
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>

              {/* Language Selector */}
              <div className="mt-6">
                <h5 className="text-xs font-medium mb-2">Language</h5>
                <select className="w-full p-2 text-sm border rounded bg-background">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-wrap items-center space-x-4 text-xs text-muted-foreground">
            <span>
              © {currentYear} {APP_NAME}. All rights reserved.
            </span>
            <span>•</span>
            <span>Version {APP_VERSION}</span>
            <span>•</span>
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <span>•</span>
            <Link
              to="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <span>•</span>
            <Link
              to="/cookies"
              className="hover:text-foreground transition-colors"
            >
              Cookies
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>All systems operational</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span>🔒</span>
              <span>SSL Secured</span>
            </div>
          </div>
        </div>

        {/* Age Rating Notice */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-muted-foreground">
            Some content may not be suitable for children. Parental guidance is
            recommended for viewers under 18.
            {APP_NAME} complies with international content rating standards.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
