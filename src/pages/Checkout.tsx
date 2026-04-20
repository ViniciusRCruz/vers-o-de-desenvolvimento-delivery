import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { MapPin, CreditCard, Banknote, Wallet, ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';

export default function Checkout() {
  const { cart, cartTotal, removeFromCart, updateQuantity, clearCart, addOrder, userProfile } = useAppContext();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const activeAddress = userProfile?.addresses?.find((a: any) => a.id === userProfile?.activeAddressId) || userProfile?.addresses?.[0];

  const handleFinishOrder = async () => {
    if (!paymentMethod) return alert('Selecione uma forma de pagamento');
    setIsProcessing(true);
    
    // Simulate API Call
    setTimeout(async () => {
      const newOrder = {
        id: `ORD-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toLocaleDateString(),
        total: cartTotal,
        status: 'pending' as const,
        marketName: 'Supermercado (Mix)',
        items: [...cart],
        deliveryAddress: activeAddress || null
      };
      await addOrder(newOrder);
      clearCart();
      setIsProcessing(false);
      navigate(`/tracking/${newOrder.id}`);
    }, 1500);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Seu carrinho está vazio</h2>
          <p className="text-slate-500 mb-6">Navegue pelas lojas e adicione produtos.</p>
          <button onClick={() => navigate('/')} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition">
            Buscar Produtos
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 flex flex-col lg:flex-row gap-8">
        {/* Left Side: Cart & Address */}
        <div className="flex-1 flex flex-col gap-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-medium w-fit">
            <ArrowLeft className="w-5 h-5" /> Voltar
          </button>
          
          <h1 className="text-2xl font-bold text-slate-800">Finalizar Pedido</h1>
          
          {/* Cart Items */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
            <h2 className="font-semibold text-lg border-b border-slate-100 pb-4">Itens do Carrinho ({cart.length})</h2>
            {cart.map(item => (
              <div key={item.id} className="flex gap-4 items-center py-2">
                <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-3xl">
                  {item.img}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{item.name}</h3>
                  <p className="text-sm text-slate-500">R$ {item.price.toFixed(2).replace('.', ',')} / {item.unit}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-100 rounded-lg">
                    <button onClick={() => item.qty > 1 ? updateQuantity(item.id, -1) : removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-green-600 transition">
                      {item.qty > 1 ? <Minus className="w-4 h-4" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                    </button>
                    <span className="w-6 text-center font-semibold text-sm">{item.qty}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-green-600 transition">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-20 text-right font-bold text-slate-800">
                    R$ {(item.price * item.qty).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" /> Endereço de Entrega
              </h2>
              <button onClick={() => navigate('/auth')} className="text-green-600 text-sm font-semibold">Alterar</button>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="font-semibold text-slate-800">{userProfile?.name || 'Cliente visitante'}</p>
              {activeAddress ? (
                <>
                  <p className="text-sm text-slate-600 mt-1 font-medium">{activeAddress.street}, {activeAddress.houseNumber}</p>
                  <p className="text-sm text-slate-500">{activeAddress.cityState}</p>
                  {activeAddress.reference && <p className="text-xs text-slate-400 mt-1 flex gap-1"><span className="font-semibold">Ref:</span> {activeAddress.reference}</p>}
                </>
              ) : (
                <p className="text-sm text-slate-500">{userProfile?.addressText || 'Nenhum endereço salvo. Por favor, complete seu perfil.'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Payment & Summary */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
            <h2 className="font-semibold text-lg">Pagamento</h2>
            
            <div className="flex flex-col gap-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'pix' ? 'border-green-600 bg-green-50/50' : 'border-slate-100 hover:border-green-200'}`}>
                <input type="radio" name="payment" className="hidden" onChange={() => setPaymentMethod('pix')} />
                <Wallet className={`w-6 h-6 ${paymentMethod === 'pix' ? 'text-green-600' : 'text-slate-400'}`} />
                <span className="font-semibold text-slate-800">PIX (Rápido)</span>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-green-600 bg-green-50/50' : 'border-slate-100 hover:border-green-200'}`}>
                <input type="radio" name="payment" className="hidden" onChange={() => setPaymentMethod('card')} />
                <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-green-600' : 'text-slate-400'}`} />
                <span className="font-semibold text-slate-800">Cartão de Crédito/Débito</span>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'cash' ? 'border-green-600 bg-green-50/50' : 'border-slate-100 hover:border-green-200'}`}>
                <input type="radio" name="payment" className="hidden" onChange={() => setPaymentMethod('cash')} />
                <Banknote className={`w-6 h-6 ${paymentMethod === 'cash' ? 'text-green-600' : 'text-slate-400'}`} />
                <span className="font-semibold text-slate-800">Dinheiro na entrega</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4 sticky top-24">
            <h2 className="font-semibold text-lg">Resumo</h2>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxa de Entrega</span>
              <span className="text-green-600 font-semibold">Grátis</span>
            </div>
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center mt-2">
              <span className="font-semibold text-lg text-slate-800">Total</span>
              <span className="font-extrabold text-2xl text-slate-800">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            </div>

            <button 
              onClick={handleFinishOrder}
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg mt-4 transition-all flex items-center justify-center gap-2 ${isProcessing ? 'bg-green-400 cursor-wait' : 'bg-green-600 hover:bg-green-700 active:scale-[0.98] shadow-md shadow-green-600/20'} text-white`}
            >
              {isProcessing ? 'Processando...' : 'Finalizar Pedido'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
