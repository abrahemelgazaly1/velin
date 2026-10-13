import {useEffect,useState} from 'react';
import {Trash2,LogOut,Plus,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Tabs,TabsContent,TabsList,TabsTrigger} from '@/components/ui/tabs';
import api from '@/lib/api';
import {notify,confirmDelete} from '@/lib/alerts';
import {money,productImage} from '@/lib/store';
import type { Product, Colour, Order, PromoCode } from '@/lib/types';

const msg=(e:unknown)=>e instanceof Error?e.message:'Please try again';

export function AdminPage(){
 const[state,setState]=useState<'loading'|'out'|'denied'|'in'>('loading');
 
 async function check(){
   try{
     const token=localStorage.getItem('admin_token');
     if(!token){
       setState('out');
       return;
     }
     const response=await api.get('/auth/me');
     if(response.data.role==='admin'){
       setState('in');
     }else{
       setState('denied');
     }
   }catch{
     setState('out');
   }
 }
 
 useEffect(()=>{void check();},[]);
 
 if(state==='loading')return <main className="page"><p>Loading…</p></main>;
 if(state!=='in')return <Login denied={state==='denied'} onDone={check}/>;
 
 return <main className="admin-page">
   <div className="admin-header">
     <h1>VÉLIN Admin</h1>
     <Button variant="outline" size="sm" onClick={async()=>{
       localStorage.removeItem('admin_token');
       setState('out');
     }}>
       <LogOut className="w-4 h-4 mr-2"/>SIGN OUT
     </Button>
   </div>
   <Tabs defaultValue="add">
     <div className="admin-scroll-wrapper">
       <TabsList className="admin-tabs-scroll">
         <TabsTrigger value="add">Add Product</TabsTrigger>
         <TabsTrigger value="manage">Manage Products</TabsTrigger>
         <TabsTrigger value="orders">Orders</TabsTrigger>
         <TabsTrigger value="promo">Promo Codes</TabsTrigger>
         <TabsTrigger value="settings">Settings</TabsTrigger>
       </TabsList>
     </div>
     <TabsContent value="add"><ProductForm/></TabsContent>
     <TabsContent value="manage"><Manage/></TabsContent>
     <TabsContent value="orders"><Orders/></TabsContent>
     <TabsContent value="promo"><Promos/></TabsContent>
     <TabsContent value="settings"><Settings/></TabsContent>
   </Tabs>
 </main>;
}

function Login({denied,onDone}:{denied:boolean;onDone:()=>void}){
 const[email,setEmail]=useState('');
 const[pw,setPw]=useState('');
 const[busy,setBusy]=useState(false);
 
 return <main className="login-page">
   <div className="login-container">
     <h1>VÉLIN Admin</h1>
     <p className="login-subtitle">Sign in to manage your store</p>
     {denied&&<p className="text-destructive mb-4">No admin access</p>}
     <form className="login-form" onSubmit={async e=>{
       e.preventDefault();
       setBusy(true);
       try{
         const response=await api.post('/auth/login',{email,password:pw});
         localStorage.setItem('admin_token',response.data.token);
         onDone();
       }catch(err:any){
         await notify('Login failed',err.response?.data?.error||'Login failed','error');
       }finally{
         setBusy(false);
       }
     }}>
       <div className="form-group"><Label htmlFor="em">Email</Label><Input id="em" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@velin.com" required/></div>
       <div className="form-group"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" required/></div>
       <Button className="shop-button w-full" type="submit" disabled={busy}>{busy?'SIGNING IN…':'SIGN IN'}</Button>
     </form>
   </div>
 </main>;
}

function useRefresh(){return()=>{};}

