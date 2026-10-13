import {createFileRoute} from '@tanstack/react-router';
import {WishlistPage} from '@/components/bag-pages';
import {catalogOptions} from '@/lib/catalog.functions';
import {meta} from '@/lib/store';
export const Route=createFileRoute('/wishlist')({head:()=>meta('Wishlist','Your saved VÉLIN pieces.'),loader:({context})=>context.queryClient.ensureQueryData(catalogOptions()),component:WishlistPage});
