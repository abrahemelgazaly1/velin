import {createFileRoute} from '@tanstack/react-router';
import {CheckoutPage} from '@/components/checkout-page';
import {catalogOptions} from '@/lib/catalog.functions';
import {meta} from '@/lib/store';
export const Route=createFileRoute('/checkout')({head:()=>meta('Checkout','Complete your VÉLIN order — cash on delivery, InstaPay or Vodafone Cash.'),loader:({context})=>context.queryClient.ensureQueryData(catalogOptions()),component:CheckoutPage});
