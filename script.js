const WA_NUMBER="919600664546";
const CART="ss_textiles_cart_v4";

let products=[];
let cart=JSON.parse(localStorage.getItem(CART)||"[]");
let editingImage="";
let currentUser=null;
let isAdmin=false;

const FIREBASE_READY =
  window.firebase &&
  window.FIREBASE_CONFIG &&
  window.FIREBASE_CONFIG.apiKey &&
  !window.FIREBASE_CONFIG.apiKey.includes("PASTE_YOUR") &&
  window.FIREBASE_CONFIG.projectId &&
  !window.FIREBASE_CONFIG.projectId.includes("PASTE_YOUR");

let auth=null, db=null, storage=null;

function esc(s){
  return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}
function saveCart(){localStorage.setItem(CART,JSON.stringify(cart));}
function toggleMenu(){document.getElementById("links").classList.toggle("open");}
document.querySelectorAll(".links a").forEach(a=>a.addEventListener("click",()=>document.getElementById("links").classList.remove("open")));
document.getElementById("year").textContent=new Date().getFullYear();

function adminEmails(){
  return (window.STORE_ACCESS?.ADMIN_EMAILS||[])
    .map(x=>String(x).trim().toLowerCase())
    .filter(Boolean);
}
function checkAdmin(user){
  return !!user && !!user.email && adminEmails().includes(user.email.toLowerCase());
}

function setCloudStatus(message, online=false){
  const el=document.getElementById("cloudStatus");
  el.className="cloud-status "+(online?"online":"offline");
  el.textContent=message;
}

function initFirebase(){
  if(!FIREBASE_READY){
    setCloudStatus("⚠️ Firebase is not configured yet. Add your Firebase Web App config in firebase-config.js.",false);
    return false;
  }
  try{
    if(!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
    auth=firebase.auth();
    db=firebase.firestore();
    storage=firebase.storage();

    // Google is the only sign-in provider used by this website.
    const provider=new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});

    auth.onAuthStateChanged(async user=>{
      currentUser=user||null;
      isAdmin=checkAdmin(currentUser);
      renderAuth();
      updateAdminVisibility();
      if(isAdmin) await loadAdminData();
      else renderAdmin([]);
    });

    window.googleProvider=provider;
    setCloudStatus("☁️ Online Store connected — products sync for all customers.",true);
    return true;
  }catch(err){
    console.error(err);
    setCloudStatus("⚠️ Firebase could not start. Check firebase-config.js.",false);
    return false;
  }
}

async function signInWithGoogle(){
  if(!FIREBASE_READY){
    alert("Please configure Firebase first in firebase-config.js.");
    return;
  }
  try{
    await auth.signInWithPopup(window.googleProvider);
  }catch(err){
    console.error(err);
    if(err.code==="auth/popup-blocked"){
      alert("Your browser blocked the Google sign-in popup. Please allow popups for this website and try again.");
    }else if(err.code!=="auth/popup-closed-by-user"){
      alert("Google sign-in failed: "+err.message);
    }
  }
}
async function signOutGoogle(){
  if(auth) await auth.signOut();
}

function renderAuth(){
  const area=document.getElementById("authArea");
  const footer=document.getElementById("footerAuth");
  if(!currentUser){
    area.innerHTML='<button class="auth-btn" onclick="signInWithGoogle()">Sign in with Google</button>';
    footer.innerHTML="";
    return;
  }
  const name=esc(currentUser.displayName||currentUser.email||"Customer");
  area.innerHTML=`<span class="user-chip">👤 ${name}</span><button class="auth-btn" onclick="signOutGoogle()">Sign Out</button>`;
  footer.innerHTML=isAdmin?'<span class="muted">Admin signed in</span>':'<span class="muted">Customer signed in</span>';
  if(isAdmin) document.getElementById("adminUser").textContent=currentUser.email||"Admin";
}

function updateAdminVisibility(){
  const section=document.getElementById("admin");
  section.hidden=!isAdmin;
  if(isAdmin){
    document.getElementById("adminUser").textContent=currentUser?.email||"Admin";
  }
}

