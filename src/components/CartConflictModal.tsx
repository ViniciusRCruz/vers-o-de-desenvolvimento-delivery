import React from 'react';
import { X, ShoppingBag, Trash2 } from 'lucide-react';

interface CartConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newStoreName?: string;
}

export default function CartConflictModal({ isOpen, onClose, onConfirm, newStoreName }: CartConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-amber-600" />
          </div>
          
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Carrinho com outra loja</h2>
          
          <p className="text-slate-600 mb-8 leading-relaxed">
            Seu carrinho já possui itens de outro estabelecimento. 
            Deseja <span className="font-bold text-red-600">limpar o carrinho</span> para adicionar produtos de <span className="font-bold text-[#003B5C]">{newStoreName || 'esta loja'}</span>?
          </p>
          
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={onConfirm}
              className="w-full bg-[#003B5C] text-white py-4 rounded-2xl font-extrabold text-base hover:bg-[#005a8c] transition-all shadow-lg shadow-[#003B5C]/20 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Trash2 className="w-5 h-5" />
              Limpar e Adicionar
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold text-base hover:bg-slate-200 transition-all active:scale-[0.98]"
            >
              Manter carrinho atual
            </button>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
