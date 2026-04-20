import React from 'react';
import Header from '../components/Header';
import { MARKETS } from '../data/mockData';
import { Star, Clock, Bike, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function HomeList() {
  const navigate = useNavigate();
  const { selectedCity } = useAppContext();
  
  const cityMarkets = MARKETS.filter(m => m.cityId === selectedCity.id);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col gap-10">
        
        {/* Banner */}
        <div className="h-[180px] md:h-[220px] bg-gradient-to-r from-orange-400 to-red-500 rounded-3xl relative overflow-hidden text-white flex items-center px-8 md:px-12 shadow-lg hover:scale-[1.01] transition-transform cursor-pointer">
          <div className="relative z-10">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">Promoção</span>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">Mercados com<br/>Frete Grátis</h1>
            <p className="opacity-90 max-w-xs text-sm">Aproveite para reabastecer a despensa com economia em {selectedCity.name.split(',')[0]}.</p>
          </div>
          <div className="absolute right-0 bottom-[-20px] rotate-[-10deg] text-[120px] md:text-[140px] opacity-20 select-none">
            🛍️
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {['Todos', 'Hortifruti', 'Carnes', 'Bebidas', 'Padaria', 'Limpeza', 'Pet Shop'].map((cat, i) => (
            <button key={i} className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm border ${i === 0 ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200 hover:border-green-300 hover:text-green-600'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Markets List */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-6">Lojas Próximas em {selectedCity.name}</h2>
          
          {cityMarkets.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Poxa, ainda não chegamos aqui!</h3>
              <p className="text-slate-500 max-w-sm">No momento não temos mercados cadastrados em {selectedCity.name}. Expanda nossa área em breve!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cityMarkets.map(market => (
                <div 
                  key={market.id} 
                  onClick={() => navigate(`/store/${market.id}`)}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4 cursor-pointer hover:shadow-md hover:border-green-200 transition-all group"
                >
                  <div className="flex gap-4 items-center border-b border-slate-100 pb-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-105 transition-transform">
                      {market.img}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-green-600 transition-colors">{market.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1 text-yellow-500 font-bold"><Star className="w-4 h-4 fill-current" /> {market.rating}</span>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
