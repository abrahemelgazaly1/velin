import {createFileRoute} from '@tanstack/react-router';
import {CatalogPage} from '@/components/catalog-page';
import {catalogOptions} from '@/lib/catalog.functions';
import {meta} from '@/lib/store';
export const Route=createFileRoute('/category/$category')({head:()=>meta('Crow-neck','The VÉLIN Crow-neck collection — clean everyday tops.'),loader:({context})=>context.queryClient.ensureQueryData(catalogOptions()),component:()=><CatalogPage category/>});
