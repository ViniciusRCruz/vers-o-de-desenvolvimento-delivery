import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, X, Minus, Plus } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function StoreView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart } = useAppContext();
  const [activeCategory, setActiveCategory] = useState('Todos');
  
  const [market, setMarket] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalObs, setModalObs] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
         // Fetch Market
         const { data: marketData, error: marketError } = await supabase.from('markets').select('*').eq('id', id).single();
         if (marketError) throw marketError;
         
         const mappedMarket = {
            ...marketData,
            img: marketData.img || '🏪',
            rating: marketData.rating || 5.0,
            deliveryTime: marketData.deliveryTime || 45,
            fee: marketData.fee || 0,
         };
         setMarket(mappedMarket);

         // Fetch Products
         const { data: productsData, error: productsError } = await supabase.from('products').select('*').eq('marketId', id).eq('isActive', true);
         if (productsError) throw productsError;
         
         setProducts(productsData || []);
      } catch (err) {
         console.error(err);
      } finally {
         setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
         <div className="text-slate-400 font-bold animate-pulse">Carregando loja e produtos...</div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center font-sans">
         <div className="text-4xl mb-4">🏪</div>
         <h2 className="text-2xl font-bold text-slate-800 mb-4">Loja não encontrada</h2>
         <button onClick={() => navigate('/')} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold">Voltar</button>
      </div>
    );
  }

  const storeClosed = !market.isOpen;

  // Filter products
  const filteredProducts = activeCategory === 'Todos' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <>
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col md:flex-row gap-8 w-full">
        {/* Sidebar */}
        <aside className="w-full md:w-56 shrink-0 flex flex-col gap-2">
          
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-medium w-fit mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2 font-bold px-4">
            Categorias ({market.name})
          </div>
          
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {categories.map((cat, i) => (
              <button 
                key={i}
                onClick={() => setActiveCategory(cat as string)}
                className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${activeCategory === cat ? 'bg-green-600 text-white shadow-sm shadow-green-600/20' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                {cat as string}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <section className="flex-1 flex flex-col gap-8 min-w-0">
          {/* Hero Banner */}
          <div className={`h-[240px] md:h-[200px] rounded-3xl relative overflow-hidden text-white flex items-center px-8 md:px-10 shadow-lg ${storeClosed ? 'bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-500/20' : 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/20'}`}>
            <div className="relative z-10 max-w-sm">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
                {market.name}
              </h1>
              <p className="text-sm md:text-base opacity-90 font-medium">
                {storeClosed ? 'Esta loja está fechada no momento.' : 'Os melhores produtos entregues na sua porta.'}
              </p>
            </div>
            <div className="absolute right-[-40px] bottom-[-40px] w[280px] h-[280px] md:w-[320px] md:h-[320px] bg-white/10 rounded-full flex items-center justify-center text-[100px] md:text-[120px] select-none rotate-[-15deg]">
              {market.img}
            </div>
          </div>

          {storeClosed && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
               <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl shrink-0">🔒</div>
               <div>
                  <p className="font-bold text-red-800 text-sm">Loja Fechada</p>
                  <p className="text-xs text-red-600">Este estabelecimento não está aceitando pedidos agora. Volte mais tarde!</p>
               </div>
            </div>
          )}

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-800">
                {activeCategory === 'Todos' ? 'Catálogo Completo' : activeCategory}
              </h2>
            </div>

            {/* Product Grid */}
            {products.length === 0 ? (
               <div className="bg-white p-10 rounded-2xl text-center text-slate-500 border border-slate-100 shadow-sm">
                  Esta loja ainda não possui produtos cadastrados.
               </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredProducts.map(product => (
                    <div key={product.id} onClick={() => { if(!storeClosed) { setSelectedProduct(product); setModalQty(1); setModalObs(''); } }} className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 group hover:shadow-md hover:border-green-100 transition-all duration-300 ${storeClosed ? '' : 'cursor-pointer'}`}>
                      <div className="h-[140px] bg-slate-50 rounded-xl flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300 group-hover:bg-green-50/50 select-none overflow-hidden relative">
                        {product.image && product.image.startsWith('http') ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl">🛍️</span>
                        )}
                      </div>
                      <div className="flex flex-col mt-1">
                        <h3 className="text-[15px] font-semibold text-slate-800 mb-0.5 group-hover:text-green-600 transition-colors line-clamp-1">{product.name}</h3>
                        <span className="text-xs font-medium text-slate-400">{product.unit || 'unidade'}</span>
                      </div>
                      <div className="flex justify-between items-center mt-auto pt-2">
                        <div className="text-lg font-extrabold text-slate-800">R$ {Number(product.price).toFixed(2).replace('.', ',')}</div>
                        <button 
                          onClick={() => { if (!storeClosed) addToCart(product); }}
                          disabled={storeClosed}
                          title={storeClosed ? 'Loja fechada' : 'Adicionar ao carrinho'}
                          className={`w-9 h-9 rounded-xl border-0 text-xl font-bold flex items-center justify-center transition-all ${storeClosed ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-100 hover:bg-green-600 text-slate-600 hover:text-white cursor-pointer active:scale-95 hover:shadow-md hover:shadow-green-600/30'}`}
                        >
                          {storeClosed ? '🔒' : '+'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-x-8 gap-y-4 text-sm font-medium">
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              Entrega em {market.deliveryTime} min
            </div>
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              Taxa: R$ {market.fee === 0 ? 'Grátis' : Number(market.fee).toFixed(2).replace('.', ',')}
            </div>
          </div>
        </section>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>

    {/* Product Detail Modal */}
    {selectedProduct && !storeClosed && (
       <div className="fixed inset-0 bg-black/60 z-[60] flex items-end md:items-center justify-center" onClick={() => setSelectedProduct(null)}>
          <div 
            className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
             {/* Image */}
             <div className="relative h-[200px] md:h-[240px] bg-slate-100 rounded-t-3xl md:rounded-t-3xl overflow-hidden">
                {selectedProduct.image && selectedProduct.image.startsWith('http') ? (
                   <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-6xl bg-slate-50">🛍️</div>
                )}
                <button 
                   onClick={() => setSelectedProduct(null)} 
                   className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-colors"
                >
                   <X className="w-5 h-5 text-slate-700" />
                </button>
             </div>

             {/* Content */}
             <div className="p-6 flex flex-col gap-5">
                <div>
                   <span className="text-[10px] uppercase font-bold text-green-600 tracking-wider">{selectedProduct.category}</span>
                   <h2 className="text-xl font-extrabold text-slate-800 mt-1">{selectedProduct.name}</h2>
                   {selectedProduct.description && (
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{selectedProduct.description}</p>
                   )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                   {(selectedProduct.promotionalPrice || selectedProduct.platformDiscount) ? (
                      <>
                         <span className="text-sm text-slate-400 line-through">R$ {Number(selectedProduct.price).toFixed(2).replace('.', ',')}</span>
                         <span className="text-2xl font-extrabold text-green-600">
                            R$ {Math.max(0, Number(selectedProduct.promotionalPrice || selectedProduct.price) - Number(selectedProduct.platformDiscount || 0)).toFixed(2).replace('.', ',')}
                         </span>
                      </>
                   ) : (
                      <span className="text-2xl font-extrabold text-slate-800">R$ {Number(selectedProduct.price).toFixed(2).replace('.', ',')}</span>
                   )}
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4">
                   <span className="text-sm font-bold text-slate-700">Quantidade</span>
                   <div className="flex items-center gap-4">
                      <button 
                         onClick={() => setModalQty(Math.max(1, modalQty - 1))} 
                         className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-green-500 hover:text-green-600 transition-colors shadow-sm"
                      >
                         <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xl font-extrabold text-slate-800 w-8 text-center">{modalQty}</span>
                      <button 
                         onClick={() => setModalQty(modalQty + 1)} 
                         className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors shadow-sm"
                      >
                         <Plus className="w-4 h-4" />
                      </button>
                   </div>
                </div>

                {/* Observation Field */}
                <div className="flex flex-col gap-2">
                   <label className="text-sm font-bold text-slate-700">Alguma observação?</label>
                   <textarea 
                      placeholder="Ex: Sem cebola, ponto da carne mal passado, trocar por integral..."
                      className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm text-slate-600 resize-none h-20 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      value={modalObs}
                      onChange={e => setModalObs(e.target.value)}
                      maxLength={200}
                   />
                   <span className="text-[10px] text-slate-400 text-right">{modalObs.length}/200</span>
                </div>

                {/* Add to Cart Button */}
                <button 
                   onClick={() => {
                      addToCart(selectedProduct, modalQty, modalObs.trim() || undefined);
                      setSelectedProduct(null);
                   }}
                   className="w-full bg-green-600 text-white py-4 rounded-2xl font-extrabold text-base hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-3"
                >
                   Adicionar R$ {(
                      Math.max(0, Number(selectedProduct.promotionalPrice || selectedProduct.price) - Number(selectedProduct.platformDiscount || 0)) * modalQty
                   ).toFixed(2).replace('.', ',')}
                </button>
             </div>
          </div>
       </div>
    )}
    </div>
    </>
  );
}
