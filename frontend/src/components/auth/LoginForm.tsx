import { useAuthStore } from "@/store/authStore";
import { useState } from "react";

export default function LoginForm() {
  const { login, isLoading, error } = useAuthStore();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials); // Uses your Go API
      // authStore automatically handles token storage
      // Redirects will be handled by your app logic
    } catch (err) {
      // Error is automatically set in authStore
      console.error("Login failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={credentials.email}
        onChange={(e) =>
          setCredentials((prev) => ({ ...prev, email: e.target.value }))
        }
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) =>
          setCredentials((prev) => ({ ...prev, password: e.target.value }))
        }
        placeholder="Password"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
