import { createServerFn } from '@tanstack/react-start';
import { queryOptions } from '@tanstack/react-query';
import type { Product, Settings } from '@/lib/types';

// Mock data for when API is not available
const mockProducts = [
  {
    _id: '1',
    name: 'Black Crow-neck',
    description: 'Everyday comfort redefined',
    price: 4500,
    images: ['demo:black'],
    category: 'sweaters',
    colours: [{ name: 'Black', hex: '#000000' }],
    sizes: ['S', 'M', 'L', 'XL'],
    sold_out: false,
    sold_sizes: [],
    sold_colours: [],
    best_seller: true,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '2',
    name: 'White Crow-neck',
    description: 'Classic white for everyday wear',
    price: 4500,
    images: ['demo:white'],
    category: 'sweaters',
    colours: [{ name: 'White', hex: '#FFFFFF' }],
    sizes: ['S', 'M', 'L'],
    sold_out: false,
    sold_sizes: [],
    sold_colours: [],
    best_seller: false,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '3',
    name: 'Gray Crow-neck',
    description: 'Modern gray tones',
    price: 4500,
    images: ['demo:gray'],
    category: 'sweaters',
    colours: [{ name: 'Gray', hex: '#808080' }],
    sizes: ['S', 'M', 'L', 'XL'],
    sold_out: false,
    sold_sizes: [],
    sold_colours: [],
    best_seller: false,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockSettings: Settings = {
  instapay: 'InstaPay@velin',
  vodafone: '01012345678',
  instagram: 'https://instagram.com/velin',
  tiktok: 'https://tiktok.com/@velin',
  delivery: 'Fast delivery within 3-5 business days',
};

export const getCatalog = createServerFn({method:'GET'}).handler(async()=>{
 // On Vercel, API_URL is provided via service binding to the internal server URL
 // In development, falls back to localhost
 const apiUrl = process.env['API_URL'] || 'http://localhost:3000/api';
 
 try{
   const [productsRes,settingsRes]=await Promise.all([
     fetch(`${apiUrl}/products`),
     fetch(`${apiUrl}/settings`)
   ]);
   
   const productsData=await productsRes.json();
   const settingsData=await settingsRes.json();
   
   return {
     products: productsData.data||mockProducts,
     settings: settingsData.data||mockSettings
   };
 }catch(error){
   console.warn('[Catalog] API not available, returning mock data', error);
   return {
     products: mockProducts,
     settings: mockSettings
   };
 }
});

export const catalogOptions=()=>queryOptions({queryKey:['catalog'],queryFn:()=>getCatalog(),staleTime:60000});
