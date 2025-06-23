import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Play, Mail, CheckCircle, Eye, EyeOff } from "lucide-react";
import { authService } from "../../services/auth";
import { validatePassword } from "../../utils/validation";
import { ROUTES, APP_NAME } from "../../utils/constants";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { cn } from "../../utils/helpers";

type Step = "request" | "sent" | "reset";

interface ForgotPasswordFormData {
  email: string;
}

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState<Step>(token ? "reset" : "request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [forgotFormData, setForgotFormData] = useState<ForgotPasswordFormData>({
    email: "",
  });

  const [resetFormData, setResetFormData] = useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    formType: "forgot" | "reset"
  ) => {
    const { name, value } = e.target;

    if (formType === "forgot") {
      setForgotFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setResetFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear errors
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: [] }));
    }
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const validateForgotForm = () => {
    const errors: Record<string, string[]> = {};

    if (!forgotFormData.email.trim()) {
      errors.email = ["Email is required"];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotFormData.email)) {
      errors.email = ["Please enter a valid email address"];
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateResetForm = () => {
    const errors: Record<string, string[]> = {};

    // Password validation
    const passwordValidation = validatePassword(resetFormData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors;
    }

    // Confirm password validation
    if (!resetFormData.confirmPassword) {
      errors.confirmPassword = ["Please confirm your password"];
    } else if (resetFormData.password !== resetFormData.confirmPassword) {
      errors.confirmPassword = ["Passwords do not match"];
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForgotForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await authService.forgotPassword({
        email: forgotFormData.email.trim().toLowerCase(),
      });

      setStep("sent");
      setSuccess("Password reset email sent successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateResetForm() || !token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await authService.resetPassword(token, resetFormData.password);

      setSuccess(
        "Password reset successfully! You can now sign in with your new password."
      );

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!forgotFormData.email) return;

    try {
      setLoading(true);
      setError(null);

      await authService.forgotPassword({ email: forgotFormData.email });
      setSuccess("Reset email sent again!");
    } catch (err: any) {
      setError(err.message || "Failed to resend email.");
    } finally {
      setLoading(false);
    }
  };

  // Request Step
  if (step === "request") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center space-x-2 mb-6"
            >
              <Play className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">{APP_NAME}</span>
            </Link>
            <h1 className="text-2xl font-bold">Forgot your password?</h1>
            <p className="text-muted-foreground mt-2">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your
                password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {/* Error Display */}
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-medium block mb-1"
                  >
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={forgotFormData.email}
                    onChange={(e) => handleInputChange(e, "forgot")}
                    placeholder="john.doe@example.com"
                    autoComplete="email"
                    className={cn(
                      fieldErrors.email?.length &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {fieldErrors.email?.map((error, index) => (
                    <p key={index} className="text-xs text-destructive mt-1">
                      {error}
                    </p>
                  ))}
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm text-primary hover:underline inline-flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Email Sent Step
  if (step === "sent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center space-x-2 mb-6"
            >
              <Play className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">{APP_NAME}</span>
            </Link>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                {/* Success Icon */}
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>

                <div>
                  <h1 className="text-xl font-bold mb-2">Check your email</h1>
                  <p className="text-muted-foreground">
                    We've sent a password reset link to:
                  </p>
                  <p className="font-medium mt-1">{forgotFormData.email}</p>
                </div>

                {success && (
                  <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
                    {success}
                  </div>
                )}

                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or try
                    again.
                  </p>

                  <Button
                    onClick={handleResendEmail}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? "Sending..." : "Resend Email"}
                  </Button>

                  <Link
                    to={ROUTES.LOGIN}
                    className="block text-center text-sm text-primary hover:underline"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset Password Step
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center space-x-2 mb-6"
          >
            <Play className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </Link>
          <h1 className="text-2xl font-bold">Create new password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your new password below.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Choose a strong password that you haven't used before.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-2">
                    Password Reset Successful!
                  </h2>
                  <p className="text-muted-foreground">{success}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Redirecting to sign in...
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                {/* Error Display */}
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}

                {/* New Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-medium block mb-1"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={resetFormData.password}
                      onChange={(e) => handleInputChange(e, "reset")}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      className={cn(
                        "pr-10",
                        fieldErrors.password?.length &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password?.map((error, index) => (
                    <p key={index} className="text-xs text-destructive mt-1">
                      {error}
                    </p>
                  ))}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium block mb-1"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={resetFormData.confirmPassword}
                      onChange={(e) => handleInputChange(e, "reset")}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      className={cn(
                        "pr-10",
                        fieldErrors.confirmPassword?.length &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword?.map((error, index) => (
                    <p key={index} className="text-xs text-destructive mt-1">
                      {error}
                    </p>
                  ))}
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>
            )}

            {!success && (
              <div className="mt-6 text-center">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm text-primary hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
