const G=(k,d)=>{try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):d}catch{return d}};
const S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
 
if(!G('adminCreds',null)) S('adminCreds',{id:'admin',pass:'admin123'});
if(!G('rates',null)) S('rates',{cowFat:4,cowSnf:2,bufFat:5,bufSnf:2.5});
 
let CU=null,pendingOTP=null,otpPurpose=null,otpMobile=null,pendingUser=null,otpTmr=null;
let fpOTP=null,fpMobile=null;
 
// ---- SCREEN NAV ----
function goScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}
 
// ---- OTP UTILS ----
function genOTP(){return Math.floor(100000+Math.random()*900000).toString();}
function startTimer(){
  clearInterval(otpTmr);let t=120;
  const el=document.getElementById('otp_countdown');if(el) el.textContent=t;
  otpTmr=setInterval(()=>{t--;if(el) el.textContent=t;if(t<=0){clearInterval(otpTmr);const tim=document.getElementById('otp_timer');if(tim) tim.textContent='❌ OTP expire हो गया।';}},1000);
}
 
// ---- LOGIN ----
function sendLoginOTP(){
  const id=document.getElementById('li_id').value.trim();
  const pass=document.getElementById('li_pass').value.trim();
  const err=document.getElementById('li_err');
  err.style.display='none';
  const ac=G('adminCreds',{id:'admin',pass:'admin123'});
  let found=null;
  if(id===ac.id&&pass===ac.pass) found={id:'admin',name:'Admin',role:'admin',mobile:'9102188725'};
  else{const ks=G('kisans',[]);const k=ks.find(x=>(x.mobile===id||x.id===id)&&x.pass===pass);if(k) found={id:k.id,name:k.name,role:'kisan',mobile:k.mobile};}
  if(!found){err.textContent='❌ गलत ID या Password!';err.style.display='block';return;}
  pendingUser=found;pendingOTP=genOTP();otpPurpose='login';otpMobile=found.mobile;
  document.getElementById('otp_mobile_show').textContent='📱 '+otpMobile;
  document.getElementById('otp_display').textContent=pendingOTP;
  document.getElementById('otp_subtitle').textContent='Login OTP';
  document.getElementById('otp_err').style.display='none';
  document.getElementById('otp_suc').style.display='none';
  [0,1,2,3,4,5].forEach(i=>{document.getElementById('o'+i).value='';});
  startTimer();goScreen('screenOTP');
}
 
// ---- REGISTER ----
function doRegister(){
  const name=document.getElementById('rg_name').value.trim();
  const mobile=document.getElementById('rg_mobile').value.trim();
  const village=document.getElementById('rg_village').value.trim();
  const cows=document.getElementById('rg_cows').value.trim();
  const pass=document.getElementById('rg_pass').value.trim();
  const err=document.getElementById('rg_err');
  const suc=document.getElementById('rg_suc');
  err.style.display='none';suc.style.display='none';
  if(!name||!mobile||!pass){err.textContent='❌ नाम, mobile और password जरूरी है!';err.style.display='block';return;}
  if(mobile.length!==10){err.textContent='❌ 10 अंकों का mobile number डालें!';err.style.display='block';return;}
  if(pass.length<4){err.textContent='❌ Password कम से कम 4 अक्षर का होना चाहिए!';err.style.display='block';return;}
  const ks=G('kisans',[]);
  if(ks.find(k=>k.mobile===mobile)){err.textContent='❌ यह mobile पहले से registered है!';err.style.display='block';return;}
  pendingUser={id:'K'+Date.now(),name,mobile,village,cows:cows||'?',pass,role:'kisan',joinDate:new Date().toLocaleDateString('hi-IN')};
  pendingOTP=genOTP();otpPurpose='register';otpMobile=mobile;
  document.getElementById('otp_mobile_show').textContent='📱 '+mobile;
  document.getElementById('otp_display').textContent=pendingOTP;
  document.getElementById('otp_subtitle').textContent='Registration OTP';
  document.getElementById('otp_err').style.display='none';
  document.getElementById('otp_suc').style.display='none';
  [0,1,2,3,4,5].forEach(i=>{document.getElementById('o'+i).value='';});
  startTimer();goScreen('screenOTP');
}
 
