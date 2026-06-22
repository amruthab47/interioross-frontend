import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Truck, Tag, X, Check, ExternalLink } from 'lucide-react';
import { getMarketplace } from '../api/catalog';
import { getProjects } from '../api/projects';
import { projectToRow } from '../utils/format';

const CATEGORIES = ['All', 'Furniture', 'Lighting', 'Materials', 'Hardware'];
const SORT_OPTIONS = [
  { key: 'relevance', label: 'Best Match'   },
  { key: 'rated',     label: 'Best Rated'   },
  { key: 'price',     label: 'Lowest Price' },
];

function getSortedUrl(url, store, sortMode) {
  if (sortMode === 'relevance' || !url) return url;
  // Only append sort params for search/listing pages (those with ? already), not product-detail pages
  const isSearch = url.includes('?')
  const sep = isSearch ? '&' : '?'
  if (store === 'Amazon') {
    if (sortMode === 'rated') return url + sep + 's=review-rank';
    if (sortMode === 'price') return url + sep + 's=price-asc-rank';
  }
  if (store === 'Flipkart') {
    if (sortMode === 'rated') return url + sep + 'sort=rating_desc';
    if (sortMode === 'price') return url + sep + 'sort=price_asc';
  }
  return url;
}

const availabilityStyle = (availability) => {
  if (availability === 'In Stock') return 'bg-green-100 text-green-700';
  if (availability === 'Limited Stock') return 'bg-[#FFF3E0] text-[#E07B20]';
  return 'bg-red-100 text-red-600';
};

function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="12" height="12" viewBox="0 0 12 12"
          fill={s <= Math.round(rating) ? '#E07B20' : '#E5E7EB'}
          xmlns="http://www.w3.org/2000/svg">
          <polygon points="6,1 7.5,4.5 11.5,4.5 8.5,7 9.5,11 6,8.5 2.5,11 3.5,7 0.5,4.5 4.5,4.5" />
        </svg>
      ))}
    </span>
  );
}

