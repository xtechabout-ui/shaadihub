import { Link } from "wouter";
import { Heart, Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#faf8fb]">
      <div className="text-center max-w-lg">
        {/* Logo mark */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rose-gradient rounded-3xl flex items-center justify-center shadow-lg">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
        </div>

        {/* 404 */}
        <p className="text-8xl font-black text-gray-100 leading-none mb-0 select-none">404</p>

        <h1 className="font-display text-3xl font-bold text-gray-900 -mt-2 mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-500 text-base leading-relaxed mb-8">
          Looks like this page wandered off to plan its own wedding. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/">
            <Button className="rose-gradient text-white rounded-xl px-6 font-semibold flex items-center gap-2">
              <Home className="w-4 h-4" /> Go Home
            </Button>
          </Link>
          <Link href="/vendors">
            <Button variant="outline" className="rounded-xl px-6 font-semibold flex items-center gap-2 border-gray-200">
              <Search className="w-4 h-4" /> Browse Vendors
            </Button>
          </Link>
        </div>

        {/* Breadcrumb-style back hint */}
        <p className="text-xs text-gray-400 mt-8 flex items-center justify-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Use your browser's back button to return to the previous page
        </p>
      </div>
    </div>
  );
}
