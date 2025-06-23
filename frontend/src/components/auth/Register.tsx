import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Play, Check, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  validateForm,
  registerSchema,
  validatePassword,
} from "../../utils/validation";
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

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  marketingEmails: boolean;
}

const Register: React.FC = () => {
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    marketingEmails: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    checks: {
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false,
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: [],
      }));
    }

    if (error) {
      clearError();
    }

    // Update password strength for password field
    if (name === "password") {
      updatePasswordStrength(value);
    }
  };

  const updatePasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;

    setPasswordStrength({ score, checks });
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return { text: "Very Weak", color: "text-red-500" };
      case 2:
        return { text: "Weak", color: "text-orange-500" };
      case 3:
        return { text: "Fair", color: "text-yellow-500" };
      case 4:
        return { text: "Good", color: "text-blue-500" };
      case 5:
        return { text: "Strong", color: "text-green-500" };
      default:
        return { text: "", color: "" };
    }
  };

  const getPasswordStrengthBarColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-orange-500";
      case 3:
        return "bg-yellow-500";
      case 4:
        return "bg-blue-500";
      case 5:
        return "bg-green-500";
      default:
        return "bg-gray-200";
    }
  };

  const validateForm = () => {
    const errors: Record<string, string[]> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = ["First name is required"];
    } else if (formData.firstName.length < 2) {
      errors.firstName = ["First name must be at least 2 characters"];
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = ["Last name is required"];
    } else if (formData.lastName.length < 2) {
      errors.lastName = ["Last name must be at least 2 characters"];
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = ["Email is required"];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = ["Please enter a valid email address"];
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = ["Please confirm your password"];
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = ["Passwords do not match"];
    }

    // Terms acceptance validation
    if (!formData.acceptTerms) {
      errors.acceptTerms = ["You must accept the Terms of Service"];
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // Registration successful, user will be redirected by auth context
      navigate(ROUTES.HOME);
    } catch (err) {
      // Error is handled by auth context
      console.error("Registration failed:", err);
    }
  };

  const renderPasswordCheck = (
    key: keyof typeof passwordStrength.checks,
    label: string
  ) => (
    <div key={key} className="flex items-center space-x-2 text-sm">
      {passwordStrength.checks[key] ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3 text-gray-400" />
      )}
      <span
        className={
          passwordStrength.checks[key]
            ? "text-green-600"
            : "text-muted-foreground"
        }
      >
        {label}
      </span>
    </div>
  );

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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mt-2">
            Start your streaming journey today
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Enter your information to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Display */}
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="text-sm font-medium block mb-1"
                  >
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className={cn(
                      fieldErrors.firstName?.length &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {fieldErrors.firstName?.map((error, index) => (
                    <p key={index} className="text-xs text-destructive mt-1">
                      {error}
                    </p>
                  ))}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="text-sm font-medium block mb-1"
                  >
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className={cn(
                      fieldErrors.lastName?.length &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {fieldErrors.lastName?.map((error, index) => (
                    <p key={index} className="text-xs text-destructive mt-1">
                      {error}
                    </p>
                  ))}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium block mb-1"
                >
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
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

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-medium block mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
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

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Password strength:</span>
                      <span className={getPasswordStrengthText().color}>
                        {getPasswordStrengthText().text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className={cn(
                          "h-1 rounded-full transition-all duration-300",
                          getPasswordStrengthBarColor()
                        )}
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      {renderPasswordCheck("length", "At least 8 characters")}
                      {renderPasswordCheck("lowercase", "One lowercase letter")}
                      {renderPasswordCheck("uppercase", "One uppercase letter")}
                      {renderPasswordCheck("number", "One number")}
                      {renderPasswordCheck("special", "One special character")}
                    </div>
                  </div>
                )}

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
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className={cn(
                      "pr-10",
                      fieldErrors.confirmPassword?.length &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

              {/* Terms and Marketing */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <label htmlFor="acceptTerms" className="text-sm">
                    I accept the{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {fieldErrors.acceptTerms?.map((error, index) => (
                  <p key={index} className="text-xs text-destructive">
                    {error}
                  </p>
                ))}

                <div className="flex items-start space-x-2">
                  <input
                    id="marketingEmails"
                    name="marketingEmails"
                    type="checkbox"
                    checked={formData.marketingEmails}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <label
                    htmlFor="marketingEmails"
                    className="text-sm text-muted-foreground"
                  >
                    Send me updates about new movies, shows, and special offers
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to={ROUTES.LOGIN}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            By creating an account, you'll get instant access to thousands of
            movies and TV shows. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
