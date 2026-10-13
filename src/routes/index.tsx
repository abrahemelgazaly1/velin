import {createFileRoute} from '@tanstack/react-router';
import {HomePage} from '@/components/home-page';
import {catalogOptions} from '@/lib/catalog.functions';
import {meta} from '@/lib/store';
export const Route=createFileRoute('/')({head:()=>meta('Everyday. Redefined.','VÉLIN — bold everyday essentials: hoodies, pants and tees in black and white.'),loader:({context})=>context.queryClient.ensureQueryData(catalogOptions()),component:HomePage});
