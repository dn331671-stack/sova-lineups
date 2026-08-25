const MAPS = ['Ascent','Bind','Haven','Icebox','Lotus','Pearl','Split','Fracture','Sunset'];
const CATEGORIES = {
  'Phòng thủ': [['Chống Rush','Phát hiện địch rush sớm'],['Scan','Quét vị trí và kiểm soát khu vực'],['Anti Spike','Ngăn hoặc trì hoãn việc đặt spike'],['Khác','Các lineup phòng thủ khác']],
  'Tấn công': [['Recon','Scan site và khu vực cần chiếm'],['Clear Site','Hỗ trợ dọn site'],['Anti Defuse','Gây áp lực khi đối thủ defuse'],['Khác','Các lineup tấn công khác']]
};
let currentMap='', currentSide='', currentCategory='', supabaseClient=null, editingId=null;

const $=id=>document.getElementById(id);
function hideViews(){['homeView','mapView','categoryView','lineupView','adminView'].forEach(id=>$(id).classList.add('hidden'));}
function goHome(){hideViews();$('homeView').classList.remove('hidden');}
function showAdmin(){if(!supabaseClient){alert('Bạn chưa cấu hình Publishable key trong config.js');return;} hideViews();$('adminView').classList.remove('hidden'); loadAdmin();}
function renderMaps(){
  $('mapGrid').innerHTML=MAPS.map(m=>`<button class="map-card" onclick="openMap('${m}')"><b>${m.toUpperCase()}</b><small>Xem lineup Sova</small></button>`).join('');
  $('mapNav').innerHTML=MAPS.map(m=>`<button class="map-link" onclick="openMap('${m}')">◆ &nbsp; ${m.toUpperCase()}</button>`).join('');
}
function openMap(map){currentMap=map;hideViews();$('mapView').classList.remove('hidden');$('mapHeading').innerHTML=`<h1>${map.toUpperCase()}</h1><p class="muted">Chọn phe để xem lineup.</p>`;}
function chooseSide(side){currentSide=side;hideViews();$('categoryView').classList.remove('hidden');$('categoryHeading').innerHTML=`<h1>${currentMap.toUpperCase()} — ${side.toUpperCase()}</h1>`;$('categoryGrid').innerHTML=CATEGORIES[side].map(([n,d])=>`<button class="category-card" onclick="openCategory('${n}')"><b>${n}</b><small>${d}</small></button>`).join('');}
async function openCategory(category){currentCategory=category;hideViews();$('lineupView').classList.remove('hidden');$('lineupHeading').innerHTML=`<h1>${currentMap.toUpperCase()} — ${currentSide.toUpperCase()} — ${category.toUpperCase()}</h1>`;$('categorySearch').value='';await renderLineups();}
async function renderLineups(){
  const q=$('categorySearch').value.toLowerCase().trim();
  if(!supabaseClient){$('lineupList').innerHTML='<div class="lineup"><div><h3>Chưa kết nối Supabase</h3><p>Dán Publishable key vào config.js.</p></div></div>';return;}
  let query=supabaseClient.from('lineups').select('*').eq('map',currentMap).eq('side',currentSide).eq('category',currentCategory).order('created_at',{ascending:false});
  const {data,error}=await query;
  if(error){$('lineupList').innerHTML=`<div class="lineup"><div><h3>Lỗi tải lineup</h3><p>${escapeHtml(error.message)}</p></div></div>`;return;}
  const list=(data||[]).filter(x=>(`${x.title||''} ${x.description||''}`).toLowerCase().includes(q));
  $('lineupList').innerHTML=list.length?list.map(x=>`<article class="lineup"><div><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.description||'Lineup Sova')}</p></div><a class="video" href="${safeUrl(x.video_url)}" target="_blank" rel="noopener">▶ XEM VIDEO</a></article>`).join(''):`<div class="lineup"><div><h3>Chưa có lineup</h3><p>Admin chưa thêm lineup ở mục này.</p></div></div>`;
}
function populateForm(){ $('formMap').innerHTML=MAPS.map(m=>`<option>${m}</option>`).join(''); updateCategoryOptions(); }
$('formSide').addEventListener('change',updateCategoryOptions);
function updateCategoryOptions(){const side=$('formSide').value;$('formCategory').innerHTML=CATEGORIES[side].map(x=>`<option>${x[0]}</option>`).join('');}
async function loadAdmin(){
  const {data:{user}}=await supabaseClient.auth.getUser();
  if(!user){goHome();return;}
  $('adminUser').textContent=`Đăng nhập: ${user.email}`;populateForm();await loadAdminList();
}
async function loadAdminList(){
  const {data,error}=await supabaseClient.from('lineups').select('*').order('created_at',{ascending:false});
  if(error){$('adminList').innerHTML=`<p class="error">${escapeHtml(error.message)}</p>`;return;}
  $('adminList').innerHTML=(data||[]).map(x=>`<article class="admin-item"><div><b>${escapeHtml(x.title)}</b><small>${escapeHtml(x.map)} · ${escapeHtml(x.side)} · ${escapeHtml(x.category)}</small></div><div class="admin-actions"><button class="secondary" onclick="startEdit('${x.id}')">Sửa</button><button class="danger" onclick="deleteLineup('${x.id}')">Xóa</button></div></article>`).join('')||'<p class="muted">Chưa có lineup nào.</p>';
  window.adminData=data||[];
}
$('lineupForm').addEventListener('submit',async e=>{e.preventDefault();const payload={map:$('formMap').value,side:$('formSide').value,category:$('formCategory').value,title:$('formTitle').value.trim(),video_url:$('formVideo').value.trim(),description:$('formDescription').value.trim()};let result;if(editingId){result=await supabaseClient.from('lineups').update(payload).eq('id',editingId);}else{result=await supabaseClient.from('lineups').insert(payload);}if(result.error){alert(result.error.message);return;}resetForm();await loadAdminList();if(currentCategory)await renderLineups();alert(editingId?'Đã cập nhật lineup!':'Đã thêm lineup!');});
function startEdit(id){const x=(window.adminData||[]).find(v=>String(v.id)===String(id));if(!x)return;editingId=id;$('formMap').value=x.map;$('formSide').value=x.side;updateCategoryOptions();$('formCategory').value=x.category;$('formTitle').value=x.title;$('formVideo').value=x.video_url;$('formDescription').value=x.description||'';$('saveBtn').textContent='LƯU THAY ĐỔI';$('cancelEdit').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});}
$('cancelEdit').addEventListener('click',resetForm);
function resetForm(){editingId=null;$('lineupForm').reset();$('formMap').value=MAPS[0];$('formSide').value='Phòng thủ';updateCategoryOptions();$('saveBtn').textContent='＋ THÊM LINEUP';$('cancelEdit').classList.add('hidden');}
async function deleteLineup(id){if(!confirm('Xóa lineup này?'))return;const {error}=await supabaseClient.from('lineups').delete().eq('id',id);if(error){alert(error.message);return;}await loadAdminList();if(currentCategory)await renderLineups();}
$('logoutBtn').addEventListener('click',async()=>{await supabaseClient.auth.signOut();goHome();$('loginBtn').textContent='🔐 Admin';});
$('loginBtn').addEventListener('click',async()=>{const {data:{session}}=await supabaseClient.auth.getSession();if(session){showAdmin();}else{$('authModal').classList.remove('hidden');$('loginError').textContent='';}});
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginError').textContent='';const {error}=await supabaseClient.auth.signInWithPassword({email:$('loginEmail').value,password:$('loginPassword').value});if(error){$('loginError').textContent=error.message;return;}closeLogin();$('loginBtn').textContent='⚙ Admin';showAdmin();});
function closeLogin(){$('authModal').classList.add('hidden');}
$('categorySearch').addEventListener('input',renderLineups);
$('searchInput').addEventListener('input',async e=>{const q=e.target.value.toLowerCase().trim();if(!q){goHome();return;}if(!supabaseClient)return;const {data}=await supabaseClient.from('lineups').select('*').or(`title.ilike.%${q}%,map.ilike.%${q}%,category.ilike.%${q}%`).limit(1);if(data?.[0]){currentMap=data[0].map;currentSide=data[0].side;await openCategory(data[0].category);}});
supabaseInit();
async function supabaseInit(){if(SUPABASE_PUBLISHABLE_KEY==='PASTE_YOUR_PUBLISHABLE_KEY_HERE'){ $('setupNotice').classList.remove('hidden'); renderMaps(); return;} supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);const {data:{session}}=await supabaseClient.auth.getSession();if(session)$('loginBtn').textContent='⚙ Admin';supabaseClient.auth.onAuthStateChange((_event,s)=>{$('loginBtn').textContent=s?'⚙ Admin':'🔐 Admin';});renderMaps();}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function safeUrl(url){try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)?u.href:'#';}catch{return '#';}}