// ---- OTP BOXES ----
function otpNext(el,idx){
  if(el.value.length>1) el.value=el.value.slice(-1);
  if(el.value&&idx<5) document.getElementById('o'+(idx+1)).focus();
}
function getOTP(){return [0,1,2,3,4,5].map(i=>document.getElementById('o'+i).value).join('');}
 
function verifyOTP(){
  const entered=getOTP();
  const err=document.getElementById('otp_err');
  const suc=document.getElementById('otp_suc');
  err.style.display='none';suc.style.display='none';
  if(entered.length!==6){err.textContent='❌ 6 अंकों का OTP डालें!';err.style.display='block';return;}
  if(entered!==pendingOTP){err.textContent='❌ गलत OTP! फिर से try करें।';err.style.display='block';return;}
  clearInterval(otpTmr);
  suc.textContent='✅ OTP Verified!';suc.style.display='block';
  if(otpPurpose==='register'){
    const ks=G('kisans',[]);ks.push(pendingUser);S('kisans',ks);
    // Send new kisan details to admin WhatsApp
    const msg=`🔔 *नया किसान Registered!*\n\n👨‍🌾 नाम: ${pendingUser.name}\n📱 Mobile/ID: ${pendingUser.mobile}\n🔒 Password: ${pendingUser.pass}\n🏘️ गाँव: ${pendingUser.village||'N/A'}\n🐄 पशु: ${pendingUser.cows}\n🆔 System ID: ${pendingUser.id}\n📅 Date: ${pendingUser.joinDate}\n\n_Gramin Dairy Manager_`;
    setTimeout(()=>{
      window.open('https://wa.me/919102188725?text='+encodeURIComponent(msg),'_blank');
      goScreen('screenLogin');
      ['rg_name','rg_mobile','rg_village','rg_cows','rg_pass'].forEach(id=>{document.getElementById(id).value='';});
    },800);
  } else if(otpPurpose==='login'){
    CU=pendingUser;
    setTimeout(()=>loadApp(),500);
  }
}
 
function resendOTP(){
  pendingOTP=genOTP();
  document.getElementById('otp_display').textContent=pendingOTP;
  [0,1,2,3,4,5].forEach(i=>{document.getElementById('o'+i).value='';});
  document.getElementById('otp_err').style.display='none';
  startTimer();
}
 
// ---- FORGOT PASSWORD ----
function forgotSendOTP(){
  const mobile=document.getElementById('fp_mobile').value.trim();
  const err=document.getElementById('fp_err1');err.style.display='none';
  const ac=G('adminCreds',{id:'admin',pass:'admin123'});
  const ks=G('kisans',[]);
  const isAdmin=(mobile===ac.id||mobile==='admin');
  const kisan=ks.find(k=>k.mobile===mobile);
  if(!isAdmin&&!kisan){err.textContent='❌ यह mobile/ID registered नहीं है!';err.style.display='block';return;}
  fpOTP=genOTP();fpMobile=mobile;
  document.getElementById('fp_otp_display').textContent=fpOTP;
  document.getElementById('fp_step1').style.display='none';
  document.getElementById('fp_step2').style.display='block';
  [0,1,2,3,4,5].forEach(i=>{document.getElementById('fp'+i).value='';});
}
 
function fpNext(el,idx){
  if(el.value.length>1) el.value=el.value.slice(-1);
  if(el.value&&idx<5) document.getElementById('fp'+(idx+1)).focus();
}
 
