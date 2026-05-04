import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAppContext } from '../context/AppContext';
import { ShieldCheck, Store, MapPin, UserPlus, PackagePlus, Trash2, X, Check, MessageCircle, Send, ImagePlus, Link2, Pencil, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const { isLoggedIn, isSystemAdmin, adminMarkets, currentUser, updateAdminMarkets, isAdminDataLoaded } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'markets' | 'products' | 'orders' | 'system'>('markets');
  
  // Market Form State
  const [isAddingMarket, setIsAddingMarket] = useState(false);
  const MARKET_CATEGORIES = ['Mercado', 'Hortifruti', 'Carnes', 'Bebidas', 'Padaria', 'Limpeza', 'Pet Shop', 'Farmácia', 'Conveniência'];
  const PREDEFINED_CITIES = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR', 'Campinas, SP']; // Edite aqui com as cidades reais
  
  const [newMarket, setNewMarket] = useState({ name: '', cityId: PREDEFINED_CITIES[0], deliveryTime: 45, fee: 4, categories: [] as string[], description: '', address: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingImage, setIsUpdatingImage] = useState<string | null>(null);
  const [managingAdminsFor, setManagingAdminsFor] = useState<any | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Product Form State
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', category: '', newCategory: '', image: '' });
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImageMode, setProductImageMode] = useState<'url' | 'file'>('file');
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [productImagePreview, setProductImagePreview] = useState<string>('');
  
  // Product Edit State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editProductImageFile, setEditProductImageFile] = useState<File | null>(null);
  const [editProductImagePreview, setEditProductImagePreview] = useState<string>('');
  const [editIsCreatingCategory, setEditIsCreatingCategory] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Orders State
  const [storeOrders, setStoreOrders] = useState<any[]>([]);
  const [activeChatOrder, setActiveChatOrder] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeChatOrder) {
      scrollToBottom();
    }
  }, [activeChatOrder?.chat, activeChatOrder?.id]);

  useEffect(() => {
    // Inicializa o som de notificação
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  useEffect(() => {
    if(adminMarkets.length > 0 && !selectedMarketId) {
      setSelectedMarketId(adminMarkets[0].id);
    }
  }, [adminMarkets]);

  // Fetch store data and listen to orders
  useEffect(() => {
    if (!selectedMarketId) return;
    
    const fetchStoreData = async () => {
       const { data: prods } = await supabase.from('products').select('*').eq('marketId', selectedMarketId);
       if (prods) {
          setStoreProducts(prods);
          const uniqueCats = Array.from(new Set(prods.map((d: any) => d.category).filter(Boolean)));
          setExistingCategories(uniqueCats as string[]);
       }
       
       const { data: ords } = await supabase.from('orders').select('*').eq('marketId', selectedMarketId).order('created_at', { ascending: false });
       if (ords) {
          setStoreOrders(ords);
       }
    };
    fetchStoreData();

    // Inscrever-se para novos pedidos em tempo real (Notificação Sonora)
    const channel = supabase.channel(`admin_orders_${selectedMarketId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `marketId=eq.${selectedMarketId}` }, (payload) => {
         if (payload.eventType === 'INSERT') {
             // Toca o som de notificação
             if (audioRef.current) {
                 audioRef.current.play().catch(e => console.log('Autoplay blocked:', e));
             }
             setStoreOrders(prev => [payload.new, ...prev]);
         } else if (payload.eventType === 'UPDATE') {
             setStoreOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
             if (activeChatOrder && activeChatOrder.id === payload.new.id) {
                 setActiveChatOrder(payload.new);
             }
         }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedMarketId, activeChatOrder]);

  const toggleCategory = (cat: string) => {
     setNewMarket(prev => {
        if(prev.categories.includes(cat)) {
           return {...prev, categories: prev.categories.filter(c => c !== cat)}
        } else {
           return {...prev, categories: [...prev.categories, cat]}
        }
     });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedMarketId || !currentUser) return;
    
    const finalCategory = isCreatingCategory ? newProduct.newCategory.trim() : newProduct.category;
    if (!finalCategory) { return alert("Por favor, selecione ou digite uma categoria."); }
    
    setIsUploadingProduct(true);
    try {
       let imageUrl = newProduct.image || '';

       // Se o modo for arquivo e tiver um arquivo selecionado, faz upload
       if (productImageMode === 'file' && productImageFile) {
          const fileExt = productImageFile.name.split('.').pop();
          const fileName = `product_${selectedMarketId}_${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('markets').upload(fileName, productImageFile);
          if (uploadError) throw uploadError;
          imageUrl = supabase.storage.from('markets').getPublicUrl(fileName).data.publicUrl;
       }

       const prodStruct = { name: newProduct.name, price: Number(newProduct.price), description: newProduct.description, category: finalCategory, image: imageUrl, marketId: selectedMarketId, isActive: true };
       const { error } = await supabase.from('products').insert([prodStruct]);
       if (error) throw error;
       
       alert(`Produto salvo com sucesso!`);
       const createdProduct = { ...prodStruct, id: Math.random().toString() };
       setStoreProducts([...storeProducts, createdProduct]);
       setIsAddingProduct(false);
       setNewProduct({ name: '', price: '', description: '', category: finalCategory, newCategory: '', image: '' });
       setProductImageFile(null);
       setProductImagePreview('');
       setIsCreatingCategory(false);
       if (!existingCategories.includes(finalCategory)) setExistingCategories([...existingCategories, finalCategory]);
    } catch(err: any) {
       alert("Erro ao salvar produto: " + (err.message || ''));
    } finally {
       setIsUploadingProduct(false);
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!editingProduct || !selectedMarketId) return;

    const finalCategory = editIsCreatingCategory ? editingProduct.newCategory?.trim() : editingProduct.category;
    if (!finalCategory) return alert("Por favor, selecione ou digite uma categoria.");

    setIsSavingEdit(true);
    try {
      let imageUrl = editingProduct.image || '';

      // Upload nova imagem se selecionada
      if (editProductImageFile) {
        const fileExt = editProductImageFile.name.split('.').pop();
        const fileName = `product_${selectedMarketId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('markets').upload(fileName, editProductImageFile);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from('markets').getPublicUrl(fileName).data.publicUrl;
      }

      const updateData = {
        name: editingProduct.name,
        price: Number(editingProduct.price),
        description: editingProduct.description,
        category: finalCategory,
        image: imageUrl
      };

      const { error } = await supabase.from('products').update(updateData).eq('id', editingProduct.id);
      if (error) throw error;

      alert("Produto atualizado com sucesso!");
      setStoreProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...updateData } : p));
      setEditingProduct(null);
      setEditProductImageFile(null);
      setEditProductImagePreview('');
      
      if (!existingCategories.includes(finalCategory)) {
        setExistingCategories(prev => [...prev, finalCategory]);
      }
    } catch (err: any) {
      alert("Erro ao atualizar produto: " + (err.message || ''));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!isSystemAdmin || !currentUser) return;
    try {
       setIsUploading(true);
       let logoUrl = '';
       let coverUrl = '';

       if (logoFile) {
           const fileExt = logoFile.name.split('.').pop();
           const fileName = `logo_${Date.now()}.${fileExt}`;
           const { error: uploadError, data } = await supabase.storage.from('markets').upload(fileName, logoFile);
           if (uploadError) throw uploadError;
           if (data) {
               logoUrl = supabase.storage.from('markets').getPublicUrl(fileName).data.publicUrl;
           }
       }

       if (coverFile) {
           const fileExt = coverFile.name.split('.').pop();
           const fileName = `cover_${Date.now()}.${fileExt}`;
           const { error: uploadError, data } = await supabase.storage.from('markets').upload(fileName, coverFile);
           if (uploadError) throw uploadError;
           if (data) {
               coverUrl = supabase.storage.from('markets').getPublicUrl(fileName).data.publicUrl;
           }
       }

       const marketStruct = { 
         name: newMarket.name, 
         isActive: true, 
         adminEmails: [currentUser.email],
         cityId: newMarket.cityId,
         img: logoUrl,
         cover: coverUrl,
         deliveryTime: newMarket.deliveryTime,
         fee: newMarket.fee,
         categories: newMarket.categories.length > 0 ? newMarket.categories : ['Mercado'],
         description: newMarket.description.trim() || null,
         address: newMarket.address.trim() || null
       };
       const { data, error } = await supabase.from('markets').insert([marketStruct]).select().single();
       if (error) throw error;
       
       const createdMarket = { ...data, rating: 5.0 };
       if(updateAdminMarkets) updateAdminMarkets([...adminMarkets, createdMarket]);
       setIsAddingMarket(false);
       setNewMarket({ name: '', cityId: PREDEFINED_CITIES[0], deliveryTime: 45, fee: 4, categories: [], description: '', address: '' });
       setLogoFile(null);
       setCoverFile(null);
    } catch(err: any) {
       console.error("Erro ao criar mercado:", err);
       alert("Erro ao criar mercado. Verifique o console para mais detalhes.");
    } finally {
       setIsUploading(false);
    }
  }

  const handleDeleteMarket = async (marketId: string) => {
     if(!isSystemAdmin) return;
     if(window.confirm('Excluir esta loja?')) {
        const { error } = await supabase.from('markets').delete().eq('id', marketId);
        if (!error && updateAdminMarkets) updateAdminMarkets(adminMarkets.filter(m => m.id !== marketId));
     }
  };

  const handleUpdateMarketImage = async (market: any, type: 'logo' | 'cover', file: File) => {
      setIsUpdatingImage(`${market.id}-${type}`);
      try {
           const fileExt = file.name.split('.').pop();
           const fileName = `${type}_${market.id}_${Date.now()}.${fileExt}`;
           const { error: uploadError, data } = await supabase.storage.from('markets').upload(fileName, file);
           if (uploadError) throw uploadError;
           
           const newUrl = supabase.storage.from('markets').getPublicUrl(fileName).data.publicUrl;
           
           const updatePayload = type === 'logo' ? { img: newUrl } : { cover: newUrl };
           const { error } = await supabase.from('markets').update(updatePayload).eq('id', market.id);
           
           if (!error && updateAdminMarkets) {
              updateAdminMarkets(adminMarkets.map(m => m.id === market.id ? {...m, ...updatePayload} : m));
              alert(`${type === 'logo' ? 'Logo' : 'Capa'} atualizada com sucesso!`);
           } else {
              throw error;
           }
      } catch(err) {
           console.error(err);
           alert("Erro ao atualizar imagem.");
      } finally {
           setIsUpdatingImage(null);
      }
  };

  const handleUpdateMarketFee = async (market: any) => {
      if (!isSystemAdmin) return;
      const val = window.prompt(`Definir nova taxa de entrega para [${market.name}]? (Atual: R$ ${Number(market.fee || 0).toFixed(2).replace('.', ',')})`);
      if (val === null) return;
      const num = parseFloat(val.replace(',', '.'));
      if (isNaN(num) || num < 0) {
         alert("Valor inválido.");
         return;
      }
      const { error } = await supabase.from('markets').update({ fee: num }).eq('id', market.id);
      if (!error && updateAdminMarkets) {
         updateAdminMarkets(adminMarkets.map(m => m.id === market.id ? {...m, fee: num} : m));
         alert("Taxa atualizada com sucesso!");
      } else {
         alert("Erro ao atualizar taxa.");
      }
  };

  const handleDeleteProduct = async (productId: string) => {
     if(window.confirm('Excluir este produto?')) {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (!error) setStoreProducts(storeProducts.filter(p => p.id !== productId));
     }
  };

  const handleSetPromotion = async (p: any) => {
      const val = window.prompt(`Definir preço promocional da Loja para [${p.name}]? (Preço original: R$ ${p.price}). Deixe em branco para remover a promoção.`);
      if (val === null) return;
      const num = parseFloat(val.replace(',', '.'));
      const promo = isNaN(num) ? null : num;
      const { error } = await supabase.from('products').update({ promotionalPrice: promo }).eq('id', p.id);
      if (!error) {
         setStoreProducts(storeProducts.map(prod => prod.id === p.id ? {...prod, promotionalPrice: promo} : prod));
         alert("Promoção atualizada com sucesso!");
      } else {
         alert("Erro ao atualizar promoção.");
      }
  };

  const handleSetPlatformDiscount = async (p: any) => {
      if (!isSystemAdmin) return;
      const val = window.prompt(`[MASTER] Definir desconto subsidiado pela Plataforma para [${p.name}]? (Ex: 5.00 será abatido do valor final, mas a loja recebe integral). Deixe em branco para remover.`);
      if (val === null) return;
      const num = parseFloat(val.replace(',', '.'));
      const promo = isNaN(num) ? null : num;
      const { error } = await supabase.from('products').update({ platformDiscount: promo }).eq('id', p.id);
      if (!error) {
         setStoreProducts(storeProducts.map(prod => prod.id === p.id ? {...prod, platformDiscount: promo} : prod));
         alert("Desconto da plataforma atualizado com sucesso!");
      } else {
         alert("Erro ao atualizar desconto da plataforma.");
      }
  };

   const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
       try {
          // Busca o histórico atual primeiro
          const { data: current } = await supabase.from('orders').select('statusHistory').eq('id', orderId).single();
          const history = current?.statusHistory || {};
          const updatedHistory = { ...history, [newStatus]: new Date().toISOString() };

          const { error } = await supabase.from('orders').update({ 
             status: newStatus,
             statusHistory: updatedHistory,
             // Se for finalizado, garantimos o finishedAt para compatibilidade
             ...(newStatus === 'finished' ? { finishedAt: new Date().toISOString() } : {})
          }).eq('id', orderId);

          if (error) throw error;
          
          setStoreOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, statusHistory: updatedHistory } : o));
       } catch (err: any) {
          console.error(err);
          alert("Erro ao atualizar status do pedido: " + err.message);
       }
   };

  const handleSendChatMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeChatOrder || !chatMessage.trim()) return;
      
      const text = chatMessage.trim();
      setChatMessage('');

      const newMsg = { sender: 'store', text: text, time: new Date().toISOString() };
      
      // Atualização Otimista local
      const optimisticChat = [...(activeChatOrder.chat || []), newMsg];
      setActiveChatOrder({ ...activeChatOrder, chat: optimisticChat });

      try {
          // Busca a versão mais recente para evitar sobrescrever mensagens do cliente
          const { data: latestOrder } = await supabase.from('orders').select('chat').eq('id', activeChatOrder.id).single();
          const finalChat = [...(latestOrder?.chat || []), newMsg];
          
          const { error } = await supabase.from('orders').update({ chat: finalChat }).eq('id', activeChatOrder.id);
          if (error) throw error;
      } catch (err) {
          alert("Erro ao enviar mensagem.");
      }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
      // Omitted to keep it short, same as before
      e.preventDefault();
      if(!managingAdminsFor || !newAdminEmail) return;
      const updatedEmails = [...(managingAdminsFor.adminEmails || []), newAdminEmail];
      const { error } = await supabase.from('markets').update({ adminEmails: updatedEmails }).eq('id', managingAdminsFor.id);
      if (!error) {
          const updatedMarket = {...managingAdminsFor, adminEmails: updatedEmails};
          if(updateAdminMarkets) updateAdminMarkets(adminMarkets.map(m => m.id === managingAdminsFor.id ? updatedMarket : m));
          setManagingAdminsFor(updatedMarket);
          setNewAdminEmail('');
      }
  };

  const handleRemoveAdmin = async (emailToRemove: string) => {
      if(!managingAdminsFor) return;
      const updatedEmails = managingAdminsFor.adminEmails.filter((e: string) => e !== emailToRemove);
      const { error } = await supabase.from('markets').update({ adminEmails: updatedEmails }).eq('id', managingAdminsFor.id);
      if (!error) {
          const updatedMarket = {...managingAdminsFor, adminEmails: updatedEmails};
          if(updateAdminMarkets) updateAdminMarkets(adminMarkets.map(m => m.id === managingAdminsFor.id ? updatedMarket : m));
          setManagingAdminsFor(updatedMarket);
      }
  };

  useEffect(() => {
    if (isLoggedIn && isAdminDataLoaded && !isSystemAdmin && adminMarkets.length === 0) navigate('/');
  }, [isLoggedIn, isAdminDataLoaded, isSystemAdmin, adminMarkets, navigate]);

  if (!isLoggedIn) return (<div className="min-h-screen bg-slate-50 flex items-center justify-center"><button onClick={() => navigate('/auth')} className="bg-green-600 text-white p-3 rounded">Login</button></div>);
  if (!isAdminDataLoaded) return (<div className="min-h-screen bg-slate-50 flex items-center justify-center">Carregando...</div>);
  if (!isSystemAdmin && adminMarkets.length === 0) return null;

  // Organizando pedidos para o Kanban
  const newOrders = storeOrders.filter(o => o.status === 'pending');
  const prepOrders = storeOrders.filter(o => o.status === 'prep');
  const deliveryOrders = storeOrders.filter(o => o.status === 'delivery');
  const finishedOrders = storeOrders.filter(o => o.status === 'finished' || o.status === 'canceled');

  const renderOrderCard = (order: any, actions: React.ReactNode) => {
      const hasUnreadMessage = order.chat && order.chat.length > 0 && order.chat[order.chat.length-1].sender === 'customer';
      return (
      <div key={order.id} className={`bg-white border-2 rounded-xl p-4 shadow-sm flex flex-col gap-3 transition-colors ${hasUnreadMessage ? 'border-red-400 bg-red-50/30' : 'border-slate-100'}`}>
         <div className="flex justify-between items-start">
             <div>
                <span className="font-bold text-slate-800 text-sm">#{order.id.split('-')[0]}</span>
                <div className="text-xs text-slate-400">{new Date(order.created_at).toLocaleTimeString('pt-BR')}</div>
             </div>
             {hasUnreadMessage ? (
                 <button onClick={() => setActiveChatOrder(order)} className="bg-red-500 text-white hover:bg-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md animate-bounce">
                     <MessageCircle className="w-4 h-4 shrink-0" />
                     <span>Mensagem</span>
                 </button>
             ) : (
                 <button onClick={() => setActiveChatOrder(order)} className="text-slate-400 hover:text-blue-500 bg-slate-50 p-2 rounded-full relative transition-colors">
                     <MessageCircle className="w-5 h-5" />
                 </button>
             )}
         </div>
         
         <div className="flex flex-col gap-1.5 text-xs text-slate-600">
             {order.items.map((i: any, idx: number) => (
                <div key={idx} className="flex flex-col">
                   <span><span className="font-bold">{i.qty}x</span> {i.name}</span>
                   {i.observation && (
                      <span className="text-[10px] text-orange-700 bg-orange-100 font-semibold px-2 py-0.5 rounded w-fit mt-0.5 border border-orange-200">
                         📝 {i.observation}
                      </span>
                   )}
                </div>
             ))}
         </div>
         
         <div className="flex justify-between items-center pt-2 border-t border-slate-100">
             <span className="font-extrabold text-green-700 text-sm">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
             <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-md text-slate-600 uppercase">{order.paymentMethod === 'pix' ? 'PIX' : order.paymentMethod === 'card' ? 'Cartão' : 'Dinheiro'}</span>
         </div>
         
         {order.deliveryAddress && (
             <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded flex gap-2">
                 <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                 <span>{order.deliveryAddress.street}, {order.deliveryAddress.houseNumber}</span>
             </div>
         )}
         
         <div className="flex gap-2 mt-1">
             {actions}
         </div>
      </div>
  );
};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-10 flex flex-col gap-6">
        
        {/* Banner */}
        <div className="bg-slate-800 rounded-3xl p-6 md:p-8 text-white flex justify-between items-center shadow-lg">
           <div>
              <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block border border-green-500/30">
                {isSystemAdmin ? 'MASTER ADMIN' : 'LOJISTA'}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold">Painel de Gestão</h1>
           </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-px">
          <button onClick={() => setActiveTab('markets')} className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'markets' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500'}`}>Estabelecimentos</button>
          <button onClick={() => setActiveTab('products')} className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'products' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500'}`}>Catálogo</button>
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'orders' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500'}`}>
             Pedidos {newOrders.length > 0 && <span className="bg-red-500 text-white rounded-full px-2 py-0.5 ml-1 text-xs">{newOrders.length}</span>}
          </button>
          {isSystemAdmin && <button onClick={() => setActiveTab('system')} className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'system' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500'}`}>Master</button>}
        </div>

        {/* Tab Contents */}
        <div className="flex flex-col gap-6">
           {activeTab === 'markets' && (
               <div className="flex flex-col gap-6">
                  {adminMarkets.map(market => (
                     <div key={market.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner overflow-hidden border border-slate-100 shrink-0">
                                 {market.img ? <img src={market.img} alt={market.name} className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-slate-400" />}
                              </div>
                              <div>
                                 <h3 className="font-bold text-lg text-slate-800">{market.name}</h3>
                                 <p className="text-sm text-slate-500">{market.cityId || 'Cidade não definida'}</p>
                              </div>
                           </div>
                           
                           {/* Toggle Aberto/Fechado */}
                           <button 
                              onClick={async () => {
                                 const newVal = !market.isOpen;
                                 const { error } = await supabase.from('markets').update({ isOpen: newVal }).eq('id', market.id);
                                 if (!error && updateAdminMarkets) {
                                    updateAdminMarkets(adminMarkets.map(m => m.id === market.id ? {...m, isOpen: newVal} : m));
                                 }
                              }}
                              className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm ${market.isOpen ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                           >
                              <div className={`w-5 h-5 rounded-full border-2 transition-all ${market.isOpen ? 'bg-white border-white shadow-md' : 'bg-slate-400 border-slate-400'}`}></div>
                              {market.isOpen ? 'Loja Aberta' : 'Loja Fechada'}
                           </button>
                        </div>
                        
                        {/* Descrição e Endereço editáveis inline */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                              <div className="flex items-center justify-between mb-1">
                                 <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><FileText className="w-3 h-3" /> Descrição</span>
                                 <button 
                                    onClick={async () => {
                                       const val = window.prompt('Descrição da loja:', market.description || '');
                                       if (val === null) return;
                                       const { error } = await supabase.from('markets').update({ description: val.trim() || null }).eq('id', market.id);
                                       if (!error && updateAdminMarkets) updateAdminMarkets(adminMarkets.map((m: any) => m.id === market.id ? {...m, description: val.trim() || null} : m));
                                    }}
                                    className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                                 ><Pencil className="w-3 h-3" /> Editar</button>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2">{market.description || <span className="text-slate-300 italic">Sem descrição</span>}</p>
                           </div>
                           <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                              <div className="flex items-center justify-between mb-1">
                                 <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Endereço</span>
                                 <button 
                                    onClick={async () => {
                                       const val = window.prompt('Endereço da loja:', market.address || '');
                                       if (val === null) return;
                                       const { error } = await supabase.from('markets').update({ address: val.trim() || null }).eq('id', market.id);
                                       if (!error && updateAdminMarkets) updateAdminMarkets(adminMarkets.map((m: any) => m.id === market.id ? {...m, address: val.trim() || null} : m));
                                    }}
                                    className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                                 ><Pencil className="w-3 h-3" /> Editar</button>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2">{market.address || <span className="text-slate-300 italic">Sem endereço</span>}</p>
                           </div>
                        </div>
                        
                        <div className="flex gap-2 text-xs text-slate-400">
                           <span className="bg-slate-50 px-2 py-1 rounded">{market.categories?.join(', ') || 'Sem categorias'}</span>
                        </div>
                     </div>
                  ))}
                  {adminMarkets.length === 0 && (
                     <div className="text-slate-500 p-10 text-center bg-white rounded-2xl border border-slate-200">
                        Você não possui lojas vinculadas à sua conta.
                     </div>
                  )}
               </div>
           )}

           {activeTab === 'products' && (
               // Render Products
               <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                     <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none w-full sm:w-48" value={selectedMarketId} onChange={e => setSelectedMarketId(e.target.value)}>
                        {adminMarkets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                     </select>
                     <button onClick={() => setIsAddingProduct(!isAddingProduct)} className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2">
                        {isAddingProduct ? 'Cancelar' : 'Novo Produto'}
                     </button>
                  </div>
                  {isAddingProduct && (
                      <form onSubmit={handleCreateProduct} className="bg-white p-6 rounded-2xl border border-green-200 shadow-sm flex flex-col gap-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <input type="text" placeholder="Nome do Produto" required className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-green-500" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                             <input type="number" step="0.01" placeholder="Valor (R$)" required className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-green-500" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                             <select className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-green-500 bg-white" value={isCreatingCategory ? 'NEW' : newProduct.category} onChange={e => { e.target.value === 'NEW' ? setIsCreatingCategory(true) : setNewProduct({...newProduct, category: e.target.value, newCategory: ''}); setIsCreatingCategory(e.target.value === 'NEW'); }}>
                                <option value="" disabled>Categoria</option>
                                {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="NEW">+ Nova Categoria</option>
                             </select>
                             {isCreatingCategory && <input type="text" placeholder="Nome da nova categoria" required className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-green-500" value={newProduct.newCategory} onChange={e => setNewProduct({...newProduct, newCategory: e.target.value})} />}
                             <input type="text" placeholder="Descrição (opcional)" className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-green-500 md:col-span-2" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                          </div>

                          {/* Seção de Imagem do Produto */}
                          <div className="border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                             <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-700">Foto do Produto</span>
                                <div className="flex bg-slate-100 rounded-lg overflow-hidden">
                                   <button type="button" onClick={() => { setProductImageMode('file'); setNewProduct({...newProduct, image: ''}); }} className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${productImageMode === 'file' ? 'bg-green-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                      <ImagePlus className="w-3.5 h-3.5" /> Enviar Arquivo
                                   </button>
                                   <button type="button" onClick={() => { setProductImageMode('url'); setProductImageFile(null); setProductImagePreview(''); }} className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${productImageMode === 'url' ? 'bg-green-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                      <Link2 className="w-3.5 h-3.5" /> URL da Web
                                   </button>
                                </div>
                             </div>

                             <div className="flex gap-4 items-start">
                                {/* Preview */}
                                <div className="w-24 h-24 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                   {(productImagePreview || (productImageMode === 'url' && newProduct.image)) ? (
                                      <img src={productImagePreview || newProduct.image} alt="Preview" className="w-full h-full object-cover rounded-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                   ) : (
                                      <ImagePlus className="w-8 h-8 text-slate-300" />
                                   )}
                                </div>

                                <div className="flex-1 flex flex-col gap-2">
                                   {productImageMode === 'file' ? (
                                      <>
                                         <label className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
                                            <ImagePlus className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm text-slate-600">{productImageFile ? productImageFile.name : 'Selecionar imagem...'}</span>
                                            <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={(e) => {
                                               const file = e.target.files?.[0];
                                               if (file) {
                                                  setProductImageFile(file);
                                                  const reader = new FileReader();
                                                  reader.onloadend = () => setProductImagePreview(reader.result as string);
                                                  reader.readAsDataURL(file);
                                               }
                                            }} />
                                         </label>
                                         <span className="text-[10px] text-slate-400">PNG, JPG ou WebP. Recomendado: 500x500px.</span>
                                      </>
                                   ) : (
                                      <>
                                         <input 
                                            type="url" 
                                            placeholder="https://exemplo.com/imagem.jpg" 
                                            className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-green-500 text-sm" 
                                            value={newProduct.image} 
                                            onChange={e => setNewProduct({...newProduct, image: e.target.value})} 
                                         />
                                         <span className="text-[10px] text-slate-400">Cole o link direto de uma imagem da web.</span>
                                      </>
                                   )}
                                </div>
                             </div>
                          </div>

                          <button type="submit" disabled={isUploadingProduct} className="bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                             {isUploadingProduct ? 'Salvando...' : 'Salvar Produto'}
                          </button>
                      </form>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      {storeProducts.map(p => (
                          <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col shadow-sm relative group">
                             {p.platformDiscount && (
                                <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10 animate-pulse">
                                   MASTER PROMO
                                </span>
                             )}
                             {/* Thumbnail do produto */}
                             <div className="h-24 bg-slate-50 rounded-xl mb-2 overflow-hidden flex items-center justify-center">
                                {p.image && p.image.startsWith('http') ? (
                                   <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                   <span className="text-3xl text-slate-300">🛍️</span>
                                )}
                             </div>
                             <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{p.category}</span>
                             <span className="font-bold text-slate-800 text-sm leading-tight mb-2 flex-1">{p.name}</span>
                             
                             <div className="flex flex-col mb-3">
                                {p.promotionalPrice || p.platformDiscount ? (
                                   <>
                                      <span className="text-xs text-slate-400 line-through">R$ {Number(p.price).toFixed(2).replace('.', ',')}</span>
                                      <span className="text-green-600 font-extrabold text-lg">
                                         R$ {Math.max(0, Number(p.promotionalPrice || p.price) - Number(p.platformDiscount || 0)).toFixed(2).replace('.', ',')}
                                      </span>
                                      {p.platformDiscount && <span className="text-[10px] text-purple-600 font-bold bg-purple-50 rounded px-1 w-fit mt-0.5">-R$ {Number(p.platformDiscount).toFixed(2).replace('.', ',')} (Plataforma)</span>}
                                   </>
                                ) : (
                                   <span className="text-green-600 font-extrabold text-lg">R$ {Number(p.price).toFixed(2).replace('.', ',')}</span>
                                )}
                             </div>
                             
                             <div className="flex flex-col gap-1.5 mt-auto">
                                <button onClick={() => handleSetPromotion(p)} className="bg-yellow-50 text-yellow-700 text-xs font-bold py-1.5 rounded-lg hover:bg-yellow-100 transition-colors">
                                   {p.promotionalPrice ? 'Alterar Promoção' : 'Criar Promoção Loja'}
                                </button>
                                {isSystemAdmin && (
                                   <button onClick={() => handleSetPlatformDiscount(p)} className="bg-purple-50 text-purple-700 text-xs font-bold py-1.5 rounded-lg hover:bg-purple-100 transition-colors">
                                      {p.platformDiscount ? 'Edit Master Promo' : '+ Master Promo'}
                                   </button>
                                )}
                                 <button onClick={() => { setEditingProduct({...p}); setEditProductImagePreview(p.image || ''); setEditIsCreatingCategory(false); }} className="bg-blue-50 text-blue-700 text-xs font-bold py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                    Editar
                                 </button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="bg-slate-50 text-red-500 text-xs font-bold py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                   Excluir
                                </button>
                             </div>
                          </div>
                      ))}
                  </div>
               </div>
           )}

           {activeTab === 'orders' && (
              <div className="flex flex-col gap-4">
                 <div className="flex gap-4 items-center">
                    <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold w-48 outline-none" value={selectedMarketId} onChange={e => setSelectedMarketId(e.target.value)}>
                       {adminMarkets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                 </div>

                 {/* Kanban Board */}
                 <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 items-start">
                    
                    {/* Novos Pedidos */}
                    <div className="bg-slate-100 rounded-2xl p-4 min-w-[280px] flex flex-col gap-3">
                        <h3 className="font-bold text-slate-700 flex items-center justify-between">
                            Novos 
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{newOrders.length}</span>
                        </h3>
                        {newOrders.map(order => renderOrderCard(order, (
                            <>
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'prep')} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-600 flex items-center justify-center gap-1"><Check className="w-4 h-4"/> Aceitar</button>
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'canceled')} className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-200">Recusar</button>
                            </>
                        )))}
                    </div>

                    {/* Em Preparo */}
                    <div className="bg-orange-50/50 rounded-2xl p-4 min-w-[280px] flex flex-col gap-3 border border-orange-100">
                        <h3 className="font-bold text-orange-800 flex items-center justify-between">
                            Preparando 
                            <span className="bg-orange-200 text-orange-800 text-xs px-2 py-0.5 rounded-full">{prepOrders.length}</span>
                        </h3>
                        {prepOrders.map(order => renderOrderCard(order, (
                            <button onClick={() => handleUpdateOrderStatus(order.id, 'delivery')} className="w-full bg-orange-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-orange-600">Despachar para Entrega</button>
                        )))}
                    </div>

                    {/* Em Entrega */}
                    <div className="bg-blue-50/50 rounded-2xl p-4 min-w-[280px] flex flex-col gap-3 border border-blue-100">
                        <h3 className="font-bold text-blue-800 flex items-center justify-between">
                            Em Rota 
                            <span className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full">{deliveryOrders.length}</span>
                        </h3>
                        {deliveryOrders.map(order => renderOrderCard(order, (
                            <button onClick={() => handleUpdateOrderStatus(order.id, 'finished')} className="w-full bg-blue-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-600 flex items-center justify-center gap-1">
                                <Check className="w-4 h-4"/> Marcar como Entregue
                            </button>
                        )))}
                    </div>

                    {/* Concluídos */}
                    <div className="bg-slate-50 rounded-2xl p-4 min-w-[280px] flex flex-col gap-3 opacity-80">
                        <h3 className="font-bold text-slate-500">Histórico Recente</h3>
                        {finishedOrders.slice(0, 10).map(order => renderOrderCard(order, (
                            <span className={`text-xs font-bold ${order.status === 'finished' ? 'text-green-600' : 'text-red-500'}`}>{order.status === 'finished' ? 'Finalizado' : 'Cancelado'}</span>
                        )))}
                    </div>

                 </div>
              </div>
           )}

           {activeTab === 'system' && isSystemAdmin && (
               <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                     <h2 className="text-xl font-bold text-slate-800">Gerenciamento de Lojas (Master)</h2>
                     <button onClick={() => setIsAddingMarket(!isAddingMarket)} className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2">
                        {isAddingMarket ? 'Cancelar' : '+ Nova Loja'}
                     </button>
                  </div>

                  {isAddingMarket && (
                     <form onSubmit={handleCreateMarket} className="bg-white p-6 rounded-2xl border border-green-200 shadow-sm flex flex-col gap-4">
                        <h3 className="font-bold text-lg">Nova Loja</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <input type="text" placeholder="Nome da Loja" required className="border p-2 rounded" value={newMarket.name} onChange={e => setNewMarket({...newMarket, name: e.target.value})} />
                           
                           <select required className="border p-2 rounded bg-white text-slate-700 outline-none focus:border-green-500" value={newMarket.cityId} onChange={e => setNewMarket({...newMarket, cityId: e.target.value})}>
                              <option value="" disabled>Selecione a cidade</option>
                              {PREDEFINED_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                           </select>
                           
                           <textarea placeholder="Descrição da loja (visível para o cliente)" className="border p-2 rounded resize-none h-16 md:col-span-2" value={newMarket.description} onChange={e => setNewMarket({...newMarket, description: e.target.value})} maxLength={300} />
                           
                           <input type="text" placeholder="Endereço da loja (Rua, Número, Bairro)" className="border p-2 rounded md:col-span-2" value={newMarket.address} onChange={e => setNewMarket({...newMarket, address: e.target.value})} />

                           <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-600">Logo (Recomendado: 500x500px, 1:1)</label>
                              <input type="file" accept="image/png, image/jpeg" className="border p-1.5 rounded text-sm bg-slate-50" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                           </div>

                           <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-600">Capa (Recomendado: 1200x400px, 3:1)</label>
                              <input type="file" accept="image/png, image/jpeg" className="border p-1.5 rounded text-sm bg-slate-50" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
                           </div>

                           <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-600">Tempo de Entrega (min)</label>
                              <input type="number" placeholder="Tempo de Entrega (min)" required className="border p-2 rounded" value={newMarket.deliveryTime} onChange={e => setNewMarket({...newMarket, deliveryTime: Number(e.target.value)})} />
                           </div>
                           
                           <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-600">Taxa de Entrega (R$)</label>
                              <input type="number" step="0.01" placeholder="Taxa de Entrega (R$)" required className="border p-2 rounded" value={newMarket.fee} onChange={e => setNewMarket({...newMarket, fee: Number(e.target.value)})} />
                           </div>
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-600 mb-2">Categorias:</p>
                           <div className="flex flex-wrap gap-2">
                              {MARKET_CATEGORIES.map(cat => (
                                 <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-bold ${newMarket.categories.includes(cat) ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{cat}</button>
                              ))}
                           </div>
                        </div>
                        <button type="submit" disabled={isUploading} className="bg-green-600 text-white p-3 rounded-xl font-bold mt-2 disabled:opacity-50">
                           {isUploading ? 'Enviando Imagens e Salvando...' : 'Salvar Loja'}
                        </button>
                     </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {adminMarkets.map(market => (
                        <div key={market.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                 <div className="bg-slate-50 w-12 h-12 flex items-center justify-center rounded-xl overflow-hidden border border-slate-100 shrink-0">
                                     {market.img ? <img src={market.img} alt={market.name} className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-slate-400" />}
                                 </div>
                                 <div>
                                    <h3 className="font-bold text-slate-800">{market.name}</h3>
                                    <p className="text-xs text-slate-500">{market.cityId || 'Não definida'} • ID: {market.id.split('-')[0]}</p>
                                 </div>
                              </div>
                              <button onClick={() => handleDeleteMarket(market.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Excluir Loja">
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </div>

                           <div className="flex gap-2">
                              <label className={`text-[11px] border border-slate-200 px-2 py-1.5 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer text-center flex-1 ${isUpdatingImage === `${market.id}-logo` ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isUpdatingImage === `${market.id}-logo` ? 'Enviando...' : 'Trocar Logo'}
                                <input type="file" accept="image/png, image/jpeg" className="hidden" disabled={isUpdatingImage !== null} onChange={(e) => { if(e.target.files?.[0]) handleUpdateMarketImage(market, 'logo', e.target.files[0]) }} />
                              </label>
                              <label className={`text-[11px] border border-slate-200 px-2 py-1.5 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer text-center flex-1 ${isUpdatingImage === `${market.id}-cover` ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isUpdatingImage === `${market.id}-cover` ? 'Enviando...' : 'Trocar Capa'}
                                <input type="file" accept="image/png, image/jpeg" className="hidden" disabled={isUpdatingImage !== null} onChange={(e) => { if(e.target.files?.[0]) handleUpdateMarketImage(market, 'cover', e.target.files[0]) }} />
                              </label>
                           </div>

                           <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <div>
                                 <p className="text-[10px] uppercase font-bold text-slate-400">Taxa de Entrega</p>
                                 <p className="font-extrabold text-green-700">R$ {Number(market.fee || 0).toFixed(2).replace('.', ',')}</p>
                              </div>
                              <button onClick={() => handleUpdateMarketFee(market)} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:border-green-500 hover:text-green-600 transition-colors">
                                 Alterar Taxa
                              </button>
                           </div>

                           <div className="border-t border-slate-100 pt-4">
                              <div className="flex justify-between items-center mb-2">
                                 <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Administradores</h4>
                                 <button onClick={() => setManagingAdminsFor(managingAdminsFor?.id === market.id ? null : market)} className="text-xs text-blue-600 font-bold hover:underline">Gerenciar</button>
                              </div>
                              
                              <div className="flex flex-col gap-2 mt-2">
                                 {market.adminEmails?.map((email: string) => (
                                    <div key={email} className="bg-slate-50 px-3 py-2 rounded-lg text-xs text-slate-600 flex justify-between items-center border border-slate-100">
                                       <span>{email}</span>
                                       {managingAdminsFor?.id === market.id && (
                                          <button onClick={() => handleRemoveAdmin(email)} className="text-red-500 hover:text-red-700 font-bold" title="Remover Admin"><X className="w-4 h-4"/></button>
                                       )}
                                    </div>
                                 ))}
                              </div>

                              {managingAdminsFor?.id === market.id && (
                                 <form onSubmit={handleAddAdmin} className="mt-3 flex gap-2">
                                    <input type="email" placeholder="Novo email admin..." required className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-green-500" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
                                    <button type="submit" className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-1"><UserPlus className="w-3 h-3"/> Adicionar</button>
                                 </form>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
           )}
        </div>

        {/* Modal de Chat */}
        {activeChatOrder && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden h-[500px]">
                 <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center">
                    <div>
                       <h3 className="font-bold text-slate-800">Chat - Pedido #{activeChatOrder.id.split('-')[0]}</h3>
                       <p className="text-xs text-slate-500">Use apenas em caso de necessidade.</p>
                    </div>
                    <button onClick={() => setActiveChatOrder(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-50/50">
                    {(!activeChatOrder.chat || activeChatOrder.chat.length === 0) ? (
                        <div className="text-center text-slate-400 text-sm mt-10">Nenhuma mensagem ainda.</div>
                    ) : (
                        <>
                           {activeChatOrder.chat.map((msg: any, i: number) => (
                              <div key={i} className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'store' ? 'bg-green-600 text-white self-end rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 self-start rounded-bl-sm'}`}>
                                  {msg.text}
                                  <div className={`text-[10px] opacity-70 text-right mt-1 ${msg.sender === 'store' ? 'text-green-50' : 'text-slate-400'}`}>
                                     {new Date(msg.time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                              </div>
                           ))}
                           <div ref={chatEndRef} />
                        </>
                    )}
                 </div>
                 <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                    <input type="text" placeholder="Digite uma mensagem..." className="flex-1 border border-slate-200 rounded-xl px-3 outline-none focus:border-green-500" value={chatMessage} onChange={e => setChatMessage(e.target.value)} />
                    <button type="submit" disabled={!chatMessage.trim()} className="bg-green-600 text-white p-3 rounded-xl disabled:opacity-50"><Send className="w-4 h-4"/></button>
                 </form>
              </div>
           </div>
        )}
         {/* Product Edit Modal */}
         {editingProduct && (
           <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="text-xl font-extrabold text-slate-800">Editar Produto</h2>
                  <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                     <X className="w-6 h-6 text-slate-500" />
                  </button>
               </div>
               
               <form onSubmit={handleUpdateProduct} className="p-6 overflow-y-auto flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome</label>
                        <input type="text" required className="border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Preço (R$)</label>
                        <input type="number" step="0.01" required className="border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} />
                     </div>
                     
                     <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Categoria</label>
                        <div className="flex gap-2">
                           <select className="flex-1 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-white" value={editIsCreatingCategory ? 'NEW' : editingProduct.category} onChange={e => { if(e.target.value === 'NEW') { setEditIsCreatingCategory(true); } else { setEditIsCreatingCategory(false); setEditingProduct({...editingProduct, category: e.target.value}); } }}>
                              {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                              <option value="NEW">+ Nova Categoria</option>
                           </select>
                           {editIsCreatingCategory && (
                              <input type="text" placeholder="Nome da nova categoria" required className="flex-1 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500" value={editingProduct.newCategory || ''} onChange={e => setEditingProduct({...editingProduct, newCategory: e.target.value})} />
                           )}
                        </div>
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Descrição</label>
                        <textarea className="border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 resize-none h-20" value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                     </div>
                  </div>

                  <div className="flex flex-col gap-2">
                     <label className="text-xs font-bold text-slate-500 uppercase ml-1">Imagem do Produto</label>
                     <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-24 h-24 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                           {editProductImagePreview || editingProduct.image ? (
                              <img src={editProductImagePreview || editingProduct.image} alt="Preview" className="w-full h-full object-cover" />
                           ) : (
                              <ImagePlus className="w-8 h-8 text-slate-300" />
                           )}
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                           <label className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-all text-center">
                              Trocar Imagem
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                    setEditProductImageFile(file);
                                    const reader = new FileReader();
                                    reader.onloadend = () => setEditProductImagePreview(reader.result as string);
                                    reader.readAsDataURL(file);
                                 }
                              }} />
                           </label>
                           <input type="text" placeholder="Ou cole a URL da imagem" className="border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 text-xs" value={editingProduct.image || ''} onChange={e => { setEditingProduct({...editingProduct, image: e.target.value}); setEditProductImagePreview(''); setEditProductImageFile(null); }} />
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-3 mt-2">
                     <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                     <button type="submit" disabled={isSavingEdit} className="flex-[2] bg-blue-600 text-white py-3.5 rounded-2xl font-extrabold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50">
                        {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                     </button>
                  </div>
               </form>
             </div>
           </div>
         )}

      </main>
    </div>
  );
}
