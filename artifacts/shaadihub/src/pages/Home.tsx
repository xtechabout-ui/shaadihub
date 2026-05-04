import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  Search, ArrowRight, BadgeCheck, Users, CalendarDays, Star,
  Camera, Utensils, Building2, Sparkles, Heart, ChevronRight,
  MessageCircle, Shield, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListVendors, getListVendorsQueryKey } from "@workspace/api-client-react";
import { VendorCard } from "@/components/VendorCard";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Marriage Hall": <Building2 className="w-7 h-7" />,
  "Photography": <Camera className="w-7 h-7" />,
  "Catering": <Utensils className="w-7 h-7" />,
  "Decoration": <Sparkles className="w-7 h-7" />,
  "Makeup & Beauty": <Heart className="w-7 h-7" />,
  "Event Planner": <CalendarDays className="w-7 h-7" />,
};

const CATEGORY_COVERS: Record<string, string> = {
  "Marriage Hall": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80",
  "Photography": "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80",
  "Catering": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
  "Decoration": "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
  "Makeup & Beauty": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80",
  "Event Planner": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80",
};

const STEPS = [
  {
    n: "01",
    icon: Search,
    title: "Search & Discover",
    desc: "Browse hundreds of verified wedding vendors in Karachi — from venues and caterers to photographers and decorators.",
  },
  {
    n: "02",
    icon: MessageCircle,
    title: "Connect & Compare",
    desc: "View portfolios, read real reviews, compare packages, and WhatsApp vendors directly from their profile.",
  },
  {
    n: "03",
    icon: BadgeCheck,
    title: "Book with Confidence",
    desc: "Send a booking request, confirm your date, and enjoy your perfect wedding day with zero stress.",
  },
];

const TESTIMONIALS = [
  {
    name: "Ayesha & Bilal",
    date: "March 2026",
    text: "ShaadiHub made planning our wedding so easy! We found our venue, photographer, and caterer all in one place. Highly recommended!",
    rating: 5,
    avatar: "A",
  },
  {
    name: "Sana Khan",
    date: "January 2026",
    text: "Nadia's Bridal Studio from ShaadiHub was absolutely stunning. The verified badge gave me so much confidence. My bridal look was perfect.",
    rating: 5,
    avatar: "S",
  },
  {
    name: "Imran & Zara",
    date: "February 2026",
    text: "Found Royal Marquee on ShaadiHub and the booking process was seamless. The team is super helpful. 10/10 experience!",
    rating: 5,
    avatar: "I",
  },
];

