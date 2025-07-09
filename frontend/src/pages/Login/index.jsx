import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleInput = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Mock username/password auth
    if (form.username && form.password) {
      login({ email: form.username, name: form.username });
      navigate(location.state?.from?.pathname || "/onboarding", { replace: true });
    } else {
      setError("Please enter both username and password.");
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
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            <Input
              name="username"
              placeholder="Username or Email"
              value={form.username}
              onChange={handleInput}
              autoFocus
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleInput}
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
          <div className="my-4 text-center text-gray-500">or</div>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 