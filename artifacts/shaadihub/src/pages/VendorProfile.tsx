import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  Star, MapPin, Users, BadgeCheck, Award, ChevronLeft, ChevronRight,
  Heart, MessageSquare, Phone, Shield, X, Calendar, Check, ArrowLeft,
} from "lucide-react";
import {
  useGetVendor, getGetVendorQueryKey,
  useGetVendorReviews, getGetVendorReviewsQueryKey,
  useCreateBooking, useCreateReview, useToggleFavorite,
  useGetFavorites, getGetFavoritesQueryKey,
  useListVendors, getListVendorsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { VendorCard } from "@/components/VendorCard";

function formatPKR(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${cls} ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} />
      ))}
    </div>
  );
}

function ClickableStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >
          <Star className={`w-8 h-8 transition-colors ${s <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} />
        </button>
      ))}
    </div>
  );
}

export default function VendorProfile() {
  const { id } = useParams<{ id: string }>();
  const vendorId = Number(id);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  // Correct signatures: first arg is primitive id/vendorId
  const { data: vendor, isLoading } = useGetVendor(vendorId, {
    query: { queryKey: getGetVendorQueryKey(vendorId) },
  });
  const { data: reviews } = useGetVendorReviews(vendorId, {
    query: { queryKey: getGetVendorReviewsQueryKey(vendorId) },
  });
  const { data: favorites } = useGetFavorites({
    query: { queryKey: getGetFavoritesQueryKey(), enabled: !!user },
  });

  const createBooking = useCreateBooking();
  const createReview = useCreateReview();
  const toggleFav = useToggleFavorite();

  // Similar vendors — same category, excluding current vendor
  const similarParams = { category: vendor?.category, limit: 4 };
  const { data: similarData } = useListVendors(similarParams, {
    query: {
      queryKey: getListVendorsQueryKey(similarParams),
      enabled: !!vendor?.category,
    },
  });
  const similarVendors = (similarData?.vendors ?? []).filter((v) => v.id !== vendorId).slice(0, 3);

  const [imgIndex, setImgIndex] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);

  const [bookDate, setBookDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [bookNotes, setBookNotes] = useState("");
  const [bookError, setBookError] = useState("");
  const [bookSuccess, setBookSuccess] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const isFavorited = favorites?.some((f) => f.id === vendorId) ?? false;
  const [fav, setFav] = useState(isFavorited);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Vendor not found</p>
          <Button onClick={() => setLocation("/vendors")} variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Vendors
          </Button>
        </div>
      </div>
    );
  }

  // Build image gallery: cover first, then additional images
  const allImages = [
    ...(vendor.coverImageUrl ? [{ id: -1, imageUrl: vendor.coverImageUrl }] : []),
    ...(vendor.images ?? []).filter((img) => img.imageUrl !== vendor.coverImageUrl),
  ];

  const handleToggleFav = () => {
    if (!user) { setLocation("/login"); return; }
    setFav(!fav);
    toggleFav.mutate({ vendorId }, {
      onSuccess: (d) => { setFav(d.favorited); qc.invalidateQueries({ queryKey: getGetFavoritesQueryKey() }); },
      onError: () => setFav(fav),
    });
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setLocation("/login"); return; }
    if (!bookDate) { setBookError("Please select an event date"); return; }
    setBookLoading(true);
    setBookError("");
    try {
      await createBooking.mutateAsync({
        data: {
          vendorId,
          packageId: selectedPackageId ?? undefined,
          eventDate: bookDate,
          guestCount: guestCount ? Number(guestCount) : undefined,
          notes: bookNotes || undefined,
        },
      });
      setBookSuccess(true);
    } catch (err: unknown) {
      const msg = (err instanceof Error) ? err.message : "Booking failed. Please try again.";
      setBookError(msg);
    } finally {
      setBookLoading(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating) { setReviewError("Please select a rating"); return; }
    setReviewLoading(true);
    setReviewError("");
    try {
      await createReview.mutateAsync({ vendorId, data: { rating: reviewRating, comment: reviewComment || undefined } });
      setReviewSuccess(true);
      qc.invalidateQueries({ queryKey: getGetVendorReviewsQueryKey(vendorId) });
    } catch (err: unknown) {
      const msg = (err instanceof Error) ? err.message : "Review submission failed";
      setReviewError(msg);
    } finally {
      setReviewLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back */}
        <button onClick={() => setLocation("/vendors")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-4 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to vendors
        </button>

        <div className="flex gap-8 flex-col lg:flex-row">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Gallery */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-4 aspect-[16/9]">
              {allImages.length > 0 ? (
                <>
                  <img
                    src={allImages[imgIndex]?.imageUrl}
                    alt={vendor.title}
                    className="w-full h-full object-cover"
                  />
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setImgIndex((i) => (i + 1) % allImages.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {allImages.map((_, i) => (
                          <button key={i} onClick={() => setImgIndex(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? "bg-white" : "bg-white/50"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-100 to-pink-50">
                  <span className="text-8xl">💒</span>
                </div>
              )}
              {/* Fav button */}
              <button onClick={handleToggleFav}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all ${
                  fav ? "bg-rose-500 text-white" : "bg-white/90 text-gray-400 hover:text-rose-500"
                }`}>
                <Heart className={`w-5 h-5 ${fav ? "fill-white" : ""}`} />
              </button>
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setImgIndex(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${i === imgIndex ? "border-rose-500" : "border-transparent"}`}>
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-rose-50 text-rose-600 text-xs font-semibold px-3 py-1 rounded-full border border-rose-100">{vendor.category}</span>
                {vendor.verified && (
                  <span className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
                {vendor.isFeatured && (
                  <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-3 py-1 rounded-full border border-amber-100 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Featured
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{vendor.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                {(vendor.location || vendor.area) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    {[vendor.area, vendor.location].filter(Boolean).join(", ")}
                  </span>
                )}
                {vendor.capacity && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-rose-400" /> Up to {vendor.capacity.toLocaleString()} guests
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StarDisplay rating={vendor.rating} size="md" />
                <span className="text-lg font-bold text-gray-900">{vendor.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({vendor.totalReviews} reviews)</span>
              </div>
            </div>

            {/* Description */}
            {vendor.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                <h2 className="font-display text-lg font-bold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed text-sm">{vendor.description}</p>
              </div>
            )}

            {/* Packages */}
            {vendor.packages && vendor.packages.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Packages</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendor.packages.map((pkg) => {
                    // features is string[] from the API
                    const features: string[] = Array.isArray(pkg.features) ? pkg.features : [];
                    const isPopular = pkg.isPopular;
                    return (
                      <div key={pkg.id}
                        className={`rounded-2xl border-2 p-5 flex flex-col transition-all ${
                          isPopular ? "border-rose-400 shadow-md bg-rose-50/30" : "border-gray-100 bg-gray-50/50"
                        }`}>
                        {isPopular && (
                          <span className="self-start bg-rose-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full mb-2">Most Popular</span>
                        )}
                        <h3 className="font-semibold text-gray-900 mb-1">{pkg.name}</h3>
                        <p className="text-2xl font-bold text-rose-600 mb-1">{formatPKR(pkg.price)}</p>
                        {pkg.description && <p className="text-xs text-gray-500 mb-3">{pkg.description}</p>}
                        {features.length > 0 && (
                          <ul className="space-y-1.5 mb-4 flex-1">
                            {features.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        )}
                        <Button
                          onClick={() => { setSelectedPackageId(pkg.id); setBookingOpen(true); setBookError(""); setBookSuccess(false); }}
                          className={`w-full rounded-xl text-sm ${isPopular ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                        >
                          Book This Package
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Map */}
            {vendor.latitude && vendor.longitude && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Location</h2>
                <div className="rounded-xl overflow-hidden h-64 border border-gray-100">
                  <iframe
                    title="Vendor location map"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${vendor.latitude},${vendor.longitude}&z=15&output=embed`}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold text-gray-900">
                  Reviews {reviews && reviews.length > 0 && (
                    <span className="text-gray-400 font-normal text-sm">({reviews.length})</span>
                  )}
                </h2>
                {user?.role === "user" && (
                  <Button variant="outline" size="sm" onClick={() => { setReviewOpen(true); setReviewError(""); setReviewSuccess(false); }} className="rounded-xl">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Write a Review
                  </Button>
                )}
              </div>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-9 h-9 rounded-full rose-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {(r.userName ?? String(r.userId ?? "?")).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm">{r.userName ?? "Anonymous"}</p>
                          <StarDisplay rating={r.rating} />
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
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">No reviews yet. Be the first!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Sidebar */}
          <aside className="lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-36">
              {vendor.priceRangeMin && (
                <div className="mb-5">
                  <p className="text-xs text-gray-400">Starting from</p>
                  <p className="text-3xl font-display font-bold text-rose-600">{formatPKR(vendor.priceRangeMin)}</p>
                  {vendor.priceRangeMax && vendor.priceRangeMax !== vendor.priceRangeMin && (
                    <p className="text-xs text-gray-400 mt-0.5">Up to {formatPKR(vendor.priceRangeMax)}</p>
                  )}
                </div>
              )}
              <Button
                onClick={() => { setBookingOpen(true); setSelectedPackageId(null); setBookError(""); setBookSuccess(false); }}
                className="w-full rose-gradient text-white font-semibold py-3 rounded-xl mb-3 hover:opacity-90"
              >
                <Calendar className="w-4 h-4 mr-2" /> Book Now
              </Button>
              {vendor.whatsapp && (
                <a
                  href={`https://wa.me/92${vendor.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-emerald-500 text-emerald-600 font-semibold text-sm mb-5 hover:bg-emerald-50 transition-colors"
                >
                  <Phone className="w-4 h-4" /> WhatsApp Inquiry
                </a>
              )}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                {[
                  { icon: BadgeCheck, color: "text-emerald-500", bg: "bg-emerald-50", label: "Verified Vendor", sub: "Identity confirmed by ShaadiHub" },
                  { icon: Shield, color: "text-blue-500", bg: "bg-blue-50", label: "Secure Booking", sub: "Your payment is protected" },
                  { icon: Check, color: "text-rose-500", bg: "bg-rose-50", label: "Free Cancellation", sub: "Cancel up to 7 days before" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <div className={`w-9 h-9 ${b.bg} rounded-xl flex items-center justify-center shrink-0`}>
                      <b.icon className={`w-4 h-4 ${b.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{b.label}</p>
                      <p className="text-xs text-gray-400">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Similar Vendors */}
      {similarVendors.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="border-t border-gray-100 pt-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-1">You might also like</p>
                <h2 className="font-display text-2xl font-bold text-gray-900">Similar {vendor.category} Vendors</h2>
              </div>
              <Link href={`/vendors?category=${encodeURIComponent(vendor.category)}`}>
                <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-sm hidden sm:flex">
                  See all <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similarVendors.map((v) => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-display text-xl font-bold text-gray-900">Book Appointment</h3>
                <p className="text-sm text-gray-500 mt-0.5">{vendor.title}</p>
              </div>
              <button onClick={() => setBookingOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {!user ? (
                <div className="text-center py-6">
                  <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Please log in to make a booking</p>
                  <Button onClick={() => { setBookingOpen(false); setLocation("/login"); }} className="rose-gradient text-white rounded-xl">
                    Sign In to Book
                  </Button>
                </div>
              ) : bookSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-gray-900 mb-2">Booking Sent!</h4>
                  <p className="text-gray-500 text-sm mb-4">Your booking request has been sent. The vendor will confirm shortly.</p>
                  <Button onClick={() => setBookingOpen(false)} variant="outline" className="rounded-xl">Close</Button>
                </div>
              ) : (
                <form onSubmit={handleBook} className="space-y-4">
                  {selectedPackageId && vendor.packages && (
                    <div className="bg-rose-50 rounded-xl px-4 py-3 text-sm text-rose-700 font-medium">
                      Package: {vendor.packages.find((p) => p.id === selectedPackageId)?.name ?? "Selected Package"}
                    </div>
                  )}
                  {bookError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{bookError}</div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Event Date *</label>
                    <input
                      type="date"
                      value={bookDate}
                      min={today}
                      onChange={(e) => setBookDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Number of Guests</label>
                    <input
                      type="number"
                      value={guestCount}
                      min="1"
                      onChange={(e) => setGuestCount(e.target.value)}
                      placeholder="e.g. 200"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes (optional)</label>
                    <textarea
                      value={bookNotes}
                      onChange={(e) => setBookNotes(e.target.value)}
                      placeholder="Any special requirements..."
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                    />
                  </div>
                  <Button type="submit" disabled={bookLoading} className="w-full rose-gradient text-white rounded-xl py-3 font-semibold">
                    {bookLoading ? "Sending..." : "Confirm Booking Request"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-display text-xl font-bold text-gray-900">Write a Review</h3>
              <button onClick={() => setReviewOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {reviewSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-gray-900 mb-2">Review Submitted!</h4>
                  <p className="text-gray-500 text-sm mb-4">Thank you for your feedback.</p>
                  <Button onClick={() => setReviewOpen(false)} variant="outline" className="rounded-xl">Close</Button>
                </div>
              ) : (
                <form onSubmit={handleReview} className="space-y-4">
                  {reviewError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{reviewError}</div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Rating *</label>
                    <ClickableStars value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Comment (optional)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience..."
                      rows={4}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                    />
                  </div>
                  <Button type="submit" disabled={reviewLoading} className="w-full rose-gradient text-white rounded-xl py-3 font-semibold">
                    {reviewLoading ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
