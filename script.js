const WA_NUMBER="919600664546";
const CART="ss_textiles_cart_v3";
const CONFIG=window.SUPABASE_CONFIG||{};
const SUPABASE_READY=!!(window.supabase && CONFIG.url && CONFIG.anonKey && !CONFIG.url.includes("PASTE_YOUR") && !CONFIG.anonKey.includes("PASTE_YOUR"));
const sb=SUPABASE_READY?window.supabase.createClient(CONFIG.url,CONFIG.anonKey):null;
let products=[];
let cart=JSON.parse(localStorage.getItem(CART)||"[]");
let adminUser=null;
let editingImage="";
const localProducts=JSON.parse(localStorage.getItem("ss_local_products")||"[]");

function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function saveCart(){localStorage.setItem(CART,JSON.stringify(cart))}
function toggleMenu(){document.getElementById("links").classList.toggle("open")}
document.querySelectorAll(".links a").forEach(a=>a.addEventListener("click",()=>document.getElementById("links").classList.remove("open")));
document.getElementById("year").textContent=new Date().getFullYear();

function setCloudStatus(){
 const el=document.getElementById("cloudStatus");
 if(SUPABASE_READY){el.className="cloud-status online";el.textContent="☁️ Online Store connected — products sync for all customers."}
 else {el.className="cloud-status offline";el.textContent="⚠️ Database not connected yet. Add your Supabase URL/key in supabase-config.js to turn on online product sync."}
}
async function loadProducts(){
 setCloudStatus();
 if(!SUPABASE_READY){products=[...localProducts];renderProducts();renderCart();return;}
 const {data,error}=await sb.from("products").select("*").order("created_at",{ascending:false});
 if(error){console.error(error);products=[];document.getElementById("cloudStatus").textContent="⚠️ Supabase connected, but the products table/policies need setup. Run supabase_setup.sql."}
 else products=data||[];
 renderProducts();renderCart();
}

function renderProducts(){
 const q=(document.getElementById("search").value||"").toLowerCase(), cat=document.getElementById("category").value;
 const list=products.filter(p=>(cat==="All"||p.category===cat)&&(`${p.name} ${p.description||p.desc||""}`.toLowerCase().includes(q)));
 const grid=document.getElementById("productGrid");document.getElementById("emptyProducts").hidden=list.length>0;
 grid.innerHTML=list.map(p=>`<article class="product"><div class="product-img">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}">`:`<div class="placeholder">🛍️</div>`}</div><div class="product-body"><div class="product-cat">${esc(p.category)}</div><h3>${esc(p.name)}</h3><p>${esc(p.description||p.desc||"")}</p><div class="price">₹${Number(p.price).toLocaleString("en-IN")}</div><button class="btn primary" onclick="addToCart('${p.id}')">Add to Cart</button></div></article>`).join("");
}
function addToCart(id){let x=cart.find(i=>i.id===id);if(x)x.qty++;else cart.push({id,qty:1});saveCart();renderCart();location.hash="cart"}
function renderCart(){
 const box=document.getElementById("cartItems");let total=0;
 cart=cart.filter(i=>products.some(p=>p.id===i.id));
 if(!cart.length){box.innerHTML='<div class="empty">Your cart is empty. <a href="#products">Shop now</a></div>';document.getElementById("cartTotal").textContent="0";document.getElementById("cartCount").textContent="0";saveCart();return;}
 box.innerHTML=cart.map(i=>{let p=products.find(x=>x.id===i.id);if(!p)return "";total+=Number(p.price)*i.qty;return `<div class="cart-row"><div>${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:"🛍️"}</div><div><b>${esc(p.name)}</b><div class="muted">₹${Number(p.price).toLocaleString("en-IN")}</div></div><div class="qty"><button onclick="changeQty('${p.id}',-1)">−</button><span>${i.qty}</span><button onclick="changeQty('${p.id}',1)">+</button></div><strong>₹${(Number(p.price)*i.qty).toLocaleString("en-IN")}</strong><button class="remove" onclick="removeCart('${p.id}')">Remove</button></div>`}).join("");
 document.getElementById("cartTotal").textContent=total.toLocaleString("en-IN");document.getElementById("cartCount").textContent=cart.reduce((a,b)=>a+b.qty,0);saveCart();
}
function changeQty(id,n){let x=cart.find(i=>i.id===id);if(!x)return;x.qty+=n;if(x.qty<=0)cart=cart.filter(i=>i.id!==id);saveCart();renderCart()}
function removeCart(id){cart=cart.filter(i=>i.id!==id);saveCart();renderCart()}
function openCheckout(){
  if(!cart.length){alert("Please select at least one product before confirming your order.");return;}
  const modal=document.getElementById("checkoutModal");
  modal.hidden=false;
  modal.style.display="grid";
  document.getElementById("cName").focus();
}
function closeCheckout(){const modal=document.getElementById("checkoutModal");modal.hidden=true;modal.style.display="none"}

async function sendWhatsApp(e){
 e.preventDefault();let lines=["*NEW ORDER - SS TEXTILES GIFTS*",""];let total=0;
 const items=[];
 cart.forEach(i=>{const p=products.find(x=>x.id===i.id);if(p){const sub=Number(p.price)*i.qty;total+=sub;items.push({product_id:p.id,product_name:p.name,quantity:i.qty,unit_price:Number(p.price),subtotal:sub});lines.push(`• ${p.name} x ${i.qty} = ₹${sub.toLocaleString("en-IN")}`)}});
 lines.push("",`*Total: ₹${total.toLocaleString("en-IN")}*`,"",`Customer: ${document.getElementById("cName").value}`,`Phone: ${document.getElementById("cPhone").value}`,`Address: ${document.getElementById("cAddress").value}`,"","Please confirm this order.");
 if(SUPABASE_READY){
   const {data:order,error}=await sb.from("orders").insert({customer_name:document.getElementById("cName").value.trim(),customer_phone:document.getElementById("cPhone").value.trim(),customer_address:document.getElementById("cAddress").value.trim(),total,status:"New"}).select("id").single();
   if(error){alert("Could not save the online order. Please try again.");console.error(error);return;}
   const rows=items.map(x=>({...x,order_id:order.id}));
   const {error:itemError}=await sb.from("order_items").insert(rows);
   if(itemError){console.error(itemError);}
 }
 window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`,"_blank");
 closeCheckout();cart=[];saveCart();renderCart();
}

