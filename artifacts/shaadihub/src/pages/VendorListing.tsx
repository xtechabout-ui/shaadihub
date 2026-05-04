import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, MapPin, ArrowUpDown } from "lucide-react";
import { useListVendors, getListVendorsQueryKey } from "@workspace/api-client-react";
import { VendorCard } from "@/components/VendorCard";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  "Marriage Hall", "Catering", "Photography", "Videography",
  "Decoration", "Car Rental", "Event Planner", "Music & DJ",
  "Makeup & Beauty", "Flowers & Florist",
];

const AREAS = [
  "Clifton", "DHA", "Gulshan", "North Nazimabad", "Saddar",
  "Korangi", "Malir", "Bahria Town", "Scheme 33", "PECHS",
];

const SORT_OPTIONS = [
  { value: "", label: "Best Match" },
  { value: "rating_desc", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function VendorListing() {
  const rawSearch = useSearch();
  const [, setLocation] = useLocation();

  // Derive filter state from URL on every navigation
  const getParams = () => new URLSearchParams(rawSearch);

  const [search, setSearch] = useState(() => getParams().get("search") ?? "");
  const [category, setCategory] = useState(() => getParams().get("category") ?? "");
  const [area, setArea] = useState(() => getParams().get("area") ?? "");
  const [minPrice, setMinPrice] = useState(() => getParams().get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(() => getParams().get("maxPrice") ?? "");
  const [minRating, setMinRating] = useState(() => getParams().get("minRating") ?? "");
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [inputSearch, setInputSearch] = useState(() => getParams().get("search") ?? "");

  // Sync state whenever URL search string changes (e.g. navbar category link clicked while already on /vendors)
  useEffect(() => {
    const p = new URLSearchParams(rawSearch);
    const newCategory = p.get("category") ?? "";
    const newArea = p.get("area") ?? "";
    const newSearch = p.get("search") ?? "";
    setCategory(newCategory);
    setArea(newArea);
    setSearch(newSearch);
    setInputSearch(newSearch);
    setPage(1);
  }, [rawSearch]);

  // Build sort-derived query params
  const sortParams: { sortBy?: string; sortDir?: string } = {};
  if (sortBy === "rating_desc") { sortParams.sortBy = "rating"; sortParams.sortDir = "desc"; }
  else if (sortBy === "price_asc") { sortParams.sortBy = "price"; sortParams.sortDir = "asc"; }
  else if (sortBy === "price_desc") { sortParams.sortBy = "price"; sortParams.sortDir = "desc"; }

  const queryParams = {
    search: search || undefined,
    category: category || undefined,
    area: area || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minRating: minRating ? Number(minRating) : undefined,
    page,
    limit: 12,
    ...sortParams,
  };

  const { data, isLoading } = useListVendors(queryParams, {
    query: { queryKey: getListVendorsQueryKey(queryParams) },
  });

  const vendors = data?.vendors ?? [];
  const totalPages = data?.pages ?? 1;

  const activeFilters = [category, area, minPrice, maxPrice, minRating].filter(Boolean).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(inputSearch);
    setPage(1);
  };

  const clearFilters = () => {
    setCategory("");
    setArea("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setPage(1);
  };

  // Page title based on active category
  const pageTitle = category ? category : "All Vendors";
  const pageSubtitle = category
    ? `Browse verified ${category.toLowerCase()} vendors in Karachi`
    : "Browse all verified wedding vendors in Karachi";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="font-display text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pageSubtitle}</p>
        </div>
      </div>

      {/* Top search bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                placeholder="Search venues, photographers, caterers..."
                className="w-full bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
              />
              {inputSearch && (
                <button type="button" onClick={() => { setInputSearch(""); setSearch(""); setPage(1); }}>
                  <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-4">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`rounded-xl flex items-center gap-2 ${filtersOpen ? "border-rose-400 text-rose-600 bg-rose-50" : ""}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters > 0 && (
                <span className="bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {activeFilters}
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 flex-col md:flex-row">
          {/* Sidebar Filters */}
          <aside className={`md:w-64 shrink-0 ${filtersOpen ? "block" : "hidden md:block"}`}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-36">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="text-xs text-rose-500 hover:text-rose-700 font-medium">
                    Clear all
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</label>
                <div className="space-y-1.5">
                  {CATEGORIES.map((c) => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        checked={category === c}
                        onChange={() => { setCategory(c === category ? "" : c); setPage(1); }}
                        className="w-3.5 h-3.5 accent-rose-500"
                      />
                      <span className={`text-sm ${category === c ? "text-rose-600 font-semibold" : "text-gray-600 group-hover:text-gray-900"}`}>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Area */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Area in Karachi</label>
                <select
                  value={area}
                  onChange={(e) => { setArea(e.target.value); setPage(1); }}
                  className="w-full rounded-xl border border-gray-200 text-sm px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-700"
                >
                  <option value="">All Areas</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price Range (PKR)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                    placeholder="Min"
                    className="w-1/2 rounded-xl border border-gray-200 text-sm px-2 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                    placeholder="Max"
                    className="w-1/2 rounded-xl border border-gray-200 text-sm px-2 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>
              </div>

              {/* Min Rating */}
              <div className="mb-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Minimum Rating</label>
                <div className="flex gap-2 flex-wrap">
                  {["", "3", "4", "4.5"].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setMinRating(r); setPage(1); }}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${minRating === r ? "bg-rose-500 text-white border-rose-500" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}
                    >
                      {r ? `${r}+ ★` : "Any"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Results header with sort */}
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {isLoading ? "Loading..." : `${data?.total ?? 0} vendors found`}
                </p>
                {(search || category || area) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[search && `"${search}"`, category, area].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              {/* Sort dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <ArrowUpDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="rounded-xl border border-gray-200 text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-700 cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter pills */}
            {(category || area || minPrice || maxPrice || minRating) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {category && <FilterPill label={category} onRemove={() => { setCategory(""); setPage(1); }} />}
                {area && <FilterPill label={area} onRemove={() => { setArea(""); setPage(1); }} />}
                {minPrice && <FilterPill label={`Min PKR ${Number(minPrice).toLocaleString()}`} onRemove={() => { setMinPrice(""); setPage(1); }} />}
                {maxPrice && <FilterPill label={`Max PKR ${Number(maxPrice).toLocaleString()}`} onRemove={() => { setMaxPrice(""); setPage(1); }} />}
                {minRating && <FilterPill label={`${minRating}+ stars`} onRemove={() => { setMinRating(""); setPage(1); }} />}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-gray-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : vendors.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {vendors.map((v) => <VendorCard key={v.id} vendor={v} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-xl"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                          p === page ? "bg-rose-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-rose-300"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-xl"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">No vendors found</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your filters or search terms</p>
                <Button onClick={clearFilters} variant="outline" className="rounded-xl">Clear Filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium px-3 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-rose-800">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
