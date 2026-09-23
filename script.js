const state={menu:"caesar",rsaKeys:null};
const $=id=>document.getElementById(id);
const menuData={
 caesar:{title:"Caesar Cipher",desc:"Algoritma klasik dengan pergeseran karakter.",shift:true,key:false},
 vigenere:{title:"Vigenère Cipher",desc:"Algoritma klasik menggunakan kunci berupa kata.",shift:false,key:true},
 aes:{title:"AES",desc:"Algoritma modern menggunakan AES-GCM 256-bit.",shift:false,key:true},
 rsa:{title:"RSA",desc:"Algoritma modern dengan pasangan kunci publik dan privat.",shift:false,key:false},
 super:{title:"Super Enkripsi",desc:"Gabungan Caesar → Vigenère → AES → RSA (hybrid encryption).",shift:true,key:true}
};
//test
function addStep(title,text){const d=document.createElement("div");d.className="step";d.innerHTML=`<strong>${escapeHtml(title)}</strong><span>${escapeHtml(String(text))}</span>`;$("process").appendChild(d)}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function resetProcess(){ $("process").innerHTML=""; }
function setMenu(m){
 state.menu=m; const d=menuData[m];
 document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.menu===m));

 $("menuTitle").textContent=d.title;
 $("menuDesc").textContent=d.desc;
 $("shiftBox").classList.toggle("hidden",!d.shift);
 $("keyBox").classList.toggle("hidden",!d.key);
 $("bruteForceBtn").classList.toggle("hidden",m!=="caesar");
 $("bruteForceHint").classList.toggle("hidden",m!=="caesar");
 $("rsaInfo").classList.toggle("hidden",m!=="rsa"&&m!=="super");

 resetProcess();
 $("result").value="";
}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>setMenu(b.dataset.menu));
$("clearBtn").onclick=()=>{$("inputText").value="";$("result").value="";resetProcess()};
$("copyBtn").onclick=async()=>{if($("result").value){await navigator.clipboard.writeText($("result").value);alert("Hasil berhasil disalin.");}};