const STATS = [
  { label: "Verified vendors", value: "250+", icon: BadgeCheck, color: "text-emerald-500 bg-emerald-50" },
  { label: "Happy couples", value: "3.5k+", icon: Heart, color: "text-rose-500 bg-rose-50" },
  { label: "Bookings monthly", value: "1.2k", icon: CalendarDays, color: "text-blue-500 bg-blue-50" },
  { label: "Avg. rating", value: "4.8★", icon: Star, color: "text-amber-500 bg-amber-50" },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= count ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} />
      ))}
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const { data: featuredData } = useListVendors(
    { featured: true, limit: 6 },
    { query: { queryKey: getListVendorsQueryKey({ featured: true, limit: 6 }) } }
  );
  const featuredVendors = featuredData?.vendors ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation(search.trim() ? `/vendors?search=${encodeURIComponent(search.trim())}` : "/vendors");
  };

  return (
    <div className="min-h-screen bg-[#faf8fb]">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white">
        {/* Soft gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-100/60 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 mb-6">
                <Sparkles className="h-4 w-4" />
                Wedding planning made simple
              </div>
              <h1 className="font-display text-5xl font-black leading-[1.1] tracking-tight text-gray-950 sm:text-6xl">
                Your Perfect{" "}
                <span className="text-rose-500">Wedding Day</span>{" "}
                Starts Here.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-gray-500">
                Discover top-rated venues, photographers, caterers, and planners in Karachi — all in one place. Compare, connect, and book with confidence.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
                  <Search className="h-5 w-5 shrink-0 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Find marriage hall near you..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
                <Button type="submit" className="rounded-2xl bg-rose-500 px-7 py-3.5 text-sm font-semibold text-white hover:bg-rose-600">
                  Book Now
                </Button>
              </form>

              {/* Category quick links */}
              <div className="mt-5 flex flex-wrap gap-2">
                {["Marriage Hall", "Photography", "Catering", "Decoration", "Makeup & Beauty"].map((cat) => (
                  <Link key={cat} href={`/vendors?category=${encodeURIComponent(cat)}`}>
                    <span className="cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600">
                      {cat}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Social proof */}
              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["A", "S", "I", "Z"].map((letter, i) => (
                    <div key={i} className="w-9 h-9 rounded-full rose-gradient border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      {letter}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <StarRow count={5} />
                    <span className="text-sm font-bold text-gray-900">4.9</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Trusted by 3,500+ couples in Karachi</p>
                </div>
              </div>
            </div>

            {/* Right: image collage */}
            <div className="relative hidden lg:block">
              <div className="relative h-[540px]">
                {/* Main large image */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80"
                    alt="Wedding venue"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                {/* Floating card — venue spotlight */}
                <div className="absolute -bottom-6 -left-8 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 w-64">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                    <img src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=120&q=80" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-500 mb-0.5">Venue Spotlight</p>
                    <p className="text-sm font-bold text-gray-900 truncate">Royal Marquee</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-gray-700">4.7</span>
                      <span className="text-xs text-gray-400">(203 reviews)</span>
                    </div>
                  </div>
                </div>
                {/* Floating pill — verified badge */}
                <div className="absolute top-6 -right-6 bg-emerald-500 text-white rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4" />
                  <span className="text-sm font-semibold">250+ Verified</span>
                </div>
                {/* Small overlay image */}
                <div className="absolute top-1/3 -right-10 w-36 h-36 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                  <img src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=300&q=80" alt="Photography" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-950">{s.value}</p>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED VENDORS ────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-2">Top Picks</p>
              <h2 className="font-display text-4xl font-black text-gray-950">Featured Vendors</h2>
              <p className="mt-2 text-gray-500">Karachi's most sought-after wedding vendors, handpicked for excellence.</p>
            </div>
            <Link href="/vendors">
              <Button variant="outline" className="hidden sm:flex items-center gap-2 rounded-xl border-gray-200">
                View all vendors <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {featuredVendors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVendors.map((v) => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 sm:hidden">
            <Link href="/vendors">
              <Button className="w-full rounded-xl rose-gradient text-white">
                View all vendors <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── BROWSE BY CATEGORY ──────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-2">Explore</p>
            <h2 className="font-display text-4xl font-black text-gray-950">Browse by Category</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">From grand venues to bridal beauty, find every service you need for your dream wedding.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(CATEGORY_COVERS).map(([cat, cover]) => (
              <Link key={cat} href={`/vendors?category=${encodeURIComponent(cat)}`}>
                <div className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer shadow-sm hover:shadow-lg transition-shadow">
                  <img src={cover} alt={cat} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="text-white mb-1 flex justify-center">
                      {CATEGORY_ICONS[cat]}
                    </div>
                    <p className="text-white text-xs font-bold text-center leading-tight">{cat}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="py-20 bg-[#faf8fb]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-2">Simple Process</p>
            <h2 className="font-display text-4xl font-black text-gray-950">How ShaadiHub Works</h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">Plan your entire wedding in three simple steps — no stress, no hassle.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 relative">
            {/* Connecting line */}
            <div className="hidden sm:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-rose-200 via-rose-300 to-rose-200" />

            {STEPS.map((step) => (
              <div key={step.n} className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rose-gradient rounded-2xl flex items-center justify-center shadow-lg">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gray-950 text-white text-xs font-black flex items-center justify-center">
                    {step.n.replace("0", "")}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-gray-950 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/vendors">
              <Button className="rose-gradient text-white px-8 py-3 rounded-2xl font-semibold text-sm">
                Start Planning Your Wedding <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ─────────────────────────────────────────── */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: Shield, color: "bg-blue-50 text-blue-500", title: "Secure Bookings", desc: "Your payment and personal data are always protected end-to-end." },
              { icon: BadgeCheck, color: "bg-emerald-50 text-emerald-500", title: "Verified Vendors Only", desc: "Every vendor is manually reviewed and verified before listing." },
              { icon: Award, color: "bg-amber-50 text-amber-500", title: "Quality Guaranteed", desc: "We maintain strict quality standards — only the best vendors make it." },
            ].map((t) => (
              <div key={t.title} className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50">
                <div className={`w-12 h-12 rounded-xl ${t.color} flex items-center justify-center shrink-0`}>
                  <t.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-950 mb-1">{t.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────── */}
      <section className="py-20 bg-[#faf8fb]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-2">Love Stories</p>
            <h2 className="font-display text-4xl font-black text-gray-950">What Couples Say</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <StarRow count={t.rating} />
                <p className="mt-4 text-gray-600 text-sm leading-relaxed">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-10 h-10 rose-gradient rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rose-gradient rounded-3xl p-12 shadow-2xl">
            <h2 className="font-display text-4xl font-black text-white mb-4">
              Ready to Plan Your Dream Wedding?
            </h2>
            <p className="text-rose-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of couples who found their perfect vendors through ShaadiHub. Start for free today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/vendors">
                <Button className="bg-white text-rose-600 font-bold px-8 py-3 rounded-2xl hover:bg-rose-50 text-sm">
                  Browse Vendors
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-8 py-3 rounded-2xl text-sm border border-rose-400">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
