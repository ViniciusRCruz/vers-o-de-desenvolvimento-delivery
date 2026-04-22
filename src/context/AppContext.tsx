import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Order, CITIES } from '../data/mockData';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface City { id: string; name: string; }

interface AppContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentUser(user);
        
        try {
          const docRef = doc(db, 'users', user.uid, 'private', 'info');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }

          // Check if System Admin
          if (user.email === 'vinissoba@gmail.com') {
             setIsSystemAdmin(true);
             const q = query(collection(db, 'markets'), where('isActive', '==', true));
             const mktSnap = await getDocs(q);
             const fetchedMarkets: any[] = [];
             mktSnap.forEach(d => fetchedMarkets.push({ id: d.id, ...d.data() }));
             setAdminMarkets(fetchedMarkets); 
          } else if (user.email) {
             const sysAdminDoc = await getDoc(doc(db, 'system_admins', user.email));
             if (sysAdminDoc.exists()) {
                 setIsSystemAdmin(true);
                 const q = query(collection(db, 'markets'), where('isActive', '==', true));
                 const mktSnap = await getDocs(q);
                 const fetchedMarkets: any[] = [];
                 mktSnap.forEach(d => fetchedMarkets.push({ id: d.id, ...d.data() }));
                 setAdminMarkets(fetchedMarkets);
             } else {
                 setIsSystemAdmin(false);
                 // Buscamos todas as lojas ativas (permitido pelas regras) e filtramos no cliente 
                 // para evitar erro de índice composto (array-contains + ==) no Firebase
                 const q = query(collection(db, 'markets'), where('isActive', '==', true));
                 const mktSnap = await getDocs(q);
                 const fetchedMarkets: any[] = [];
                 mktSnap.forEach(d => {
                     const data = d.data();
                     if (data.adminEmails && data.adminEmails.includes(user.email)) {
                         fetchedMarkets.push({ id: d.id, ...data });
                     }
                 });
                 setAdminMarkets(fetchedMarkets);
             }
          }

          // Fetch past orders
          const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
          const ordersSnap = await getDocs(q);
          const fetchedOrders: any[] = [];
          ordersSnap.forEach(docSnap => {
            fetchedOrders.push({ id: docSnap.id, ...docSnap.data() });
          });
          fetchedOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(fetchedOrders);
          
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setUserProfile(null);
        setIsSystemAdmin(false);
        setAdminMarkets([]);
        setOrders([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
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
    // Optimistic UI update
    setOrders([order, ...orders]);
    
    // Save to firebase omitted
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const cartCount = cart.reduce((count, item) => count + item.qty, 0);

  return (
    <AppContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount,
      isLoggedIn, currentUser, userProfile, login: () => {}, logout: () => firebaseSignOut(auth),
      orders, addOrder, selectedCity, setSelectedCity,
      isSystemAdmin, adminMarkets, updateAdminMarkets: setAdminMarkets
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
