import { useState } from "react";
import { useLocation } from "wouter";
import { BarChart2, Store, Users, BadgeCheck, AlertTriangle, Star, TrendingUp, Shield, ShieldOff, CheckCircle, XCircle, Trash2 } from "lucide-react";
import {
  useGetAdminStats, getGetAdminStatsQueryKey,
  useAdminListVendors, getAdminListVendorsQueryKey,
  useAdminListUsers, getAdminListUsersQueryKey,
  useApproveVendor, useSuspendVendor, useFeatureVendor, useAdminDeleteVendor, useBlockUser
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("stats");
  const qc = useQueryClient();

  if (!user) { setLocation("/login"); return null; }
  if (user.role !== "admin") { setLocation("/"); return null; }

  const { data: stats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: vendors } = useAdminListVendors({ query: { queryKey: getAdminListVendorsQueryKey() } });
  const { data: users } = useAdminListUsers({ query: { queryKey: getAdminListUsersQueryKey() } });

  const approveVendor = useApproveVendor();
  const suspendVendor = useSuspendVendor();
  const featureVendor = useFeatureVendor();
  const deleteVendor = useAdminDeleteVendor();
  const blockUser = useBlockUser();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: getAdminListVendorsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  const TABS = [
    { id: "stats", label: "Statistics", icon: BarChart2 },
    { id: "vendors", label: "Vendors", icon: Store },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 mt-1">ShaadiHub platform management</p>
        </div>

        <div className="flex gap-8 flex-col md:flex-row">
          <aside className="md:w-52 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-3 w-full px-5 py-3.5 text-sm font-medium transition-colors ${tab === t.id ? "bg-rose-50 text-rose-600 border-r-2 border-rose-500" : "text-gray-600 hover:bg-gray-50"}`}>
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {tab === "stats" && (
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Platform Statistics</h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Total Users", value: stats?.totalUsers ?? "-", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: "Total Vendors", value: stats?.totalVendors ?? "-", icon: Store, color: "text-rose-500", bg: "bg-rose-50" },
                    { label: "Verified Vendors", value: stats?.verifiedVendors ?? "-", icon: BadgeCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
                    { label: "Pending Approval", value: stats?.pendingVendors ?? "-", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
                    { label: "Total Bookings", value: stats?.totalBookings ?? "-", icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-50" },
                    { label: "Total Reviews", value: stats?.totalReviews ?? "-", icon: Star, color: "text-pink-500", bg: "bg-pink-50" },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center mb-4`}>
                        <s.icon className={`w-6 h-6 ${s.color}`} />
                      </div>
                      <p className="font-display text-3xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "vendors" && (
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 mb-6">All Vendors</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Vendor</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Category</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Rating</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors?.map(v => (
                          <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-gray-900">{v.title}</p>
                              <p className="text-xs text-gray-400">{v.city}</p>
                            </td>
                            <td className="px-5 py-4 text-gray-600 text-xs">{v.category}</td>
                            <td className="px-5 py-4">
                              <span className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                                ⭐ {v.rating.toFixed(1)} ({v.totalReviews})
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex gap-1 flex-wrap">
                                {v.verified ? (
                                  <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold border border-emerald-100">Verified</span>
                                ) : (
                                  <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold border border-amber-100">Pending</span>
                                )}
                                {v.isFeatured && <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-semibold border border-rose-100">Featured</span>}
                                {v.isSuspended && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold border border-red-100">Suspended</span>}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex gap-1">
                                {!v.verified && (
                                  <button onClick={() => approveVendor.mutate({ id: v.id }, { onSuccess: invalidateAll })}
                                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50" title="Approve">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button onClick={() => featureVendor.mutate({ id: v.id }, { onSuccess: invalidateAll })}
                                  className={`p-1.5 rounded-lg ${v.isFeatured ? "text-rose-600 bg-rose-50" : "text-gray-400 hover:bg-gray-50"}`} title="Toggle Featured">
                                  <Star className="w-4 h-4" />
                                </button>
                                <button onClick={() => suspendVendor.mutate({ id: v.id }, { onSuccess: invalidateAll })}
                                  className={`p-1.5 rounded-lg ${v.isSuspended ? "text-amber-600 bg-amber-50" : "text-gray-400 hover:bg-gray-50"}`} title="Toggle Suspend">
                                  {v.isSuspended ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => { if (confirm("Delete this vendor?")) deleteVendor.mutate({ id: v.id }, { onSuccess: invalidateAll }); }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!vendors?.length && <p className="text-center text-gray-400 text-sm py-10">No vendors found</p>}
                  </div>
                </div>
              </div>
            )}

            {tab === "users" && (
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 mb-6">All Users</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">User</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Role</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Joined</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users?.map(u => (
                          <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-gray-900">{u.name}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                                u.role === "admin" ? "bg-violet-50 text-violet-600 border-violet-100" :
                                u.role === "vendor" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                "bg-blue-50 text-blue-600 border-blue-100"
                              }`}>{u.role}</span>
                            </td>
                            <td className="px-5 py-4">
                              {u.isBlocked ? (
                                <span className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-semibold border border-red-100">Blocked</span>
                              ) : (
                                <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">Active</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td className="px-5 py-4">
                              {u.role !== "admin" && (
                                <button onClick={() => blockUser.mutate({ id: u.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() }) })}
                                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${u.isBlocked ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                                  {u.isBlocked ? "Unblock" : "Block"}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!users?.length && <p className="text-center text-gray-400 text-sm py-10">No users found</p>}
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
