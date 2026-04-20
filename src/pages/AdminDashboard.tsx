import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAppContext } from '../context/AppContext';
import { ShieldCheck, Store, MapPin, Search, ArrowRight, UserPlus, PackagePlus } from 'lucide-react';

export default function AdminDashboard() {
  const { isLoggedIn, isSystemAdmin, adminMarkets, currentUser } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'markets' | 'products' | 'system'>('markets');

  useEffect(() => {
    // Immediate redirect if explicitly unauthorized (fully initialized but lacking permissions)
    if (isLoggedIn && !isSystemAdmin && adminMarkets.length === 0) {
      navigate('/');
    }
  }, [isLoggedIn, isSystemAdmin, adminMarkets, navigate]);

  if (!isLoggedIn) {
     return (
       <div className="min-h-screen bg-slate-50 flex flex-col font-sans items-center justify-center">
          <h2 className="text-2xl font-bold">Faça login para acessar o painel</h2>
          <button onClick={() => navigate('/auth')} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-bold">Ir para Login</button>
       </div>
     )
  }

  // Double-check prevention mechanism from rendering anything during the redirect frame
  if (!isSystemAdmin && adminMarkets.length === 0) {
      return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
        
        {/* Banner */}
        <div className="bg-slate-800 rounded-3xl p-8 md:p-10 text-white flex justify-between items-center shadow-lg">
           <div>
              <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block border border-green-500/30">
                {isSystemAdmin ? 'MASTER ADMIN' : 'LOJISTA'}
              </span>
              <h1 className="text-3xl font-extrabold flex items-center gap-3">Painel de Gestão</h1>
              <p className="text-slate-400 mt-2 text-sm">{currentUser?.email}</p>
           </div>
           <div className="hidden md:flex text-6xl opacity-80">
              🛠️
           </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-px">
          <button 
             onClick={() => setActiveTab('markets')}
             className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'markets' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
             Meus Estabelecimentos
          </button>
          <button 
             onClick={() => setActiveTab('products')}
             className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'products' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
             Catálogo de Produtos
          </button>
          {isSystemAdmin && (
             <button 
                onClick={() => setActiveTab('system')}
                className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'system' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
             >
                Gestão Master
             </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="flex flex-col gap-6">
           {activeTab === 'markets' && (
              <div className="flex flex-col gap-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Lojas Gerenciadas ({adminMarkets.length})</h2>
                    {isSystemAdmin && (
                       <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2">
                          <Store className="w-4 h-4" /> Nova Loja
                       </button>
                    )}
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminMarkets.map(market => (
                       <div key={market.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 relative group">
                          <div className="flex gap-4 items-center border-b border-slate-100 pb-4">
                             <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-3xl">
                               {market.img}
                             </div>
                             <div>
                                <h3 className="font-bold text-lg text-slate-800">{market.name}</h3>
                                <div className="text-sm text-slate-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> {market.cityId}</div>
                             </div>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">Ativo</span>
                             <button className="text-sm font-bold text-slate-600 hover:text-green-600 flex items-center gap-1">Admins <UserPlus className="w-4 h-4"/></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {activeTab === 'products' && (
              <div className="flex flex-col gap-6">
                 <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                    <h2 className="text-xl font-bold text-slate-800">Manutenção de Produtos</h2>
                    <div className="flex gap-3 w-full sm:w-auto">
                       <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none w-full sm:w-48 text-slate-700 shadow-sm focus:border-green-500">
                          {adminMarkets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </select>
                       <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2 whitespace-nowrap">
                          <PackagePlus className="w-4 h-4" /> Novo Produto
                       </button>
                    </div>
                 </div>
                 <div className="bg-white border border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                     <p className="text-slate-500 max-w-sm mb-4">Selecione uma loja e gerencie seu catálogo adicionando, alterando categorias e editando valores.</p>
                     <p className="text-sm font-semibold text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-100">Área pronta para conexão Firebase Cloud.</p>
                 </div>
              </div>
           )}

           {activeTab === 'system' && isSystemAdmin && (
              <div className="flex flex-col gap-6">
                 <h2 className="text-xl font-bold text-slate-800">Definições Master</h2>
                 <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-2"><ShieldCheck className="w-5 h-5"/> Administradores Globais</h3>
                    <p className="text-sm text-amber-700 mb-6">Usuários listados aqui tem permissão para deletar lojas, alterar catálogos e cadastrar novos parceiros logísticos.</p>
                    
                    <div className="flex gap-3 max-w-md">
                       <input type="email" placeholder="Email do novo admin..." className="flex-1 border border-amber-300 bg-white rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-500" />
                       <button className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors">Conceder</button>
                    </div>
                 </div>
              </div>
           )}
        </div>

      </main>
    </div>
  );
}
