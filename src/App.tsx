/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, MapPin, User, ShoppingCart, Home, Apple, Beef, Milk, Croissant, CupSoda, Droplets, ArrowRight } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white px-6 md:px-10 h-20 flex items-center justify-between border-b border-slate-200 z-10 sticky top-0">
        <div className="text-2xl font-extrabold text-green-600 tracking-tight">
          FRESHMERCADO
        </div>
        
        <div className="hidden md:flex relative w-full max-w-md mx-6">
          <input 
            type="text" 
            placeholder="Buscar produtos, marcas e mais..." 
            className="w-full bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-5 rounded-full text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex gap-4 md:gap-6 items-center">
          <button className="hidden md:flex relative items-center gap-2 font-semibold text-sm text-slate-700 hover:text-green-600 transition-colors">
            <span className="text-lg">📍</span> São Paulo, SP
          </button>
          <button className="relative flex items-center gap-2 font-semibold text-sm text-slate-700 hover:text-green-600 transition-colors">
            <span className="text-lg">👤</span> <span className="hidden md:inline">Perfil</span>
          </button>
          <button className="relative flex items-center gap-2 font-semibold text-sm text-slate-700 hover:text-green-600 transition-colors">
            <span className="text-lg">🛒</span> <span className="hidden md:inline">Carrinho</span>
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full absolute -top-2 -left-1 md:left-3 shadow-sm border-2 border-white">
              3
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col md:flex-row gap-8 w-full">
        {/* Sidebar */}
        <aside className="w-full md:w-56 shrink-0 flex flex-col gap-2">
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2 font-bold px-4">
            Categorias
          </div>
          
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button className="whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium bg-green-600 text-white shadow-sm shadow-green-600/20 transition-all">
              <span>🏠</span> Início
            </button>
            <button className="whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-600 hover:bg-slate-200 transition-colors">
              <span>🍎</span> Hortifruti
            </button>
            <button className="whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-600 hover:bg-slate-200 transition-colors">
              <span>🥩</span> Açougue
            </button>
            <button className="whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-600 hover:bg-slate-200 transition-colors">
              <span>🥛</span> Laticínios
            </button>
            <button className="whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-600 hover:bg-slate-200 transition-colors">
              <span>🍞</span> Padaria
            </button>
            <button className="whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-600 hover:bg-slate-200 transition-colors">
              <span>🥤</span> Bebidas
            </button>
            <button className="whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-600 hover:bg-slate-200 transition-colors">
              <span>🧼</span> Limpeza
            </button>
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
              <h2 className="text-xl font-bold tracking-tight text-slate-800">Mais Vendidos</h2>
              <button className="text-green-600 font-semibold text-sm hover:text-green-700 transition-colors flex items-center gap-1">
                Ver tudo <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 group hover:shadow-md hover:border-green-100 transition-all duration-300">
                <div className="h-[140px] bg-slate-50 rounded-xl flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300 group-hover:bg-green-50/50">
                  🍌
                </div>
                <div className="flex flex-col mt-1">
                  <h3 className="text-[15px] font-semibold text-slate-800 mb-0.5 group-hover:text-green-600 transition-colors">Banana Nanica</h3>
                  <span className="text-xs font-medium text-slate-400">kg • Orgânico</span>
                </div>
                <div className="flex justify-between items-center mt-auto pt-2">
                  <div className="text-lg font-extrabold text-slate-800">R$ 5,90</div>
                  <button className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-green-600 text-slate-600 hover:text-white border-0 text-xl font-bold cursor-pointer flex items-center justify-center transition-colors active:scale-95">
                    +
                  </button>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 group hover:shadow-md hover:border-green-100 transition-all duration-300">
                <div className="h-[140px] bg-slate-50 rounded-xl flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300 group-hover:bg-green-50/50">
                  🥛
                </div>
                <div className="flex flex-col mt-1">
                  <h3 className="text-[15px] font-semibold text-slate-800 mb-0.5 group-hover:text-green-600 transition-colors">Leite Integral</h3>
                  <span className="text-xs font-medium text-slate-400">1L • Fazenda Sul</span>
                </div>
                <div className="flex justify-between items-center mt-auto pt-2">
                  <div className="text-lg font-extrabold text-slate-800">R$ 4,50</div>
                  <button className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-green-600 text-slate-600 hover:text-white border-0 text-xl font-bold cursor-pointer flex items-center justify-center transition-colors active:scale-95">
                    +
                  </button>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 group hover:shadow-md hover:border-green-100 transition-all duration-300">
                <div className="h-[140px] bg-slate-50 rounded-xl flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300 group-hover:bg-green-50/50">
                  🍞
                </div>
                <div className="flex flex-col mt-1">
                  <h3 className="text-[15px] font-semibold text-slate-800 mb-0.5 group-hover:text-green-600 transition-colors">Pão Artesanal</h3>
                  <span className="text-xs font-medium text-slate-400">500g • Integral</span>
                </div>
                <div className="flex justify-between items-center mt-auto pt-2">
                  <div className="text-lg font-extrabold text-slate-800">R$ 12,90</div>
                  <button className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-green-600 text-slate-600 hover:text-white border-0 text-xl font-bold cursor-pointer flex items-center justify-center transition-colors active:scale-95">
                    +
                  </button>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 group hover:shadow-md hover:border-green-100 transition-all duration-300">
                <div className="h-[140px] bg-slate-50 rounded-xl flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300 group-hover:bg-green-50/50">
                  🥩
                </div>
                <div className="flex flex-col mt-1">
                  <h3 className="text-[15px] font-semibold text-slate-800 mb-0.5 group-hover:text-green-600 transition-colors">Patinho Moído</h3>
                  <span className="text-xs font-medium text-slate-400">500g • Resfriado</span>
                </div>
                <div className="flex justify-between items-center mt-auto pt-2">
                  <div className="text-lg font-extrabold text-slate-800">R$ 24,90</div>
                  <button className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-green-600 text-slate-600 hover:text-white border-0 text-xl font-bold cursor-pointer flex items-center justify-center transition-colors active:scale-95">
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-x-8 gap-y-4 text-sm font-medium">
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              Entrega Grátis acima de R$ 150
            </div>
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              Tempo médio: 45 min
            </div>
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              1.2k Pedidos hoje
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
