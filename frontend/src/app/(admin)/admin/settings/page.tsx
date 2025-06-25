"use client";
import React, { useState, useEffect } from "react";
import {
  Save,
  Settings,
  Globe,
  Play,
  CreditCard,
  Mail,
  Shield,
  Database,
  Bell,
  Palette,
  Code,
  Users,
  FileText,
  AlertTriangle,
} from "lucide-react";
import adminAPI from "@/lib/api/admin";

interface PlatformSettings {
  general: {
    site_name: string;
    site_description: string;
    site_url: string;
    contact_email: string;
    support_phone?: string;
    maintenance_mode: boolean;
    registration_enabled: boolean;
    default_language: string;
    timezone: string;
    terms_url?: string;
    privacy_url?: string;
  };
  streaming: {
    max_quality: string;
    concurrent_streams: number;
    download_enabled: boolean;
    offline_viewing_days: number;
    max_downloads_per_user: number;
    streaming_bitrate_limit: number;
    buffer_size: number;
    adaptive_bitrate: boolean;
  };
  payments: {
    currency: string;
    tax_rate: number;
    trial_period_days: number;
    grace_period_days: number;
    stripe_webhook_secret?: string;
    paypal_enabled: boolean;
    apple_pay_enabled: boolean;
    google_pay_enabled: boolean;
  };
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    from_email: string;
    from_name: string;
    welcome_email_enabled: boolean;
    notification_email_enabled: boolean;
  };
  security: {
    password_min_length: number;
    session_timeout: number;
    max_login_attempts: number;
    account_lockout_duration: number;
    two_factor_enabled: boolean;
    ip_whitelist_enabled: boolean;
    admin_ip_whitelist?: string[];
  };
  storage: {
    cdn_enabled: boolean;
    cdn_url?: string;
    max_file_size: number;
    allowed_file_types: string[];
    thumbnail_quality: number;
    video_compression_enabled: boolean;
  };
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await adminAPI.updateSettings(settings);
      setHasChanges(false);
      // Show success notification
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Show error notification
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (
    section: keyof PlatformSettings,
    field: string,
    value: any
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
    setHasChanges(true);
  };

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "streaming", label: "Streaming", icon: Play },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "email", label: "Email", icon: Mail },
    { id: "security", label: "Security", icon: Shield },
    { id: "storage", label: "Storage", icon: Database },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Failed to load settings. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      {/* Maintenance Mode Warning */}
      {settings.general.maintenance_mode && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            <span className="text-orange-800 font-medium">
              Maintenance mode is currently enabled. Users cannot access the
              platform.
            </span>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-lg shadow mr-6">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                General Settings
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.general.site_name}
                    onChange={(e) =>
                      updateSettings("general", "site_name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.general.contact_email}
                    onChange={(e) =>
                      updateSettings("general", "contact_email", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Description
                </label>
                <textarea
                  rows={3}
                  value={settings.general.site_description}
                  onChange={(e) =>
                    updateSettings(
                      "general",
                      "site_description",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site URL
                  </label>
                  <input
                    type="url"
                    value={settings.general.site_url}
                    onChange={(e) =>
                      updateSettings("general", "site_url", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Support Phone
                  </label>
                  <input
                    type="tel"
                    value={settings.general.support_phone || ""}
                    onChange={(e) =>
                      updateSettings("general", "support_phone", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintenance_mode"
                    checked={settings.general.maintenance_mode}
                    onChange={(e) =>
                      updateSettings(
                        "general",
                        "maintenance_mode",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="maintenance_mode"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable maintenance mode
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="registration_enabled"
                    checked={settings.general.registration_enabled}
                    onChange={(e) =>
                      updateSettings(
                        "general",
                        "registration_enabled",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="registration_enabled"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Allow new user registrations
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "streaming" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Streaming Settings
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Quality
                  </label>
                  <select
                    value={settings.streaming.max_quality}
                    onChange={(e) =>
                      updateSettings("streaming", "max_quality", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="4k">4K</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concurrent Streams
                  </label>
                  <input
                    type="number"
                    value={settings.streaming.concurrent_streams}
                    onChange={(e) =>
                      updateSettings(
                        "streaming",
                        "concurrent_streams",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offline Viewing Days
                  </label>
                  <input
                    type="number"
                    value={settings.streaming.offline_viewing_days}
                    onChange={(e) =>
                      updateSettings(
                        "streaming",
                        "offline_viewing_days",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Days before downloads expire
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Downloads per User
                  </label>
                  <input
                    type="number"
                    value={settings.streaming.max_downloads_per_user}
                    onChange={(e) =>
                      updateSettings(
                        "streaming",
                        "max_downloads_per_user",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="download_enabled"
                    checked={settings.streaming.download_enabled}
                    onChange={(e) =>
                      updateSettings(
                        "streaming",
                        "download_enabled",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="download_enabled"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable offline downloads
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="adaptive_bitrate"
                    checked={settings.streaming.adaptive_bitrate}
                    onChange={(e) =>
                      updateSettings(
                        "streaming",
                        "adaptive_bitrate",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="adaptive_bitrate"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable adaptive bitrate streaming
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Payment Settings
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={settings.payments.currency}
                    onChange={(e) =>
                      updateSettings("payments", "currency", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.payments.tax_rate}
                    onChange={(e) =>
                      updateSettings(
                        "payments",
                        "tax_rate",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trial Period (days)
                  </label>
                  <input
                    type="number"
                    value={settings.payments.trial_period_days}
                    onChange={(e) =>
                      updateSettings(
                        "payments",
                        "trial_period_days",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grace Period (days)
                  </label>
                  <input
                    type="number"
                    value={settings.payments.grace_period_days}
                    onChange={(e) =>
                      updateSettings(
                        "payments",
                        "grace_period_days",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Days before subscription cancellation after failed payment
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="paypal_enabled"
                    checked={settings.payments.paypal_enabled}
                    onChange={(e) =>
                      updateSettings(
                        "payments",
                        "paypal_enabled",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="paypal_enabled"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable PayPal payments
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="apple_pay_enabled"
                    checked={settings.payments.apple_pay_enabled}
                    onChange={(e) =>
                      updateSettings(
                        "payments",
                        "apple_pay_enabled",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="apple_pay_enabled"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable Apple Pay
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="google_pay_enabled"
                    checked={settings.payments.google_pay_enabled}
                    onChange={(e) =>
                      updateSettings(
                        "payments",
                        "google_pay_enabled",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="google_pay_enabled"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable Google Pay
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Security Settings
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Password Length
                  </label>
                  <input
                    type="number"
                    value={settings.security.password_min_length}
                    onChange={(e) =>
                      updateSettings(
                        "security",
                        "password_min_length",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={(e) =>
                      updateSettings(
                        "security",
                        "session_timeout",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    value={settings.security.max_login_attempts}
                    onChange={(e) =>
                      updateSettings(
                        "security",
                        "max_login_attempts",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Lockout Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.security.account_lockout_duration}
                    onChange={(e) =>
                      updateSettings(
                        "security",
                        "account_lockout_duration",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="two_factor_enabled"
                    checked={settings.security.two_factor_enabled}
                    onChange={(e) =>
                      updateSettings(
                        "security",
                        "two_factor_enabled",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="two_factor_enabled"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable two-factor authentication
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ip_whitelist_enabled"
                    checked={settings.security.ip_whitelist_enabled}
                    onChange={(e) =>
                      updateSettings(
                        "security",
                        "ip_whitelist_enabled",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="ip_whitelist_enabled"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable IP whitelist for admin access
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
