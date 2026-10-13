import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {notify} from '@/lib/alerts';
import type {CartLine,Product} from '@/lib/types';
type State={cart:CartLine[];wishlist:string[];token:string;ready:boolean;quick:Product|null;setQuick:(p:Product|null)=>void;add:(p:Product,size:string,colour:string,quantity:number)=>Promise<void>;saveCart:(v:CartLine[])=>Promise<void>;toggleWish:(id:string)=>Promise<void>;clear:()=>void};
const Context=createContext<State|null>(null);
export function StoreProvider({children}:{children:ReactNode}){
 const[cart,setCart]=useState<CartLine[]>([]),[wishlist,setWishlist]=useState<string[]>([]),[token,setToken]=useState(''),[ready,setReady]=useState(false),[quick,setQuick]=useState<Product|null>(null);
 useEffect(()=>{
   const t=localStorage.getItem('velin-basket')??crypto.randomUUID();
   localStorage.setItem('velin-basket',t);
   setToken(t);
   const savedCart=localStorage.getItem('velin-cart');
   const savedWish=localStorage.getItem('velin-wishlist');
   if(savedCart)setCart(JSON.parse(savedCart));
   if(savedWish)setWishlist(JSON.parse(savedWish));
   setReady(true);
 },[]);
 async function saveCart(v:CartLine[]){
   try{
     localStorage.setItem('velin-cart',JSON.stringify(v));
     setCart(v);
   }catch(e){
     await notify('Could not update bag',e instanceof Error?e.message:'Please try again','error');
   }
 }
 async function add(p:Product,size:string,colour:string,quantity:number){
   const key=(x:CartLine)=>x.id===p._id&&x.size===size&&x.colour===colour;
   const exists=cart.find(key);
   const next=exists?cart.map(x=>key(x)?{...x,quantity:Math.min(99,x.quantity+quantity)}:x):[...cart,{id:p._id,size,colour,quantity}];
   try{
     await saveCart(next);
     setQuick(null);
     await notify('Added to your bag',p.name);
   }catch(e){
     await notify('Could not add product',e instanceof Error?e.message:'Please try again','error');
   }
 }
 async function toggleWish(id:string){
   const removing=wishlist.includes(id);
   try{
     const next=removing?wishlist.filter(x=>x!==id):[...wishlist,id];
     localStorage.setItem('velin-wishlist',JSON.stringify(next));
     setWishlist(next);
     await notify(removing?'Removed from wishlist':'Added to wishlist');
   }catch(e){
     await notify('Could not update wishlist',e instanceof Error?e.message:'Please try again','error');
   }
 }
 return <Context.Provider value={{cart,wishlist,token,ready,quick,setQuick,add,saveCart,toggleWish,clear:()=>setCart([])}}>{children}</Context.Provider>;
}
export function useStore(){const s=useContext(Context);if(!s)throw new Error('Store unavailable');return s;}
