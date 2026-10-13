import {createFileRoute} from '@tanstack/react-router';
import {ProductPage} from '@/components/product-page';
import {catalogOptions} from '@/lib/catalog.functions';
import {meta} from '@/lib/store';
export const Route=createFileRoute('/products/$productId')({head:()=>meta('Product','Choose your size and colour and add this VÉLIN piece to your bag.'),loader:({context})=>context.queryClient.ensureQueryData(catalogOptions()),component:P});
function P(){const{productId}=Route.useParams();return <ProductPage id={productId}/>;}
