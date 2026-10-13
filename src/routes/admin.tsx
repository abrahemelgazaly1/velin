import {createFileRoute} from '@tanstack/react-router';
import {AdminPage} from '@/components/admin-page';
export const Route=createFileRoute('/admin')({ssr:false,head:()=>({meta:[{title:'Admin — VÉLIN'},{name:'description',content:'VÉLIN store administration.'},{name:'robots',content:'noindex'},{property:'og:title',content:'Admin — VÉLIN'},{property:'og:description',content:'VÉLIN store administration.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:AdminPage});