function toggleAdmin(){const p=document.getElementById("adminPanel");p.hidden=!p.hidden;if(!p.hidden){refreshAdminAuth();}}
async function refreshAdminAuth(){
 if(!SUPABASE_READY){
   document.getElementById("adminLoginBox").innerHTML='<h3>Local Product Manager</h3><p class="muted">Supabase is not connected yet. You can add products now on this device. Connect Supabase later to sync them for all customers.</p>';
   document.getElementById("adminManager").hidden=false;
   document.getElementById("adminUser").textContent="Local Admin";
   products=[...localProducts]; renderProducts(); renderAdmin(); return;
 }
 const {data}=await sb.auth.getSession();adminUser=data.session?.user||null;renderAdminAuth();
}
function renderAdminAuth(){
 const login=document.getElementById("adminLoginBox"),manager=document.getElementById("adminManager");
 if(adminUser){login.hidden=true;manager.hidden=false;document.getElementById("adminUser").textContent=adminUser.email||"Admin";loadAdminData();}
 else {login.hidden=false;manager.hidden=true;}
}
async function adminLogin(e){e.preventDefault();if(!SUPABASE_READY)return;const msg=document.getElementById("adminMessage");msg.textContent="Logging in...";const {data,error}=await sb.auth.signInWithPassword({email:document.getElementById("adminEmail").value.trim(),password:document.getElementById("adminPassword").value});if(error){msg.textContent=error.message;return}adminUser=data.user;msg.textContent="";renderAdminAuth()}
async function adminLogout(){if(sb)await sb.auth.signOut();adminUser=null;renderAdminAuth()}