function ProductForm({product,onSaved}:{product?:Product;onSaved?:()=>void}){
 const refresh=useRefresh();
 const[name,setName]=useState(product?.name??'');
 const[price,setPrice]=useState(String(product?.price??''));
 const[desc,setDesc]=useState(product?.description??'');
 const[sizes,setSizes]=useState<string[]>(product?.sizes??[]);
 const[sizeInput,setSizeInput]=useState('');
 const[colours,setColours]=useState<Colour[]>(product?.colours??[{name:'Black',hex:'#000000'}]);
 const[category,setCategory]=useState(product?.category??'crow-neck');
 const[best,setBest]=useState(product?.best_seller??false);
 const[files,setFiles]=useState<FileList|null>(null);
 const[previewUrls,setPreviewUrls]=useState<string[]>([]);
 const[busy,setBusy]=useState(false);
 
 function addSize(){
   if(!sizeInput.trim())return;
   const s=sizeInput.trim().toUpperCase();
   if(sizes.includes(s)){notify('Size exists','','info');return;}
   setSizes([...sizes,s]);
   setSizeInput('');
 }
 
 function handleFileSelect(e:React.ChangeEvent<HTMLInputElement>){
   const selected=e.target.files;
   if(selected){
     setFiles(selected);
     const urls=Array.from(selected).map(f=>URL.createObjectURL(f));
     setPreviewUrls(urls);
   }
 }
 
 function removePreview(index:number){
   setPreviewUrls(previewUrls.filter((_,i)=>i!==index));
   if(files){
     const dt=new DataTransfer();
     Array.from(files).forEach((f,i)=>{if(i!==index)dt.items.add(f)});
     setFiles(dt.files);
   }
 }
 
 async function save(e:React.FormEvent){
   e.preventDefault();
   const p=Number(price);
   if(!name.trim()||!(p>0)||!sizes.length||!colours.length){
     await notify('Missing details','Fill all required fields.','info');
     return;
   }
   if(!product&&!files?.length){await notify('Add images','','info');return;}
   setBusy(true);
   try{
     const formData=new FormData();
     formData.append('name',name.trim());
     formData.append('price',String(p));
     formData.append('description',desc);
     formData.append('sizes',JSON.stringify(sizes));
     formData.append('colours',JSON.stringify(colours));
     formData.append('category',category);
     formData.append('best_seller',String(best));
     formData.append('sold_out',String(product?.sold_out??false));
     formData.append('sold_sizes',JSON.stringify(product?.sold_sizes??[]));
     formData.append('sold_colours',JSON.stringify(product?.sold_colours??[]));
     
     if(files?.length){
       Array.from(files).forEach(f=>formData.append('images',f));
     }
     
     if(product){
       await api.put(`/products/${product._id}`,formData,{headers:{'Content-Type':'multipart/form-data'}});
     }else{
       await api.post('/products',formData,{headers:{'Content-Type':'multipart/form-data'}});
     }
     
     await refresh();
     await notify(product?'Updated':'Added',name);
     if(!product){
       setName('');setPrice('');setDesc('');setSizes([]);setColours([{name:'Black',hex:'#000000'}]);setCategory('crow-neck');setBest(false);setFiles(null);setPreviewUrls([]);
     }
     onSaved?.();
   }catch(err:any){await notify('Error',err.response?.data?.error||msg(err),'error');}finally{setBusy(false);}
 }
 
 return <form className="admin-form" onSubmit={save}>
   <h2>Product Information</h2>
   <div className="space-y-4">
     <div><Label className="form-label">Product Name</Label><Input placeholder="Black Crew Neck" value={name} onChange={e=>setName(e.target.value)} className="form-field"/></div>
     <div><Label className="form-label">Price (EGY)</Label><Input placeholder="350" inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value.replace(/[^0-9.]/g,''))} className="form-field"/></div>
     <div><Label className="form-label">Description</Label><Textarea placeholder="Classic everyday essential..." value={desc} onChange={e=>setDesc(e.target.value)} className="form-field"/></div>
     <div><Label className="form-label">Category</Label><select value={category} onChange={e=>setCategory(e.target.value)} className="form-field"><option value="crow-neck">Crow Neck</option><option value="v-neck">V-Neck</option><option value="hoodie">Hoodie</option><option value="sweatshirt">Sweatshirt</option><option value="t-shirt">T-Shirt</option></select></div>
     
     <div>
       <Label className="form-label">Available Sizes</Label>
       <div className="chips mb-3">
         {sizes.map((s,i)=><Button key={i} type="button" variant="outline" size="sm" onClick={()=>setSizes(sizes.filter((_,j)=>j!==i))}>{s}<X className="w-3 h-3 ml-1"/></Button>)}
       </div>
       <div className="inline-fields">
         <Input placeholder="Size (e.g. XL)" value={sizeInput} onChange={e=>setSizeInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addSize();}}} className="form-field"/>
         <Button type="button" onClick={addSize}><Plus className="w-4 h-4"/>ADD</Button>
       </div>
     </div>
     
     <div>
       <Label className="form-label">Available Colours</Label>
       {colours.map((c,i)=><div key={i} className="inline-fields mb-2">
         <input type="color" value={c.hex} onChange={e=>setColours(colours.map((x,j)=>j===i?{...x,hex:e.target.value}:x))} className="w-12 h-10 border rounded cursor-pointer"/>
         <Input placeholder="Colour name" value={c.name} onChange={e=>setColours(colours.map((x,j)=>j===i?{...x,name:e.target.value}:x))} className="form-field flex-1"/>
         <Button type="button" variant="ghost" size="icon" onClick={()=>setColours(colours.filter((_,j)=>j!==i))}><Trash2 className="w-4 h-4"/></Button>
       </div>)}
       <Button type="button" variant="outline" onClick={()=>setColours([...colours,{name:'',hex:'#ffffff'}])}><Plus className="w-4 h-4"/>ADD COLOUR</Button>
     </div>
     
     <div>
       <Label className="form-label">Product Images{product?' (optional)':''}</Label>
       <p className="text-xs text-muted-foreground mb-2">Upload unlimited images</p>
       <Input type="file" multiple accept="image/*" onChange={handleFileSelect} className="form-field"/>
       {previewUrls.length>0&&<div className="image-preview-grid">
         {previewUrls.map((url,i)=><div key={i} className="image-preview-item">
           <img src={url} alt={`Preview ${i+1}`}/>
           <button type="button" onClick={()=>removePreview(i)}><X className="w-3 h-3"/></button>
         </div>)}
       </div>}
       {files&&<p className="text-xs text-muted-foreground mt-2">{files.length} image(s) selected</p>}
     </div>
     
     <label className="flex items-center gap-2 cursor-pointer">
       <input type="checkbox" checked={best} onChange={e=>setBest(e.target.checked)} className="w-4 h-4"/>
       <span className="text-sm font-medium">Mark as Best Seller</span>
     </label>
     
     <Button type="submit" className="shop-button" disabled={busy}>{busy?'SAVING…':product?'UPDATE PRODUCT':'ADD PRODUCT'}</Button>
   </div>
 </form>;
}

