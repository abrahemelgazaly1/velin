import {useState} from 'react';
import {Link,useNavigate} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {ArrowUpRight,Copy,Check} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import api from '@/lib/api';
import {useStore} from './store-context';
import {SummaryItems,SummaryRows,Empty} from './bag-pages';
import {catalogOptions} from '@/lib/catalog.functions';
import {notify} from '@/lib/alerts';
import {money} from '@/lib/store';

const GOVS=['Cairo','Giza','Alexandria','Qalyubia','Dakahlia','Sharqia','Gharbia','Monufia','Beheira','Kafr El Sheikh','Damietta','Port Said','Ismailia','Suez','Faiyum','Beni Suef','Minya','Asyut','Sohag','Qena','Luxor','Aswan','Red Sea','New Valley','Matrouh','North Sinai','South Sinai'];

export function CheckoutPage(){
 const store=useStore(),{data}=useSuspenseQuery(catalogOptions()),nav=useNavigate();
 const[f,setF]=useState({name:'',governorate:'',address:'',phone1:'',phone2:''});
 const[method,setMethod]=useState<'cod'|'instapay'|'vodafone'>('cod');
 const[promo,setPromo]=useState(''),[pct,setPct]=useState(0),[applied,setApplied]=useState('');
 const[sender,setSender]=useState(''),[amount,setAmount]=useState(''),[file,setFile]=useState<File|null>(null);
 const[busy,setBusy]=useState(false),[request]=useState(()=>crypto.randomUUID());
 const[showTransfer,setShowTransfer]=useState(false),[copied,setCopied]=useState(false);
 const subtotal=store.cart.reduce((n,x)=>n+(data.products.find(p=>p._id===x.id)?.price??0)*x.quantity,0);
 const discount=Math.round(subtotal*pct)/100;const total=subtotal+110-discount;
 const s=data.settings||{};const recipient=method==='instapay'?(s.instapay||''):method==='vodafone'?(s.vodafone||''):'';
 const needsTransfer=method!=='cod';
 const set=(k:keyof typeof f)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setF({...f,[k]:k.startsWith('phone')?e.target.value.replace(/\D/g,'').slice(0,10):e.target.value});
 
 async function apply(){if(!promo.trim())return;try{const{data}=await api.post('/promo-codes/check',{code:promo});if(!data||!data.discount){setPct(0);setApplied('');await notify('Invalid promo code','This code has expired or reached its limit.','error');return;}setPct(data.discount);setApplied(promo.trim().toUpperCase());await notify('Promo applied',`${data.discount}% off your products.`);}catch(err:any){setPct(0);setApplied('');await notify('Invalid promo code','This code has expired or reached its limit.','error');}}
 
 async function copyRecipient(){
   if(!recipient)return;
   await navigator.clipboard.writeText(recipient);
   setCopied(true);
   setTimeout(()=>setCopied(false),2000);
   await notify('Copied!','Account number copied to clipboard.');
 }
 
 function continueToPayment(){
   if(f.name.trim().length<2||!f.governorate||f.address.trim().length<5||f.phone1.length!==10||f.phone2.length!==10){
     notify('Complete your details','Please fill in all fields. Phone numbers need 10 digits after +20.','info');
     return;
   }
   if(needsTransfer&&!recipient){
     notify('Payment method unavailable','This payment method is not configured yet. Please choose cash on delivery.','info');
     return;
   }
   if(needsTransfer){
     setShowTransfer(true);
   }
 }
 
 async function submit(e:React.FormEvent){e.preventDefault();
  if(method==='cod'){
    if(f.name.trim().length<2||!f.governorate||f.address.trim().length<5||f.phone1.length!==10||f.phone2.length!==10){await notify('Complete your details','Please fill in all fields. Phone numbers need 10 digits after +20.','info');return;}
  }else{
    if(!sender.trim()||!amount||!file){await notify('Complete transfer details','Add the sender, amount and a screenshot.','info');return;}
  }
  
  setBusy(true);try{let transfer=null;
   if(method!=='cod'&&file){const ext=(file.name.split('.').pop()??'').toLowerCase();if(!['jpg','jpeg','png','webp'].includes(ext))throw new Error('Screenshot must be JPG, PNG or WEBP');const formData=new FormData();formData.append('screenshot',file);const uploadRes=await api.post('/upload',formData,{headers:{'Content-Type':'multipart/form-data'}});transfer={sender:sender.trim(),amount,screenshot:{data:uploadRes.data.data,contentType:uploadRes.data.contentType}};}
   const orderData={
     token:store.token,
     request_id:request,
     personal:JSON.stringify({name:f.name.trim(),governorate:f.governorate,address:f.address.trim(),phone1:'+20'+f.phone1,phone2:'+20'+f.phone2}),
     payment_method:method,
     promo:applied,
     transfer:transfer?JSON.stringify(transfer):null,
     items:JSON.stringify(store.cart.map(x=>{
       const p=data.products.find(prod=>prod._id===x.id);
       return{productId:x.id,name:p?.name||'',size:x.size,colour:x.colour,quantity:x.quantity,price:p?.price||0,image:p?.images?.[0]||null};
     })),
     subtotal,
     shipping:110,
     discount,
     total
   };
   await api.post('/orders',orderData);
   store.clear();await notify('Order placed!','Thank you for shopping with VÉLIN. We will contact you to confirm delivery.');nav({to:'/'});
  }catch(err:any){await notify('Could not place order',err.response?.data?.error||err instanceof Error?err.message:'Please try again','error');}finally{setBusy(false);}
 }
 
 if(store.ready&&!store.cart.length)return <main className="page"><h1 className="page-title">Checkout</h1><Empty/></main>;
 
 return <main className="max-w-[1280px] mx-auto px-[5%] py-[55px] pb-[85px] min-h-[60vh]">
   <div className="text-[10px] tracking-[1.5px] text-muted-foreground mb-3">ALMOST YOURS</div>
   <h1 className="text-[45px] font-display font-semibold mb-[35px]">Checkout</h1>
   <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start max-w-[1200px] mx-auto">
  
  {/* Order Summary - يظهر أولاً */}
  <aside className="order-summary"><h2>Order summary</h2><SummaryItems cart={store.cart} products={data.products}/>
   <div className="flex gap-2 my-4"><Input placeholder="Promo code" value={promo} onChange={e=>setPromo(e.target.value)}/><Button type="button" variant="outline" onClick={apply}>APPLY</Button></div>
   <SummaryRows subtotal={subtotal} discount={discount}/>
   <Link to="/cart" className="underlined-link block mt-4 text-center">BACK TO BAG</Link>
  </aside>

  {/* Payment Transfer Modal */}
  {showTransfer&&needsTransfer&&<div className="fixed inset-0 bg-overlay z-50 flex items-center justify-center p-4" onClick={()=>setShowTransfer(false)}>
    <div className="bg-background max-w-md w-full p-8 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
      <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
      <div className="space-y-4">
        <div className="bg-muted p-4 rounded">
          <p className="text-sm text-muted-foreground mb-2">{method==='instapay'?'InstaPay Account':'Vodafone Cash Number'}</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-bold">{recipient}</p>
            <Button type="button" variant="outline" size="icon" onClick={copyRecipient}>
              {copied?<Check className="h-4 w-4"/>:<Copy className="h-4 w-4"/>}
            </Button>
          </div>
          <p className="text-sm mt-2">Amount: <span className="font-bold">{money(total)}</span></p>
        </div>
        
        <form onSubmit={submit} className="space-y-4">
          <div><Label htmlFor="sender">Sender name / mobile number</Label><Input id="sender" maxLength={80} value={sender} onChange={e=>setSender(e.target.value)} required/></div>
          <div><Label htmlFor="amount">Amount sent (EGY)</Label><Input id="amount" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))} required/></div>
          <div><Label htmlFor="shot">Upload transfer screenshot</Label><Input id="shot" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setFile(e.target.files?.[0]??null)} required/>{file&&<p className="text-xs text-muted-foreground mt-1">{file.name}</p>}</div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="shop-button flex-1" disabled={busy||!sender.trim()||!amount||!file}>{busy?'PLACING ORDER…':'PAY NOW'} <ArrowUpRight/></Button>
            <Button type="button" variant="outline" onClick={()=>setShowTransfer(false)}>CANCEL</Button>
          </div>
        </form>
      </div>
    </div>
  </div>}

  {/* Checkout Form */}
  <form className="space-y-8" onSubmit={submit}>
    <section className="space-y-4"><h2 className="text-xl font-bold uppercase">Personal information</h2>
     <div><Label htmlFor="name">Full name</Label><Input id="name" maxLength={80} value={f.name} onChange={set('name')}/></div>
     <div><Label htmlFor="gov">Governorate</Label><select id="gov" className="w-full h-10 border px-3 bg-background" value={f.governorate} onChange={set('governorate')}><option value="">Select governorate</option>{GOVS.map(g=><option key={g}>{g}</option>)}</select></div>
     <div><Label htmlFor="addr">Address</Label><Input id="addr" maxLength={300} value={f.address} onChange={set('address')}/></div>
     {(['phone1','phone2'] as const).map((k,i)=><div key={k}><Label htmlFor={k}>{i?'Second phone number':'Phone number'}</Label><div className="flex"><span className="h-10 px-3 border border-r-0 flex items-center font-bold">+20</span><Input id={k} inputMode="numeric" placeholder="1XXXXXXXXX" value={f[k]} onChange={set(k)}/></div></div>)}
    </section>
    
    <section className="space-y-3"><h2 className="text-xl font-bold uppercase">Payment method</h2>
     {([['cod','Cash on delivery'],['instapay','InstaPay'],['vodafone','Vodafone Cash']] as const).map(([v,l])=><label key={v} className={`flex items-center gap-3 border p-4 cursor-pointer ${method===v?'border-foreground bg-muted':''}`}><input type="radio" name="pay" checked={method===v} onChange={()=>setMethod(v)}/>{l}</label>)}
    </section>

    {/* Pay Button */}
    {needsTransfer?
      <Button type="button" className="shop-button w-full" onClick={continueToPayment}>CONTINUE TO PAYMENT <ArrowUpRight/></Button>
      :
      <Button type="submit" className="shop-button w-full" disabled={busy||!store.ready}>{busy?'PLACING ORDER…':'PLACE ORDER'} <ArrowUpRight/></Button>
    }
  </form>
 </div></main>;
}
