import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Order, CITIES } from '../data/mockData';
import { supabase } from '../lib/supabase';

interface City { id: string; name: string; }

interface AppContextType {
  cart: CartItem[];
  addToCart: (product: Product, qty?: number, observation?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isLoggedIn: boolean;
  currentUser: any;
  userProfile: any;
  login: () => void;
  logout: () => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  selectedCity: City;
  setSelectedCity: (city: City) => void;
  
  // Admin Context
  isSystemAdmin: boolean;
  adminMarkets: any[];
  isAdminDataLoaded: boolean;
  updateAdminMarkets: (markets: any[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Admin States
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [adminMarkets, setAdminMarkets] = useState<any[]>([]);
  const [isAdminDataLoaded, setIsAdminDataLoaded] = useState(false);

  const [selectedCity, setSelectedCityState] = useState<City>(() => {
    const saved = localStorage.getItem('app_city');
    if (saved) return JSON.parse(saved);
    return CITIES[0];
  });

  const setSelectedCity = (city: City) => {
    setSelectedCityState(city);
    localStorage.setItem('app_city', JSON.stringify(city));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
       handleAuthChange(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
       handleAuthChange(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = async (user: any) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentUser(user);
        
        try {
          const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
          if (profile) {
            setUserProfile(profile);
          }

          const email = user.email || '';
          let isSysAdmin = false;
          
          if (email === 'vinissoba@gmail.com') {
             isSysAdmin = true;
          } else {
             const { data: sysAdmin } = await supabase.from('system_admins').select('email').eq('email', email).single();
             if (sysAdmin) isSysAdmin = true;
          }

          setIsSystemAdmin(isSysAdmin);

          // Fetch markets
          if (isSysAdmin) {
             const { data: markets } = await supabase.from('markets').select('*').eq('isActive', true);
             setAdminMarkets(markets || []);
          } else {
             const { data: markets } = await supabase.from('markets').select('*').eq('isActive', true).contains('adminEmails', [email]);
             setAdminMarkets(markets || []);
          }
          
          setIsAdminDataLoaded(true);

          // Fetch past orders
          const { data: userOrders } = await supabase.from('orders').select('*').eq('userId', user.id).order('created_at', { ascending: false });
          if(userOrders) {
             // Rename created_at to createdAt to match frontend models
             const mappedOrders = userOrders.map((o: any) => ({
                 ...o,
                 createdAt: o.created_at,
                 updatedAt: o.updated_at
             }));
             setOrders(mappedOrders);
          }
          
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setUserProfile(null);
        setIsSystemAdmin(false);
        setAdminMarkets([]);
        setIsAdminDataLoaded(false);
        setOrders([]);
      }
  };

  const login = () => {
     supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const logout = () => {
     supabase.auth.signOut();
  };

  const addToCart = (product: Product, qty: number = 1, observation?: string) => {
    setCart(prev => {
      // Items with observations are always unique lines
      const cartKey = observation ? `${product.id}_obs_${Date.now()}` : product.id;
      
      if (!observation) {
        const existing = prev.find(item => item.id === product.id && !item.observation);
        if (existing) {
          return prev.map(item => item.id === product.id && !item.observation ? { ...item, qty: item.qty + qty } : item);
        }
      }
      return [...prev, { ...product, id: cartKey, originalId: product.id, qty, observation: observation || '' }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const addOrder = async (order: Order) => {
    setOrders([order, ...orders]);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const cartCount = cart.reduce((count, item) => count + item.qty, 0);

  return (
    <AppContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount,
      isLoggedIn, currentUser, userProfile, login, logout,
      orders, addOrder, selectedCity, setSelectedCity,
      isSystemAdmin, adminMarkets, updateAdminMarkets: setAdminMarkets, isAdminDataLoaded
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