function AddToDesignModal({ item, projects, onClose }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!selectedProject) return;
    setAdded(true);
    setTimeout(onClose, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0F2340] font-sora">Add to Design</h2>
            <p className="text-[12px] text-[#777777] mt-0.5 truncate max-w-[280px]">{item.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#F7F9FC] flex items-center justify-center text-[#777777] hover:bg-[#E0E0E0] transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center gap-4 px-5 py-4 bg-[#F7F9FC] border-b border-[#E0E0E0]">
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-[#E0E0E0]">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0F2340]">{item.name}</p>
            <p className="text-[11px] text-[#777777] mt-0.5">{item.vendor} &bull; {item.sub}</p>
            <p className="text-[15px] font-bold text-[#E07B20] mt-1">₹{item.price.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-[12px] font-semibold text-[#333333] mb-3">Select a project to add this item to:</p>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {projects.length === 0 && (
              <p className="text-[12px] text-[#777777] text-center py-4">No projects found.</p>
            )}
            {projects.map(project => {
              const isSelected = selectedProject?.id === project.id;
              return (
                <button key={project.id} onClick={() => setSelectedProject(project)}
                  className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    isSelected ? 'border-[#1B4F8A] bg-[#D6E8F7]' : 'border-[#E0E0E0] bg-white hover:border-[#2E6DA4] hover:bg-[#F7F9FC]'
                  }`}>
                  <div>
                    <p className={`text-[13px] font-medium ${isSelected ? 'text-[#1B4F8A]' : 'text-[#333333]'}`}>{project.name}</p>
                    <p className="text-[11px] text-[#777777] mt-0.5">{project.client} &bull; {project.phase}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#1B4F8A] flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 pb-5">
          {added ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-100 text-green-700 font-semibold text-[13px]">
              <Check size={16} />
              Added to {selectedProject?.name}!
            </div>
          ) : (
            <button onClick={handleAdd} disabled={!selectedProject}
              className={`w-full py-3 rounded-xl text-[13px] font-semibold text-white transition-all ${
                selectedProject ? 'bg-[#1B4F8A] hover:bg-[#2E6DA4] cursor-pointer' : 'bg-[#B0B8C4] cursor-not-allowed'
              }`}>
              {selectedProject ? `Add to ${selectedProject.name}` : 'Select a project first'}
            </button>
          )}
        </div>
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

function ProductCard({ item, onAddToDesign, sortMode }) {
  const buyUrl = getSortedUrl(item.buyUrl, item.store, sortMode);
  const fallback = CAT_PLACEHOLDER[item.category] ?? CAT_PLACEHOLDER.default;
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#E0E0E0] shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="relative w-full overflow-hidden bg-[#F7F9FC]" style={{ height: 180 }}>
        <img
          src={item.image || fallback}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = fallback; }}
        />
        {item.isNew && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold bg-[#1B4F8A] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
        )}
        {item.isBestseller && (
          <span className="absolute top-2 right-2 text-[10px] font-semibold bg-[#E07B20] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Bestseller</span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="mb-1">
          <p className="font-medium text-[13px] text-[#0F2340] leading-tight">{item.name}</p>
          <p className="text-[11px] text-[#777777] mt-0.5">{item.vendor} &bull; {item.sub}</p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={item.rating} />
          <span className="text-[11px] text-[#777777]">{item.rating} ({item.reviews})</span>
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-[15px] font-bold text-[#E07B20]">₹{item.price.toLocaleString('en-IN')}</span>
          {item.originalPrice > 0 && (
            <span className="text-[11px] text-[#777777] line-through">₹{item.originalPrice.toLocaleString('en-IN')}</span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${availabilityStyle(item.availability)}`}>
            {item.availability}
          </span>
        </div>

        <div className="mt-auto pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px] text-[#777777]">
              <Truck size={12} />
              {item.delivery}
            </span>
            <a href={buyUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-[#2E6DA4] hover:text-[#1B4F8A] hover:underline">
              <ExternalLink size={11} />
              {item.store}
            </a>
          </div>
          <div className="flex gap-2">
            <a href={buyUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 border border-[#1B4F8A] text-[#1B4F8A] hover:bg-[#D6E8F7] text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors">
              <ExternalLink size={12} />
              Buy on {item.store}
            </a>
            <button onClick={() => onAddToDesign(item)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#1B4F8A] hover:bg-[#2E6DA4] text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors">
              <ShoppingBag size={12} />
              Add to Design
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function mapItem(raw) {
  return {
    id:            String(raw._id),
    name:          raw.name,
    category:      raw.category,
    sub:           raw.subCategory ?? '',
    price:         raw.price ?? 0,
    originalPrice: raw.originalPrice ?? 0,
    vendor:        raw.vendorName ?? '',
    rating:        raw.rating ?? 0,
    reviews:       raw.reviewsCount ?? 0,
    availability:  raw.availability ?? 'In Stock',
    delivery:      raw.deliveryDays ? `${raw.deliveryDays} days` : '',
    image:         raw.imageUrl ?? '',
    isNew:         raw.isNew ?? false,
    isBestseller:  raw.isBestseller ?? false,
    store:         raw.storeName ?? '',
    buyUrl:        raw.buyUrl ?? '',
  }
}

export default function DesignerMarketplace() {
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [designerProjects, setDesignerProjects] = useState([]);
  const [search,           setSearch]           = useState('');
  const [activeCategory,   setActiveCategory]   = useState('All');
  const [modalItem,        setModalItem]        = useState(null);
  const [sortMode,         setSortMode]         = useState('relevance');
  const [loading,          setLoading]          = useState(true);
  const [apiError,         setApiError]         = useState('');

  useEffect(() => {
    setLoading(true);
    getMarketplace()
      .then(items => {
        const raw = Array.isArray(items) ? items : [];
        setMarketplaceItems(raw.map(mapItem));
        setApiError('');
      })
      .catch(err => { console.error(err); setApiError('Could not load products. Is the backend running?'); })
      .finally(() => setLoading(false));
    getProjects().then(ps => setDesignerProjects(ps.map(projectToRow))).catch(console.error);
  }, []);

  const filtered = marketplaceItems
    .filter(item => {
      const matchCat    = activeCategory === 'All' || item.category === activeCategory;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sortMode === 'rated') return b.rating - a.rating;
      if (sortMode === 'price') return a.price - b.price;
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#F7F9FC] p-6">
      <div className="mb-6">
        <h1 className="font-sora text-2xl font-bold text-[#0F2340]">Design Marketplace</h1>
        <p className="text-[13px] text-[#777777] mt-1">
          Browse curated furniture, lighting, materials and hardware for your projects
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-4 mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
            <input type="text" placeholder="Search products..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E0E0E0] rounded-lg outline-none focus:border-[#2E6DA4] text-[#333333] placeholder-[#AAAAAA]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#777777] font-medium">Sort by:</span>
            <div className="flex items-center gap-0.5 bg-[#F7F9FC] rounded-lg p-0.5 border border-[#E0E0E0]">
              {SORT_OPTIONS.map(({ key, label }) => (
                <button key={key} onClick={() => setSortMode(key)}
                  className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                    sortMode === key ? 'bg-white text-[#1B4F8A] shadow-sm font-semibold border border-[#E0E0E0]' : 'text-[#777777] hover:text-[#333333]'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[12px] text-[#777777] ml-auto whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors border ${
                activeCategory === cat
                  ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]'
                  : 'bg-white text-[#333333] border-[#E0E0E0] hover:border-[#2E6DA4] hover:text-[#2E6DA4]'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#777777]">
          <div className="w-8 h-8 rounded-full border-4 border-[#D6E8F7] border-t-[#1B4F8A] animate-spin mb-4" />
          <p className="text-[14px]">Loading products…</p>
        </div>
      ) : apiError ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#777777]">
          <Tag size={40} className="mb-4 opacity-30" />
          <p className="text-[14px] font-semibold text-[#dc2626]">{apiError}</p>
          <p className="text-[12px] mt-1">Run <code className="bg-[#F0F2F5] px-2 py-0.5 rounded text-[#1B4F8A]">npm run seed</code> in the <code className="bg-[#F0F2F5] px-2 py-0.5 rounded text-[#1B4F8A]">interioross-backend</code> folder, then refresh.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#777777]">
          <Tag size={40} className="mb-4 opacity-30" />
          <p className="text-[14px]">{marketplaceItems.length === 0 ? 'No products in database — run the seed first.' : 'No products match your search.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(item => (
            <ProductCard key={item.id} item={item} onAddToDesign={setModalItem} sortMode={sortMode} />
          ))}
        </div>
      )}

      {modalItem && (
        <AddToDesignModal item={modalItem} projects={designerProjects} onClose={() => setModalItem(null)} />
      )}
    </div>
  );
}
