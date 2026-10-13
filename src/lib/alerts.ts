export async function notify(title: string, text?: string, icon: 'success'|'error'|'info'|'warning'='success') {
 const {default:Swal}=await import('sweetalert2');
 await Swal.fire({
   title,
   text,
   icon,
   customClass:{popup:'velin-alert',confirmButton:'velin-confirm'},
   buttonsStyling:false,
   confirmButtonText:'Okay'
 });
}
export async function confirmDelete(text:string){
 const{default:Swal}=await import('sweetalert2');
 return (await Swal.fire({
   title:'Are you sure?',
   text,
   icon:'warning',
   showCancelButton:true,
   confirmButtonText:'Delete',
   customClass:{popup:'velin-alert',confirmButton:'velin-confirm',cancelButton:'velin-cancel'},
   buttonsStyling:false
 })).isConfirmed;
}
