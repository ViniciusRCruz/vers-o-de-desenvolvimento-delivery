import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Truck, PackageCheck, CookingPot, CheckCircle2, ArrowLeft, XCircle, MapPin, CreditCard, MessageCircle, HeadphonesIcon, Send, X, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Tracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  
  // Review state
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    
    // Initial fetch
    const fetchOrder = async () => {
       const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
       if (data) {
          setOrder(data);

          // Abrir chat automaticamente se solicitado via URL
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('chat') === 'true') {
             setIsChatOpen(true);
          }
          
          // Check if already reviewed
          if (data.status === 'finished') {
             const { data: rev } = await supabase.from('reviews').select('*').eq('orderId', id).single();
             if (rev) {
                setExistingReview(rev);
                setReviewSubmitted(true);
             } else {
                setShowReview(true);
             }
          }
       }
       setLoading(false);
    };
    fetchOrder();

    // Subscribe to realtime updates
    const channel = supabase.channel(`order_${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, (payload) => {
         setOrder(payload.new);
         if (payload.new.status === 'finished' && !reviewSubmitted) {
            setShowReview(true);
         }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleConfirmDelivery = async () => {
      if(!window.confirm("Confirmar que você recebeu este pedido?")) return;
      try {
          const { error } = await supabase.from('orders').update({ status: 'finished' }).eq('id', id);
          if(error) throw error;
      } catch (e) {
          alert("Erro ao confirmar entrega.");
      }
  };

  const handleSubmitReview = async () => {
      if (reviewRating === 0) return alert('Por favor, selecione uma nota de 1 a 5 estrelas.');
      if (!order) return;
      
      try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;
          if (!userId) return alert('Você precisa estar logado.');
          
          const { error } = await supabase.from('reviews').insert([{
              orderId: order.id,
              marketId: order.marketId,
              userId: userId,
              rating: reviewRating,
              comment: reviewComment.trim() || null
          }]);
          
          if (error) throw error;
          setReviewSubmitted(true);
          setShowReview(false);
          setExistingReview({ rating: reviewRating, comment: reviewComment.trim() });
      } catch (err: any) {
          alert('Erro ao enviar avaliação: ' + (err.message || ''));
      }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!order || !chatMessage.trim()) return;
      
      const newMsg = { sender: 'customer', text: chatMessage.trim(), time: new Date().toISOString() };
      const updatedChat = [...(order.chat || []), newMsg];
      
      try {
          const { error } = await supabase.from('orders').update({ chat: updatedChat }).eq('id', order.id);
          if (error) throw error;
          setChatMessage('');
      } catch (err) {
          alert("Erro ao enviar mensagem.");
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
         <div className="animate-pulse font-bold text-slate-400">Carregando pedido...</div>
      </div>
    );
  }

  if (!order) {
     return (
       <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold mb-4">Pedido não encontrado</h2>
          <button onClick={() => navigate('/')} className="text-green-600 font-bold">Voltar</button>
       </div>
     )
  }

  const getStepNumber = (status: string) => {
     if (status === 'pending') return 1;
     if (status === 'prep') return 2;
     if (status === 'delivery') return 3;
     if (status === 'finished') return 4;
     if (status === 'canceled') return 0;
     return 1;
  };

  const step = getStepNumber(order.status);

  const stepsInfo = [
    { num: 1, title: 'Recebido', icon: <CheckCircle2 className="w-6 h-6" /> },
    { num: 2, title: 'Em Separação', icon: <CookingPot className="w-6 h-6" /> },
    { num: 3, title: 'Em Entrega', icon: <Truck className="w-6 h-6" /> },
    { num: 4, title: 'Entregue', icon: <PackageCheck className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-10 flex flex-col gap-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-medium w-fit">
          <ArrowLeft className="w-5 h-5" /> Voltar ao Início
        </button>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center flex flex-col items-center relative overflow-hidden">
          
           <div className="flex gap-2 mb-6">
              <div className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-sm font-bold border border-green-100">
                Pedido #{order.id.split('-')[0]}
              </div>
              
              {/* Contato disponível apenas por 24h */}
              {order.createdAt && (new Date().getTime() - new Date(order.createdAt).getTime()) < 24 * 60 * 60 * 1000 && (
                <button 
                  onClick={() => setIsChatOpen(true)}
                  className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-100 flex items-center gap-2 hover:bg-blue-100 transition-colors relative"
                >
                   <MessageCircle className="w-4 h-4" /> Falar com a Loja
                   {order.chat && order.chat.length > 0 && order.chat[order.chat.length-1].sender === 'store' && (
                       <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                   )}
                </button>
              )}
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
             {order.status === 'canceled' ? 'Pedido Cancelado' : order.status === 'finished' ? 'Pedido Entregue!' : 'Acompanhe seu pedido'}
          </h1>
          
          {order.status !== 'canceled' && order.status !== 'finished' && (
             <p className="text-slate-500 mb-10">Previsão de entrega: <strong>30-45 min</strong></p>
          )}

          {order.status === 'canceled' ? (
             <div className="text-red-500 flex flex-col items-center my-6">
                 <XCircle className="w-16 h-16 mb-2" />
                 <p className="font-bold">Este pedido foi cancelado pelo lojista.</p>
             </div>
          ) : (
              <div className="w-full max-w-lg mx-auto flex justify-between relative mt-4 mb-10">
                <div className="absolute top-6 left-0 right-0 h-1 bg-slate-100 -z-10 rounded-full"></div>
                <div 
                  className="absolute top-6 left-0 h-1 bg-green-500 -z-10 rounded-full transition-all duration-1000 ease-in-out" 
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>

                {stepsInfo.map(s => (
                  <div key={s.num} className="flex flex-col items-center gap-3 w-20">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-500 ${step >= s.num ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-slate-100 text-slate-400'}`}>
                      {s.icon}
                    </div>
                    <span className={`text-xs font-semibold text-center transition-colors ${step >= s.num ? 'text-slate-800' : 'text-slate-400'}`}>
                      {s.title}
                    </span>
                  </div>
                ))}
              </div>
          )}

          {order.status === 'delivery' && (
              <div className="w-full bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-6 flex flex-col items-center">
                  <h3 className="font-bold text-blue-800 mb-2">O pedido já chegou?</h3>
                  <p className="text-sm text-blue-600 mb-4">Se você já recebeu o seu pedido, por favor, confirme abaixo para liberar o entregador e finalizar a entrega no sistema.</p>
                  <button onClick={handleConfirmDelivery} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center gap-2">
                     <PackageCheck className="w-5 h-5"/> Confirmar Recebimento
                  </button>
              </div>
          )}

           {/* Review Section */}
           {order.status === 'finished' && showReview && !reviewSubmitted && (
              <div className="w-full bg-yellow-50 border border-yellow-200 p-6 rounded-2xl mb-6 flex flex-col items-center gap-4">
                  <div className="text-3xl">⭐</div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Como foi sua experiência?</h3>
                  <p className="text-sm text-slate-500 text-center max-w-xs">Avalie {order.marketName} para ajudar outros clientes.</p>
                  
                  {/* Star Rating */}
                  <div className="flex gap-2 my-2">
                     {[1, 2, 3, 4, 5].map(star => (
                        <button 
                           key={star}
                           onClick={() => setReviewRating(star)}
                           onMouseEnter={() => setReviewHover(star)}
                           onMouseLeave={() => setReviewHover(0)}
                           className="transition-transform hover:scale-125 active:scale-95"
                        >
                           <Star 
                              className={`w-10 h-10 transition-colors ${(reviewHover || reviewRating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} 
                           />
                        </button>
                     ))}
                  </div>
                  {reviewRating > 0 && (
                     <span className="text-sm font-bold text-yellow-700">
                        {reviewRating === 1 ? 'Péssimo' : reviewRating === 2 ? 'Ruim' : reviewRating === 3 ? 'Regular' : reviewRating === 4 ? 'Bom' : 'Excelente!'}
                     </span>
                  )}
                  
                  {/* Comment */}
                  <textarea 
                     placeholder="Deixe um comentário (opcional)..."
                     className="w-full max-w-sm bg-white border border-yellow-200 p-3 rounded-xl text-sm resize-none h-16 focus:outline-none focus:border-yellow-400"
                     value={reviewComment}
                     onChange={e => setReviewComment(e.target.value)}
                     maxLength={300}
                  />
                  
                  <div className="flex gap-3">
                     <button onClick={() => setShowReview(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                        Agora não
                     </button>
                     <button 
                        onClick={handleSubmitReview}
                        disabled={reviewRating === 0}
                        className="bg-yellow-500 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-yellow-600 transition-colors disabled:opacity-50 shadow-md"
                     >
                        Enviar Avaliação
                     </button>
                  </div>
              </div>
           )}

           {/* Already Reviewed */}
           {order.status === 'finished' && reviewSubmitted && existingReview && (
              <div className="w-full bg-green-50 border border-green-200 p-5 rounded-2xl mb-6 flex items-center gap-4">
                  <div className="flex gap-0.5">
                     {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-5 h-5 ${s <= existingReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                     ))}
                  </div>
                  <div className="flex-1">
                     <p className="text-sm font-bold text-green-800">Obrigado pela sua avaliação!</p>
                     {existingReview.comment && <p className="text-xs text-green-600 mt-0.5">"{existingReview.comment}"</p>}
                  </div>
              </div>
           )}

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-2">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><MapPin className="w-5 h-5 text-slate-400" /> Endereço de Entrega</h3>
                 {order.deliveryAddress ? (
                     <>
                        <p className="text-sm font-semibold text-slate-700">{order.deliveryAddress.street}, {order.deliveryAddress.houseNumber}</p>
                        <p className="text-sm text-slate-500">{order.deliveryAddress.cityState} - {order.deliveryAddress.cep}</p>
                        {order.deliveryAddress.reference && <p className="text-xs text-slate-400 mt-1">Ref: {order.deliveryAddress.reference}</p>}
                     </>
                 ) : (
                     <p className="text-sm text-slate-500">Retirada na loja ou endereço não informado.</p>
                 )}
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-2">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><CreditCard className="w-5 h-5 text-slate-400" /> Pagamento</h3>
                 <p className="text-sm font-semibold text-slate-700">
                    {order.paymentMethod === 'pix' ? 'PIX' : order.paymentMethod === 'card' ? 'Cartão de Crédito/Débito' : 'Dinheiro'}
                 </p>
                 <p className="text-sm text-slate-500">
                     {order.status === 'finished' ? 'Pago com sucesso' : 'Aguardando confirmação do lojista'}
                 </p>
              </div>
          </div>

          <div className="mt-6 w-full bg-slate-50 rounded-2xl p-6 text-left border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">{order.marketName}</h3>
            <div className="flex flex-col gap-2">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm text-slate-600">
                  <span>{item.qty}x {item.name}</span>
                  <span>R$ {(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between font-extrabold text-lg text-slate-800">
                <span>Total Pago</span>
                <span className="text-green-700">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Support Button */}
      <a 
         href="https://wa.me/5511999999999?text=Ol%C3%A1,%20preciso%20de%20ajuda%20com%20o%20App%20Delivery!" 
         target="_blank" 
         rel="noopener noreferrer"
         className="fixed bottom-6 right-6 bg-slate-800 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform z-40 flex items-center justify-center group"
         title="Suporte"
      >
          <HeadphonesIcon className="w-6 h-6" />
          <span className="absolute right-16 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Falar com Suporte</span>
      </a>

      {/* Modal de Chat Cliente */}
      {isChatOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden h-[500px]">
               <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
                  <div>
                     <h3 className="font-bold">Chat com a Loja</h3>
                     <p className="text-xs text-blue-100">Use em caso de dúvidas sobre o pedido.</p>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="text-blue-200 hover:text-white"><X className="w-5 h-5"/></button>
               </div>
               <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-50/50">
                  {(!order.chat || order.chat.length === 0) ? (
                      <div className="text-center text-slate-400 text-sm mt-10">
                          Envie uma mensagem apenas se houver algum problema ou instrução importante para a loja.
                      </div>
                  ) : (
                      order.chat.map((msg: any, i: number) => (
                         <div key={i} className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'customer' ? 'bg-blue-100 text-blue-900 self-end rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 self-start rounded-bl-sm'}`}>
                             {msg.text}
                             <div className="text-[10px] opacity-50 text-right mt-1">{new Date(msg.time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
                         </div>
                      ))
                  )}
               </div>
               <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                  <input type="text" placeholder="Digite sua mensagem..." className="flex-1 border border-slate-200 rounded-xl px-3 outline-none focus:border-blue-500" value={chatMessage} onChange={e => setChatMessage(e.target.value)} />
                  <button type="submit" disabled={!chatMessage.trim()} className="bg-blue-600 text-white p-3 rounded-xl disabled:opacity-50"><Send className="w-4 h-4"/></button>
               </form>
            </div>
         </div>
      )}

    </div>
  );
}
