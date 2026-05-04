import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Heart, Menu, X, ChevronDown, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Venues", href: "/vendors?category=Marriage%20Hall" },
  { label: "Vendors", href: "/vendors" },
  { label: "Photography", href: "/vendors?category=Photography" },
  { label: "Inspiration", href: "/vendors?category=Decoration" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
    setUserMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rose-gradient rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display text-xl font-bold text-rose-600">ShaadiHub</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = location === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active ? "bg-rose-50 text-rose-600" : "text-gray-600 hover:text-rose-600 hover:bg-rose-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  data-testid="user-menu-button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
                >
                  <div className="w-8 h-8 rose-gradient rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name.split(" ")[0]}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-rose-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-rose-50">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{user.role}</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                    </div>
                    {user.role === "user" && (
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> My Dashboard
                      </Link>
                    )}
                    {(user.role === "vendor" || user.role === "admin") && (
                      <Link href="/vendor/dashboard" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Vendor Dashboard
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <ShieldCheck className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 font-medium">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold px-5">
                    List Your Business
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            data-testid="mobile-menu-button"
            className="md:hidden p-2 rounded-lg hover:bg-rose-50"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-rose-100 px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
              className="block py-2.5 px-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600">
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 mt-2">
            {user ? (
              <>
                {user.role === "user" && (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="block py-2.5 px-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600">My Dashboard</Link>
                )}
                {(user.role === "vendor" || user.role === "admin") && (
                  <Link href="/vendor/dashboard" onClick={() => setMobileOpen(false)}
                    className="block py-2.5 px-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600">Vendor Dashboard</Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}
                    className="block py-2.5 px-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600">Admin Panel</Link>
                )}
                <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="block w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50">Sign Out</button>
              </>
            ) : (
              <div className="flex gap-3 pt-1">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1">
                  <Button size="sm" className="w-full bg-rose-500 hover:bg-rose-600 text-white">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
