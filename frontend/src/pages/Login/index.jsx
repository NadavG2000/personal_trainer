import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [error, setError] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleInput = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Registration validation
        if (!form.name.trim()) {
          throw new Error("Name is required");
        }
        if (!validateEmail(form.email)) {
          throw new Error("Please enter a valid email address");
        }
        if (!validatePassword(form.password)) {
          throw new Error("Password must be at least 6 characters");
        }
        if (form.password !== form.confirmPassword) {
          throw new Error("Passwords don't match");
        }

        const response = await fetch("http://localhost:8000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            name: form.name.trim()
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Registration failed");
        }

        const data = await response.json();
        login(data.user);
        localStorage.setItem("token", data.access_token);
        navigate(location.state?.from?.pathname || "/onboarding", { replace: true });
      } else {
        // Login validation
        if (!validateEmail(form.email)) {
          throw new Error("Please enter a valid email address");
        }
        if (!form.password) {
          throw new Error("Password is required");
        }

        const response = await fetch("http://localhost:8000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Login failed");
        }

        const data = await response.json();
        login(data.user);
        localStorage.setItem("token", data.access_token);
        navigate(location.state?.from?.pathname || "/onboarding", { replace: true });
      }
    } catch (err) {
      setError(err.message || (isRegistering ? "Registration failed" : "Login failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Mock Google auth
    login({ email: "googleuser@example.com", name: "Google User" });
    navigate(location.state?.from?.pathname || "/onboarding", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {isRegistering ? "Create Account" : "Sign In"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegistering && (
              <Input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleInput}
                required
                disabled={isLoading}
              />
            )}
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleInput}
              required
              autoFocus
              disabled={isLoading}
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleInput}
              required
              disabled={isLoading}
            />
            {isRegistering && (
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleInput}
                required
                disabled={isLoading}
              />
            )}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRegistering ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                isRegistering ? "Create Account" : "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
                setForm({ name: "", email: "", password: "", confirmPassword: "" });
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={isLoading}
            >
              {isRegistering 
                ? "Already have an account? Sign In" 
                : "Don't have an account? Register"
              }
            </button>
          </div>

          <div className="my-4 text-center text-gray-500">or</div>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 