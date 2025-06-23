import React, { useState, useEffect } from "react";
import {
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Globe,
  Mail,
  Shield,
  Palette,
  Database,
  Zap,
} from "lucide-react";
import { apiService } from "../../services/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import Loading from "../common/Loading";

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    logoUrl: string;
    faviconUrl: string;
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
  };
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireEmailVerification: boolean;
    enableCaptcha: boolean;
    captchaSecret: string;
    jwtSecret: string;
    encryptionKey: string;
  };
  email: {
    provider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableSsl: boolean;
  };
  content: {
    enableContentUpload: boolean;
    maxFileSize: number;
    allowedVideoFormats: string[];
    allowedImageFormats: string[];
    enableTranscoding: boolean;
    defaultVideoQuality: string;
    enableDrm: boolean;
    contentRetention: number;
  };
  streaming: {
    cdnUrl: string;
    enableAdaptiveBitrate: boolean;
    maxConcurrentStreams: number;
    bufferSize: number;
    enableP2P: boolean;
    geoBlocking: boolean;
    blockedCountries: string[];
  };
  analytics: {
    enableAnalytics: boolean;
    googleAnalyticsId: string;
    mixpanelToken: string;
    enableHeatmaps: boolean;
    dataRetention: number;
    anonymizeIp: boolean;
  };
  backup: {
    enableAutoBackup: boolean;
    backupFrequency: string;
    backupRetention: number;
    backupLocation: string;
    s3Bucket: string;
    s3AccessKey: string;
    s3SecretKey: string;
  };
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {}
  );
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get<SystemSettings>("/admin/settings");
      setSettings(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await apiService.put("/admin/settings", settings);
      setSuccess("Settings saved successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (
    section: keyof SystemSettings,
    key: string,
    value: any
  ) => {
    if (!settings) return;

    setSettings((prev) => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value,
      },
    }));
  };

  const handleArrayChange = (
    section: keyof SystemSettings,
    key: string,
    value: string
  ) => {
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    handleSettingChange(section, key, array);
  };

  const testEmailConfiguration = async () => {
    try {
      setTestingEmail(true);
      await apiService.post("/admin/settings/test-email");
      setSuccess("Test email sent successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to send test email");
    } finally {
      setTestingEmail(false);
    }
  };

  const handleFileUpload = async (file: File, type: "logo" | "favicon") => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await apiService.post("/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      interface UploadResponse {
        data: {
          url: string;
        };
      }

      const url = (response.data as UploadResponse).data.url;
      if (type === "logo") {
        handleSettingChange("general", "logoUrl", url);
      } else {
        handleSettingChange("general", "faviconUrl", url);
      }

      setSuccess(
        `${type === "logo" ? "Logo" : "Favicon"} uploaded successfully!`
      );
    } catch (err: any) {
      setError(`Failed to upload ${type}`);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (loading) {
    return <Loading fullScreen text="Loading settings..." />;
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to Load Settings</h2>
        <p className="text-muted-foreground mb-4">
          Unable to fetch system settings.
        </p>
        <Button onClick={fetchSettings}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings and preferences
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="streaming" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Streaming
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">Site Name</label>
                  <Input
                    value={settings.general.siteName}
                    onChange={(e) =>
                      handleSettingChange("general", "siteName", e.target.value)
                    }
                    placeholder="StreamFlix"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Site URL</label>
                  <Input
                    value={settings.general.siteUrl}
                    onChange={(e) =>
                      handleSettingChange("general", "siteUrl", e.target.value)
                    }
                    placeholder="https://streamflix.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Site Description</label>
                <Input
                  value={settings.general.siteDescription}
                  onChange={(e) =>
                    handleSettingChange(
                      "general",
                      "siteDescription",
                      e.target.value
                    )
                  }
                  placeholder="Your ultimate streaming destination"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <Select
                    value={settings.general.language}
                    onValueChange={(value) =>
                      handleSettingChange("general", "language", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Timezone</label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) =>
                      handleSettingChange("general", "timezone", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">Logo</label>
                  <div className="flex items-center gap-4">
                    {settings.general.logoUrl && (
                      <img
                        src={settings.general.logoUrl}
                        alt="Logo"
                        className="h-12 w-auto"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "logo");
                      }}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Favicon</label>
                  <div className="flex items-center gap-4">
                    {settings.general.faviconUrl && (
                      <img
                        src={settings.general.faviconUrl}
                        alt="Favicon"
                        className="h-8 w-8"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "favicon");
                      }}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">
                      Two-Factor Authentication
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Enable 2FA for all users
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.enableTwoFactor}
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        "security",
                        "enableTwoFactor",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">
                      Email Verification
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Require email verification
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.requireEmailVerification}
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        "security",
                        "requireEmailVerification",
                        checked
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium">
                    Session Timeout (minutes)
                  </label>
                  <Input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) =>
                      handleSettingChange(
                        "security",
                        "sessionTimeout",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Max Login Attempts
                  </label>
                  <Input
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) =>
                      handleSettingChange(
                        "security",
                        "maxLoginAttempts",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Minimum Password Length
                  </label>
                  <Input
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) =>
                      handleSettingChange(
                        "security",
                        "passwordMinLength",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">JWT Secret</label>
                  <div className="relative">
                    <Input
                      type={showPasswords.jwtSecret ? "text" : "password"}
                      value={settings.security.jwtSecret}
                      onChange={(e) =>
                        handleSettingChange(
                          "security",
                          "jwtSecret",
                          e.target.value
                        )
                      }
                      placeholder="Enter JWT secret key"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => togglePasswordVisibility("jwtSecret")}
                    >
                      {showPasswords.jwtSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Encryption Key</label>
                  <div className="relative">
                    <Input
                      type={showPasswords.encryptionKey ? "text" : "password"}
                      value={settings.security.encryptionKey}
                      onChange={(e) =>
                        handleSettingChange(
                          "security",
                          "encryptionKey",
                          e.target.value
                        )
                      }
                      placeholder="Enter encryption key"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => togglePasswordVisibility("encryptionKey")}
                    >
                      {showPasswords.encryptionKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">SMTP Host</label>
                  <Input
                    value={settings.email.smtpHost}
                    onChange={(e) =>
                      handleSettingChange("email", "smtpHost", e.target.value)
                    }
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">SMTP Port</label>
                  <Input
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) =>
                      handleSettingChange(
                        "email",
                        "smtpPort",
                        parseInt(e.target.value)
                      )
                    }
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">SMTP Username</label>
                  <Input
                    value={settings.email.smtpUser}
                    onChange={(e) =>
                      handleSettingChange("email", "smtpUser", e.target.value)
                    }
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">SMTP Password</label>
                  <div className="relative">
                    <Input
                      type={showPasswords.smtpPassword ? "text" : "password"}
                      value={settings.email.smtpPassword}
                      onChange={(e) =>
                        handleSettingChange(
                          "email",
                          "smtpPassword",
                          e.target.value
                        )
                      }
                      placeholder="App password or SMTP password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => togglePasswordVisibility("smtpPassword")}
                    >
                      {showPasswords.smtpPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">From Email</label>
                  <Input
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) =>
                      handleSettingChange("email", "fromEmail", e.target.value)
                    }
                    placeholder="noreply@streamflix.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">From Name</label>
                  <Input
                    value={settings.email.fromName}
                    onChange={(e) =>
                      handleSettingChange("email", "fromName", e.target.value)
                    }
                    placeholder="StreamFlix"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Enable SSL</label>
                  <p className="text-xs text-muted-foreground">
                    Use SSL/TLS encryption
                  </p>
                </div>
                <Switch
                  checked={settings.email.enableSsl}
                  onCheckedChange={(checked) =>
                    handleSettingChange("email", "enableSsl", checked)
                  }
                />
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={testEmailConfiguration}
                  disabled={testingEmail}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {testingEmail ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {testingEmail ? "Sending Test Email..." : "Send Test Email"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Settings */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">
                      Enable Content Upload
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Allow content uploading
                    </p>
                  </div>
                  <Switch
                    checked={settings.content.enableContentUpload}
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        "content",
                        "enableContentUpload",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">
                      Enable Transcoding
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Auto-transcode videos
                    </p>
                  </div>
                  <Switch
                    checked={settings.content.enableTranscoding}
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        "content",
                        "enableTranscoding",
                        checked
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">
                    Max File Size (MB)
                  </label>
                  <Input
                    type="number"
                    value={settings.content.maxFileSize}
                    onChange={(e) =>
                      handleSettingChange(
                        "content",
                        "maxFileSize",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Content Retention (days)
                  </label>
                  <Input
                    type="number"
                    value={settings.content.contentRetention}
                    onChange={(e) =>
                      handleSettingChange(
                        "content",
                        "contentRetention",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Allowed Video Formats
                </label>
                <Input
                  value={settings.content.allowedVideoFormats.join(", ")}
                  onChange={(e) =>
                    handleArrayChange(
                      "content",
                      "allowedVideoFormats",
                      e.target.value
                    )
                  }
                  placeholder="mp4, webm, mov"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated list
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Allowed Image Formats
                </label>
                <Input
                  value={settings.content.allowedImageFormats.join(", ")}
                  onChange={(e) =>
                    handleArrayChange(
                      "content",
                      "allowedImageFormats",
                      e.target.value
                    )
                  }
                  placeholder="jpg, png, webp"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated list
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tabs would continue with similar patterns for streaming, analytics, and backup... */}
      </Tabs>
    </div>
  );
};

export default Settings;
