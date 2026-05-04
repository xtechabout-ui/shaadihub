import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Heart, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    if (user.role === "vendor") setLocation("/vendor/dashboard");
    else if (user.role === "admin") setLocation("/admin");
    else setLocation("/dashboard");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-8 text-center border-b border-rose-100">
            <div className="w-16 h-16 rose-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Sign in to your ShaadiHub account</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Email Address
                </Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="border-gray-200 rounded-xl focus:ring-rose-300 focus:border-rose-400"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    className="border-gray-200 rounded-xl focus:ring-rose-300 focus:border-rose-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                data-testid="button-submit"
                type="submit"
                disabled={loading}
                className="w-full rose-gradient text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-gray-500">
              <strong className="text-gray-700">Demo credentials:</strong><br />
              Admin: admin@shaadihub.com / shaadihub2024<br />
              User: ayesha@example.com / shaadihub2024<br />
              Vendor: ahmed@example.com / shaadihub2024
            </div>

            <p className="text-center mt-6 text-sm text-gray-500">
              Don't have an account?{" "}
              <Link href="/register" className="text-rose-600 font-semibold hover:text-rose-700">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
