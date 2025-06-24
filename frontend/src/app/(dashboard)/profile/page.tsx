"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userAPI } from "@/lib/api";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { Camera, Edit } from "lucide-react";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    dateOfBirth: user?.profile?.dateOfBirth || "",
    country: user?.profile?.country || "",
    language: user?.profile?.language || "en",
  });
  const [preferences, setPreferences] = useState({
    autoplay: user?.profile?.preferences?.autoplay || false,
    subtitles: user?.profile?.preferences?.subtitles || false,
    quality: user?.profile?.preferences?.quality || "HD",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await userAPI.updateProfile({
        ...formData,
        preferences,
      });
      setUser(response.data.data!);
      // Show success message
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      // Show error message
      return;
    }

    setIsLoading(true);
    try {
      await userAPI.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      // Show success message
    } catch (error) {
      console.error("Failed to change password:", error);
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionBadge = () => {
    if (!user?.subscription) return null;

    const statusColors = {
      active: "bg-green-500",
      canceled: "bg-yellow-500",
      past_due: "bg-red-500",
      unpaid: "bg-red-500",
    };

    return (
      <Badge
        className={
          statusColors[user.subscription.status as keyof typeof statusColors]
        }
      >
        {user.subscription.status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black">
        <Header />

        <div className="pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Profile Header */}
              <div className="mb-8">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage
                        src={user?.profile?.avatar}
                        alt={user?.firstName}
                      />
                      <AvatarFallback className="text-2xl">
                        {user?.firstName?.charAt(0)}
                        {user?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {user?.firstName} {user?.lastName}
                    </h1>
                    <p className="text-gray-400 mb-2">{user?.email}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{user?.role}</Badge>
                      {getSubscriptionBadge()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-900">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="subscription">Subscription</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="mt-6">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Personal Information
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Update your account's profile information and email
                        address.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form
                        onSubmit={handleProfileUpdate}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-white">
                              First Name
                            </Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  firstName: e.target.value,
                                })
                              }
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-white">
                              Last Name
                            </Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  lastName: e.target.value,
                                })
                              }
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="dateOfBirth" className="text-white">
                              Date of Birth
                            </Label>
                            <Input
                              id="dateOfBirth"
                              type="date"
                              value={formData.dateOfBirth}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  dateOfBirth: e.target.value,
                                })
                              }
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country" className="text-white">
                              Country
                            </Label>
                            <Input
                              id="country"
                              value={formData.country}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  country: e.target.value,
                                })
                              }
                              className="bg-gray-800 border-gray-600 text-white"
                              placeholder="Your country"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="language" className="text-white">
                            Language
                          </Label>
                          <Select
                            value={formData.language}
                            onValueChange={(value) =>
                              setFormData({ ...formData, language: value })
                            }
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="it">Italian</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isLoading ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences" className="mt-6">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Viewing Preferences
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Customize your viewing experience.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white font-medium">
                            Autoplay
                          </Label>
                          <p className="text-gray-400 text-sm">
                            Automatically play the next episode
                          </p>
                        </div>
                        <Switch
                          checked={preferences.autoplay}
                          onCheckedChange={(checked) =>
                            setPreferences({
                              ...preferences,
                              autoplay: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white font-medium">
                            Subtitles
                          </Label>
                          <p className="text-gray-400 text-sm">
                            Show subtitles by default
                          </p>
                        </div>
                        <Switch
                          checked={preferences.subtitles}
                          onCheckedChange={(checked) =>
                            setPreferences({
                              ...preferences,
                              subtitles: checked,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white font-medium">
                          Default Video Quality
                        </Label>
                        <Select
                          value={preferences.quality}
                          onValueChange={(value) =>
                            setPreferences({
                              ...preferences,
                              quality: value as any,
                            })
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SD">SD (480p)</SelectItem>
                            <SelectItem value="HD">HD (720p)</SelectItem>
                            <SelectItem value="FHD">Full HD (1080p)</SelectItem>
                            <SelectItem value="4K">4K (2160p)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handleProfileUpdate}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          "Save Preferences"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="mt-6">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Change Password
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Ensure your account is using a long, random password to
                        stay secure.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form
                        onSubmit={handlePasswordChange}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label
                            htmlFor="currentPassword"
                            className="text-white"
                          >
                            Current Password
                          </Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value,
                              })
                            }
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-white">
                            New Password
                          </Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value,
                              })
                            }
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="confirmPassword"
                            className="text-white"
                          >
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isLoading ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            "Update Password"
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Subscription Tab */}
                <TabsContent value="subscription" className="mt-6">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Subscription Details
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Manage your subscription and billing information.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {user?.subscription ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-white font-medium">
                                Plan
                              </Label>
                              <p className="text-gray-300">
                                {user.subscription.plan.name}
                              </p>
                            </div>
                            <div>
                              <Label className="text-white font-medium">
                                Status
                              </Label>
                              <div className="mt-1">
                                {getSubscriptionBadge()}
                              </div>
                            </div>
                            <div>
                              <Label className="text-white font-medium">
                                Next Billing
                              </Label>
                              <p className="text-gray-300">
                                {new Date(
                                  user.subscription.currentPeriodEnd
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <Label className="text-white font-medium">
                                Price
                              </Label>
                              <p className="text-gray-300">
                                ${user.subscription.plan.price}/
                                {user.subscription.plan.interval}
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-700">
                            <h4 className="text-white font-medium mb-2">
                              Plan Features
                            </h4>
                            <ul className="text-gray-300 space-y-1">
                              {user.subscription.plan.features.map(
                                (feature, index) => (
                                  <li key={index}>• {feature}</li>
                                )
                              )}
                            </ul>
                          </div>

                          <div className="flex gap-4 pt-4">
                            <Button
                              variant="outline"
                              className="border-gray-600 text-white"
                            >
                              Change Plan
                            </Button>
                            <Button
                              variant="outline"
                              className="border-gray-600 text-white"
                            >
                              Billing Portal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400 mb-4">
                            You don't have an active subscription
                          </p>
                          <Button className="bg-red-600 hover:bg-red-700">
                            Subscribe Now
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