function Manage(){
 const refresh=useRefresh();
 const[list,setList]=useState<Product[]>([]);
 const[edit,setEdit]=useState<string|null>(null);
 const[search,setSearch]=useState('');
 const[filterCategory,setFilterCategory]=useState('all');
 
 async function load(){
   try{
     const{data}=await api.get('/products');
     setList(data.data??[]);
   }catch(err){console.error(err);}
 }
 useEffect(()=>{void load();},[]);

 async function patch(id:string,v:Partial<Product>){
   try{
     // Get the full product first to preserve existing data
     const {data: currentProduct} = await api.get(`/products/${id}`);
     
     // Prepare FormData for multipart/form-data
     const formData = new FormData();
     
     // Merge current product with updates
     const merged = { ...currentProduct, ...v };
     
     formData.append('name', merged.name);
     formData.append('price', String(merged.price));
     formData.append('description', merged.description || '');
     formData.append('sizes', JSON.stringify(merged.sizes));
     formData.append('colours', JSON.stringify(merged.colours));
     formData.append('category', merged.category);
     formData.append('best_seller', String(merged.best_seller));
     formData.append('sold_out', String(merged.sold_out));
     formData.append('sold_sizes', JSON.stringify(merged.sold_sizes || []));
     formData.append('sold_colours', JSON.stringify(merged.sold_colours || []));
     
     await api.put(`/products/${id}`, formData, {
       headers: { 'Content-Type': 'multipart/form-data' }
     });
     
     await load();
     await refresh();
   }catch(err:any){
     console.error('Patch error:', err.response?.data || err);
     await notify('Error',err.response?.data?.error||'Error','error');
   }
 }

 const tog=(a:string[],v:string)=>a.includes(v)?a.filter(x=>x!==v):[...a,v];

 const filteredList=list.filter(p=>{
   const matchesSearch=p.name.toLowerCase().includes(search.toLowerCase());
   const matchesCategory=filterCategory==='all'||p.category===filterCategory;
   return matchesSearch&&matchesCategory;
 });

 return <div className="manage-products-list">
   <div className="manage-toolbar">
     <Input placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)} className="search-input"/>
     <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} className="filter-select">
       <option value="all">All Categories</option>
       <option value="crow-neck">Crow Neck</option>
       <option value="v-neck">V-Neck</option>
       <option value="hoodie">Hoodie</option>
       <option value="sweatshirt">Sweatshirt</option>
       <option value="t-shirt">T-Shirt</option>
     </select>
   </div>
   {!filteredList.length&&<div className="empty-state"><p>No products found.</p></div>}
   {filteredList.map(p=><div key={p._id} className="product-manage-card">
     <div className="product-manage-layout">
       <img src={productImage(p.images[0])} alt={p.name} className="product-manage-img"/>
       
       <div className="product-manage-content">
         <div className="product-manage-header">
           <h3>{p.name}</h3>
           <p className="product-manage-price">{money(p.price)}</p>
         </div>
         
         <div className="product-manage-badges">
           {p.best_seller&&<span className="product-badge badge-best">BEST SELLER</span>}
           {p.sold_out&&<span className="product-badge badge-sold">SOLD OUT</span>}
         </div>
         
         <div className="product-manage-controls">
           <label className="checkbox-label">
             <input type="checkbox" checked={p.sold_out} onChange={()=>patch(p._id,{sold_out:!p.sold_out})}/>
             <span>Sold Out</span>
           </label>
           
           <label className="checkbox-label">
             <input type="checkbox" checked={p.best_seller} onChange={()=>patch(p._id,{best_seller:!p.best_seller})}/>
             <span>Best Seller</span>
           </label>
         </div>
         
         <div className="sold-options">
           <div>
             <p className="sold-label">Sold Out Sizes:</p>
             <div className="chips">
               {p.sizes.map(s=><Button key={s} type="button" size="sm" variant={p.sold_sizes.includes(s)?'default':'outline'} onClick={()=>patch(p._id,{sold_sizes:tog(p.sold_sizes,s)})}>{s}</Button>)}
             </div>
           </div>
           
           <div>
             <p className="sold-label">Sold Out Colours:</p>
             <div className="chips">
               {p.colours.map(c=><Button key={c.name} type="button" size="sm" variant={p.sold_colours.includes(c.name)?'default':'outline'} onClick={()=>patch(p._id,{sold_colours:tog(p.sold_colours,c.name)})}>{c.name}</Button>)}
             </div>
           </div>
         </div>
       </div>
       
       <div className="product-manage-actions">
         <Button variant="outline" size="sm" onClick={()=>setEdit(edit===p._id?null:p._id)}>{edit===p._id?'CLOSE':'EDIT'}</Button>
         <Button variant="outline" size="sm" onClick={async()=>{
           if(!await confirmDelete(`Delete ${p.name}?`))return;
           try{
             await api.delete(`/products/${p._id}`);
             await load();await refresh();
           }catch(err:any){await notify('Error',err.response?.data?.error||'Error','error');}
         }}><Trash2 className="w-4 h-4"/></Button>
       </div>
     </div>
     {edit===p._id&&<div className="product-edit-form"><ProductForm product={p} onSaved={()=>{setEdit(null);void load();}}/></div>}
   </div>)}
 </div>;
}

