const translations = {
 uz:{latest:"So‘nggi yangiliklar",popular:"Ommabop",topics:"Mavzular",eyebrow:"DUNYO YANGILIKLARI · BIR JOYDA",headline:"Dunyo ritmini<br><em>birinchi bo‘lib</em> his eting.",sub:"Jahon, texnologiya, biznes, sport va ilm-fandagi muhim voqealar.",explore:"Yangiliklarni ko‘rish ↓",ad:"Reklama joyi — reklama tarmog‘i ulangach faollashadi",all:"Barchasi",world:"Jahon",technology:"Texnologiya",business:"Biznes",sports:"Sport",science:"Ilm-fan",follow:"Dunyodan xabardor bo‘ling.",followSub:"Muhim voqealar — bitta manzilda.",tagline:"The World. One Pulse.",disclaimer:"Maqolalar manbasi har bir xabarda ko‘rsatiladi."},
 ru:{latest:"Последние новости",popular:"Популярное",topics:"Темы",eyebrow:"МИРОВЫЕ НОВОСТИ · В ОДНОМ МЕСТЕ",headline:"Почувствуйте<br><em>пульс мира</em> первыми.",sub:"Главные события мира, технологий, бизнеса, спорта и науки.",explore:"Смотреть новости ↓",ad:"Место для рекламы — активируется после подключения рекламной сети",all:"Все",world:"Мир",technology:"Технологии",business:"Бизнес",sports:"Спорт",science:"Наука",follow:"Будьте в курсе событий.",followSub:"Важные события — в одном месте.",tagline:"The World. One Pulse.",disclaimer:"Источник указан в каждой публикации."},
 en:{latest:"Latest news",popular:"Popular",topics:"Topics",eyebrow:"WORLD NEWS · ONE PLACE",headline:"Feel the<br><em>pulse of the world</em> first.",sub:"Important stories in world affairs, technology, business, sports and science.",explore:"Explore the news ↓",ad:"Ad placement — activates after an ad network is connected",all:"All",world:"World",technology:"Technology",business:"Business",sports:"Sports",science:"Science",follow:"Stay informed.",followSub:"Important stories — in one place.",tagline:"The World. One Pulse.",disclaimer:"The source is shown with every story."}
};
let lang="uz", category="all";
const $=s=>document.querySelector(s);
function setLanguage(v){lang=v;document.documentElement.lang=v;document.querySelectorAll("[data-i]").forEach(el=>{const k=el.dataset.i;if(translations[v][k])el.innerHTML=translations[v][k]});}
$("#lang").addEventListener("change",e=>setLanguage(e.target.value));
$("#filters").addEventListener("click",e=>{const b=e.target.closest("button[data-cat]");if(!b)return;category=b.dataset.cat;document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x===b));loadNews();});
$("#search").addEventListener("input",()=>loadNews());
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function loadNews(){
 try{
  const params=new URLSearchParams({category,q:$("#search").value});
  const r=await fetch("/api/articles?"+params);if(!r.ok)throw new Error("api");
  const rows=await r.json();
  if(!rows.length){$("#news").innerHTML=`<p class="status">Hozircha yangilik yo‘q. RSS bot ulangach maqolalar shu yerda ko‘rinadi.</p>`;return;}
  $("#news").innerHTML=rows.map(a=>`<article class="news-card"><div class="card-art">📰</div><div class="card-body"><span class="tag">${escapeHtml(a.category||"WORLD").toUpperCase()}</span><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.summary||"")}</p><small>${escapeHtml(a.source||"Source")} · <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">Asl manba ↗</a></small></div></article>`).join("");
 }catch(e){/* preview/server hali ulanmagan bo'lishi mumkin */}
}
async function status(){try{const r=await fetch("/api/status");const s=await r.json();$("#status").textContent=`Server: faol · Maqolalar: ${s.articles} · RSS bot: ${s.rss_bot_enabled?"yoqilgan":"sinov rejimida"}`;}catch(e){$("#status").textContent="Demo ko‘rinish. Server ishga tushgach holat shu yerda ko‘rinadi.";}}
setLanguage("uz");loadNews();status();
