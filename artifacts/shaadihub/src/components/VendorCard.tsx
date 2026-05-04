import { Heart, MapPin, Star, Users, BadgeCheck } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useToggleFavorite } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Vendor {
  id: number;
  category: string;
  title: string;
  location?: string | null;
  area?: string | null;
  coverImageUrl?: string | null;
  verified: boolean;
  isFeatured: boolean;
  rating: number;
  totalReviews: number;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  capacity?: number | null;
}

function formatPKR(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}

export function VendorCard({ vendor, favorited: initialFav = false }: { vendor: Vendor; favorited?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fav, setFav] = useState(initialFav);
  const toggle = useToggleFavorite();

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    setFav(!fav);
    toggle.mutate({ vendorId: vendor.id }, {
      onSuccess: (data) => {
        setFav(data.favorited);
        queryClient.invalidateQueries({ queryKey: ["/users/favorites"] });
      },
      onError: () => setFav(fav),
    });
  };

  return (
    <Link href={`/vendors/${vendor.id}`} data-testid={`card-vendor-${vendor.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm card-hover overflow-hidden cursor-pointer group">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-rose-50">
          {vendor.coverImageUrl ? (
            <img
              src={vendor.coverImageUrl}
              alt={vendor.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-100 to-pink-50">
              <span className="text-5xl">💒</span>
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {vendor.isFeatured && (
              <span className="bg-rose-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                Featured
              </span>
            )}
            {vendor.verified && (
              <span className="bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          {/* Category */}
          <div className="absolute bottom-3 left-3">
            <span className="bg-white/90 backdrop-blur text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
              {vendor.category}
            </span>
          </div>
          {/* Heart */}
          {user && (
            <button
              data-testid={`button-favorite-${vendor.id}`}
              onClick={handleFav}
              className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${
                fav ? "bg-rose-500 text-white" : "bg-white/90 text-gray-400 hover:text-rose-500"
              }`}
            >
              <Heart className={`w-4 h-4 ${fav ? "fill-white" : ""}`} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-1">{vendor.title}</h3>
          {(vendor.location || vendor.area) && (
            <p className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="truncate">{vendor.area ?? vendor.location}</span>
            </p>
          )}
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={vendor.rating} />
            <span className="text-xs font-semibold text-gray-700">{vendor.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({vendor.totalReviews})</span>
          </div>
          {vendor.capacity && (
            <p className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <Users className="w-3 h-3 text-gray-400" /> Up to {vendor.capacity.toLocaleString()} guests
            </p>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <div>
              {vendor.priceRangeMin && (
                <p className="text-xs text-gray-400">Starting from</p>
              )}
              {vendor.priceRangeMin ? (
                <p className="text-sm font-bold text-rose-600">{formatPKR(vendor.priceRangeMin)}</p>
              ) : (
                <p className="text-xs text-gray-400 italic">Contact for pricing</p>
              )}
            </div>
            <span className="text-xs font-medium text-rose-500 group-hover:translate-x-1 transition-transform">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
