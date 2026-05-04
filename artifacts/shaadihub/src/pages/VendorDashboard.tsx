import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  BarChart2, Store, Image as ImageIcon, Package, Calendar, Star,
  Edit2, Save, X, Trash2, Plus, Check, Eye, CheckCircle, XCircle,
  Upload, AlertCircle,
} from "lucide-react";
import {
  useGetMyVendorProfile, getGetMyVendorProfileQueryKey,
  useGetVendorBookings, getGetVendorBookingsQueryKey,
  useGetVendorReviews, getGetVendorReviewsQueryKey,
  useUpdateVendor, useUploadVendorImage, useDeleteVendorImage,
  useCreatePackage, useUpdatePackage, useDeletePackage,
  useUpdateBookingStatus,
} from "@workspace/api-client-react";
import type { UpdateVendorBody, CreatePackageBody } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} />
      ))}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function VendorDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  if (!user) { setLocation("/login"); return null; }
  if (user.role === "user") { setLocation("/dashboard"); return null; }

  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [pkgModalOpen, setPkgModalOpen] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: vendor, isLoading: vendorLoading } = useGetMyVendorProfile({
    query: { queryKey: getGetMyVendorProfileQueryKey() },
  });
  const { data: bookings } = useGetVendorBookings({
    query: { queryKey: getGetVendorBookingsQueryKey() },
  });
  // useGetVendorReviews takes primitive vendorId as first arg
  const { data: reviews } = useGetVendorReviews(vendor?.id ?? 0, {
    query: {
      queryKey: getGetVendorReviewsQueryKey(vendor?.id ?? 0),
      enabled: !!vendor?.id,
    },
  });

  const updateVendor = useUpdateVendor();
  const uploadImage = useUploadVendorImage();
  const deleteImage = useDeleteVendorImage();
  const createPkg = useCreatePackage();
  const updatePkg = useUpdatePackage();
  const deletePkg = useDeletePackage();
  const updateStatus = useUpdateBookingStatus();

  // Profile edit state
  const [profileForm, setProfileForm] = useState<UpdateVendorBody>({});

  const startEdit = () => {
    if (!vendor) return;
    setProfileForm({
      title: vendor.title,
      description: vendor.description ?? "",
      location: vendor.location ?? "",
      area: vendor.area ?? "",
      city: vendor.city,
      whatsapp: vendor.whatsapp ?? "",
      priceRangeMin: vendor.priceRangeMin ?? undefined,
      priceRangeMax: vendor.priceRangeMax ?? undefined,
      capacity: vendor.capacity ?? undefined,
      latitude: vendor.latitude ?? undefined,
      longitude: vendor.longitude ?? undefined,
    });
    setEditing(true);
  };

  const saveProfile = () => {
    if (!vendor) return;
    updateVendor.mutate(
      { id: vendor.id, data: profileForm },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetMyVendorProfileQueryKey() });
          setEditing(false);
        },
      }
    );
  };

  // Package form state
  const [pkgForm, setPkgForm] = useState<{ id?: number; name: string; price: number; description: string; featuresText: string; isPopular: boolean }>({
    name: "", price: 0, description: "", featuresText: "", isPopular: false,
  });

  const openAddPkg = () => {
    setEditingPkgId(null);
    setPkgForm({ name: "", price: 0, description: "", featuresText: "", isPopular: false });
    setPkgModalOpen(true);
  };

  const openEditPkg = (pkg: NonNullable<typeof vendor>["packages"][number]) => {
    const featuresText = Array.isArray(pkg.features) ? pkg.features.join("\n") : "";
    setEditingPkgId(pkg.id);
    setPkgForm({ name: pkg.name, price: pkg.price, description: pkg.description ?? "", featuresText, isPopular: pkg.isPopular });
    setPkgModalOpen(true);
  };

  const savePkg = () => {
    if (!vendor) return;
    const featuresArr = pkgForm.featuresText.split("\n").map((s) => s.trim()).filter(Boolean);
    const data: CreatePackageBody = {
      name: pkgForm.name,
      price: pkgForm.price,
      description: pkgForm.description || undefined,
      features: featuresArr,
      isPopular: pkgForm.isPopular,
    };
    if (editingPkgId) {
      // useUpdatePackage: { id: number; pkgId: number; data }
      updatePkg.mutate({ id: vendor.id, pkgId: editingPkgId, data }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getGetMyVendorProfileQueryKey() }); setPkgModalOpen(false); },
      });
    } else {
      // useCreatePackage: { id: number; data }
      createPkg.mutate({ id: vendor.id, data }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getGetMyVendorProfileQueryKey() }); setPkgModalOpen(false); },
      });
    }
  };

  const handleDeletePkg = (pkgId: number) => {
    if (!vendor || !confirm("Delete this package?")) return;
    // useDeletePackage: { id: number; pkgId: number }
    deletePkg.mutate({ id: vendor.id, pkgId }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetMyVendorProfileQueryKey() }),
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vendor) return;
    setUploading(true);
    // useUploadVendorImage: { id: number; data: { image: File } }
    uploadImage.mutate({ id: vendor.id, data: { image: file } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getGetMyVendorProfileQueryKey() }); setUploading(false); },
      onError: () => setUploading(false),
    });
    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDeleteImage = (imgId: number) => {
    if (!vendor || !confirm("Delete this image?")) return;
    // useDeleteVendorImage: { id: number; imageId: number }
    deleteImage.mutate({ id: vendor.id, imageId: imgId }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetMyVendorProfileQueryKey() }),
    });
  };

  const handleBookingStatus = (bookingId: number, status: "approved" | "rejected") => {
    // useUpdateBookingStatus: { id: number; params: { status } }
    updateStatus.mutate({ id: bookingId, params: { status } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetVendorBookingsQueryKey() }),
    });
  };

  const pendingBookings = bookings?.filter((b) => b.status === "pending") ?? [];
  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "profile", label: "Profile", icon: Store },
    { id: "portfolio", label: "Portfolio", icon: ImageIcon },
    { id: "packages", label: "Packages", icon: Package },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "reviews", label: "Reviews", icon: Star },
  ];

  if (vendorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-rose-300 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-gray-900 mb-2">No vendor profile found</h2>
          <p className="text-gray-500 text-sm">Please contact support to set up your vendor account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-500 mt-1">{vendor.title}</p>
        </div>

        <div className="flex gap-8 flex-col md:flex-row">
          {/* Sidebar */}
          <aside className="md:w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-3 w-full px-5 py-3.5 text-sm font-medium transition-colors ${tab === t.id ? "bg-rose-50 text-rose-600 border-r-2 border-rose-500" : "text-gray-600 hover:bg-gray-50"}`}>
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* OVERVIEW */}
            {tab === "overview" && (
              <div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Profile Views", value: vendor.profileViews ?? 0, icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: "Total Bookings", value: bookings?.length ?? 0, icon: Calendar, color: "text-rose-500", bg: "bg-rose-50" },
                    { label: "Reviews", value: reviews?.length ?? 0, icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
                    { label: "Rating", value: avgRating, icon: BarChart2, color: "text-emerald-500", bg: "bg-emerald-50" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
                      <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                        <s.icon className={`w-5 h-5 ${s.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                  <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Pending Bookings</h2>
                  {pendingBookings.length > 0 ? (
                    <div className="space-y-3">
                      {pendingBookings.slice(0, 5).map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {(b as { userName?: string }).userName ?? `User #${b.userId}`}
                            </p>
                            <p className="text-xs text-gray-400">{new Date(b.eventDate).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleBookingStatus(b.id, "approved")}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleBookingStatus(b.id, "rejected")}
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-6">No pending bookings</p>
                  )}
                </div>

                <div className="rose-gradient rounded-2xl p-6 text-white">
                  <h3 className="font-display text-xl font-bold mb-1">Upgrade to Premium</h3>
                  <p className="text-rose-100 text-sm mb-4">Get featured placement, priority support, and advanced analytics to grow your business.</p>
                  <Button className="bg-white text-rose-600 font-semibold hover:bg-rose-50 rounded-xl px-5 py-2 text-sm">
                    Upgrade Now →
                  </Button>
                </div>
              </div>
            )}

            {/* PROFILE */}
            {tab === "profile" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-gray-900">Business Profile</h2>
                  {editing ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="rounded-xl">
                        <X className="w-3.5 h-3.5 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={saveProfile} disabled={updateVendor.isPending} className="rose-gradient text-white rounded-xl">
                        <Save className="w-3.5 h-3.5 mr-1" /> {updateVendor.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={startEdit} className="rounded-xl">
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Profile
                    </Button>
                  )}
                </div>
                {updateVendor.isSuccess && !editing && (
                  <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                    <Check className="w-4 h-4" /> Profile saved successfully!
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {([
                    { label: "Business Name", key: "title", value: vendor.title },
                    { label: "Category", key: "_cat", value: vendor.category, readonly: true },
                    { label: "Location", key: "location", value: vendor.location ?? "" },
                    { label: "Area", key: "area", value: vendor.area ?? "" },
                    { label: "City", key: "city", value: vendor.city },
                    { label: "WhatsApp", key: "whatsapp", value: vendor.whatsapp ?? "" },
                    { label: "Min Price (PKR)", key: "priceRangeMin", value: vendor.priceRangeMin?.toString() ?? "", type: "number" },
                    { label: "Max Price (PKR)", key: "priceRangeMax", value: vendor.priceRangeMax?.toString() ?? "", type: "number" },
                    { label: "Capacity (guests)", key: "capacity", value: vendor.capacity?.toString() ?? "", type: "number" },
                    { label: "Latitude", key: "latitude", value: vendor.latitude?.toString() ?? "", type: "number" },
                    { label: "Longitude", key: "longitude", value: vendor.longitude?.toString() ?? "", type: "number" },
                  ] as const).map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                      {editing && !("readonly" in f && f.readonly) ? (
                        <input
                          type={"type" in f ? f.type : "text"}
                          value={(profileForm as Record<string, unknown>)[f.key]?.toString() ?? ""}
                          onChange={(e) => {
                            const val = ("type" in f && f.type === "number")
                              ? (e.target.value ? Number(e.target.value) : undefined)
                              : e.target.value;
                            setProfileForm((prev) => ({ ...prev, [f.key]: val }));
                          }}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                        />
                      ) : (
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 min-h-[36px] flex items-center">
                          {f.value || <span className="text-gray-400 italic">Not set</span>}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                    {editing ? (
                      <textarea
                        value={(profileForm.description as string) ?? ""}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed min-h-[80px]">
                        {vendor.description || <span className="text-gray-400 italic">No description yet</span>}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PORTFOLIO */}
            {tab === "portfolio" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-gray-900">Portfolio Images</h2>
                  <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="rose-gradient text-white rounded-xl text-sm">
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </div>

                {uploadImage.isError && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Image upload failed. Configure Cloudinary credentials in environment secrets to enable image uploads.</span>
                  </div>
                )}

                {vendor.images && vendor.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {vendor.images.map((img) => (
                      <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img src={img.imageUrl} alt="Portfolio" className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm">No images uploaded yet</p>
                    <p className="text-xs mt-1">Upload photos to showcase your work</p>
                  </div>
                )}
              </div>
            )}

            {/* PACKAGES */}
            {tab === "packages" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-gray-900">Packages</h2>
                  <Button onClick={openAddPkg} className="rose-gradient text-white rounded-xl text-sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Package
                  </Button>
                </div>
                {vendor.packages && vendor.packages.length > 0 ? (
                  <div className="space-y-4">
                    {vendor.packages.map((pkg) => {
                      const features = Array.isArray(pkg.features) ? pkg.features : [];
                      return (
                        <div key={pkg.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-semibold text-gray-900">{pkg.name}</p>
                              {pkg.isPopular && <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-medium">Popular</span>}
                            </div>
                            <p className="text-rose-600 font-bold text-sm mb-1">PKR {pkg.price.toLocaleString()}</p>
                            {pkg.description && <p className="text-xs text-gray-500 mb-2">{pkg.description}</p>}
                            {features.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {features.map((f, i) => (
                                  <span key={i} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openEditPkg(pkg)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeletePkg(pkg.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm">No packages yet. Add your first package!</p>
                  </div>
                )}
              </div>
            )}

            {/* BOOKINGS */}
            {tab === "bookings" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-display text-xl font-bold text-gray-900">All Bookings</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["ID", "Customer", "Event Date", "Guests", "Notes", "Status", "Actions"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings && bookings.length > 0 ? bookings.map((b) => (
                        <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-4 text-gray-500 text-xs">#{b.id}</td>
                          <td className="px-4 py-4 font-medium text-xs">{(b as { userName?: string }).userName ?? `User #${b.userId}`}</td>
                          <td className="px-4 py-4 text-xs">{new Date(b.eventDate).toLocaleDateString()}</td>
                          <td className="px-4 py-4 text-gray-500 text-xs">{b.guestCount ?? "—"}</td>
                          <td className="px-4 py-4 text-gray-500 text-xs max-w-[120px] truncate">{b.notes ?? "—"}</td>
                          <td className="px-4 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[b.status] ?? ""}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {b.status === "pending" && (
                              <div className="flex gap-1.5">
                                <button onClick={() => handleBookingStatus(b.id, "approved")}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Approve">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleBookingStatus(b.id, "rejected")}
                                  className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Reject">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">No bookings yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REVIEWS */}
            {tab === "reviews" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-gray-900">Reviews</h2>
                  <div className="flex items-center gap-2">
                    <StarRow rating={Number(avgRating) || 0} />
                    <span className="text-lg font-bold text-gray-900">{avgRating}</span>
                    <span className="text-sm text-gray-400">({reviews?.length ?? 0})</span>
                  </div>
                </div>
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className="w-9 h-9 rounded-full rose-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {(r.userName ?? String(r.userId ?? "?")).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 text-sm">{r.userName ?? "Anonymous"}</p>
                            <StarRow rating={r.rating} />
                          </div>
                          {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(r.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <Star className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm">No reviews yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Package Modal */}
      {pkgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-display text-xl font-bold text-gray-900">{editingPkgId ? "Edit Package" : "Add Package"}</h3>
              <button onClick={() => setPkgModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Package Name *</label>
                <input
                  value={pkgForm.name}
                  onChange={(e) => setPkgForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Silver Package"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Price (PKR) *</label>
                <input
                  type="number"
                  value={pkgForm.price || ""}
                  onChange={(e) => setPkgForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  placeholder="150000"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                <input
                  value={pkgForm.description}
                  onChange={(e) => setPkgForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Features (one per line)</label>
                <textarea
                  value={pkgForm.featuresText}
                  onChange={(e) => setPkgForm((f) => ({ ...f, featuresText: e.target.value }))}
                  placeholder={"Decoration included\nCatering for 200\nFree parking"}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pkgForm.isPopular}
                  onChange={(e) => setPkgForm((f) => ({ ...f, isPopular: e.target.checked }))}
                  className="w-4 h-4 accent-rose-500"
                />
                <span className="text-sm text-gray-700 font-medium">Mark as Most Popular</span>
              </label>
              <Button
                onClick={savePkg}
                disabled={createPkg.isPending || updatePkg.isPending || !pkgForm.name || !pkgForm.price}
                className="w-full rose-gradient text-white rounded-xl py-3 font-semibold"
              >
                <Check className="w-4 h-4 mr-2" />
                {createPkg.isPending || updatePkg.isPending ? "Saving..." : "Save Package"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