function forgotVerify(){
  const entered=[0,1,2,3,4,5].map(i=>document.getElementById('fp'+i).value).join('');
  const newpass=document.getElementById('fp_newpass').value.trim();
  const err=document.getElementById('fp_err2');const suc=document.getElementById('fp_suc');
  err.style.display='none';suc.style.display='none';
  if(entered!==fpOTP){err.textContent='❌ गलत OTP!';err.style.display='block';return;}
  if(!newpass||newpass.length<4){err.textContent='❌ कम से कम 4 अक्षर का password डालें!';err.style.display='block';return;}
  const ac=G('adminCreds',{id:'admin',pass:'admin123'});
  if(fpMobile===ac.id||fpMobile==='admin'){ac.pass=newpass;S('adminCreds',ac);}
  else{const ks=G('kisans',[]);const idx=ks.findIndex(k=>k.mobile===fpMobile);if(idx>-1){ks[idx].pass=newpass;S('kisans',ks);}}
  suc.textContent='✅ Password बदल गया! अब Login करें।';suc.style.display='block';
  setTimeout(()=>{goScreen('screenLogin');document.getElementById('fp_step1').style.display='block';document.getElementById('fp_step2').style.display='none';document.getElementById('fp_mobile').value='';document.getElementById('fp_newpass').value='';},1500);
}
 
// ---- LOAD APP ----
function loadApp(){
  goScreen('screenApp');
  document.getElementById('h_user').textContent='👤 '+CU.name;
  if(CU.role==='admin'){
    document.getElementById('h_role').textContent='Admin Panel';
    document.getElementById('tab-entry').style.display='flex';
    document.getElementById('tab-kisans').style.display='flex';
    document.getElementById('tab-wreq').style.display='flex';
    document.getElementById('tab-admin').style.display='flex';
    document.getElementById('kisan_sel_wrap').style.display='block';
    document.getElementById('admin_month').style.display='block';
    document.getElementById('f_kisan').style.display='inline-block';
    document.getElementById('th_kisan').style.display='table-cell';
    loadRateSettings();loadKisanDropdown();loadKisanFilter();renderKisans();renderWreq();
  } else {
    document.getElementById('h_role').textContent=CU.name;
    document.getElementById('tab-withdraw').style.display='flex';
    renderWithdrawPage();
  }
  document.getElementById('en_date').value=new Date().toISOString().split('T')[0];
  switchTab('dashboard');renderDashboard();renderRecords();
}
 
function doLogout(){
  CU=null;goScreen('screenLogin');
  document.getElementById('li_id').value='';document.getElementById('li_pass').value='';document.getElementById('li_err').style.display='none';
}
 
// ---- TABS ----
function switchTab(tab){
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
  document.getElementById('content-'+tab).classList.add('active');
  document.getElementById('tab-'+tab).classList.add('active');
  if(tab==='dashboard') renderDashboard();
  if(tab==='records') renderRecords();
  if(tab==='kisans') renderKisans();
  if(tab==='withdraw') renderWithdrawPage();
  if(tab==='wreq') renderWreq();
}
 
// ---- RATE CALC ----
function calcRate(){
  const milk=parseFloat(document.getElementById('en_milk').value)||0;
  const fat=parseFloat(document.getElementById('en_fat').value)||0;
  const snf=parseFloat(document.getElementById('en_snf').value)||0;
  const r=G('rates',{cowFat:4,cowSnf:2,bufFat:5,bufSnf:2.5});
  const rate=(fat*r.cowFat)+(snf*r.cowSnf);
  document.getElementById('cr_rate').textContent=rate.toFixed(2);
  document.getElementById('cr_amt').textContent=(rate*milk).toFixed(2);
}
 
// ---- SAVE ENTRY ----
function saveEntry(){
  const err=document.getElementById('en_err');const suc=document.getElementById('en_suc');
  err.style.display='none';suc.style.display='none';
  const date=document.getElementById('en_date').value;
  const shift=document.getElementById('en_shift').value;
  const milk=parseFloat(document.getElementById('en_milk').value);
  const fat=parseFloat(document.getElementById('en_fat').value);
  const snf=parseFloat(document.getElementById('en_snf').value);
  if(!date||!milk||!fat||!snf){err.textContent='❌ सभी fields भरें!';err.style.display='block';return;}
  const r=G('rates',{cowFat:4,cowSnf:2,bufFat:5,bufSnf:2.5});
  const rate=(fat*r.cowFat)+(snf*r.cowSnf);
  const amount=rate*milk;
  let kisanId=CU.id,kisanName=CU.name;
  if(CU.role==='admin'){
    const sel=document.getElementById('en_kisan').value;
    if(!sel){err.textContent='❌ किसान चुनें!';err.style.display='block';return;}
    const k=G('kisans',[]).find(x=>x.id===sel);
    if(k){kisanId=k.id;kisanName=k.name;}
  }
  const entries=G('entries',[]);
  entries.push({id:Date.now(),date,shift,milk,fat,snf,rate:+rate.toFixed(2),amount:+amount.toFixed(2),kisanId,kisanName,createdAt:new Date().toISOString()});
  S('entries',entries);
  suc.textContent='✅ Entry save! Amount: ₹'+amount.toFixed(2);suc.style.display='block';
  ['en_milk','en_fat','en_snf'].forEach(id=>{document.getElementById(id).value='';});
  document.getElementById('cr_rate').textContent='0.00';document.getElementById('cr_amt').textContent='0.00';
  renderDashboard();
}
 
