export type Colour = { name: string; hex: string };
export type CartLine = { id: string; size: string; colour: string; quantity: number };

export interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  sizes: string[];
  colours: Colour[];
  category: string;
  best_seller: boolean;
  sold_out: boolean;
  sold_sizes: string[];
  sold_colours: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  items: any[];
  personal: any;
  payment_method: string;
  transfer: any;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  promo: string | null;
  status: string;
  createdAt: string;
}

export interface PromoCode {
  _id: string;
  code: string;
  discount: number;
  expires_at: string;
  max_uses: number;
  uses: number;
  createdAt: string;
}

export interface Settings {
  instapay: string;
  vodafone: string;
  instagram: string;
  tiktok: string;
  delivery: string;
}
