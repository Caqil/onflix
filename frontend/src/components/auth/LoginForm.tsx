"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    remember_me: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(credentials);
      router.push("/browse"); // Redirect after successful login
    } catch (err) {
      // Error is automatically handled by the store
      console.error("Login failed:", err);
    }
  };

  //   const handleGoogleLogin = async () => {
  //     // This would integrate with Google OAuth
  //     try {
  //       // Get Google token from OAuth flow
  //       const googleToken = await getGoogleToken(); // Your Google OAuth implementation
  //       await googleLogin(googleToken);
  //       router.push("/browse");
  //     } catch (err) {
  //       console.error("Google login failed:", err);
  //     }
  //   };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={credentials.email}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, email: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={credentials.password}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, password: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            checked={credentials.remember_me}
            onChange={(e) =>
              setCredentials((prev) => ({
                ...prev,
                remember_me: e.target.checked,
              }))
            }
            className="mr-2"
            disabled={isLoading}
          />
          <label htmlFor="remember" className="text-sm">
            Remember me
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Sign in with Google
        </button> */}
      </form>
    </div>
  );
}
