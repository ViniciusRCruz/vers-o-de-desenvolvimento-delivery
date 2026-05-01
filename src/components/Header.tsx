import React, { useState, useEffect, useRef } from 'react';
import { Search, User, ShoppingCart, ListOrdered, ShieldAlert, Store, Tag, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import Logo from './Logo';


export default function Header() {
  const { cartCount, isLoggedIn, selectedCity, isSystemAdmin, adminMarkets } = useAppContext();
  const navigate = useNavigate();

  const hasAdminAccess = isSystemAdmin || adminMarkets.length > 0;

  // Search state
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ markets: any[]; products: any[] }>({ markets: [], products: [] });
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSearchResults({ markets: [], products: [] });
      setIsSearchOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const term = `%${query.trim()}%`;

        // Search markets by name
        const { data: markets } = await supabase
          .from('markets')
          .select('id, name, img, categories, cityId')
          .eq('isActive', true)
          .ilike('name', term)
          .limit(5);

        // Search products by name or category
        const { data: products } = await supabase
          .from('products')
          .select('id, name, price, promotionalPrice, platformDiscount, category, image, marketId')
          .eq('isActive', true)
          .ilike('name', term)
          .limit(8);

        // For product results, we need the market names to show context
        let enrichedProducts: any[] = [];
        if (products && products.length > 0) {
          const marketIds = [...new Set(products.map(p => p.marketId))];
          const { data: productMarkets } = await supabase
            .from('markets')
            .select('id, name')
            .in('id', marketIds);

          const marketMap = (productMarkets || []).reduce((acc, m) => {
            acc[m.id] = m.name;
            return acc;
          }, {} as Record<string, string>);

          enrichedProducts = products.map(p => ({
            ...p,
            marketName: marketMap[p.marketId] || 'Loja'
          }));
        }

        setSearchResults({
          markets: markets || [],
          products: enrichedProducts
        });
        setIsSearchOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelectMarket = (marketId: string) => {
    setQuery('');
    setIsSearchOpen(false);
    navigate(`/store/${marketId}`);
  };

  const handleSelectProduct = (product: any) => {
    setQuery('');
    setIsSearchOpen(false);
    navigate(`/store/${product.marketId}`);
  };

  const clearSearch = () => {
    setQuery('');
    setIsSearchOpen(false);
    setSearchResults({ markets: [], products: [] });
  };

  const hasResults = searchResults.markets.length > 0 || searchResults.products.length > 0;
  const noResults = query.trim().length >= 2 && !isSearching && !hasResults;

  return (
    <header className="bg-white px-4 md:px-10 h-16 md:h-20 flex items-center justify-between border-b border-slate-200 z-50 sticky top-0">
      <Link to="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
        <Logo size="sm" showText={false} />
        <div className="flex flex-col leading-none">
          <span className="text-xl font-black tracking-tighter text-[#003B5C]">PARNAÍBA</span>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#003B5C] uppercase">Delivery</span>
        </div>
      </Link>
      
      {/* Search Bar — Desktop inline, Mobile icon toggle */}
      <div ref={searchRef} className="relative w-full max-w-lg mx-4 md:mx-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar mercados, produtos..." 
            className="w-full bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-10 rounded-full text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { if (hasResults || noResults) setIsSearchOpen(true); }}
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          {query && (
            <button 
              onClick={clearSearch} 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-[60] max-h-[70vh] overflow-y-auto">
            
            {isSearching && (
              <div className="p-6 text-center text-sm text-slate-400 animate-pulse">Buscando...</div>
            )}

            {noResults && (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <Search className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">Nenhum resultado para "<span className="text-slate-800">{query}</span>"</p>
                <p className="text-xs text-slate-400">Tente buscar por outro nome de produto ou loja.</p>
              </div>
            )}

            {!isSearching && searchResults.markets.length > 0 && (
              <div>
                <div className="px-4 pt-4 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lojas</span>
                </div>
                {searchResults.markets.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMarket(m.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                      {m.img || '🏪'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">{m.name}</p>
                      <p className="text-xs text-slate-400 truncate">{m.categories?.slice(0, 3).join(', ')}</p>
                    </div>
                    <Store className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {!isSearching && searchResults.products.length > 0 && (
              <div>
                {searchResults.markets.length > 0 && <div className="border-t border-slate-100"></div>}
                <div className="px-4 pt-4 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Produtos</span>
                </div>
                {searchResults.products.map(p => {
                  const hasPromo = p.promotionalPrice || p.platformDiscount;
                  const finalPrice = hasPromo
                    ? Math.max(0, Number(p.promotionalPrice || p.price) - Number(p.platformDiscount || 0))
                    : Number(p.price);

                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg shrink-0 overflow-hidden">
                        {p.image && p.image.startsWith('http') ? (
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>🛍️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400 truncate">em {p.marketName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {hasPromo ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 line-through">R$ {Number(p.price).toFixed(2).replace('.', ',')}</span>
                            <span className="text-sm font-extrabold text-green-600">R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-extrabold text-slate-800">R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!isSearching && hasResults && (
              <div className="border-t border-slate-100 p-3">
                <p className="text-center text-[11px] text-slate-400">Clique em um resultado para navegar</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 md:gap-6 items-center shrink-0">

        {isLoggedIn ? (
          <div className="flex items-center gap-2 md:gap-4">
            {hasAdminAccess && (
              <Link to="/admin" className="relative flex items-center gap-1.5 md:gap-2 font-bold text-xs md:text-sm text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                <ShieldAlert className="w-4 h-4 text-slate-500" /> <span className="hidden sm:inline">Painel</span>
              </Link>
            )}
            <Link to="/history" className="relative flex items-center gap-1.5 md:gap-2 font-semibold text-xs md:text-sm text-slate-700 hover:text-green-600 transition-colors">
              <ListOrdered className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Pedidos</span>
            </Link>
            <Link to="/auth" className="relative flex items-center gap-1.5 md:gap-2 font-semibold text-xs md:text-sm text-slate-700 hover:text-green-600 transition-colors">
              <User className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Perfil</span>
            </Link>
          </div>
        ) : (
          <Link to="/login" className="flex relative items-center gap-1.5 md:gap-2 font-semibold text-xs md:text-sm text-slate-700 hover:text-green-600 transition-colors">
            <User className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Entrar</span>
          </Link>
        )}

        <Link to="/checkout" className="relative flex items-center gap-2 font-semibold text-sm text-slate-700 hover:text-green-600 transition-colors">
          <div className="relative">
            <ShoppingCart className="w-6 h-6 md:w-5 md:h-5 text-slate-700" />
            {cartCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full absolute -top-2 -right-2 shadow-sm border-2 border-white animate-pulse">
                {cartCount}
              </span>
            )}
          </div>
          <span className="hidden md:inline">Carrinho</span>
        </Link>
      </div>
    </header>
  );
}
