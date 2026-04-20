import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Truck, PackageCheck, CookingPot, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Tracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders } = useAppContext();
  
  const [step, setStep] = useState(1);

  // Simulate progress
  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 3000);
    const timer2 = setTimeout(() => setStep(3), 8000);
    const timer3 = setTimeout(() => setStep(4), 14000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, []);

  const order = orders.find(o => o.id === id) || { 
    id: id || 'ORD-TEST', date: 'Hoje', total: 0, items: [], marketName: 'Mercado' 
  };

  const stepsInfo = [
    { num: 1, title: 'Pedido Recebido', icon: <CheckCircle2 className="w-6 h-6" /> },
    { num: 2, title: 'Em Separação', icon: <CookingPot className="w-6 h-6" /> },
    { num: 3, title: 'Em Entrega', icon: <Truck className="w-6 h-6" /> },
    { num: 4, title: 'Entregue', icon: <PackageCheck className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-10 flex flex-col gap-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-medium w-fit">
          <ArrowLeft className="w-5 h-5" /> Voltar ao Início
        </button>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center flex flex-col items-center">
          <div className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-green-100">
            Pedido {order.id}
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Acompanhe seu pedido</h1>
          <p className="text-slate-500 mb-10">Previsão de entrega: <strong>30-45 min</strong></p>

          <div className="w-full max-w-lg mx-auto flex justify-between relative">
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

          <div className="mt-12 w-full bg-slate-50 rounded-2xl p-6 text-left border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">{order.marketName}</h3>
            <div className="flex flex-col gap-2">
              {order.items?.map((item: any, idx) => (
                <div key={idx} className="flex justify-between text-sm text-slate-600">
                  <span>{item.qty}x {item.name}</span>
                  <span>R$ {(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between font-bold text-slate-800">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
