export interface Product { id: string; name: string; category: string; price: number; unit: string; img: string; }
export interface Market { id: string; name: string; rating: number; deliveryTime: string; fee: number; img: string; categories: string[]; cityId: string; }
export interface CartItem extends Product { qty: number; }
export interface Order { id: string; date: string; total: number; status: 'Recebido' | 'Em separação' | 'Em entrega' | 'Entregue'; items: CartItem[]; marketName: string; }

export const CITIES = [
  { id: 'sao-paulo-sp', name: 'São Paulo, SP' },
  { id: 'salvador-ba', name: 'Salvador, BA' },
  { id: 'curitiba-pr', name: 'Curitiba, PR' }
];

export const MARKETS: Market[] = [
  { id: 'm1', cityId: 'sao-paulo-sp', name: 'FreshMercado Central', rating: 4.8, deliveryTime: '30-45', fee: 0, img: '🏪', categories: ['Hortifruti', 'Açougue', 'Bebidas'] },
  { id: 'm2', cityId: 'sao-paulo-sp', name: 'Super Bom (Paulista)', rating: 4.5, deliveryTime: '20-30', fee: 5.9, img: '🛒', categories: ['Mercearia', 'Limpeza', 'Padaria'] },
  { id: 'm3', cityId: 'salvador-ba', name: 'Atacadão Abaeté', rating: 4.9, deliveryTime: '45-60', fee: 9.9, img: '🏭', categories: ['Atacado', 'Bebidas'] },
  { id: 'm4', cityId: 'salvador-ba', name: 'Mercado Pelourinho', rating: 4.6, deliveryTime: '15-25', fee: 2.5, img: '🌴', categories: ['Mercearia', 'Feira'] },
  { id: 'm5', cityId: 'curitiba-pr', name: 'Mercado Barigui', rating: 4.7, deliveryTime: '30-50', fee: 5.0, img: '🌲', categories: ['Hortifruti', 'Orgânicos'] }
];

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Banana Nanica', category: 'Hortifruti', price: 5.9, unit: 'kg', img: '🍌' },
  { id: 'p2', name: 'Leite Integral', category: 'Laticínios', price: 4.5, unit: '1L', img: '🥛' },
  { id: 'p3', name: 'Pão Artesanal', category: 'Padaria', price: 12.9, unit: '500g', img: '🍞' },
  { id: 'p4', name: 'Patinho Moído', category: 'Açougue', price: 24.9, unit: '500g', img: '🥩' },
  { id: 'p5', name: 'Coca-Cola', category: 'Bebidas', price: 8.9, unit: '2L', img: '🥤' },
  { id: 'p6', name: 'Maçã Fuji', category: 'Hortifruti', price: 9.9, unit: 'kg', img: '🍎' },
  { id: 'p7', name: 'Detergente Ipê', category: 'Limpeza', price: 2.5, unit: '500ml', img: '🧼' },
  { id: 'p8', name: 'Croissant', category: 'Padaria', price: 7.9, unit: 'un', img: '🥐' },
];

export const PAST_ORDERS: Order[] = [
  { 
    id: 'ORD-1029', 
    date: '10/04/2026', 
    total: 39.70, 
    status: 'Entregue', 
    marketName: 'FreshMercado Central', 
    items: [{...PRODUCTS[0], qty:2}, {...PRODUCTS[3], qty:1}] 
  }
];
