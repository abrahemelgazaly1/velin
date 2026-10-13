import black from '@/assets/black-crew.jpg';
import white from '@/assets/white-crew.jpg';
import gray from '@/assets/gray-crew.jpg';
import campaign from '@/assets/campaign.jpg';
import type { Product, Colour } from '@/lib/types';

export type CartLine = { id: string; size: string; colour: string; quantity: number };
export const imageMap: Record<string,string> = {'demo:black':black,'demo:white':white,'demo:gray':gray,'demo:campaign':campaign};

export const productImage = (src?: string | { data: string; contentType: string }) => {
  if (!src) return black;
  if (typeof src === 'string') return imageMap[src] ?? src;
  if (typeof src === 'object' && src.data && src.contentType) {
    return `data:${src.contentType};base64,${src.data}`;
  }
  return black;
};

export const coloursOf = (p: Product): Colour[] => Array.isArray(p.colours) ? p.colours.filter((c): c is Colour => typeof c==='object' && c!==null && 'name' in c && 'hex' in c && typeof (c as Colour).name==='string' && typeof (c as Colour).hex==='string') : [];
export const money = (n: number) => `${n.toLocaleString('en-EG',{maximumFractionDigits:2})} EGY`;
export const meta = (title: string, description: string) => ({meta:[{title:`${title} — VÉLIN`},{name:'description',content:description},{property:'og:title',content:`${title} — VÉLIN`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]});
