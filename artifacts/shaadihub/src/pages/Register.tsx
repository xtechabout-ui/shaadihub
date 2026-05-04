import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Heart, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = ["Marriage Hall","Catering","Photography","Videography","Decoration","Car Rental","Event Planner","Makeup & Beauty"];

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", phone: "", category: "Catering", title: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    if (user.role === "vendor") setLocation("/vendor/dashboard");
    else if (user.role === "admin") setLocation("/admin");
    else setLocation("/dashboard");
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { name: form.name, email: form.email, password: form.password, role: form.role, phone: form.phone };
      if (form.role === "vendor") { payload.category = form.category; payload.title = form.title || form.name; }
      await register(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-8 text-center border-b border-rose-100">
            <div className="w-16 h-16 rose-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">Join ShaadiHub</h1>
            <p className="text-gray-500 text-sm">Create your free account today</p>
          </div>
          <div className="p-8">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

            {/* Role toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
              {[{v:"user",l:"I'm a Couple"},{v:"vendor",l:"I'm a Vendor"}].map(r => (
                <button key={r.v} type="button" onClick={() => setForm({...form, role: r.v})}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${form.role === r.v ? "bg-white text-rose-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {r.l}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</Label>
                <Input data-testid="input-name" value={form.name} onChange={set("name")} placeholder="Your full name" required className="border-gray-200 rounded-xl focus:ring-rose-300" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</Label>
                <Input data-testid="input-email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required className="border-gray-200 rounded-xl focus:ring-rose-300" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number</Label>
                <Input data-testid="input-phone" value={form.phone} onChange={set("phone")} placeholder="+92-300-1234567" className="border-gray-200 rounded-xl focus:ring-rose-300" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</Label>
                <div className="relative">
                  <Input data-testid="input-password" type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Min 6 characters" required className="border-gray-200 rounded-xl focus:ring-rose-300 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {form.role === "vendor" && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Business Category</Label>
                    <select value={form.category} onChange={set("category")} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Business Name</Label>
                    <Input data-testid="input-title" value={form.title} onChange={set("title")} placeholder="Your business name" className="border-gray-200 rounded-xl focus:ring-rose-300" />
                  </div>
                </>
              )}

              <Button data-testid="button-submit" type="submit" disabled={loading} className="w-full rose-gradient text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity mt-2">
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-center mt-6 text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-rose-600 font-semibold hover:text-rose-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
