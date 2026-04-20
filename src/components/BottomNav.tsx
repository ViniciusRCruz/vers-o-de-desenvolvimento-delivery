import React from 'react';
import { Home, Tag, ListOrdered, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function BottomNav() {
  const location = useLocation();
  const { isLoggedIn } = useAppContext();

  const navItems = [
    { label: 'Home', path: '/', icon: <Home className="w-6 h-6" /> },
    { label: 'Promoções', path: '/promocoes', icon: <Tag className="w-6 h-6" /> },
    { label: 'Pedidos', path: '/history', icon: <ListOrdered className="w-6 h-6" /> },
    { label: 'Conta', path: isLoggedIn ? '/auth' : '/login', icon: <User className="w-6 h-6" /> },
  ];

  // We don't want to show the bottom nav in specific screens like checkout or admin
  const hiddenPaths = ['/admin', '/checkout'];
  const isHidden = hiddenPaths.some(p => location.pathname.startsWith(p));

  if (isHidden) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          // Disable promotions link for now since we don't have the screen
          const isPromo = item.path === '/promocoes';

          return (
            <Link 
              key={item.label}
              to={isPromo ? '#' : item.path} 
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-green-600' : 'text-slate-500 hover:text-slate-800'} ${isPromo ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`${isActive ? 'scale-110 shadow-sm' : ''} transition-transform`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
