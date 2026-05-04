import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Heart, Calendar, CheckSquare, LayoutDashboard, Trash2, Check } from "lucide-react";
import {
  useGetMe, getGetMeQueryKey,
  useGetFavorites, getGetFavoritesQueryKey,
  useGetUserBookings, getGetUserBookingsQueryKey,
  useToggleFavorite
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { VendorCard } from "@/components/VendorCard";
import { useQueryClient } from "@tanstack/react-query";

const CHECKLIST_TASKS = [
  "Book marriage hall",
  "Hire catering service",
  "Book photographer",
  "Book videographer",
  "Arrange decoration",
  "Book car rental",
  "Hire event planner",
  "Book makeup artist",
  "Send wedding invitations",
  "Plan honeymoon",
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-gray-50 text-gray-700 border-gray-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("overview");
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try { return JSON.parse(localStorage.getItem("shaadihub_checklist") ?? "[]") || new Array(10).fill(false); }
    catch { return new Array(10).fill(false); }
  });

  if (!user) { setLocation("/login"); return null; }
  if (user.role === "vendor") { setLocation("/vendor/dashboard"); return null; }
  if (user.role === "admin") { setLocation("/admin"); return null; }

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: favorites } = useGetFavorites({ query: { queryKey: getGetFavoritesQueryKey() } });
  const { data: bookings } = useGetUserBookings({ query: { queryKey: getGetUserBookingsQueryKey() } });
  const toggleFav = useToggleFavorite();
  const qc = useQueryClient();

  const progress = checklist.filter(Boolean).length;

  const toggleCheck = (i: number) => {
    const next = checklist.map((v, idx) => idx === i ? !v : v);
    setChecklist(next);
    localStorage.setItem("shaadihub_checklist", JSON.stringify(next));
  };

  const removeFav = (vendorId: number) => {
    toggleFav.mutate({ vendorId }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetFavoritesQueryKey() }) });
  };

  const TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "checklist", label: "Checklist", icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {me?.name ?? user.name}!</p>
        </div>

        <div className="flex gap-8 flex-col md:flex-row">
          {/* Sidebar */}
          <aside className="md:w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-3 w-full px-5 py-3.5 text-sm font-medium transition-colors ${tab === t.id ? "bg-rose-50 text-rose-600 border-r-2 border-rose-500" : "text-gray-600 hover:bg-gray-50"}`}>
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === "overview" && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { label: "Saved Vendors", value: favorites?.length ?? 0, icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
                    { label: "Bookings", value: bookings?.length ?? 0, icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: "Tasks Done", value: `${progress}/10`, icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-50" },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
                      <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Recent Bookings</h2>
                  {bookings && bookings.length > 0 ? (
                    <div className="space-y-3">
                      {bookings.slice(0, 5).map(b => (
                        <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{b.vendorTitle ?? "Unknown Vendor"}</p>
                            <p className="text-xs text-gray-500">{b.eventDate}</p>
                          </div>
                          <StatusBadge status={b.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                      <p className="text-sm">No bookings yet</p>
                      <Link href="/vendors"><button className="text-rose-500 text-sm font-medium mt-2">Browse vendors →</button></Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "favorites" && (
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Saved Vendors</h2>
                {favorites && favorites.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {favorites.map(v => <VendorCard key={v.id} vendor={v} favorited />)}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                    <h3 className="font-display text-lg font-bold text-gray-900 mb-2">No favorites yet</h3>
                    <p className="text-gray-500 text-sm mb-4">Save vendors you love to find them easily later</p>
                    <Link href="/vendors"><button className="text-rose-500 font-medium hover:text-rose-700">Browse vendors →</button></Link>
                  </div>
                )}
              </div>
            )}

            {tab === "bookings" && (
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 mb-6">My Bookings</h2>
                {bookings && bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map(b => (
                      <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        {b.vendorCoverImageUrl ? (
                          <img src={b.vendorCoverImageUrl} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rose-gradient rounded-xl flex items-center justify-center text-2xl shrink-0">💒</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{b.vendorTitle ?? "Vendor"}</p>
                          <p className="text-xs text-gray-500">{b.vendorCategory}</p>
                          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {b.eventDate}
                          </p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                    <p className="text-gray-500 text-sm">No bookings yet</p>
                  </div>
                )}
              </div>
            )}

            {tab === "checklist" && (
              <div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold text-gray-900">Wedding Checklist</h2>
                    <span className="text-sm font-semibold text-rose-600">{progress} / 10 done</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                    <div className="h-full rose-gradient rounded-full transition-all" style={{ width: `${progress * 10}%` }} />
                  </div>
                  <div className="space-y-3">
                    {CHECKLIST_TASKS.map((task, i) => (
                      <button key={i} onClick={() => toggleCheck(i)}
                        className={`flex items-center gap-3 w-full p-4 rounded-xl border text-left transition-all ${checklist[i] ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checklist[i] ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                          {checklist[i] && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm font-medium ${checklist[i] ? "line-through text-gray-400" : "text-gray-700"}`}>{task}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