function caesar(text,shift){return [...text].map(ch=>{let c=ch.charCodeAt(0);if(c>=65&&c<=90)return String.fromCharCode((c-65+shift+26)%26+65);if(c>=97&&c<=122)return String.fromCharCode((c-97+shift+26)%26+97);return ch}).join("")}
function bruteForceCaesar(text){
  if(!text.trim())throw new Error("Masukkan teks terlebih dahulu.");
  if(!/[A-Za-z]/.test(text))throw new Error("Teks tidak mengandung huruf A-Z, sehingga brute force tidak menghasilkan variasi apa pun.");

  resetProcess();

  addStep("Input",text);
  addStep("Metode","Brute Force Caesar");
  addStep("Kemungkinan Kunci","25");

  for(let shift=1;shift<=25;shift++){
    const result=caesar(text,-shift);
    addStep(`Shift ${shift}`,result);
  }

  $("result").value="Brute force selesai. Periksa hasil pada bagian Proses Algoritma.";
}
function vigenere(text,key,dec=false){key=key.replace(/[^A-Za-z]/g,"").toUpperCase();if(!key)throw Error("Kunci Vigenère tidak boleh kosong.");let i=0;return [...text].map(ch=>{let c=ch.charCodeAt(0);if((c>=65&&c<=90)||(c>=97&&c<=122)){let base=c>=97?97:65;let k=key.charCodeAt(i++%key.length)-65;return String.fromCharCode((c-base+(dec?-k:k)+26)%26+base)}return ch}).join("")}
function b64(buf){return btoa(String.fromCharCode(...new Uint8Array(buf)))}
function unb64(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer}
async function aesEncrypt(text,password){
 const raw=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(password));
 const key=await crypto.subtle.importKey("raw",raw,{name:"AES-GCM"},false,["encrypt","decrypt"]);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const ct=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(text));
 return b64(iv)+"."+b64(ct);
}
async function aesDecrypt(data,password){
 const parts=data.split(".");if(parts.length!==2)throw Error("Format AES tidak valid.");
 const raw=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(password));
 const key=await crypto.subtle.importKey("raw",raw,{name:"AES-GCM"},false,["decrypt"]);
 const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:new Uint8Array(unb64(parts[0]))},key,unb64(parts[1]));
 return new TextDecoder().decode(pt);
}
async function ensureRSA(){
 if(state.rsaKeys)return;
 $("rsaStatus").textContent="Membuat kunci RSA 2048-bit...";
 state.rsaKeys=await crypto.subtle.generateKey({name:"RSA-OAEP",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["encrypt","decrypt"]);
 $("rsaStatus").textContent="Kunci RSA 2048-bit siap digunakan.";
}
async function rsaEncrypt(text){await ensureRSA();const ct=await crypto.subtle.encrypt({name:"RSA-OAEP"},state.rsaKeys.publicKey,new TextEncoder().encode(text));return b64(ct)}
async function rsaDecrypt(data){await ensureRSA();const pt=await crypto.subtle.decrypt({name:"RSA-OAEP"},state.rsaKeys.privateKey,unb64(data));return new TextDecoder().decode(pt)}

async function run(encrypt){
 const text=$("inputText").value;
 if(!text){alert("Masukkan teks terlebih dahulu.");return}
 const key=$("key").value||"KRIPTO"; const shift=Number($("shift").value)||0;
 resetProcess();
 try{
  if(state.menu==="caesar"){
    addStep("Input",text);
    addStep("Pergeseran",shift);

    const out=caesar(text,encrypt?shift:-shift);

    addStep(encrypt?"Enkripsi":"Dekripsi",out);
    $("result").value=out;
  }else if(state.menu==="vigenere"){
   addStep("Input",text);addStep("Kunci",key);
   const out=vigenere(text,key,!encrypt);addStep(encrypt?"Enkripsi Vigenère":"Dekripsi Vigenère",out);$("result").value=out;
  }else if(state.menu==="aes"){
   addStep("Input",text);addStep("Algoritma","AES-256-GCM");
   const out=encrypt?await aesEncrypt(text,key):await aesDecrypt(text,key);
   addStep(encrypt?"AES Enkripsi":"AES Dekripsi",out);$("result").value=out;
  }else if(state.menu==="rsa"){
   await ensureRSA();addStep("Input",text);addStep("Algoritma","RSA-OAEP 2048-bit");
   const out=encrypt?await rsaEncrypt(text):await rsaDecrypt(text);
   addStep(encrypt?"RSA Enkripsi":"RSA Dekripsi",out);$("result").value=out;
  }else if(state.menu==="super"){
   if(encrypt){
    addStep("Input",text);
    const s1=caesar(text,shift);addStep("1. Caesar",s1);
    const s2=vigenere(s1,key,false);addStep("2. Vigenère",s2);
    const aes=await aesEncrypt(s2,key);addStep("3. AES-256-GCM",aes);
    const aesKeyMaterial=key; // RSA protects the AES key material
    const rsa=await rsaEncrypt(aesKeyMaterial);
    addStep("4. RSA",rsa);
    const packet=JSON.stringify({rsaKey:rsa,aesData:aes});
    $("result").value=btoa(unescape(encodeURIComponent(packet)));
    addStep("Ciphertext akhir","Paket super enkripsi Base64 berhasil dibuat.");
   }else{
    const packet=JSON.parse(decodeURIComponent(escape(atob(text))));
    addStep("Input","Paket super enkripsi diterima");
    const aesKey=await rsaDecrypt(packet.rsaKey);addStep("1. RSA Dekripsi",aesKey);
    const s2=await aesDecrypt(packet.aesData,aesKey);addStep("2. AES Dekripsi",s2);
    const s1=vigenere(s2,aesKey,true);addStep("3. Vigenère Dekripsi",s1);
    const out=caesar(s1,-shift);addStep("4. Caesar Dekripsi",out);
    $("result").value=out;
   }
  }
 }catch(e){addStep("ERROR",e.message||"Terjadi kesalahan.");$("result").value="";}
}
$("encryptBtn").onclick=()=>run(true);$("decryptBtn").onclick=()=>run(false);
$("bruteForceBtn").onclick=()=>{
  const text=$("inputText").value;
  resetProcess();
  try{
   bruteForceCaesar(text);
  }catch(e){
   addStep("ERROR",e.message||"Terjadi kesalahan saat menjalankan brute force.");
   $("result").value="";
   alert(e.message||"Terjadi kesalahan saat menjalankan brute force.");
  }
};
$("generateRsaBtn").onclick=async()=>{state.rsaKeys=null;await ensureRSA()};
ensureRSA().catch(()=>{});
setMenu("caesar");
