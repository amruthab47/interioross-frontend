import { useState, useEffect } from 'react';
import { Search, X, ExternalLink } from 'lucide-react';
import { getMarketplace } from '../api/catalog';

const CATEGORIES = ['All', 'Furniture', 'Lighting', 'Materials', 'Hardware'];
const SORT_OPTIONS = [
  { key: 'relevance', label: 'Best Match'   },
  { key: 'rated',     label: 'Best Rated'   },
  { key: 'price',     label: 'Lowest Price' },
];

function getSortedUrl(url, store, sortMode) {
  if (sortMode === 'relevance') return url;
  if (store === 'Amazon') {
    if (sortMode === 'rated') return url + '&s=review-rank';
    if (sortMode === 'price') return url + '&s=price-asc-rank';
  }
  if (store === 'Flipkart') {
    if (sortMode === 'rated') return url + '&sort=rating_desc';
    if (sortMode === 'price') return url + '&sort=price_asc';
  }
  return url;
}

function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill={s <= Math.round(rating) ? '#E07B20' : '#E5E7EB'}
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="6,1 7.5,4.5 11.5,4.5 8.5,7 9.5,11 6,8.5 2.5,11 3.5,7 0.5,4.5 4.5,4.5" />
        </svg>
      ))}
    </span>
  );
}

function availabilityStyle(availability) {
  if (availability === 'In Stock')      return 'bg-green-100 text-green-700';
  if (availability === 'Limited Stock') return 'bg-[#FFF3E0] text-[#E07B20]';
  return 'bg-red-100 text-red-600';
}

function ProductCard({ item, sortMode }) {
  const discount = item.originalPrice > item.price ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
  const buyUrl = getSortedUrl(item.buyUrl, item.store, sortMode);
  const fallback = CAT_PLACEHOLDER[item.category] ?? CAT_PLACEHOLDER.default;
  return (
    <div className="bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm flex flex-col hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative w-full overflow-hidden bg-[#F7F9FC]" style={{ height: 180 }}>
        <img
          src={item.image || fallback}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = fallback; }}
        />
        {item.isNew && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold bg-[#1B4F8A] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
            New
          </span>
        )}
        {item.isBestseller && (
          <span className="absolute top-2 right-2 text-[10px] font-semibold bg-[#E07B20] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
            Bestseller
          </span>
        )}
        {discount > 0 && (
          <span className="absolute bottom-2 left-2 text-[10px] font-semibold bg-green-600 text-white px-2 py-0.5 rounded-full">
            {discount}% OFF
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="font-semibold text-[13px] text-[#0F2340] dark:text-white leading-tight">{item.name}</p>
        <p className="text-[11px] text-[#777777] mt-0.5">{item.vendor} &bull; {item.sub}</p>

        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={item.rating} />
          <span className="text-[11px] text-[#777777]">{item.rating} ({item.reviews})</span>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[16px] font-bold font-sora text-[#1B4F8A]">
              &#8377;{item.price.toLocaleString('en-IN')}
            </p>
            {item.originalPrice !== item.price && (
              <p className="text-[11px] text-[#777777] line-through">
                &#8377;{item.originalPrice.toLocaleString('en-IN')}
              </p>
            )}
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${availabilityStyle(item.availability)}`}>
            {item.availability}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-2 mb-3">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#777777" strokeWidth="2">
            <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h6l2 5v3h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <span className="text-[11px] text-[#777777]">Delivery: {item.delivery}</span>
        </div>

        <a
          href={buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto w-full flex items-center justify-center gap-2 bg-[#1B4F8A] hover:bg-[#2E6DA4] text-white text-[12px] font-semibold py-2.5 rounded-lg transition-colors"
        >
          <ExternalLink size={13} />
          Buy on {item.store}
        </a>
      </div>
    </div>
  );
}

const CAT_PLACEHOLDER = {
  Furniture:  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=70&auto=format',
  Lighting:   'https://images.unsplash.com/photo-1513506003901-1e6a6b4a2588?w=600&q=70&auto=format',
  Materials:  'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=70&auto=format',
  Hardware:   'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=70&auto=format',
  default:    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=70&auto=format',
}

function normalizeItem(i) {
  return {
    ...i,
    id:       i._id,
    vendor:   i.vendorName ?? '',
    store:    i.storeName ?? '',
    reviews:  i.reviewsCount ?? 0,
    delivery: `${i.deliveryDays ?? 7} days`,
    image:    i.imageUrl ?? '',
    sub:      i.subCategory ?? '',
  }
}

export default function ClientMarketplace() {
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('relevance');

  useEffect(() => { getMarketplace().then(d => setMarketplaceItems(d.map(normalizeItem))).catch(console.error) }, [])

  const filtered = marketplaceItems.filter((item) => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (item.vendor ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#0F1219] space-y-5">

      {/* Header */}
      <div className="bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold font-sora text-[#0F2340] dark:text-white">Product Catalogue</h1>
            <p className="text-[13px] text-[#777777] mt-0.5">Browse furniture, lighting and materials curated for your project</p>
          </div>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
            <input
              type="text"
              placeholder="Search products or vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[13px] bg-[#F7F9FC] dark:bg-[#0F1219] border border-[#E0E0E0] dark:border-[#1F2937] rounded-lg focus:outline-none focus:border-[#1B4F8A] text-[#333333] dark:text-gray-200 placeholder-[#777777]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X size={13} className="text-[#777777]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category tabs + Sort */}
      <div className="flex gap-2 flex-wrap items-center">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
              activeCategory === cat
                ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]'
                : 'bg-white dark:bg-[#141B27] text-[#333333] dark:text-gray-300 border-[#E0E0E0] dark:border-[#1F2937] hover:border-[#2E6DA4]'
            }`}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1.5 text-[11px] opacity-70">
                ({marketplaceItems.filter((i) => i.category === cat).length})
              </span>
            )}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#777777] font-medium">Sort by:</span>
            <div className="flex items-center gap-0.5 bg-white dark:bg-[#141B27] rounded-lg p-0.5 border border-[#E0E0E0] dark:border-[#1F2937]">
              {SORT_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortMode(key)}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    sortMode === key
                      ? 'bg-[#1B4F8A] text-white'
                      : 'text-[#777777] dark:text-gray-400 hover:text-[#333333] dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[12px] text-[#777777]">{filtered.length} products</span>
        </div>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#141B27] rounded-xl border border-[#E0E0E0] dark:border-[#1F2937] shadow-sm p-10 text-center">
          <Search size={28} className="text-[#D6E8F7] mx-auto mb-3" />
          <p className="text-[14px] font-medium text-[#333333] dark:text-white">No products found</p>
          <p className="text-[12px] text-[#777777] mt-1">Try a different category or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ProductCard key={item.id} item={item} sortMode={sortMode} />
          ))}
        </div>
      )}
    </div>
  );
}
