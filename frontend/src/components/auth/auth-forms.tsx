"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Mail, KeyRound } from "lucide-react";
import {
  LoginFormData,
  loginSchema,
  RegisterFormData,
  registerSchema,
} from "../../lib/validations/auth";
import { SUCCESS_MESSAGES } from "../../lib/utils/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Checkbox } from "../ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useAppContext } from "@/context/app-context";

// Validation schemas for forgot password and reset password
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectTo = "/",
}) => {
  const router = useRouter();
  const { login } = useAuth();
  const { addNotification } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Ensure both email and password are present and non-optional
      const credentials = {
        email: data.email ?? "",
        password: data.password ?? "",
      };
      await login.mutate(credentials);

      toast.success(SUCCESS_MESSAGES.LOGIN_SUCCESS);

      addNotification({
        type: "success",
        title: "Welcome back!",
        message: "You have successfully logged in.",
      });

      onSuccess?.();
      router.push(redirectTo);
    } catch (error: any) {
      toast(error.message || "Invalid email or password");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register("email")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>

          <div className="text-center">
            <Button variant="link" asChild>
              <a href="/forgot-password">Forgot password?</a>
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  redirectTo = "/",
}) => {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const { addNotification } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser.mutate({
        email: data.email ?? "",
        password: data.password ?? "",
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        terms_accepted: data.terms_accepted ?? false,
      });

      toast.success(SUCCESS_MESSAGES.REGISTRATION_SUCCESS);

      addNotification({
        type: "success",
        title: "Account Created",
        message:
          "Welcome to OnFlix! Your account has been created successfully.",
      });

      onSuccess?.();
      router.push(redirectTo);
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Join OnFlix to start streaming premium content
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                placeholder="John"
                {...register("first_name")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                placeholder="Doe"
                {...register("last_name")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register("email")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="terms_accepted" {...register("terms_accepted")} />
            <Label htmlFor="terms_accepted" className="text-sm">
              I accept the{" "}
              <a href="/terms" className="text-primary underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-primary underline">
                Privacy Policy
              </a>
            </Label>
          </div>
          {errors.terms_accepted && (
            <p className="text-sm text-destructive">
              {errors.terms_accepted.message}
            </p>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
}) => {
  const { addNotification } = useAppContext();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      // Call your forgot password API
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to send reset email");
      }

      toast.success("Password reset email sent!");

      addNotification({
        type: "success",
        title: "Email Sent",
        message: "Check your inbox for password reset instructions.",
      });

      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Forgot Password?</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register("email")}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>

          <Button variant="ghost" asChild className="w-full">
            <a href="/login">Back to Sign In</a>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  token,
  onSuccess,
}) => {
  const router = useRouter();
  const { addNotification } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch("password");

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      // Call your reset password API
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      toast.success(SUCCESS_MESSAGES.PASSWORD_RESET);

      addNotification({
        type: "success",
        title: "Password Reset",
        message: "Your password has been reset successfully.",
      });

      onSuccess?.();
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                {...register("confirmPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Password strength indicator */}
          {password && (
            <div className="space-y-2">
              <Label className="text-sm">Password Strength</Label>
              <div className="space-y-1">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded ${
                        getPasswordStrength(password) >= level
                          ? getPasswordStrength(password) === 1
                            ? "bg-red-500"
                            : getPasswordStrength(password) === 2
                            ? "bg-yellow-500"
                            : getPasswordStrength(password) === 3
                            ? "bg-blue-500"
                            : "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getPasswordStrength(password) === 1 && "Weak"}
                  {getPasswordStrength(password) === 2 && "Fair"}
                  {getPasswordStrength(password) === 3 && "Good"}
                  {getPasswordStrength(password) === 4 && "Strong"}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

// Helper function to calculate password strength
function getPasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  return Math.min(4, strength);
}
