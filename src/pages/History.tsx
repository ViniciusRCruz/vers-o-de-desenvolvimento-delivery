import React from 'react';
import Header from '../components/Header';
import { useAppContext } from '../context/AppContext';
import { Clock, RefreshCcw, ArrowLeft, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const { orders, addToCart } = useAppContext();
  const navigate = useNavigate();

  const handleReorder = (items: any[]) => {
    items.forEach(item => {
      // Simplificado: Assumindo que addToCart lidaria com quantidades na vida real, aqui adiciona de 1 em 1
      for(let i=0; i<item.qty; i++){
        addToCart(item);
      }
    });
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 flex flex-col gap-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-medium w-fit">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>

        <h1 className="text-2xl font-bold text-slate-800">Meus Pedidos</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center text-slate-500">
            Você ainda não fez nenhum pedido!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4 group">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                       <Store className="w-5 h-5 text-slate-400" />
                       <h3 className="font-bold text-lg text-slate-800">{order.marketName}</h3>
                    </div>
                    <span className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.createdAt || order.date).toLocaleDateString('pt-BR')} • {order.id.slice(0, 8)}</span>
                  </div>
                  <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm font-semibold">
                    {order.status}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm text-slate-600 line-clamp-1">
                    {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                  </p>
                  <p className="font-bold text-slate-800">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => handleReorder(order.items)}
                    className="w-full md:w-auto bg-green-50 text-green-700 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" /> Refazer Pedido
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