async function loadAdminData(){
 if(!SUPABASE_READY||!adminUser)return;
 const {data,error}=await sb.from("products").select("*").order("created_at",{ascending:false});if(!error){products=data||[];renderProducts();renderCart();}
 renderAdmin();renderOrders();
}
function resetForm(){document.getElementById("productForm").reset();document.getElementById("editId").value="";editingImage=""}
async function uploadImage(file){
 if(!file)return editingImage;
 const ext=(file.name.split(".").pop()||"jpg").toLowerCase();const path=`products/${crypto.randomUUID()}.${ext}`;
 const {error}=await sb.storage.from("product-images").upload(path,file,{upsert:false,contentType:file.type});if(error)throw error;
 const {data}=sb.storage.from("product-images").getPublicUrl(path);return data.publicUrl;
}
async function saveProduct(e){
 e.preventDefault();
 if(!SUPABASE_READY){
   const file=document.getElementById("pImage").files[0];
   const finish=(image_url)=>{
     const id=document.getElementById("editId").value||crypto.randomUUID();
     const item={id,name:document.getElementById("pName").value.trim(),category:document.getElementById("pCategory").value,price:Number(document.getElementById("pPrice").value),description:document.getElementById("pDesc").value.trim(),image_url};
     const idx=localProducts.findIndex(x=>x.id===id);
     if(idx>=0)localProducts[idx]=item; else localProducts.unshift(item);
     localStorage.setItem("ss_local_products",JSON.stringify(localProducts));
     products=[...localProducts]; renderProducts(); renderCart(); renderAdmin(); resetForm(); alert("Product saved on this device. Connect Supabase to make it available to all customers online.");
   };
   if(file){const reader=new FileReader();reader.onload=()=>finish(reader.result);reader.readAsDataURL(file);} else {finish(editingImage||"");}
   return;
 }
 if(!adminUser){alert("Please login first.");return}
 const id=document.getElementById("editId").value;const file=document.getElementById("pImage").files[0];
 try{
  const image_url=file?await uploadImage(file):editingImage;
  const payload={name:document.getElementById("pName").value.trim(),category:document.getElementById("pCategory").value,price:Number(document.getElementById("pPrice").value),description:document.getElementById("pDesc").value.trim(),image_url};
  let error;if(id){({error}=await sb.from("products").update(payload).eq("id",id));}else{({error}=await sb.from("products").insert(payload));}
  if(error)throw error;
  alert("Product saved online successfully.");resetForm();await loadAdminData();
 }catch(err){console.error(err);alert("Could not save product: "+err.message)}
}
function editProduct(id){const p=products.find(x=>x.id===id);if(!p)return;document.getElementById("editId").value=p.id;document.getElementById("pName").value=p.name;document.getElementById("pCategory").value=p.category;document.getElementById("pPrice").value=p.price;document.getElementById("pDesc").value=p.description||"";editingImage=p.image_url||"";document.getElementById("adminPanel").hidden=false;scrollTo({top:document.getElementById("admin").offsetTop,behavior:"smooth"})}
async function deleteProduct(id){if(!adminUser||!confirm("Delete this product?"))return;const {error}=await sb.from("products").delete().eq("id",id);if(error){alert(error.message);return}cart=cart.filter(i=>i.id!==id);saveCart();await loadAdminData()}
function renderAdmin(){const box=document.getElementById("adminProducts");if(!box)return;box.innerHTML=products.map(p=>`<div class="admin-item">${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:"🛍️"}<div class="grow"><b>${esc(p.name)}</b><div class="muted">${esc(p.category)} • ₹${Number(p.price).toLocaleString("en-IN")}</div></div><button onclick="editProduct('${p.id}')">Edit</button><button onclick="deleteProduct('${p.id}')">Delete</button></div>`).join("")||'<p class="muted">No online products yet.</p>'}
async function renderOrders(){
 const box=document.getElementById("adminOrders");if(!box||!SUPABASE_READY||!adminUser)return;box.innerHTML='<p class="muted">Loading orders...</p>';
 const {data:orders,error}=await sb.from("orders").select("*").order("created_at",{ascending:false}).limit(50);if(error){box.innerHTML='<p class="muted">Unable to load orders.</p>';return}
 if(!orders.length){box.innerHTML='<p class="muted">No customer orders yet.</p>';return}
 box.innerHTML=orders.map(o=>`<div class="order-card"><div class="order-top"><b>${esc(o.customer_name)}</b><span>${new Date(o.created_at).toLocaleString("en-IN")}</span></div><p>📞 ${esc(o.customer_phone)}<br>📍 ${esc(o.customer_address)}</p><strong>₹${Number(o.total).toLocaleString("en-IN")}</strong><select onchange="updateOrderStatus('${o.id}',this.value)"><option ${o.status==='New'?'selected':''}>New</option><option ${o.status==='Confirmed'?'selected':''}>Confirmed</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></div>`).join("")
}
async function updateOrderStatus(id,status){const {error}=await sb.from("orders").update({status}).eq("id",id);if(error)alert(error.message)}

setCloudStatus();loadProducts();
if(SUPABASE_READY&&sb)sb.auth.onAuthStateChange((_event,session)=>{adminUser=session?.user||null;renderAdminAuth()});