// ---- DASHBOARD ----
function renderDashboard(){
  const entries=G('entries',[]);
  const today=new Date().toISOString().split('T')[0];
  const my=CU.role==='kisan'?entries.filter(e=>e.kisanId===CU.id):entries;
  const td=my.filter(e=>e.date===today);
  const morn=td.filter(e=>e.shift==='morning');
  const eve=td.filter(e=>e.shift==='evening');
  const sumM=a=>a.reduce((s,e)=>s+e.milk,0);
  const sumA=a=>a.reduce((s,e)=>s+e.amount,0);
  document.getElementById('st_milk').textContent=sumM(td).toFixed(1)+'L';
  document.getElementById('st_amt').textContent='₹'+sumA(td).toFixed(0);
  document.getElementById('st_morn').textContent=sumM(morn).toFixed(1)+'L';
  document.getElementById('st_eve').textContent=sumM(eve).toFixed(1)+'L';
  document.getElementById('s_mm').textContent=sumM(morn).toFixed(1)+' L';
  document.getElementById('s_ma').textContent='₹'+sumA(morn).toFixed(2);
  document.getElementById('s_em').textContent=sumM(eve).toFixed(1)+' L';
  document.getElementById('s_ea').textContent='₹'+sumA(eve).toFixed(2);
  if(CU.role==='admin'){
    const m=today.slice(0,7);
    document.getElementById('st_month').textContent='₹'+my.filter(e=>e.date.startsWith(m)).reduce((s,e)=>s+e.amount,0).toFixed(2);
  }
  const recent=[...my].reverse().slice(0,5);
  const el=document.getElementById('recentEntries');
  if(!recent.length){el.innerHTML='<div class="empty-state"><div class="ei">📭</div><p>कोई entry नहीं</p></div>';return;}
  el.innerHTML=recent.map(e=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee">
      <div><strong>${e.date}</strong> <span class="badge ${e.shift}">${e.shift==='morning'?'☀️ सुबह':'🌙 शाम'}</span>${CU.role==='admin'?` <span style="font-size:11px;color:var(--text-light)">— ${e.kisanName}</span>`:''}</div>
      <div style="text-align:right"><div style="font-weight:700;color:var(--primary)">${e.milk}L</div><div style="font-size:11px;color:var(--accent);font-weight:700">₹${e.amount}</div></div>
    </div>`).join('');
}
 
// ---- RECORDS ----
function renderRecords(){
  const entries=G('entries',[]);
  let f=CU.role==='kisan'?entries.filter(e=>e.kisanId===CU.id):entries;
  const df=document.getElementById('f_date').value;
  const sf=document.getElementById('f_shift').value;
  const kf=CU.role==='admin'?document.getElementById('f_kisan').value:'';
  if(df) f=f.filter(e=>e.date===df);
  if(sf) f=f.filter(e=>e.shift===sf);
  if(kf) f=f.filter(e=>e.kisanId===kf);
  const tbody=document.getElementById('rec_body');
  const empty=document.getElementById('rec_empty');
  const total=document.getElementById('rec_total');
  if(!f.length){tbody.innerHTML='';empty.style.display='block';total.style.display='none';return;}
  empty.style.display='none';
  const tA=f.reduce((s,e)=>s+e.amount,0);const tM=f.reduce((s,e)=>s+e.milk,0);
  tbody.innerHTML=[...f].reverse().map(e=>`<tr><td>${e.date}</td><td><span class="badge ${e.shift}">${e.shift==='morning'?'☀️ सुबह':'🌙 शाम'}</span></td>${CU.role==='admin'?`<td>${e.kisanName}</td>`:''}<td><strong>${e.milk}L</strong></td><td>${e.fat}%</td><td>${e.snf}%</td><td>₹${e.rate}</td><td style="color:var(--primary);font-weight:700">₹${e.amount}</td></tr>`).join('');
  total.style.display='flex';document.getElementById('rec_total_val').textContent=`${tM.toFixed(1)}L | ₹${tA.toFixed(2)}`;
}
 
// ---- KISANS ----
function renderKisans(){
  const kisans=G('kisans',[]);const entries=G('entries',[]);
  const el=document.getElementById('kisan_list');
  if(!kisans.length){el.innerHTML='<div class="empty-state"><div class="ei">👨‍🌾</div><p>कोई किसान नहीं</p></div>';return;}
  const today=new Date().toISOString().split('T')[0];
  el.innerHTML=kisans.map(k=>{
    const ke=entries.filter(e=>e.kisanId===k.id);
    const tM=ke.reduce((s,e)=>s+e.milk,0);const tA=ke.reduce((s,e)=>s+e.amount,0);
    const tdA=ke.filter(e=>e.date===today).reduce((s,e)=>s+e.amount,0);
    const wreqs=G('wreqs',[]).filter(w=>w.kisanId===k.id);
    const withdrawn=wreqs.filter(w=>w.status==='approved').reduce((s,w)=>s+w.amount,0);
    const pending=wreqs.filter(w=>w.status==='pending').reduce((s,w)=>s+w.amount,0);
    return `<div class="kisan-card">
      <div class="kisan-info" style="flex:1">
        <h4>👨‍🌾 ${k.name}</h4>
        <p>📱 ${k.mobile} | 🏘️ ${k.village||'N/A'} | 🐄 ${k.cows} पशु</p>
        <p style="font-size:10px;color:var(--text-light)">Withdrawn: ₹${withdrawn.toFixed(0)} | Pending: ₹${pending.toFixed(0)}</p>
      </div>
      <div class="kisan-stats">
        <div><div class="ks-v">${tM.toFixed(0)}L</div><div class="ks-l">कुल दूध</div></div>
        <div><div class="ks-v" style="color:var(--accent)">₹${tA.toFixed(0)}</div><div class="ks-l">कुल रकम</div></div>
        <div><div class="ks-v" style="color:var(--blue)">₹${tdA.toFixed(0)}</div><div class="ks-l">आज</div></div>
      </div>
      <button onclick="deleteKisan('${k.id}')" style="background:var(--red);color:#fff;border:none;padding:7px 13px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0">🗑️ Delete</button>
    </div>`;
  }).join('');
}
 
function loadKisanDropdown(){
  const ks=G('kisans',[]);
  document.getElementById('en_kisan').innerHTML='<option value="">-- किसान चुनें --</option>'+ks.map(k=>`<option value="${k.id}">${k.name} (${k.mobile})</option>`).join('');
}
 
function loadKisanFilter(){
  const ks=G('kisans',[]);
  document.getElementById('f_kisan').innerHTML='<option value="">सभी किसान</option>'+ks.map(k=>`<option value="${k.id}">${k.name}</option>`).join('');
}
 
// ---- ADMIN ----
function loadRateSettings(){
  const r=G('rates',{cowFat:4,cowSnf:2,bufFat:5,bufSnf:2.5});
  document.getElementById('cow_fat').value=r.cowFat;document.getElementById('cow_snf').value=r.cowSnf;
  document.getElementById('buf_fat').value=r.bufFat;document.getElementById('buf_snf').value=r.bufSnf;
}
 
function saveRates(){
  S('rates',{cowFat:parseFloat(document.getElementById('cow_fat').value)||4,cowSnf:parseFloat(document.getElementById('cow_snf').value)||2,bufFat:parseFloat(document.getElementById('buf_fat').value)||5,bufSnf:parseFloat(document.getElementById('buf_snf').value)||2.5});
}
 
function changeAdminPass(){
  const np=document.getElementById('new_admin_pass').value.trim();if(!np) return;
  const c=G('adminCreds',{id:'admin',pass:'admin123'});c.pass=np;S('adminCreds',c);
  document.getElementById('pass_suc').style.display='block';document.getElementById('new_admin_pass').value='';
  setTimeout(()=>document.getElementById('pass_suc').style.display='none',2000);
}
 
function clearAllData(){
  if(confirm('⚠️ सब entries delete होंगी?')){S('entries',[]);renderDashboard();renderRecords();alert('✅ Data delete हो गया।');}
}
 
// ---- WHATSAPP ----
function buildReport(){
  const entries=G('entries',[]);const today=new Date().toISOString().split('T')[0];
  const td=entries.filter(e=>e.date===today);
  if(!td.length) return '🥛 *Gramin Dairy Report*\n\nआज कोई entry नहीं है।';
  let msg=`🥛 *Gramin Dairy Report*\n📅 ${today}\n\n*आज की Entries:*\n━━━━━━━━━━━━━━━\n`;
  const grp={};td.forEach(e=>{if(!grp[e.kisanId])grp[e.kisanId]=[];grp[e.kisanId].push(e);});
  let gT=0,gM=0;const kisans=G('kisans',[]);
  Object.keys(grp).forEach(kid=>{
    const ke=grp[kid];const k=kisans.find(x=>x.id===kid);const name=k?k.name:ke[0].kisanName;
    msg+=`\n👨‍🌾 *${name}*\n`;
    ke.forEach(e=>{msg+=`  ${e.shift==='morning'?'☀️ सुबह':'🌙 शाम'}: ${e.milk}L | FAT:${e.fat}% | SNF:${e.snf}% | ₹${e.rate}/L = *₹${e.amount}*\n`;gT+=e.amount;gM+=e.milk;});
    msg+=`  🏦 Total: ₹${ke.reduce((s,e)=>s+e.amount,0).toFixed(2)}\n`;
  });
  msg+=`\n━━━━━━━━━━━━━━━\n📊 *Grand Total: ${gM.toFixed(1)}L | ₹${gT.toFixed(2)}*\n_Gramin Dairy Manager_`;
  return msg;
}
 
function sendWhatsApp(){window.open('https://wa.me/919102188725?text='+encodeURIComponent(buildReport()),'_blank');}
 
function downloadExcel(){
  const entries=G('entries',[]);if(!entries.length){alert('कोई data नहीं!');return;}
  let csv='तारीख,समय,किसान,दूध (L),FAT%,SNF%,Rate ₹/L,Amount ₹\n';
  entries.forEach(e=>{csv+=`${e.date},${e.shift==='morning'?'सुबह':'शाम'},${e.kisanName},${e.milk},${e.fat},${e.snf},${e.rate},${e.amount}\n`;});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));
  a.download=`dairy_${new Date().toISOString().split('T')[0]}.csv`;a.click();
}
 
// ---- DELETE KISAN ----
function deleteKisan(id){
  const ks=G('kisans',[]);
  const k=ks.find(x=>x.id===id);
  if(!k) return;
  if(!confirm(`⚠️ "${k.name}" को delete करना चाहते हो?\n\nउनकी सभी entries और withdraw requests भी delete होंगी।`)) return;
  S('kisans',ks.filter(x=>x.id!==id));
  S('entries',G('entries',[]).filter(e=>e.kisanId!==id));
  S('wreqs',G('wreqs',[]).filter(w=>w.kisanId!==id));
  renderKisans();loadKisanDropdown();loadKisanFilter();
  alert(`✅ ${k.name} delete हो गए।`);
}
 
// ---- WITHDRAW (Kisan) ----
function renderWithdrawPage(){
  const entries=G('entries',[]);
  const wreqs=G('wreqs',[]).filter(w=>w.kisanId===CU.id);
  const totalEarn=entries.filter(e=>e.kisanId===CU.id).reduce((s,e)=>s+e.amount,0);
  const withdrawn=wreqs.filter(w=>w.status==='approved').reduce((s,w)=>s+w.amount,0);
  const pendingAmt=wreqs.filter(w=>w.status==='pending').reduce((s,w)=>s+w.amount,0);
  const available=totalEarn-withdrawn-pendingAmt;
 
  document.getElementById('wd_total_earn').textContent='₹'+totalEarn.toFixed(2);
  document.getElementById('wd_withdrawn').textContent='₹'+withdrawn.toFixed(2);
  document.getElementById('wd_available').textContent='₹'+Math.max(0,available).toFixed(2);
  document.getElementById('wd_pending').textContent='₹'+pendingAmt.toFixed(2);
 
  const hist=document.getElementById('wd_history');
  if(!wreqs.length){hist.innerHTML='<div class="empty-state"><div class="ei">📭</div><p>कोई request नहीं</p></div>';return;}
  hist.innerHTML=[...wreqs].reverse().map(w=>{
    const color=w.status==='approved'?'var(--primary)':w.status==='rejected'?'var(--red)':'var(--accent)';
    const label=w.status==='approved'?'✅ Approved':w.status==='rejected'?'❌ Rejected':'⏳ Pending';
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee">
      <div>
        <div style="font-weight:700">₹${w.amount.toFixed(2)}</div>
        <div style="font-size:11px;color:var(--text-light)">${w.date}${w.note?' • '+w.note:''}</div>
        ${w.adminNote?`<div style="font-size:11px;color:${color}">Admin: ${w.adminNote}</div>`:''}
      </div>
      <span style="background:${color};color:#fff;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">${label}</span>
    </div>`;
  }).join('');
}
 
