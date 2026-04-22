import React, { useState } from 'react';
import { Search, MapPin, User, ShoppingCart, ListOrdered, ChevronDown, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CITIES } from '../data/mockData';

export default function Header() {
  const { cartCount, isLoggedIn, logout, selectedCity, setSelectedCity, isSystemAdmin, adminMarkets } = useAppContext();
  const navigate = useNavigate();
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  const hasAdminAccess = isSystemAdmin || adminMarkets.length > 0;

  return (
    <header className="bg-white px-6 md:px-10 h-20 flex items-center justify-between border-b border-slate-200 z-50 sticky top-0">
      <Link to="/" className="text-2xl font-extrabold text-green-600 tracking-tight flex items-center gap-2">
        FRESHMERCADO
      </Link>
      
      <div className="hidden md:flex relative w-full max-w-md mx-6">
        <input 
          type="text" 
          placeholder="Buscar mercados, produtos..." 
          className="w-full bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-5 rounded-full text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      </div>

      <div className="flex gap-4 md:gap-6 items-center">
        
        {/* City Selector */}
        <div className="relative">
          <button 
            onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
            className="flex items-center gap-1.5 md:gap-2 font-semibold text-sm text-slate-700 hover:text-green-600 transition-colors"
          >
            <MapPin className="w-5 h-5 text-green-600" /> 
            <span className="max-w-[100px] truncate md:max-w-none">{selectedCity.name}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isCityDropdownOpen && (
            <div className="absolute top-full mt-2 w-48 bg-white border border-slate-100 shadow-xl rounded-xl py-2 z-50 right-0 md:left-0">
              {CITIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCity(c); setIsCityDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${c.id === selectedCity.id ? 'bg-green-50 text-green-600' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoggedIn ? (
          <div className="flex items-center gap-2 md:gap-4">
            {hasAdminAccess && (
              <Link to="/admin" className="relative flex items-center gap-1.5 md:gap-2 font-bold text-xs md:text-sm text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                <ShieldAlert className="w-4 h-4 text-slate-500" /> <span className="hidden sm:inline">Painel</span>
              </Link>
            )}
            <Link to="/history" className="relative flex items-center gap-1.5 md:gap-2 font-semibold text-xs md:text-sm text-slate-700 hover:text-green-600 transition-colors">
              <ListOrdered className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Pedidos</span>
            </Link>
            <Link to="/auth" className="relative flex items-center gap-1.5 md:gap-2 font-semibold text-xs md:text-sm text-slate-700 hover:text-green-600 transition-colors">
              <User className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Perfil</span>
            </Link>
          </div>
        ) : (
          <Link to="/login" className="flex relative items-center gap-1.5 md:gap-2 font-semibold text-xs md:text-sm text-slate-700 hover:text-green-600 transition-colors">
            <User className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Entrar</span>
          </Link>
        )}

        <Link to="/checkout" className="relative flex items-center gap-2 font-semibold text-sm text-slate-700 hover:text-green-600 transition-colors">
          <div className="relative">
            <ShoppingCart className="w-6 h-6 md:w-5 md:h-5 text-slate-700" />
            {cartCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full absolute -top-2 -right-2 shadow-sm border-2 border-white animate-pulse">
                {cartCount}
              </span>
            )}
          </div>
          <span className="hidden md:inline">Carrinho</span>
        </Link>
      </div>
    </header>
  );
}
