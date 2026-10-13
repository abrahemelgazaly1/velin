import {createFileRoute} from '@tanstack/react-router';
import {CatalogPage} from '@/components/catalog-page';
import {catalogOptions} from '@/lib/catalog.functions';
import {meta} from '@/lib/store';
export const Route=createFileRoute('/products/')({head:()=>meta('Products','Shop every VÉLIN piece — search and sort the full collection.'),loader:({context})=>context.queryClient.ensureQueryData(catalogOptions()),component:()=><CatalogPage/>});