async function loadProducts(){
  if(!db){
    renderProducts();
    renderCart();
    return;
  }
  try{
    const snap=await db.collection("products").orderBy("createdAt","desc").get();
    products=snap.docs.map(doc=>({id:doc.id,...doc.data()}));
    renderProducts();
    renderCart();
  }catch(err){
    console.error(err);
    setCloudStatus("⚠️ Could not load products. Check Firestore setup/rules.",false);
    products=[];
    renderProducts();
    renderCart();
  }
}

function renderProducts(){
  const q=(document.getElementById("search").value||"").toLowerCase();
  const cat=document.getElementById("category").value;
  const list=products.filter(p=>
    (cat==="All"||p.category===cat) &&
    (`${p.name} ${p.description||""}`.toLowerCase().includes(q))
  );
  const grid=document.getElementById("productGrid");
  document.getElementById("emptyProducts").hidden=list.length>0;
  grid.innerHTML=list.map(p=>`
    <article class="product">
      <div class="product-img">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}">`:`<div class="placeholder">🛍️</div>`}</div>
      <div class="product-body">
        <div class="product-cat">${esc(p.category||"")}</div>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description||"")}</p>
        <div class="price">₹${Number(p.price||0).toLocaleString("en-IN")}</div>
        <button class="btn primary" onclick="addToCart('${p.id}')">Add to Cart</button>
      </div>
    </article>`).join("");
}

function addToCart(id){
  let x=cart.find(i=>i.id===id);
  if(x)x.qty++;else cart.push({id,qty:1});
  saveCart();renderCart();location.hash="cart";
}
function renderCart(){
  const box=document.getElementById("cartItems");let total=0;
  cart=cart.filter(i=>products.some(p=>p.id===i.id));
  if(!cart.length){
    box.innerHTML='<div class="empty">Your cart is empty. <a href="#products">Shop now</a></div>';
    document.getElementById("cartTotal").textContent="0";
    document.getElementById("cartCount").textContent="0";
    saveCart();return;
  }
  box.innerHTML=cart.map(i=>{
    const p=products.find(x=>x.id===i.id); if(!p)return "";
    total+=Number(p.price||0)*i.qty;
    return `<div class="cart-row">
      <div>${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:"🛍️"}</div>
      <div><b>${esc(p.name)}</b><div class="muted">₹${Number(p.price||0).toLocaleString("en-IN")}</div></div>
      <div class="qty"><button onclick="changeQty('${p.id}',-1)">−</button><span>${i.qty}</span><button onclick="changeQty('${p.id}',1)">+</button></div>
      <strong>₹${(Number(p.price||0)*i.qty).toLocaleString("en-IN")}</strong>
      <button class="remove" onclick="removeCart('${p.id}')">Remove</button>
    </div>`;
  }).join("");
  document.getElementById("cartTotal").textContent=total.toLocaleString("en-IN");
  document.getElementById("cartCount").textContent=cart.reduce((a,b)=>a+b.qty,0);
  saveCart();
}
function changeQty(id,n){
  let x=cart.find(i=>i.id===id);if(!x)return;
  x.qty+=n;if(x.qty<=0)cart=cart.filter(i=>i.id!==id);
  saveCart();renderCart();
}
function removeCart(id){cart=cart.filter(i=>i.id!==id);saveCart();renderCart();}

function openCheckout(){
  if(!cart.length){alert("Please select at least one product before confirming your order.");return;}
  const modal=document.getElementById("checkoutModal");
  modal.hidden=false;modal.style.display="grid";
  document.getElementById("cName").focus();
}
function closeCheckout(){
  const modal=document.getElementById("checkoutModal");
  modal.hidden=true;modal.style.display="none";
}

function sendWhatsApp(e){
  e.preventDefault();
  let lines=["*NEW ORDER - SS TEXTILES GIFTS*",""],total=0;
  cart.forEach(i=>{
    const p=products.find(x=>x.id===i.id);
    if(p){
      const sub=Number(p.price||0)*i.qty;total+=sub;
      lines.push(`• ${p.name} x ${i.qty} = ₹${sub.toLocaleString("en-IN")}`);
    }
  });
  lines.push("",
    `*Total: ₹${total.toLocaleString("en-IN")}*`,"",
    `Customer: ${document.getElementById("cName").value.trim()}`,
    `Phone: ${document.getElementById("cPhone").value.trim()}`,
    `Address: ${document.getElementById("cAddress").value.trim()}`,"",
    "Please confirm this order.");
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`,"_blank");
  closeCheckout();cart=[];saveCart();renderCart();
}

