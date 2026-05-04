import { Heart } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rose-gradient rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">ShaadiHub</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Karachi's premier wedding marketplace connecting couples with trusted vendors for their dream day.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Categories</h4>
            <ul className="space-y-2">
              {["Marriage Hall", "Catering", "Photography", "Decoration", "Makeup & Beauty"].map((cat) => (
                <li key={cat}>
                  <Link href={`/vendors?category=${encodeURIComponent(cat)}`}
                    className="text-sm text-gray-400 hover:text-rose-400 transition-colors">{cat}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Areas</h4>
            <ul className="space-y-2">
              {["Clifton", "DHA", "Gulshan", "North Nazimabad", "PECHS"].map((area) => (
                <li key={area}>
                  <Link href={`/vendors?area=${encodeURIComponent(area)}`}
                    className="text-sm text-gray-400 hover:text-rose-400 transition-colors">{area}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: "Browse Vendors", href: "/vendors" },
                { label: "Register as Vendor", href: "/register" },
                { label: "Sign In", href: "/login" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-rose-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 ShaadiHub. All rights reserved. Karachi, Pakistan.</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for couples in Karachi
          </p>
        </div>
      </div>
    </footer>
  );
}
