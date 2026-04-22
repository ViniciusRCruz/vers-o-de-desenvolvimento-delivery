import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAppContext } from '../context/AppContext';
import { ShieldCheck, Store, MapPin, UserPlus, PackagePlus, Trash2, X } from 'lucide-react';

import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, arrayUnion, deleteDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const { isLoggedIn, isSystemAdmin, adminMarkets, currentUser, updateAdminMarkets } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'markets' | 'products' | 'system'>('markets');
  
  // Market Form State
  const [isAddingMarket, setIsAddingMarket] = useState(false);
  const [newMarket, setNewMarket] = useState({ name: '', cityId: 'São Paulo, SP', img: '🏪', deliveryTime: 45, fee: 0, categories: [] as string[] });

  // Admin Management Modal State
  const [managingAdminsFor, setManagingAdminsFor] = useState<any | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Use MARKET_CATEGORIES from HomeList or declare here.
  const MARKET_CATEGORIES = ['Mercado', 'Hortifruti', 'Carnes', 'Bebidas', 'Padaria', 'Limpeza', 'Pet Shop', 'Farmácia', 'Conveniência'];

  const toggleCategory = (cat: string) => {
     setNewMarket(prev => {
        if(prev.categories.includes(cat)) {
           return {...prev, categories: prev.categories.filter(c => c !== cat)}
        } else {
           return {...prev, categories: [...prev.categories, cat]}
        }
     });
  };

  // Product Form State
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, oldPrice: 0, unit: 'unidade', description: '', category: 'Alimentos', image: 'https://picsum.photos/seed/fruit/200/200' });

  // Update selected store to be always the first one when markets load
  useEffect(() => {
    if(adminMarkets.length > 0 && !selectedMarketId) {
      setSelectedMarketId(adminMarkets[0].id);
    }
  }, [adminMarkets]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedMarketId || !currentUser) return;
    
    try {
       const productId = `prod_${Date.now()}`;
       const docRef = doc(db, 'products', productId);
       const prodStruct = {
          name: newProduct.name,
          price: newProduct.price,
          oldPrice: newProduct.oldPrice || null,
          unit: newProduct.unit,
          description: newProduct.description,
          category: newProduct.category,
          image: newProduct.image,
          marketId: selectedMarketId,
          isActive: true,
          createdAt: serverTimestamp()
       };
       await setDoc(docRef, prodStruct);
       alert(`Produto [${newProduct.name}] salvo no banco!`);
       setIsAddingProduct(false);
       setNewProduct({ name: '', price: 0, oldPrice: 0, unit: 'unidade', description: '', category: 'Alimentos', image: 'https://picsum.photos/seed/fruit/200/200' });
    } catch(err) {
       console.error("Failed creating product", err);
       alert("Erro ao salvar produto.");
    }
  }

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!isSystemAdmin || !currentUser) return;
    
    try {
       const marketId = `mkt_${Date.now()}`;
       const docRef = doc(db, 'markets', marketId);
       const marketStruct = {
          name: newMarket.name,
          cityId: newMarket.cityId,
          img: newMarket.img,
          deliveryTime: newMarket.deliveryTime,
          fee: newMarket.fee,
          rating: 5.0,
          categories: newMarket.categories.length > 0 ? newMarket.categories : ['Mercado'], // Fallback se não marcar nada
          isActive: true,
          adminEmails: [currentUser.email],
          createdAt: serverTimestamp()
       };
       await setDoc(docRef, marketStruct);
       // Refresh via context or local state
       if(updateAdminMarkets) {
         updateAdminMarkets([...adminMarkets, { id: marketId, ...marketStruct }]);
       }
       setIsAddingMarket(false);
       setNewMarket({ name: '', cityId: 'São Paulo, SP', img: '🏪', deliveryTime: 45, fee: 0, categories: [] });
    } catch(err) {
       console.error("Failed creating market", err);
       alert("Erro de permissão ou rede ao criar mercado.");
    }
  }

  const handleDeleteMarket = async (marketId: string) => {
     if(!isSystemAdmin) return;
     if(window.confirm('Tem certeza que deseja excluir esta loja? Esta ação não pode ser desfeita.')) {
        try {
           await deleteDoc(doc(db, 'markets', marketId));
           if(updateAdminMarkets) {
              updateAdminMarkets(adminMarkets.filter(m => m.id !== marketId));
           }
        } catch(err) {
           console.error(err);
           alert("Erro ao excluir loja.");
        }
     }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!managingAdminsFor || !newAdminEmail) return;
     try {
         await setDoc(doc(db, 'markets', managingAdminsFor.id), { adminEmails: arrayUnion(newAdminEmail) }, { merge: true });
         alert(`Parceiro ${newAdminEmail} adicionado com sucesso!`);
         
         const updatedMarket = {...managingAdminsFor, adminEmails: [...(managingAdminsFor.adminEmails||[]), newAdminEmail]};
         
         if(updateAdminMarkets) {
             const newAdminMarkets = adminMarkets.map(m => m.id === managingAdminsFor.id ? updatedMarket : m);
             updateAdminMarkets(newAdminMarkets);
         }
         
         setManagingAdminsFor(updatedMarket);
         setNewAdminEmail('');
     } catch(err) {
         console.error(err);
         alert("Erro ao adicionar parceiro.");
     }
  };

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
                 <div className="flex justify-between items-center flex-wrap gap-4">
                    <h2 className="text-xl font-bold text-slate-800">Lojas Gerenciadas ({adminMarkets.length})</h2>
                    {isSystemAdmin && (
                       <button 
                         onClick={() => setIsAddingMarket(!isAddingMarket)}
                         className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                       >
                          <Store className="w-4 h-4" /> {isAddingMarket ? 'Cancelar' : 'Nova Loja'}
                       </button>
                    )}
                 </div>

                 {isAddingMarket && isSystemAdmin && (
                    <form onSubmit={handleCreateMarket} className="bg-white border text-left border-green-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                       <h3 className="font-bold text-green-800">Cadastrar Novo Estabelecimento</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input type="text" placeholder="Nome da Loja" required className="border p-3 rounded-lg outline-none focus:border-green-500" value={newMarket.name} onChange={e => setNewMarket({...newMarket, name: e.target.value})} />
                          <select className="border p-3 rounded-lg outline-none focus:border-green-500" value={newMarket.cityId} onChange={e => setNewMarket({...newMarket, cityId: e.target.value})}>
                            {['São Paulo, SP', 'Cascavel, PR'].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <div className="flex gap-4">
                            <input type="number" placeholder="Tempo Médio (min)" required className="border p-3 rounded-lg outline-none focus:border-green-500 flex-1" value={newMarket.deliveryTime || ''} onChange={e => setNewMarket({...newMarket, deliveryTime: Number(e.target.value)})} />
                            <input type="number" step="0.01" placeholder="Taxa (0 = Grátis)" required className="border p-3 rounded-lg outline-none focus:border-green-500 flex-1" value={newMarket.fee || ''} onChange={e => setNewMarket({...newMarket, fee: Number(e.target.value)})} />
                          </div>
                          <div className="md:col-span-2 flex flex-col gap-2">
                             <span className="text-sm font-semibold text-slate-700">Selecione as Categorias:</span>
                             <div className="flex flex-wrap gap-2">
                               {MARKET_CATEGORIES.map(cat => (
                                 <button
                                   key={cat}
                                   type="button"
                                   onClick={() => toggleCategory(cat)}
                                   className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                                     newMarket.categories.includes(cat) ? 'bg-green-100 text-green-700 border-green-300' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-green-200'
                                   }`}
                                 >
                                   {cat}
                                 </button>
                               ))}
                             </div>
                          </div>
                       </div>
                       <button type="submit" className="bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">Salvar Loja</button>
                    </form>
                 )}
                 
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
                          <div className="flex justify-between items-center mt-2 pt-4 border-t border-slate-50">
                             <div className="flex gap-2">
                               <span className="text-xs font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">Ativo</span>
                               {isSystemAdmin && (
                                  <button onClick={() => handleDeleteMarket(market.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-md border border-red-100 transition-colors" title="Excluir Loja">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               )}
                             </div>
                             <button onClick={() => setManagingAdminsFor(market)} className="text-sm font-bold text-slate-600 hover:text-green-600 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Admins <UserPlus className="w-4 h-4"/></button>
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
                       <select 
                         className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none w-full sm:w-48 text-slate-700 shadow-sm focus:border-green-500"
                         value={selectedMarketId}
                         onChange={e => setSelectedMarketId(e.target.value)}
                       >
                          <option value="" disabled>Selecione a loja...</option>
                          {adminMarkets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </select>
                       <button onClick={() => setIsAddingProduct(!isAddingProduct)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2 whitespace-nowrap">
                          <PackagePlus className="w-4 h-4" /> {isAddingProduct ? 'Cancelar' : 'Novo Produto'}
                       </button>
                    </div>
                 </div>

                 {isAddingProduct && (
                    <form onSubmit={handleCreateProduct} className="bg-white border text-left border-green-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                       <h3 className="font-bold text-green-800">Cadastrar Produto para {adminMarkets.find(m => m.id === selectedMarketId)?.name}</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input type="text" placeholder="URL da Imagem (Opcional)" className="border p-3 rounded-lg outline-none focus:border-green-500" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
                          <input type="text" placeholder="Nome do Produto" required className="border p-3 rounded-lg outline-none focus:border-green-500" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                          <div className="flex gap-4">
                            <input type="number" step="0.01" placeholder="Preço Atual" required className="border p-3 rounded-lg outline-none focus:border-green-500 flex-1" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                            <input type="number" step="0.01" placeholder="Preço Antigo (Opcional)" className="border p-3 rounded-lg outline-none focus:border-green-500 flex-1" value={newProduct.oldPrice || ''} onChange={e => setNewProduct({...newProduct, oldPrice: Number(e.target.value)})} />
                          </div>
                          <div className="flex gap-4">
                             <input type="text" placeholder="Unidade (ex: kg, unidade)" required className="border p-3 rounded-lg outline-none focus:border-green-500 flex-1" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} />
                             <input type="text" placeholder="Categoria (ex: Bebidas)" required className="border p-3 rounded-lg outline-none focus:border-green-500 flex-1" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
                          </div>
                          <input type="text" placeholder="Breve descritivo do produto" className="border p-3 rounded-lg outline-none focus:border-green-500 md:col-span-2" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                       </div>
                       <button type="submit" disabled={!selectedMarketId} className="bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50">Adicionar ao Catálogo</button>
                    </form>
                 )}

                 <div className="bg-white border border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                     <p className="text-slate-500 max-w-sm mb-4">A lista de produtos dinâmicos da loja {adminMarkets.find(m => m.id === selectedMarketId)?.name || 'selecionada'} será renderizada aqui sob o banco de dados.</p>
                     <p className="text-sm font-semibold text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-100">Criação de novos itens habilitada na nuvem.</p>
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

        {/* Manage Admins Modal */}
        {managingAdminsFor && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                 <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Administradores da Loja</h3>
                    <button onClick={() => setManagingAdminsFor(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="p-6 flex flex-col gap-6">
                    <div>
                       <p className="text-sm text-slate-500 mb-2">Loja: <strong>{managingAdminsFor.name}</strong></p>
                       <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                          {managingAdminsFor.adminEmails && managingAdminsFor.adminEmails.length > 0 ? (
                             managingAdminsFor.adminEmails.map((email: string) => (
                                <div key={email} className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-sm text-slate-700 flex items-center gap-2">
                                   <ShieldCheck className="w-4 h-4 text-green-600"/> {email}
                                </div>
                             ))
                          ) : (
                             <p className="text-sm text-slate-400 italic">Nenhum administrador adicional.</p>
                          )}
                       </div>
                    </div>
                    <form onSubmit={handleAddAdmin} className="flex flex-col gap-3">
                       <label className="text-sm font-semibold text-slate-700">Adicionar novo parceiro</label>
                       <div className="flex gap-2">
                          <input type="email" placeholder="E-mail do lojista" required className="flex-1 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-green-500 text-sm" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
                          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors">Adicionar</button>
                       </div>
                    </form>
                 </div>
              </div>
           </div>
        )}

      </main>
    </div>
  );
}