// ---------------- ADMIN PRODUCT MANAGER ----------------
function resetForm(){
  document.getElementById("productForm").reset();
  document.getElementById("editId").value="";
  document.getElementById("formTitle").textContent="Add Product";
  editingImage="";
}

async function uploadImage(file){
  if(!file)return editingImage;
  if(!storage)throw new Error("Firebase Storage is not ready.");
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
  const path=`products/${crypto.randomUUID()}.${ext||"jpg"}`;
  const ref=storage.ref(path);
  await ref.put(file,{contentType:file.type||"image/jpeg"});
  return await ref.getDownloadURL();
}

async function saveProduct(e){
  e.preventDefault();
  if(!isAdmin||!currentUser){
    alert("Admin Google sign-in is required.");
    return;
  }
  const name=document.getElementById("pName").value.trim();
  const category=document.getElementById("pCategory").value;
  const price=Number(document.getElementById("pPrice").value);
  const description=document.getElementById("pDesc").value.trim();
  const id=document.getElementById("editId").value;
  const file=document.getElementById("pImage").files[0];

  try{
    const image_url=file?await uploadImage(file):editingImage;
    const payload={
      name,category,price,description,
      image_url:image_url||"",
      updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy:currentUser.email||""
    };
    if(id){
      await db.collection("products").doc(id).update(payload);
      alert("Product updated successfully.");
    }else{
      payload.createdAt=firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("products").add(payload);
      alert("Product added successfully.");
    }
    resetForm();
    await loadAdminData();
  }catch(err){
    console.error(err);
    alert("Could not save product: "+err.message);
  }
}

function editProduct(id){
  if(!isAdmin)return;
  const p=products.find(x=>x.id===id);if(!p)return;
  document.getElementById("editId").value=p.id;
  document.getElementById("pName").value=p.name||"";
  document.getElementById("pCategory").value=p.category||"Men's Wear";
  document.getElementById("pPrice").value=p.price??"";
  document.getElementById("pDesc").value=p.description||"";
  document.getElementById("pImage").value="";
  editingImage=p.image_url||"";
  document.getElementById("formTitle").textContent="Edit Product";
  document.getElementById("admin").scrollIntoView({behavior:"smooth"});
}

async function deleteProduct(id){
  if(!isAdmin||!currentUser)return;
  const p=products.find(x=>x.id===id);
  if(!p||!confirm(`Delete "${p.name}"?`))return;
  try{
    await db.collection("products").doc(id).delete();
    cart=cart.filter(i=>i.id!==id);saveCart();
    await loadAdminData();
  }catch(err){
    console.error(err);
    alert("Could not delete product: "+err.message);
  }
}

function renderAdmin(list=products){
  const box=document.getElementById("adminProducts");
  if(!box)return;
  if(!isAdmin){
    box.innerHTML="";
    return;
  }
  box.innerHTML=list.map(p=>`
    <div class="admin-item">
      ${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:"🛍️"}
      <div class="grow"><b>${esc(p.name)}</b><div class="muted">${esc(p.category||"")} • ₹${Number(p.price||0).toLocaleString("en-IN")}</div></div>
      <button onclick="editProduct('${p.id}')">Edit</button>
      <button onclick="deleteProduct('${p.id}')">Delete</button>
    </div>`).join("")||'<p class="muted">No products yet.</p>';
}

async function loadAdminData(){
  if(!isAdmin||!db)return;
  try{
    const snap=await db.collection("products").orderBy("createdAt","desc").get();
    products=snap.docs.map(doc=>({id:doc.id,...doc.data()}));
    renderProducts();renderCart();renderAdmin(products);
  }catch(err){
    console.error(err);
    alert("Admin data could not be loaded: "+err.message);
  }
}

// Start
renderAuth();
updateAdminVisibility();
if(initFirebase()) loadProducts();
else {
  // No local product manager: products must come from Firebase.
  products=[];
  renderProducts();renderCart();
}
