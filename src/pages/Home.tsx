import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { PRODUCTS, MARKETS } from '../data/mockData';
import { useAppContext } from '../context/AppContext';

export default function StoreView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart } = useAppContext();
  const [activeCategory, setActiveCategory] = useState('Todos');

  const market = MARKETS.find(m => m.id === id) || MARKETS[0];
  
  // Filter products
  const filteredProducts = activeCategory === 'Todos' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  const categories = ['Todos', ...Array.from(new Set(PRODUCTS.map(p => p.category)))];

  return (
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
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${activeCategory === cat ? 'bg-green-600 text-white shadow-sm shadow-green-600/20' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <section className="flex-1 flex flex-col gap-8 min-w-0">
          {/* Hero Banner */}
          <div className="h-[240px] md:h-[200px] bg-gradient-to-br from-green-400 to-green-600 rounded-3xl relative overflow-hidden text-white flex items-center px-8 md:px-10 shadow-lg shadow-green-500/20">
            <div className="relative z-10 max-w-sm">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
                Ofertas de Verão<br />Até 40% OFF
              </h1>
              <p className="text-sm md:text-base opacity-90 font-medium">
                Produtos frescos direto do produtor para sua mesa.
              </p>
            </div>
            <div className="absolute right-[-40px] bottom-[-40px] w[280px] h-[280px] md:w-[320px] md:h-[320px] bg-white/10 rounded-full flex items-center justify-center text-[100px] md:text-[120px] select-none rotate-[-15deg]">
              🥗
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-800">
                {activeCategory === 'Todos' ? 'Mais Vendidos' : activeCategory}
              </h2>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 group hover:shadow-md hover:border-green-100 transition-all duration-300">
                  <div className="h-[140px] bg-slate-50 rounded-xl flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300 group-hover:bg-green-50/50 select-none">
                    {product.img}
                  </div>
                  <div className="flex flex-col mt-1">
                    <h3 className="text-[15px] font-semibold text-slate-800 mb-0.5 group-hover:text-green-600 transition-colors line-clamp-1">{product.name}</h3>
                    <span className="text-xs font-medium text-slate-400">{product.unit}</span>
                  </div>
                  <div className="flex justify-between items-center mt-auto pt-2">
                    <div className="text-lg font-extrabold text-slate-800">R$ {product.price.toFixed(2).replace('.', ',')}</div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-green-600 text-slate-600 hover:text-white border-0 text-xl font-bold cursor-pointer flex items-center justify-center transition-all active:scale-95 hover:shadow-md hover:shadow-green-600/30"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-x-8 gap-y-4 text-sm font-medium">
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              Entrega em {market.deliveryTime} min
            </div>
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              Taxa: R$ {market.fee.toFixed(2).replace('.', ',')}
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
  );
}