function submitWithdraw(){
  const amt=parseFloat(document.getElementById('wd_amount').value);
  const note=document.getElementById('wd_note').value.trim();
  const err=document.getElementById('wd_err');const suc=document.getElementById('wd_suc');
  err.style.display='none';suc.style.display='none';
 
  if(!amt||amt<=0){err.textContent='❌ सही amount डालें!';err.style.display='block';return;}
 
  const entries=G('entries',[]);
  const wreqs=G('wreqs',[]);
  const totalEarn=entries.filter(e=>e.kisanId===CU.id).reduce((s,e)=>s+e.amount,0);
  const withdrawn=wreqs.filter(w=>w.kisanId===CU.id&&w.status==='approved').reduce((s,w)=>s+w.amount,0);
  const pendingAmt=wreqs.filter(w=>w.kisanId===CU.id&&w.status==='pending').reduce((s,w)=>s+w.amount,0);
  const available=totalEarn-withdrawn-pendingAmt;
 
  if(amt>available){err.textContent=`❌ Available balance ₹${available.toFixed(2)} से ज्यादा नहीं ले सकते!`;err.style.display='block';return;}
 
  wreqs.push({id:'W'+Date.now(),kisanId:CU.id,kisanName:CU.name,amount:amt,note,status:'pending',date:new Date().toISOString().split('T')[0],createdAt:new Date().toISOString()});
  S('wreqs',wreqs);
 
  // Notify admin on WhatsApp
  const msg=`💸 *Withdraw Request*\n\n👨‍🌾 किसान: ${CU.name}\n📱 Mobile: ${CU.mobile||CU.id}\n💵 Amount: ₹${amt.toFixed(2)}\n📝 Note: ${note||'—'}\n📅 Date: ${new Date().toLocaleDateString('hi-IN')}\n\n_Gramin Dairy Manager_`;
  window.open('https://wa.me/919102188725?text='+encodeURIComponent(msg),'_blank');
 
  suc.textContent='✅ Request भेज दी गई! Admin approve करेंगे।';suc.style.display='block';
  document.getElementById('wd_amount').value='';document.getElementById('wd_note').value='';
  renderWithdrawPage();
}
 