function Orders(){
 const[list,setList]=useState<Order[]>([]);
 const[viewingScreenshot,setViewingScreenshot]=useState<string|null>(null);
 
 async function load(){
   try{
     const{data}=await api.get('/orders');
     setList(data.data??[]);
   }catch(err){console.error(err);}
 }
 useEffect(()=>{void load();},[]);
 
 async function proof(imageData:any){
   if(!imageData) {
     await notify('No screenshot', 'No payment screenshot was uploaded.', 'info');
     return;
   }
   
   try {
     let base64String = '';
     
     // Check if imageData is an object with data property
     if(typeof imageData === 'object' && imageData !== null && imageData.data) {
       const contentType = imageData.contentType || 'image/webp';
       base64String = `data:${contentType};base64,${imageData.data}`;
       setViewingScreenshot(base64String);
     } 
     // Check if imageData is a string
     else if(typeof imageData === 'string') {
       if(imageData.startsWith('data:')) {
         // Already a base64 string
         setViewingScreenshot(imageData);
       } else if(imageData.startsWith('/') || imageData.startsWith('uploads/')) {
         // It's a file path - try to fetch from API
         const filename = imageData.split('/').pop();
         if(filename) {
           try {
             const response = await api.get(`/screenshot/${filename}`);
             if(response.data && response.data.data) {
               const contentType = response.data.contentType || 'image/webp';
               base64String = `data:${contentType};base64,${response.data.data}`;
               setViewingScreenshot(base64String);
             } else {
               await notify('Not available', 'This screenshot is no longer available.', 'error');
             }
           } catch(err) {
             await notify('Not found', 'Could not load screenshot from server.', 'error');
           }
         }
       } else {
         // Assume it's raw base64
         base64String = `data:image/webp;base64,${imageData}`;
         setViewingScreenshot(base64String);
       }
     } else {
       await notify('Invalid screenshot', 'Could not load the screenshot.', 'error');
     }
   } catch(err) {
     console.error('Error opening screenshot:', err);
     await notify('Error', 'Could not open the screenshot.', 'error');
   }
 }
 
 return <div className="orders-container">
   {!list.length&&<div className="empty-state"><p>No orders yet.</p></div>}
   {list.map(o=>{
     const pe=o.personal as {name:string;governorate:string;address:string;phone1:string;phone2:string};
     const tr=o.transfer as {sender:string;amount:string;screenshot:string}|null;
     const items=o.items as {name:string;size:string;colour:string;quantity:number;price:number;image?:string|{data:string;contentType:string}}[];
     
     return <div key={o._id} className="modern-order-card">
       {/* Order Header */}
       <div className="order-card-header">
         <div className="order-id-section">
           <span className="order-label">Order ID</span>
           <h3 className="order-id">#{o._id.slice(0,12).toUpperCase()}</h3>
         </div>
         <div className="order-date-section">
           <span className="order-label">Date & Time</span>
           <time className="order-date">{new Date(o.createdAt).toLocaleDateString('en-GB')} • {new Date(o.createdAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</time>
         </div>
       </div>
       
       {/* Products Section */}
       <div className="order-section">
         <h4 className="section-title">Products</h4>
         <div className="order-products">
           {items.map((it,i)=><div key={i} className="order-product-item">
             <div className="product-item-image">
               {it.image?<img src={productImage(it.image)} alt={it.name}/>:<div className="placeholder-img"/>}
             </div>
             <div className="product-item-details">
               <p className="product-item-name">{it.name}</p>
               <p className="product-item-price">{money(it.price)}</p>
               <div className="product-item-options">
                 <span className="option-pill">Size: {it.size}</span>
                 <span className="option-pill">Color: {it.colour}</span>
                 <span className="option-pill">Qty: {it.quantity}</span>
               </div>
             </div>
           </div>)}
         </div>
       </div>
       
       {/* Personal Info Section */}
       <div className="order-section">
         <h4 className="section-title">Personal Information</h4>
         <div className="personal-info-grid">
           <div className="info-item">
             <span className="info-label">Full Name</span>
             <p className="info-value">{pe.name}</p>
           </div>
           <div className="info-item">
             <span className="info-label">Governorate</span>
             <p className="info-value">{pe.governorate}</p>
           </div>
           <div className="info-item full-width">
             <span className="info-label">Address</span>
             <p className="info-value">{pe.address}</p>
           </div>
           <div className="info-item">
             <span className="info-label">Phone Number 1</span>
             <p className="info-value">{pe.phone1}</p>
           </div>
           <div className="info-item">
             <span className="info-label">Phone Number 2</span>
             <p className="info-value">{pe.phone2}</p>
           </div>
         </div>
       </div>
       
       {/* Payment Method Section */}
       <div className="order-section">
         <h4 className="section-title">Payment Method</h4>
         <div className="payment-method-display">
           <span className="payment-badge">{o.payment_method==='cod'?'Cash on Delivery':o.payment_method==='instapay'?'InstaPay':'Vodafone Cash'}</span>
         </div>
         {tr&&<div className="transfer-details">
           <div className="transfer-info">
             <div className="transfer-row">
               <span className="transfer-label">Sender Account:</span>
               <span className="transfer-value">{tr.sender}</span>
             </div>
             <div className="transfer-row">
               <span className="transfer-label">Amount Transferred:</span>
               <span className="transfer-value">{money(Number(tr.amount))}</span>
             </div>
           </div>
           {tr.screenshot&&<div className="screenshot-preview">
             <p className="screenshot-label">Payment Screenshot:</p>
             {typeof tr.screenshot === 'string' && (tr.screenshot.startsWith('uploads/') || tr.screenshot.startsWith('/')) ? (
               <p className="text-xs text-muted-foreground">Legacy screenshot (path only) - not viewable</p>
             ) : (
               <button type="button" className="screenshot-button" onClick={()=>proof(tr.screenshot)}>
                 <span>View Screenshot</span>
               </button>
             )}
           </div>}
         </div>}
       </div>
       
       {/* Order Summary */}
       <div className="order-section">
         <h4 className="section-title">Order Summary</h4>
         <div className="order-totals">
           <div className="total-row">
             <span className="total-label">Product Subtotal</span>
             <span className="total-value">{money(o.subtotal)}</span>
           </div>
           <div className="total-row">
             <span className="total-label">Delivery Shipping</span>
             <span className="total-value">{money(o.shipping)}</span>
           </div>
           {o.discount>0&&<div className="total-row discount">
             <span className="total-label">Discount</span>
             <span className="total-value">-{money(o.discount)}</span>
           </div>}
           <div className="total-row final-total">
             <span className="total-label">Total Amount</span>
             <span className="total-value">{money(o.total)}</span>
           </div>
         </div>
       </div>
       
       {/* Actions */}
       <div className="order-actions">
         <select className="status-select" value={o.status} onChange={async e=>{
           try{
             await api.put(`/orders/${o._id}`,{status:e.target.value});
             void load();
           }catch(err:any){await notify('Error',err.response?.data?.error||'Error','error');}
         }}>
           {['Pending','Confirmed','Shipped','Delivered','Cancelled'].map(s=><option key={s}>{s}</option>)}
         </select>
         <Button variant="destructive" className="delete-order-btn" onClick={async()=>{
           if(!await confirmDelete('Delete this order?'))return;
           try{
             await api.delete(`/orders/${o._id}`);
             void load();
           }catch(err:any){await notify('Error',err.response?.data?.error||'Error','error');}
         }}>
           <Trash2 className="w-4 h-4 mr-2"/>Delete Order
         </Button>
       </div>
     </div>;
   })}
   
   {/* Screenshot Modal */}
   {viewingScreenshot&&<div className="screenshot-modal-overlay" onClick={()=>setViewingScreenshot(null)}>
     <div className="screenshot-modal-content" onClick={e=>e.stopPropagation()}>
       <div className="screenshot-modal-header">
         <h3>Payment Screenshot</h3>
         <Button variant="ghost" size="icon" onClick={()=>setViewingScreenshot(null)}>
           <X className="w-5 h-5"/>
         </Button>
       </div>
       <div className="screenshot-modal-body">
         <img src={viewingScreenshot} alt="Payment screenshot" className="screenshot-modal-image"/>
       </div>
       <div className="screenshot-modal-footer">
         <Button variant="outline" onClick={()=>setViewingScreenshot(null)}>Close</Button>
       </div>
     </div>
   </div>}
 </div>;
}

function Promos(){
 const[list,setList]=useState<PromoCode[]>([]);
 const[d,setD]=useState(10),[days,setDays]=useState(7),[uses,setUses]=useState(50);
 const[customCode,setCustomCode]=useState('');
 
 async function load(){
   try{
     const{data}=await api.get('/promo-codes');
     setList(data.data??[]);
   }catch(err){console.error(err);}
 }
 useEffect(()=>{void load();},[]);
 
 async function gen(){
   if(d<1||d>70||days<1||uses<1){await notify('Check values','','info');return;}
   
   let code=customCode.trim().toUpperCase();
   if(!code){
     code='VELIN'+Array.from(crypto.getRandomValues(new Uint8Array(5))).map(b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join('');
   }
   
   try{
     await api.post('/promo-codes',{
       code,
       discount:d,
       expires_at:new Date(Date.now()+days*864e5).toISOString(),
       max_uses:uses
     });
     await notify('Created',code);
     setCustomCode('');
     void load();
   }catch(err:any){await notify('Error',err.response?.data?.error||'Error','error');}
 }
 
 return <div className="promo-section">
   <div className="admin-form max-w-2xl">
     <h2>Generate Promo Code</h2>
     <div className="space-y-4">
       <div>
         <Label className="form-label">Custom Promo Code (optional)</Label>
         <p className="text-xs text-muted-foreground mb-2">Leave empty to auto-generate</p>
         <Input placeholder="SUMMER2024" value={customCode} onChange={e=>setCustomCode(e.target.value)} className="form-field"/>
       </div>
       <div className="grid gap-4 sm:grid-cols-3">
         <div><Label className="form-label">Discount %</Label><Input type="number" min={1} max={70} value={d} onChange={e=>setD(Math.min(70,Number(e.target.value)))} className="form-field"/></div>
         <div><Label className="form-label">Valid (days)</Label><Input type="number" min={1} value={days} onChange={e=>setDays(Number(e.target.value))} className="form-field"/></div>
         <div><Label className="form-label">Max uses</Label><Input type="number" min={1} value={uses} onChange={e=>setUses(Number(e.target.value))} className="form-field"/></div>
       </div>
     </div>
     <Button onClick={gen} className="shop-button mt-4">GENERATE CODE</Button>
   </div>
   
   <div className="space-y-2">
     <h2>Active Codes</h2>
     {!list.length&&<p className="text-muted-foreground">No codes yet.</p>}
     {list.map(p=>{
       const live=new Date(p.expires_at)>new Date()&&p.uses<p.max_uses;
       return <div key={p._id} className="promo-card">
         <div>
           <h3>{p.code}</h3>
           <p>{p.discount}% off • Valid until {new Date(p.expires_at).toLocaleDateString()} • Used {p.uses}/{p.max_uses} • {live?<span className="text-green-600">Active</span>:<span className="text-red-600">Expired</span>}</p>
         </div>
         <Button variant="outline" size="icon" onClick={async()=>{
           if(!await confirmDelete(`Delete ${p.code}?`))return;
           try{
             await api.delete(`/promo-codes/${p._id}`);
             void load();
           }catch(err:any){await notify('Error',err.response?.data?.error||'Error','error');}
         }}><Trash2 className="w-4 h-4"/></Button>
       </div>;
     })}
   </div>
 </div>;
}

function Tags(){
 const[list,setList]=useState<string[]>([]);
 const[input,setInput]=useState('');
 
 async function load(){
   try{
     const{data}=await api.get('/products');
     const allTags=new Set<string>();
     data.data?.forEach((p:Product)=>{
       p.tags?.forEach(t=>allTags.add(t));
     });
     setList(Array.from(allTags).sort());
   }catch(err){console.error(err);}
 }
 useEffect(()=>{void load();},[]);
 
 async function deleteTag(tag:string){
   if(!await confirmDelete(`Delete tag "${tag}" from all products?`))return;
   try{
     const{data}=await api.get('/products');
     for(const p of data.data??[]){
       const newTags=p.tags.filter((t:string)=>t!==tag);
       await api.put(`/products/${p._id}`,{tags:newTags});
     }
     await load();
   }catch(err:any){await notify('Error',err.response?.data?.error||'Error','error');}
 }
 
 return <div className="space-y-4">
   <div className="admin-form max-w-2xl">
     <h2>Manage Tags</h2>
     <p className="text-sm text-muted-foreground mb-4">Tags are automatically created when you add them to products. Here you can view and delete tags from all products.</p>
     {!list.length&&<p className="text-muted-foreground">No tags yet.</p>}
     <div className="tag-manager">
       {list.map(t=><span key={t} className="tag-chip">
         {t}<button type="button" onClick={()=>deleteTag(t)}><Trash2 className="w-3 h-3"/></button>
       </span>)}
     </div>
   </div>
 </div>;
}

function Settings(){
 const refresh=useRefresh();
 const[s,setS]=useState({instapay:'',vodafone:'',instagram:'',tiktok:'',delivery:''});
 
 useEffect(()=>{
   void api.get('/settings').then(({data})=>{
     if(data.data)setS(data.data);
   }).catch(()=>{});
 },[]);
 
 return <form className="admin-form max-w-2xl" onSubmit={async e=>{
   e.preventDefault();
   try{
     await api.put('/settings',s);
     await refresh();
     await notify('Saved');
   }catch(err:any){await notify('Error',err.response?.data?.error||'Error','error');}
 }}>
   <h2>Store Settings</h2>
   <div className="space-y-4">
     <div><Label className="form-label">InstaPay Account</Label><Input placeholder="InstaPay@yourstore" value={s.instapay} onChange={e=>setS({...s,instapay:e.target.value})} className="form-field"/></div>
     <div><Label className="form-label">Vodafone Cash Number</Label><Input placeholder="01012345678" value={s.vodafone} onChange={e=>setS({...s,vodafone:e.target.value})} className="form-field"/></div>
     <div><Label className="form-label">Instagram Link</Label><Input placeholder="https://instagram.com/yourstore" value={s.instagram} onChange={e=>setS({...s,instagram:e.target.value})} className="form-field"/></div>
     <div><Label className="form-label">TikTok Link</Label><Input placeholder="https://tiktok.com/@yourstore" value={s.tiktok} onChange={e=>setS({...s,tiktok:e.target.value})} className="form-field"/></div>
     <div><Label className="form-label">Delivery Message</Label><Textarea placeholder="Fast delivery" value={s.delivery} onChange={e=>setS({...s,delivery:e.target.value})} className="form-field"/></div>
   </div>
   <Button type="submit" className="shop-button mt-6">SAVE</Button>
 </form>;
}
