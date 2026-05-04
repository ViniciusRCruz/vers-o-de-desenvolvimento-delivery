import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Star, Clock, Bike, Tag, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export const MARKET_CATEGORIES = ['Mercado', 'Hortifruti', 'Carnes', 'Bebidas', 'Padaria', 'Limpeza', 'Pet Shop', 'Farmácia', 'Conveniência'];

export default function HomeList() {
  const navigate = useNavigate();
  const { selectedCity, addToCart } = useAppContext();
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [allMarkets, setAllMarkets] = useState<any[]>([]);
  const [promoProducts, setPromoProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
       setIsLoading(true);
       try {
           const { data: marketsData, error } = await supabase.from('markets').select('*').eq('isActive', true);
           if (error) throw error;
           
           // Fetch all reviews to calculate averages
           const { data: reviewsData } = await supabase.from('reviews').select('marketId, rating');
           const avgByMarket: Record<string, { sum: number; count: number }> = {};
           (reviewsData || []).forEach((r: any) => {
              if (!avgByMarket[r.marketId]) avgByMarket[r.marketId] = { sum: 0, count: 0 };
              avgByMarket[r.marketId].sum += r.rating;
              avgByMarket[r.marketId].count += 1;
           });

           const mappedMarkets = (marketsData || []).map(m => {
               const rev = avgByMarket[m.id];
               return {
                   ...m,
                   img: m.img || '🏪',
                   rating: rev ? parseFloat((rev.sum / rev.count).toFixed(1)) : null,
                   reviewCount: rev ? rev.count : 0,
                   deliveryTime: m.deliveryTime || 45,
                   fee: m.fee || 0,
                   categories: m.categories && m.categories.length > 0 ? m.categories : ['Mercado'],
                   cityId: m.cityId || 'São Paulo, SP'
               };
           });
           setAllMarkets(mappedMarkets);

           // Busca produtos que têm desconto pelo lojista OU pela plataforma
           const { data: prods, error: prodErr } = await supabase.from('products').select('*')
               .or('promotionalPrice.not.is.null,platformDiscount.not.is.null')
               .eq('isActive', true);
           
           if (!prodErr && prods) {
               setPromoProducts(prods);
           }
       } catch (err) {
           console.error("Erro ao carregar dados", err);
       } finally {
           setIsLoading(false);
       }
    };
    fetchData();
  }, []);
  
   const cityMarkets = allMarkets.filter(m => m.cityId === selectedCity.id || m.cityId === selectedCity.name);
   const cityMarketIds = cityMarkets.map(m => m.id);
   const cityPromos = promoProducts.filter(p => cityMarketIds.includes(p.marketId));

   // Categorias que realmente possuem lojas na cidade selecionada
   const availableCategories = MARKET_CATEGORIES.filter(cat => 
     cityMarkets.some(m => m.categories && m.categories.includes(cat))
   );

  // Agrupa promos por loja
  const promosByStore = cityPromos.reduce((acc, p) => {
      if(!acc[p.marketId]) acc[p.marketId] = [];
      acc[p.marketId].push(p);
      return acc;
  }, {} as Record<string, any[]>);
  
  const displayMarkets = cityMarkets.filter(m => {
    if (activeCategory === 'Todos' || activeCategory === 'Promoções') return true;
    return m.categories && m.categories.includes(activeCategory);
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col gap-10">
        
        {/* Banner principal promocional */}
        <div className="h-[180px] md:h-[220px] bg-gradient-to-r from-[#003B5C] to-[#005a8c] rounded-3xl relative overflow-hidden text-white flex items-center px-8 md:px-12 shadow-lg hover:scale-[1.01] transition-transform cursor-pointer" onClick={() => setActiveCategory('Promoções')}>
          <div className="relative z-10">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">App Promos</span>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">Oportunidades<br/>Especiais</h1>
            <p className="opacity-90 max-w-xs text-sm">Preços com descontos das lojas e ofertas da própria plataforma.</p>
          </div>
          <div className="absolute right-0 bottom-[-20px] rotate-[-10deg] text-[120px] md:text-[140px] opacity-20 select-none">
            🏷️
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {['Promoções', ...availableCategories].map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(isActive ? 'Todos' : cat)}
                className={`whitespace-nowrap flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm border ${isActive ? 'bg-[#003B5C] text-white border-[#003B5C]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#003B5C] hover:text-[#003B5C]'}`}
              >
                {cat === 'Promoções' && <Tag className="w-4 h-4" />}
                {cat}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
               <div className="text-slate-400 animate-pulse font-bold">Buscando as melhores opções para você...</div>
            </div>
          ) : activeCategory === 'Promoções' ? (
              // ABA DE PROMOÇÕES
              <div className="flex flex-col gap-8">
                 <h2 className="text-xl font-bold text-slate-800">Promoções em {selectedCity.name}</h2>
                 
                 {Object.keys(promosByStore).length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                      <div className="text-6xl mb-4 text-slate-300">🏷️</div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Poxa, sem promoções agora.</h3>
                      <p className="text-slate-500 max-w-sm">Nenhuma loja está com ofertas ativas na sua cidade no momento. Fique de olho, atualizamos sempre!</p>
                      <button onClick={() => setActiveCategory('Todos')} className="mt-6 bg-green-50 text-green-700 px-6 py-2 rounded-xl font-bold hover:bg-green-100 transition-colors">Ver todas as Lojas</button>
                    </div>
                 ) : (
                    Object.keys(promosByStore).map(marketId => {
                       const market = cityMarkets.find(m => m.id === marketId);
                       if(!market) return null;
                       const products = promosByStore[marketId];
                       
                       return (
                          <div key={market.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                              <div 
                                className="flex items-center justify-between border-b border-slate-100 pb-3 cursor-pointer group"
                                onClick={() => navigate(`/store/${market.id}`)}
                              >
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform overflow-hidden">
                                        {market.img && market.img.startsWith('http') ? (
                                           <img src={market.img} alt={market.name} className="w-full h-full object-cover" />
                                        ) : (
                                           market.img || '🏪'
                                        )}
                                     </div>
                                     <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#003B5C] transition-colors">{market.name}</h3>
                                  </div>
                                  <div className="text-sm text-[#003B5C] font-semibold group-hover:underline">Ver Loja &rarr;</div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {products.map(p => {
                                      const finalPrice = Math.max(0, Number(p.promotionalPrice || p.price) - Number(p.platformDiscount || 0));
                                      
                                      return (
                                          <div key={p.id} className="bg-slate-50 rounded-xl p-4 flex flex-col gap-2 relative border border-transparent hover:border-green-200 transition-colors">
                                              {p.platformDiscount && (
                                                  <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10">App Promo</span>
                                              )}
                                              <span className="font-semibold text-slate-800 text-sm line-clamp-1">{p.name}</span>
                                              <div className="flex flex-col">
                                                 <span className="text-xs text-slate-400 line-through">R$ {Number(p.price).toFixed(2).replace('.', ',')}</span>
                                                 <span className="text-green-600 font-extrabold text-lg">R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
                                              </div>
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                                                className="mt-2 w-full bg-green-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                              >
                                                  Adicionar
                                              </button>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                       )
                    })
                 )}
              </div>
          ) : (
              // ABA DE LOJAS
              <div>
                 <h2 className="text-xl font-bold text-slate-800 mb-6">Lojas Próximas em {selectedCity.name}</h2>
                 {displayMarkets.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                      <div className="text-6xl mb-4">🏪</div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Não encontramos lojas.</h3>
                      <p className="text-slate-500 max-w-sm">Nenhum estabelecimento da categoria "{activeCategory}" atende em {selectedCity.name} no momento.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayMarkets.map(market => {
                        const isClosed = !market.isOpen;
                        return (
                        <div 
                          key={market.id} 
                          onClick={() => navigate(`/store/${market.id}`)}
                          className={`bg-white rounded-2xl p-5 shadow-sm border flex flex-col gap-4 cursor-pointer transition-all group relative overflow-hidden ${isClosed ? 'border-slate-200 opacity-60 grayscale hover:opacity-80 hover:grayscale-[50%]' : 'border-slate-100 hover:shadow-md hover:border-green-200'}`}
                        >
                          {isClosed && (
                             <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full z-10 shadow-sm">
                                Fechado
                             </div>
                          )}
                          <div className="flex gap-4 items-center border-b border-slate-100 pb-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                              {market.img && market.img.startsWith('http') ? (
                                 <img src={market.img} alt={market.name} className="w-full h-full object-cover" />
                              ) : (
                                 market.img || '🏪'
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className={`font-bold text-lg transition-colors ${isClosed ? 'text-slate-500' : 'text-slate-800 group-hover:text-[#003B5C]'}`}>{market.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1 text-yellow-500 font-bold">
                                  <Star className="w-4 h-4 fill-current" /> 
                                  {market.rating ? `${market.rating} (${market.reviewCount})` : <span className="text-slate-400 text-xs font-semibold">Novo</span>}
                                </span>
                                <span>•</span>
                                <span>{market.categories.slice(0,2).join(', ')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg text-slate-500">
                              <Clock className="w-4 h-4" /> {market.deliveryTime} min
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg text-slate-500">
                              <Bike className="w-4 h-4" /> {market.fee === 0 ? <span className="text-green-600 font-bold">Grátis</span> : `R$ ${market.fee.toFixed(2).replace('.', ',')}`}
                            </div>
                            {!isClosed && (
                               <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.5)]"></span>
                                  Aberto
                               </div>
                            )}
                          </div>
                        </div>
                      )})}
                    </div>
                 )}
              </div>
          )}
        </div>

      </main>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