// ---- WREQ (Admin) ----
function renderWreq(){
  const wreqs=G('wreqs',[]);
  const pending=wreqs.filter(w=>w.status==='pending');
  const done=wreqs.filter(w=>w.status!=='pending');
 
  const badge=document.getElementById('wreq_badge');
  if(badge) badge.textContent=pending.length;
 
  const listEl=document.getElementById('wreq_list');
  if(!pending.length){listEl.innerHTML='<div class="empty-state"><div class="ei">📭</div><p>कोई pending request नहीं</p></div>';}
  else{
    listEl.innerHTML=pending.map(w=>`
      <div style="background:#fff9f0;border:2px solid var(--accent);border-radius:12px;padding:13px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div>
            <div style="font-weight:800;font-size:15px">₹${w.amount.toFixed(2)}</div>
            <div style="font-size:12px;color:var(--text-light)">👨‍🌾 ${w.kisanName} | 📅 ${w.date}</div>
            ${w.note?`<div style="font-size:12px;color:var(--text)">📝 ${w.note}</div>`:''}
          </div>
          <span style="background:var(--accent);color:#fff;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">⏳ Pending</span>
        </div>
        <div style="display:flex;gap:8px">
          <input type="text" id="note_${w.id}" placeholder="Admin note (optional)" style="flex:1;padding:7px 10px;border:2px solid var(--border);border-radius:8px;font-family:inherit;font-size:12px;outline:none;">
          <button onclick="approveWithdraw('${w.id}')" style="background:var(--primary);color:#fff;border:none;padding:7px 13px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer">✅ Approve</button>
          <button onclick="rejectWithdraw('${w.id}')" style="background:var(--red);color:#fff;border:none;padding:7px 13px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer">❌ Reject</button>
        </div>
      </div>`).join('');
  }
 
  const doneEl=document.getElementById('wreq_done');
  if(!done.length){doneEl.innerHTML='<div class="empty-state"><div class="ei">✅</div><p>कोई completed request नहीं</p></div>';}
  else{
    doneEl.innerHTML=[...done].reverse().map(w=>{
      const color=w.status==='approved'?'var(--primary)':'var(--red)';
      const label=w.status==='approved'?'✅ Approved':'❌ Rejected';
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee">
        <div>
          <div style="font-weight:700">₹${w.amount.toFixed(2)} — ${w.kisanName}</div>
          <div style="font-size:11px;color:var(--text-light)">${w.date}${w.adminNote?' • '+w.adminNote:''}</div>
        </div>
        <span style="background:${color};color:#fff;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">${label}</span>
      </div>`;
    }).join('');
  }
}
 
function approveWithdraw(id){
  const wreqs=G('wreqs',[]);
  const idx=wreqs.findIndex(w=>w.id===id);if(idx<0) return;
  const note=document.getElementById('note_'+id)?.value||'';
  wreqs[idx].status='approved';wreqs[idx].adminNote=note;wreqs[idx].resolvedAt=new Date().toISOString();
  S('wreqs',wreqs);
  // Notify kisan via WhatsApp
  const w=wreqs[idx];
  const ks=G('kisans',[]).find(k=>k.id===w.kisanId);
  if(ks){
    const msg=`✅ *Withdraw Approved!*\n\n👨‍🌾 ${w.kisanName}\n💵 Amount: ₹${w.amount.toFixed(2)}\n📝 ${note||'Admin ने approve किया'}\n📅 ${new Date().toLocaleDateString('hi-IN')}\n\n_Gramin Dairy Manager_`;
    window.open('https://wa.me/91'+ks.mobile+'?text='+encodeURIComponent(msg),'_blank');
  }
  renderWreq();
}
 
function rejectWithdraw(id){
  const wreqs=G('wreqs',[]);
  const idx=wreqs.findIndex(w=>w.id===id);if(idx<0) return;
  const note=document.getElementById('note_'+id)?.value||'';
  wreqs[idx].status='rejected';wreqs[idx].adminNote=note;wreqs[idx].resolvedAt=new Date().toISOString();
  S('wreqs',wreqs);renderWreq();
}
 
// Auto nightly WhatsApp at 9PM
function checkAutoWA(){
  const today=new Date().toISOString().split('T')[0];const now=new Date();
  if(now.getHours()===21&&localStorage.getItem('lastWA')!==today){localStorage.setItem('lastWA',today);sendWhatsApp();}
}
setInterval(checkAutoWA,60000);
