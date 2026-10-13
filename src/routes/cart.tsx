import {createFileRoute} from '@tanstack/react-router';
import {CartPage} from '@/components/bag-pages';
import {catalogOptions} from '@/lib/catalog.functions';
import {meta} from '@/lib/store';
export const Route=createFileRoute('/cart')({head:()=>meta('Shopping bag','Review your VÉLIN bag before checkout.'),loader:({context})=>context.queryClient.ensureQueryData(catalogOptions()),component:CartPage});
