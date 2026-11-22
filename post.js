/* トリミングログ 追加ファイル post.js */
(function(){
const TPL={chihuahua:'チワワ',simple:'シンプル'};
const W0=1080,H0=1920,SAFE=[230,110,400,0];
const TS={s:['小',0.8],m:['中',1],l:['大',1.25]};
const MD={both:'ビフォー＋アフター',after:'アフターだけ'};
const T={id:null,imgs:{},slots:[],blob:null,tok:0,bt:null,svt:null,raf:0,ptrs:new Map(),act:null,d0:0,z0:1};
let B=null;
const css=document.createElement('style');
css.textContent='.tpx{border:none;background:none;color:#bbb;font-size:15px;padding:0 2px 0 4px}.tpchips{margin-top:8px}#bk_prev canvas{border-radius:8px}';
document.head.appendChild(css);

/* ---- 犬のイラスト ---- */
function cutBg(im){const w=im.naturalWidth,h=im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(im,0,0);
  const D=x.getImageData(0,0,w,h),p=D.data,seen=new Uint8Array(w*h),q=new Int32Array(w*h);let qh=0,qt=0;
  const push=i=>{if(seen[i])return;seen[i]=1;const o=i*4;if(p[o+3]<20||(p[o]>232&&p[o+1]>232&&p[o+2]>232)){p[o+3]=0;q[qt++]=i}};
  for(let i=0;i<w;i++){push(i);push((h-1)*w+i)}for(let j=0;j<h;j++){push(j*w);push(j*w+w-1)}
  while(qh<qt){const i=q[qh++],X=i%w;if(X>0)push(i-1);if(X<w-1)push(i+1);if(i>=w)push(i-w);if(i<w*h-w)push(i+w)}
  x.putImageData(D,0,0);return c}
const DOGS=[['dog.png','スムース'],['dog2.png','ロング'],['dog3.png','ブラタン']].map(([src,n],i)=>{
  const d={n,im:null,url:''},im=new Image();let alt=0;
  im.onload=()=>{d.url=im.src;try{d.im=cutBg(im)}catch(e){d.im=im}
    document.querySelectorAll('img[data-dog="'+i+'"]').forEach(e=>{e.src=d.url;e.style.display=''});redraw();if(B&&document.getElementById('bk_prev'))bkDraw()};
  im.onerror=()=>{if(!alt){alt=1;im.src=src.replace('.png','.PNG')}};
  im.src=src;return d});

function cfg(){S.settings=S.settings||{};const c=S.settings.tp=S.settings.tp||{};
  if(!TPL[c.tpl])c.tpl='chihuahua';
  if(!(c.style>=0&&c.style<STYLES.length))c.style=0;
  c.size='reel';
  if(!MD[c.mode])c.mode='both';
  if(!TS[c.ts])c.ts='m';
  c.dog=Number(c.dog)||0;if(!(c.dog>=0&&c.dog<DOGS.length))c.dog=0;
  if(!Array.isArray(S.settings.myTags))S.settings.myTags=[];
  if(!Array.isArray(S.settings.tpPhrases))S.settings.tpPhrases=typeof DEF_PHRASES!=='undefined'?DEF_PHRASES.slice():[];
  return c}
function pt(r){const p=r.pt=r.pt||{};
  if(p.title==null)p.title='';if(p.sub==null)p.sub='';if(p.lb==null)p.lb=true;
  if(p.lbB==null)p.lbB='BEFORE';if(p.lbA==null)p.lbA='AFTER';if(!Array.isArray(p.off))p.off=[];return p}
const isBoth=(c,r)=>c.mode==='both'&&!!r.before&&!!r.after;
const ckey=(c,r)=>c.tpl+'|reel|'+(isBoth(c,r)?'both':'one');
function crop(r,k,c){c=c||cfg();r.tpCrop=r.tpCrop||{};const key=ckey(c,r);const o=r.tpCrop[key]=r.tpCrop[key]||{};return o[k]=o[k]||{z:1,x:0,y:0}}
function isLight(h){h=String(h).replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);if(isNaN(n))return false;return(0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255>0.7}
function laterSave(){clearTimeout(T.svt);T.svt=setTimeout(()=>save(),500)}
async function loadImgs(ids){for(const id of ids){if(id&&!T.imgs[id]){const src=await getImg(id);if(src){try{T.imgs[id]=await loadSrc(src)}catch(e){}}}}}

/* ---- 描画の部品 ---- */
function rr(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function fit(ctx,t,maxW,size,w){let s=Math.round(size);do{ctx.font=(w?w+' ':'')+s+'px '+FONT;if(ctx.measureText(t).width<=maxW)break;s-=2}while(s>24);return s}
function paw(ctx,x,y,r,col,a){ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.fillStyle=col;
  ctx.beginPath();ctx.ellipse(0,r*0.35,r*0.62,r*0.5,0,0,7);ctx.fill();
  [[-0.62,-0.3],[-0.22,-0.68],[0.22,-0.68],[0.62,-0.3]].forEach(([dx,dy])=>{ctx.beginPath();ctx.ellipse(dx*r,dy*r,r*0.2,r*0.26,dx*0.5,0,7);ctx.fill()});ctx.restore()}
function bone(ctx,x,y,l,col,a){ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.fillStyle=col;const t=l*0.18;ctx.fillRect(-l/2,-t/2,l,t);
  [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sx,sy])=>{ctx.beginPath();ctx.arc(sx*l/2,sy*t*0.55,t*0.62,0,7);ctx.fill()});ctx.restore()}
function chi(ctx,cx,cy,s){const d=DOGS[cfg().dog]||DOGS[0];ctx.save();
  if(d.im){const iw=d.im.width,ih=d.im.height,w=s*2.4,h=w*ih/iw;ctx.drawImage(d.im,cx-w/2,cy-h/2-s*0.2,w,h)}
  else{ctx.font=Math.round(s*2.2)+'px "Apple Color Emoji",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🐶',cx,cy-s*0.2)}
  ctx.restore()}
function mark(ctx,st,xr,y){ctx.save();ctx.globalAlpha=.6;ctx.fillStyle=st.text;ctx.font='bold 30px '+FONT;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(APP_NAME,xr,y);ctx.restore()}
function pill(ctx,text,x,y,st,f){if(!text)return;const fs=Math.round(40*f);ctx.font='bold '+fs+'px '+FONT;const w=ctx.measureText(text).width+fs*1.2,h=fs*1.6;
  ctx.fillStyle=st.label;rr(ctx,x,y,w,h,h/2);ctx.fill();ctx.fillStyle=st.labelText;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(text,x+fs*0.6,y+h/2)}

/* ---- テンプレート ---- */
function laySimple(ctx,c,p,st,W,H,f,A){ctx.fillStyle=st.bg;ctx.fillRect(0,0,W,H);
  const pad=50,L=A.x0+pad,R=A.x1-pad,cw=R-L,mx=(L+R)/2;let y=A.y0+pad;
  ctx.fillStyle=st.text;ctx.textAlign='center';ctx.textBaseline='middle';
  if(p.title){const fs=fit(ctx,p.title,cw,84*f,'bold');y+=fs*0.6;ctx.fillText(p.title,mx,y);y+=fs*0.7}
  if(p.sub){const fs=fit(ctx,p.sub,cw,50*f,'');y+=fs*0.6;ctx.fillText(p.sub,mx,y);y+=fs*0.8}
  if(p.title||p.sub)y+=20;
  return{L,R,top:y,bottom:A.y1-90,gap:24,rad:24,frame:false,foot:()=>mark(ctx,st,R,A.y1-45)}}
function layChi(ctx,c,p,st,W,H,f,A){ctx.fillStyle=st.bg;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalAlpha=.12;for(let i=0;i<16;i++)paw(ctx,(i*397+80)%W,(i*613+150)%H,26,st.label,((i*53)%360)*Math.PI/180);ctx.restore();
  const pad=56,L=A.x0+pad,R=A.x1-pad,hh=300,s=112,y0=A.y0;
  if(p.title||p.sub){const cx=L+s*1.05,cy=y0+hh*0.58;chi(ctx,cx,cy,s);
    const bx=cx+s*1.15,by=y0+hh*0.2,bw=R-bx,bh=hh*0.68;
    ctx.fillStyle='rgba(255,255,255,.92)';rr(ctx,bx,by,bw,bh,36);ctx.fill();
    ctx.beginPath();ctx.moveTo(bx+2,by+bh*0.45);ctx.lineTo(bx-30,by+bh*0.6);ctx.lineTo(bx+2,by+bh*0.72);ctx.closePath();ctx.fill();
    ctx.fillStyle=isLight(st.text)?'#2b2b2b':st.text;ctx.textAlign='center';ctx.textBaseline='middle';const mx=bx+bw/2,mw=bw-50;
    if(p.title&&p.sub){fit(ctx,p.title,mw,80*f,'bold');ctx.fillText(p.title,mx,by+bh*0.37);fit(ctx,p.sub,mw,46*f,'');ctx.fillText(p.sub,mx,by+bh*0.74)}
    else{const t=p.title||p.sub;fit(ctx,t,mw,(p.title?80:54)*f,p.title?'bold':'');ctx.fillText(t,mx,by+bh/2)}
  }else chi(ctx,(L+R)/2,y0+hh*0.58,s);
  return{L:L+6,R:R-6,top:y0+hh+10,bottom:A.y1-130,gap:30,rad:22,frame:true,
    foot:()=>{const fy=A.y1-66;chi(ctx,L+40,fy,34);for(let i=0;i<4;i++)paw(ctx,L+120+i*70,fy+(i%2?10:-10),18,st.label,0.3);bone(ctx,L+430,fy,70,st.label,-0.2);mark(ctx,st,R,fy)}}}

/* ---- 写真の置き場所 ---- */
function slotsFor(c,r,G){const h=G.bottom-G.top,w=G.R-G.L;
  if(!isBoth(c,r))return[{k:r.after?'a':'b',id:r.after||r.before,x:G.L,y:G.top,w,h,lab:r.after?'A':'B'}];
  const ww=(w-G.gap)/2;return[{k:'b',id:r.before,x:G.L,y:G.top,w:ww,h,lab:'B'},{k:'a',id:r.after,x:G.L+ww+G.gap,y:G.top,w:ww,h,lab:'A'}]}
const slotsOne=(c,r,G,p)=>slotsFor(c,r,G).map(s=>({...s,text:p.lb?(s.lab==='B'?p.lbB:p.lbA):''}));
function gridSlots(items,c,G){const n=items.length,w=G.R-G.L,h=G.bottom-G.top;
  let cols=2,rows=Math.ceil(n/2);if(n===1){cols=1;rows=1}
  const cw=(w-G.gap*(cols-1))/cols,ch=(h-G.gap*(rows-1))/rows;
  return items.map((it,i)=>{const row=Math.floor(i/cols),col=i%cols,inRow=Math.min(cols,n-row*cols);
    let x=G.L+col*(cw+G.gap);if(inRow<cols)x+=(cols-inRow)*(cw+G.gap)/2;
    return{k:'g'+i,id:it.id,x,y:G.top+row*(ch+G.gap),w:cw,h:ch,text:it.label}})}

/* ---- 画像を作る ---- */
function paint(cv,c,p,makeSlots,getCrop){const st=STYLES[c.style]||STYLES[0],W=W0,H=H0,f=TS[c.ts][1];
  if(cv.width!==W)cv.width=W;if(cv.height!==H)cv.height=H;const ctx=cv.getContext('2d');
  const A={x0:SAFE[3],y0:SAFE[0],x1:W-SAFE[1],y1:H-SAFE[2]};
  const G=(c.tpl==='chihuahua'?layChi:laySimple)(ctx,c,p,st,W,H,f,A);
  const slots=makeSlots(G);
  for(const s of slots){
    if(G.frame){ctx.save();ctx.shadowColor='rgba(0,0,0,.15)';ctx.shadowBlur=20;ctx.shadowOffsetY=6;ctx.fillStyle='#fff';rr(ctx,s.x-12,s.y-12,s.w+24,s.h+24,G.rad+10);ctx.fill();ctx.restore()}
    const im=T.imgs[s.id],cr=getCrop(s);ctx.save();rr(ctx,s.x,s.y,s.w,s.h,G.rad);ctx.clip();ctx.fillStyle='#fff';ctx.fillRect(s.x,s.y,s.w,s.h);
    if(im){const b=Math.max(s.w/im.naturalWidth,s.h/im.naturalHeight)*cr.z,dw=im.naturalWidth*b,dh=im.naturalHeight*b;ctx.drawImage(im,s.x+s.w/2-dw/2+cr.x,s.y+s.h/2-dh/2+cr.y,dw,dh)}
    ctx.restore();
    if(s.text)pill(ctx,s.text,s.x+20,s.y+20,st,f)}
  G.foot();return slots}
function draw(){const r=recOf(T.id),cv=document.getElementById('cmp');if(!r||!cv)return;const c=cfg(),p=pt(r);
  T.slots=paint(cv,c,p,G=>slotsOne(c,r,G,p),s=>crop(r,s.k));
  const tok=++T.tok;T.blob=null;clearTimeout(T.bt);
  T.bt=setTimeout(()=>{const c2=document.getElementById('cmp');if(c2)c2.toBlob(b=>{if(T.tok===tok)T.blob=b},'image/jpeg',0.92)},250)}
function redraw(){cancelAnimationFrame(T.raf);T.raf=requestAnimationFrame(draw)}
function clampCrop(s,cr){const im=T.imgs[s.id];cr.z=Math.min(5,Math.max(0.5,cr.z));if(!im)return;
  const b=Math.max(s.w/im.naturalWidth,s.h/im.naturalHeight)*cr.z,lx=Math.abs(im.naturalWidth*b-s.w)/2,ly=Math.abs(im.naturalHeight*b-s.h)/2;
  cr.x=Math.max(-lx,Math.min(lx,cr.x));cr.y=Math.max(-ly,Math.min(ly,cr.y))}

/* ---- ハッシュタグ ---- */
function allTags(r){const pl=place(r.placeId),d=dog(r.dogId);
  const breed=d&&d.breed?'#'+String(d.breed).replace(/[\s　#＃]+/g,''):null;
  return[...new Set([shopTag(pl),...tagsOf(pl),breed,...S.settings.myTags,APP_TAG].filter(t=>t&&t.length>1))]}
const caption=r=>allTags(r).filter(t=>!pt(r).off.includes(t)).join(' ');

/* ---- 共有・保存 ---- */
function share(files,t){
  if(t&&navigator.clipboard)navigator.clipboard.writeText(t).catch(()=>{});
  if(navigator.canShare&&navigator.canShare({files})){navigator.share({files}).catch(()=>{});
    toast((t?'ハッシュタグをコピーしました。':'')+'インスタ・LINE・「画像を保存」から選べます')}
  else{files.forEach(f=>{const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=f.name;a.click()});toast('画像を保存しました')}}
window.xShare=share;

/* ---- 画面の部品 ---- */
const seg=(obj,cur,key)=>`<div class="seg sm">${Object.entries(obj).map(([k,v])=>`<button class="${k===cur?'on':''}" onclick="tpSet('${key}','${k}')">${esc(Array.isArray(v)?v[0]:v)}</button>`).join('')}</div>`;
const dogSeg=c=>`<label>イラスト</label><div class="seg sm">${DOGS.map((d,i)=>`<button class="${i===c.dog?'on':''}" onclick="tpSet('dog',${i})"><img data-dog="${i}" src="${d.url}" style="width:22px;height:22px;object-fit:contain;vertical-align:middle;margin-right:3px;${d.url?'':'display:none'}">${esc(d.n)}</button>`).join('')}</div>`;
const designCard=(c,extra)=>`<div class="sec">デザイン</div><div class="card">
<label style="margin-top:0">テンプレート</label>${seg(TPL,c.tpl,'tpl')}
${c.tpl==='chihuahua'?dogSeg(c):''}
<label>色</label><div class="sws">${STYLES.map((st,i)=>`<button class="sw ${i===c.style?'on':''}" onclick="tpSet('style',${i})"><i style="background:${st.bg};border-color:${st.label}"></i>${esc(st.name)}</button>`).join('')}</div>
${extra||''}</div>`;
const bar=fn=>`<button class="btn" style="margin:0" onclick="${fn}()">画像を共有・保存<span class="bkn"></span></button>`;
const bList=()=>S.records.filter(x=>x.before||x.after).slice().sort((a,b)=>(String(b.date||'')+(b.time||'')).localeCompare(String(a.date||'')+(a.time||''))).slice(0,30);

/* ---- 投稿画像の画面 ---- */
V.compare=prm=>{const id=typeof prm==='string'?prm:(prm&&(prm.id||prm.rec));T.id=id;const r=recOf(id);
  if(!r)return shell('投稿画像','<p class="muted">記録が見つかりません。</p>',{back:1});
  if(!r.before&&!r.after)return shell('投稿画像','<p class="muted">写真がありません。記録の「編集する」から写真を追加してください。</p>',{back:1});
  const c=cfg(),p=pt(r),my=S.settings.myTags;
  const others=bList().filter(x=>x.date===r.date&&x.id!==r.id).length;
  const tags=allTags(r).map((t,i)=>{const j=my.indexOf(t);return `<span class="tag ${p.off.includes(t)?'off':''}" onclick="tpTag(${i})">${esc(t)}${j>=0?`<button class="tpx" onclick="event.stopPropagation();tpDelMy(${j})">✕</button>`:''}</span>`}).join('');
  const phr=S.settings.tpPhrases.map((t,i)=>`<span class="chip" onclick="tpPhrase(${i})">${esc(t)}<button class="tpx" onclick="event.stopPropagation();tpDelPhrase(${i})">✕</button></span>`).join('');
  return shell('投稿画像',`<canvas id="cmp"></canvas>
<p class="muted" style="text-align:center;margin:4px 0 0">写真は指で動かせます。2本指で拡大・縮小できます</p>
<button class="link" onclick="tpResetCrop()">写真の位置を元に戻す</button>
<button class="btn sub small" onclick="go('bulk','${id}')">${others?`この日のほかの記録（${others}件）とまとめて投稿`:'ほかの記録とまとめて投稿'}</button>
${designCard(c,r.before&&r.after?`<label>写真</label>${seg(MD,c.mode,'mode')}`:'')}
<div class="sec">文字</div><div class="card">
<label style="margin-top:0">タイトル（空欄なら表示しません）</label><input id="tp_title" value="${esc(p.title)}" placeholder="例：モカ　2026/11/21" oninput="tpText()">
<div class="tpchips"><span class="chip" onclick="tpIns('name')">名前</span><span class="chip" onclick="tpIns('date')">日付</span><span class="chip" onclick="tpIns('both')">名前と日付</span></div>
<label>ひとこと（空欄なら表示しません）</label><input id="tp_sub" value="${esc(p.sub)}" placeholder="例：さっぱりしました" oninput="tpText()">
<div class="tpchips">${phr}</div><button class="link" onclick="tpSavePhrase()">今のひとことをテンプレートに保存</button>
<label>文字の大きさ</label>${seg(TS,c.ts,'ts')}
<label class="chk" style="margin-top:16px"><input type="checkbox" id="tp_lb" ${p.lb?'checked':''} onchange="tpText()">BEFORE / AFTER を表示する</label>
<div class="row" style="margin-top:8px"><input id="tp_lbB" value="${esc(p.lbB)}" oninput="tpText()"><input id="tp_lbA" value="${esc(p.lbA)}" oninput="tpText()"></div>
</div>
<div class="sec">ハッシュタグ</div><div class="card">
<p class="muted" style="margin-top:0">押すとオン・オフが切り替わります。共有するときにオンのタグが自動でコピーされます。</p>
<div>${tags}</div>
<div class="row" style="margin-top:10px"><input id="tp_newtag" placeholder="例：#チワワのいる生活"><button class="btn small" style="flex:none;width:80px" onclick="tpAddTag()">追加</button></div>
<p class="muted">追加したタグは、次から全部の記録で使えます。</p>
<button class="btn sub small" onclick="tpCopy()">ハッシュタグだけコピー</button>
</div>`,{back:1,bar:bar('tpPost')})};

AFTER.compare=async()=>{const r=recOf(T.id),cv=document.getElementById('cmp');if(!r||!cv)return;
  await loadImgs([r.before,r.after]);draw();
  const pos=e=>{const b=cv.getBoundingClientRect();return[(e.clientX-b.left)*cv.width/b.width,(e.clientY-b.top)*cv.height/b.height]};
  const slotAt=([x,y])=>T.slots.find(s=>x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h);
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);const q=pos(e);T.ptrs.set(e.pointerId,q);
    if(T.ptrs.size===1){const s=slotAt(q);T.act=s?s.k:null}
    if(T.ptrs.size===2&&T.act){const v=[...T.ptrs.values()];T.d0=dist(v[0],v[1]);T.z0=crop(r,T.act).z}};
  cv.onpointermove=e=>{if(!T.ptrs.has(e.pointerId)||!T.act)return;const prev=T.ptrs.get(e.pointerId),q=pos(e);T.ptrs.set(e.pointerId,q);
    const s=T.slots.find(o=>o.k===T.act);if(!s)return;const cr=crop(r,T.act);
    if(T.ptrs.size===1){cr.x+=q[0]-prev[0];cr.y+=q[1]-prev[1]}
    else if(T.d0){const v=[...T.ptrs.values()];cr.z=T.z0*dist(v[0],v[1])/T.d0}
    clampCrop(s,cr);redraw()};
  const up=e=>{T.ptrs.delete(e.pointerId);if(T.ptrs.size<2)T.d0=0;if(!T.ptrs.size){if(T.act)save();T.act=null}};
  cv.onpointerup=up;cv.onpointercancel=up};

/* ---- まとめて投稿の画面 ---- */
const bSel=()=>{const l=bList();const b=recOf(B.base);if(b&&!l.some(x=>x.id===b.id))l.unshift(b);return l.filter(x=>B.sel.includes(x.id))};
const bTags=()=>[...new Set(bSel().flatMap(r=>allTags(r)))];
const bCaption=()=>bTags().filter(t=>!B.off.includes(t)).join(' ');
V.bulk=prm=>{const id=typeof prm==='string'?prm:(prm&&(prm.id||prm.rec));const r=recOf(id);
  if(!r)return shell('まとめて投稿','<p class="muted">記録が見つかりません。</p>',{back:1});
  const list=bList();if(!list.some(x=>x.id===id))list.unshift(r);
  if(!B||B.base!==id){const same=list.filter(x=>x.date===r.date).map(x=>x.id);if(!same.includes(id))same.unshift(id);
    B={base:id,sel:same.slice(0,10),kind:'each',modes:{},title:'',sub:'',names:true,off:[],blobs:[],tok:0}}
  const c=cfg();
  const rows=list.map(x=>{const on=B.sel.includes(x.id),d=dog(x.dogId),m=B.modes[x.id]||'both',both=x.before&&x.after;
    return `<div class="mrow" style="flex-wrap:wrap"><label class="chk" style="flex:1;margin:0"><input type="checkbox" ${on?'checked':''} onchange="bkSel('${x.id}')">${esc(fmtDate(x.date))}　${esc(d?d.name:'')}${x.after?'':'（ビフォーのみ）'}</label>${on&&both&&B.kind==='each'?`<div class="seg sm" style="width:100%"><button class="${m==='both'?'on':''}" onclick="bkMode('${x.id}','both')">ビフォー＋アフター</button><button class="${m==='after'?'on':''}" onclick="bkMode('${x.id}','after')">アフターだけ</button></div>`:''}</div>`}).join('');
  const tags=bTags().map((t,i)=>`<span class="tag ${B.off.includes(t)?'off':''}" onclick="bkTag(${i})">${esc(t)}</span>`).join('');
  return shell('まとめて投稿',`<div class="seg sm"><button class="${B.kind==='each'?'on':''}" onclick="bkKind('each')">1匹ずつ（複数枚）</button><button class="${B.kind==='one'?'on':''}" onclick="bkKind('one')">1枚にまとめる</button></div>
<p class="muted">${B.kind==='each'?'選んだ記録を1枚ずつ作って、まとめて渡します（最大10枚）。タイトルや写真の位置は、それぞれの記録の投稿画面で決めたものが使われます。':'選んだワンちゃんのアフター写真を1枚に並べます（最大6匹）。'}</p>
<div id="bk_prev" style="display:flex;flex-wrap:wrap;justify-content:space-between"></div>
<div class="sec">記録を選ぶ</div><div class="card">${rows}</div>
${B.kind==='one'?`<div class="sec">文字</div><div class="card">
<label style="margin-top:0">タイトル（空欄なら表示しません）</label><input id="bk_title" value="${esc(B.title)}" placeholder="例：モカ＆ココ" oninput="bkText()">
<div class="tpchips"><span class="chip" onclick="bkIns('name')">名前</span><span class="chip" onclick="bkIns('date')">日付</span><span class="chip" onclick="bkIns('both')">名前と日付</span></div>
<label>ひとこと（空欄なら表示しません）</label><input id="bk_sub" value="${esc(B.sub)}" placeholder="例：みんなでさっぱり" oninput="bkText()">
<label class="chk" style="margin-top:16px"><input type="checkbox" id="bk_names" ${B.names?'checked':''} onchange="bkText()">写真に名前を出す</label></div>`:''}
${designCard(c,'')}
<div class="sec">ハッシュタグ</div><div class="card">
<p class="muted" style="margin-top:0">選んだ記録のタグをまとめています。押すとオン・オフが切り替わります。</p>
<div>${tags}</div>
<button class="btn sub small" onclick="bkCopy()">ハッシュタグだけコピー</button></div>`,
  {back:1,bar:bar('bkPost')})};
AFTER.bulk=async()=>{if(!B)return;await loadImgs(bSel().flatMap(r=>[r.before,r.after]));bkDraw()};
function bkDraw(){const box=document.getElementById('bk_prev');if(!box||!B)return;const c=cfg(),recs=bSel(),tok=++B.tok;box.innerHTML='';B.blobs=[];
  document.querySelectorAll('.bkn').forEach(e=>e.textContent='');
  if(!recs.length){box.innerHTML='<p class="muted">記録を選んでください</p>';return}
  let cvs;
  if(B.kind==='one'){const items=recs.map(r=>({id:r.after||r.before,label:B.names?(dog(r.dogId)?.name||''):''}));
    const cv=document.createElement('canvas');cv.style.cssText='width:62%;margin:0 auto';
    paint(cv,c,{title:B.title,sub:B.sub},G=>gridSlots(items,c,G),()=>({z:1,x:0,y:0}));cvs=[cv]}
  else cvs=recs.map(r=>{const c2={...c,mode:B.modes[r.id]||'both'},p=pt(r),cv=document.createElement('canvas');cv.style.cssText='width:48.5%;margin-bottom:8px';
    paint(cv,c2,p,G=>slotsOne(c2,r,G,p),s=>crop(r,s.k,c2));return cv});
  cvs.forEach(cv=>box.appendChild(cv));B.blobs=cvs.map(()=>null);
  cvs.forEach((cv,i)=>cv.toBlob(b=>{if(B.tok===tok)B.blobs[i]=b},'image/jpeg',0.92));
  document.querySelectorAll('.bkn').forEach(e=>e.textContent=`（${cvs.length}枚）`)}
window.bkSel=id=>{const i=B.sel.indexOf(id);if(i>=0)B.sel.splice(i,1);else{const max=B.kind==='one'?6:10;if(B.sel.length>=max){render();return toast(`最大${max}件までです`)}B.sel.push(id)}render()};
window.bkKind=k=>{B.kind=k;if(k==='one'&&B.sel.length>6){B.sel=B.sel.slice(0,6);toast('1枚にまとめるのは6匹までです')}render()};
window.bkMode=(id,m)=>{B.modes[id]=m;render()};
window.bkText=()=>{const g=id=>document.getElementById(id);B.title=g('bk_title').value;B.sub=g('bk_sub').value;B.names=g('bk_names').checked;bkDraw()};
window.bkIns=k=>{const names=[...new Set(bSel().map(r=>dog(r.dogId)?.name).filter(Boolean))].join('＆'),d=fmtDate(recOf(B.base)?.date);
  document.getElementById('bk_title').value=k==='name'?names:k==='date'?d:(names+'　'+d).trim();bkText()};
window.bkTag=i=>{const t=bTags()[i];if(!t)return;B.off=B.off.includes(t)?B.off.filter(x=>x!==t):[...B.off,t];render()};
window.bkCopy=()=>{const t=bCaption();if(!t)return toast('オンのタグがありません');
  navigator.clipboard.writeText(t).then(()=>toast('ハッシュタグをコピーしました'),()=>toast('コピーできませんでした'))};
window.bkPost=()=>{if(!B)return;const bl=B.blobs||[];if(!bl.length)return toast('記録を選んでください');if(bl.some(b=>!b))return toast('画像を準備中です。もう一度押してください');
  share(bl.map((b,i)=>new File([b],`trimming_${i+1}.jpg`,{type:'image/jpeg'})),bCaption())};

/* ---- ボタンの動き ---- */
window.tpSet=(k,v)=>{const c=cfg();c[k]=(k==='style'||k==='dog')?Number(v):v;save();render()};
window.tpText=()=>{const r=recOf(T.id);if(!r)return;const p=pt(r);const g=id=>document.getElementById(id);
  p.title=g('tp_title').value;p.sub=g('tp_sub').value;p.lb=g('tp_lb').checked;p.lbB=g('tp_lbB').value;p.lbA=g('tp_lbA').value;laterSave();redraw()};
window.tpIns=k=>{const r=recOf(T.id);if(!r)return;const n=dog(r.dogId)?.name||'',d=fmtDate(r.date);
  document.getElementById('tp_title').value=k==='name'?n:k==='date'?d:(n+'　'+d).trim();tpText()};
window.tpPhrase=i=>{document.getElementById('tp_sub').value=S.settings.tpPhrases[i]||'';tpText()};
window.tpDelPhrase=i=>{S.settings.tpPhrases.splice(i,1);save();render()};
window.tpSavePhrase=()=>{const v=document.getElementById('tp_sub').value.trim();if(!v)return toast('ひとことを入れてから押してください');
  if(!S.settings.tpPhrases.includes(v))S.settings.tpPhrases.unshift(v);save();render();toast('テンプレートに保存しました')};
window.tpTag=i=>{const r=recOf(T.id);if(!r)return;const t=allTags(r)[i],p=pt(r);if(!t)return;
  p.off=p.off.includes(t)?p.off.filter(x=>x!==t):[...p.off,t];save();render()};
window.tpAddTag=()=>{const el=document.getElementById('tp_newtag');const add=normTags(el.value);if(!add.length)return toast('タグを入れてください');
  for(const t of add)if(!S.settings.myTags.includes(t))S.settings.myTags.push(t);save();render();toast('追加しました')};
window.tpDelMy=j=>{S.settings.myTags.splice(j,1);save();render()};
window.tpResetCrop=()=>{const r=recOf(T.id);if(!r||!r.tpCrop)return;delete r.tpCrop[ckey(cfg(),r)];save();draw()};
window.tpCopy=()=>{const r=recOf(T.id);if(!r)return;const t=caption(r);if(!t)return toast('オンのタグがありません');
  navigator.clipboard.writeText(t).then(()=>toast('ハッシュタグをコピーしました'),()=>toast('コピーできませんでした'))};
window.tpPost=()=>{const r=recOf(T.id);if(!r)return;if(!T.blob)return toast('画像を準備中です。もう一度押してください');
  const name='trimming_'+String(r.date||'').replace(/-/g,'')+'.jpg';
  share([new File([T.blob],name,{type:'image/jpeg'})],caption(r))};
window.postNow=function(id){const rid=typeof id==='string'&&recOf(id)?id:(typeof JUST==='string'&&recOf(JUST)?JUST:(JUST&&JUST.id));if(rid)go('compare',rid)};
})();

/* ---- 予約内容をボタンで選ぶ ---- */
(function(){
const PH='カット＋シャンプー';
const st=document.createElement('style');
st.textContent='input[type="datetime-local"],input[type="date"],input[type="time"]{-webkit-appearance:none;appearance:none;display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box}input[type="datetime-local"]::-webkit-date-and-time-value{text-align:left}.rsc{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px}.rsc button{border:1.5px solid #eee;background:#fff;color:#666;border-radius:999px;padding:8px 14px;font-size:14px}.rsc button.on{background:var(--main);border-color:var(--main);color:#fff;font-weight:bold}';
document.head.appendChild(st);
const SEP=/[、，,＋+]/;
const parse=v=>String(v||'').split(SEP).map(s=>s.trim()).filter(Boolean);
function join(list){const m=MENUS.filter(x=>list.includes(x)),o=list.filter(x=>!MENUS.includes(x));return m.join('＋')+(m.length&&o.length?'、':'')+o.join('、')}
function sync(inp,box){const t=parse(inp.value);box.querySelectorAll('button').forEach(b=>b.classList.toggle('on',t.includes(b.dataset.m)))}
function attach(inp){if(inp.dataset.rsc)return;inp.dataset.rsc=1;
  const box=document.createElement('div');box.className='rsc';
  box.innerHTML=MENUS.map(m=>`<button type="button" data-m="${m}">${m}</button>`).join('');
  box.onclick=e=>{const b=e.target.closest('button');if(!b)return;let t=parse(inp.value);const m=b.dataset.m;
    t=t.includes(m)?t.filter(x=>x!==m):[...t,m];inp.value=join(t);
    inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));sync(inp,box)};
  inp.addEventListener('input',()=>sync(inp,box));
  inp.placeholder='その他（例：顔まわり短め）';
  inp.parentNode.insertBefore(box,inp);sync(inp,box)}
window.xScanResv=()=>document.querySelectorAll('input,textarea').forEach(i=>{if((i.placeholder||'').includes(PH))attach(i)});
})();

/* ---- 画面の調整（名前・ランキング・ワンちゃん・共有） ---- */
(function(){
const st=document.createElement('style');
st.textContent='.dphoto{width:56px;height:56px;flex:none;border-radius:50%;background:#f3e3e6;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:11px}.dphoto img{width:100%;height:100%;object-fit:cover}.xedit{flex:none;padding:8px 12px;border:2px solid var(--main);border-radius:10px;color:var(--main);background:#fff;font-weight:bold;font-size:13px}';
document.head.appendChild(st);
const hd=()=>document.querySelector('header h1');
const title=()=>{const h=hd();return h?h.textContent.trim():''};
const mainEl=()=>document.querySelector('main');

/* 名前をそろえる */
const REN=[['お店で見せる','トリミングオーダー履歴'],['これまでの履歴','トリミングオーダー履歴']];
function rename(){const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while(n=w.nextNode()){let s=n.data;const o=s;for(const[a,b]of REN)if(s.includes(a))s=s.split(a).join(b);if(s!==o)n.data=s}
  document.querySelectorAll('button,a').forEach(b=>{const t=b.textContent.trim();
    if(t==='これまでの記録'){b.textContent='トリミングオーダー履歴';b.style.fontSize='14px'}
    else if(/^インスタに投稿/.test(t)&&!b.closest('.savebar'))b.textContent='投稿画像を作る'})}

/* ランキングを消す */
function rank(){document.querySelectorAll('[onclick*="ranking"]').forEach(e=>e.style.display='none');
  document.querySelectorAll('.sec').forEach(s=>{if(s.textContent.trim().startsWith('ランキング')){s.style.display='none';const n=s.nextElementSibling;if(n&&!n.classList.contains('sec'))n.style.display='none'}})}

/* ホームにワンちゃん追加 */
function addDogBtn(){const m=mainEl();if(!m||title()!==APP_NAME||document.getElementById('x_dog'))return;
  if([...m.querySelectorAll('button,a')].some(b=>/ワンちゃんを(追加|登録)/.test(b.textContent)))return;
  const b=document.createElement('button');b.id='x_dog';b.className='btn sub';b.textContent='＋ ワンちゃんを追加';
  b.onclick=()=>go('dogEdit');
  const hint=[...m.querySelectorAll('.card')].find(c=>c.textContent.includes('ホーム画面に追加'));
  if(hint)m.insertBefore(b,hint);else m.appendChild(b)}

/* ワンちゃんの写真 */
const dogOf=el=>{const s=el.getAttribute('onclick')||'';const ids=(s.match(/'[^']+'/g)||[]).map(x=>x.slice(1,-1));
  for(const id of ids){const d=(S.dogs||[]).find(x=>x.id===id);if(d)return d}return null};
const circle=(src,size)=>`<div class="dphoto" style="${size?`width:${size}px;height:${size}px`:''}">${src?`<img src="${src}">`:'写真なし'}</div>`;
function dogCards(){const t=title();if(t!==APP_NAME&&!t.startsWith('設定')&&!t.includes('ワンちゃん'))return;
  document.querySelectorAll('.card.list-item[onclick]').forEach(c=>{const d=dogOf(c);if(!d)return;
    const key=(d.icon?'1':'0')+String(d.icon||'').length;if(c.dataset.xd===key)return;c.dataset.xd=key;
    const old=c.querySelector('.dphoto');
    if(d.icon){if(old)old.outerHTML=circle(d.icon);else{const ph=c.querySelector('.photo');if(ph)ph.outerHTML=circle(d.icon);else c.insertAdjacentHTML('afterbegin',circle(d.icon))}}
    if(t===APP_NAME&&!/dogEdit/.test(c.getAttribute('onclick')||'')&&!c.querySelector('.xedit')){
      const b=document.createElement('button');b.className='xedit';b.textContent='編集';
      b.onclick=e=>{e.stopPropagation();go('dogEdit',d.id)};
      const last=c.lastElementChild;if(last&&last.textContent.trim()==='›')c.insertBefore(b,last);else c.appendChild(b)}})}

/* 編集画面で写真を選ぶ */
let EID=null,EON=false,PEND=null,N0=0;
if(V.dogEdit){const o=V.dogEdit;V.dogEdit=function(prm){EID=typeof prm==='string'?prm:(prm&&prm.id)||null;EON=true;PEND=null;N0=(S.dogs||[]).length;return o.apply(this,arguments)}}
function shrink(file){return new Promise((ok,ng)=>{const u=URL.createObjectURL(file),im=new Image();
  im.onload=()=>{const s=360,c=document.createElement('canvas');c.width=s;c.height=s;const x=c.getContext('2d');
    const m=Math.min(im.naturalWidth,im.naturalHeight);x.drawImage(im,(im.naturalWidth-m)/2,(im.naturalHeight-m)/2,m,m,0,0,s,s);
    URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',0.82))};im.onerror=ng;im.src=u})}
function photoCard(){const box=document.getElementById('dp_card');const d=EID?dog(EID):null;const src=d?d.icon:PEND;
  const html=`<div style="text-align:center"><div class="muted">この子の写真</div><div style="display:inline-block;margin-top:8px">${circle(src,110)}</div>
<button class="link" onclick="xDogPhoto()">${src?'写真を変える':'写真を選ぶ'}</button>${src?'<button class="link danger" style="margin-top:0" onclick="xDogPhotoDel()">写真を消す</button>':''}</div>`;
  if(box)box.innerHTML=html;return html}
function editPhoto(){const m=mainEl();if(!m)return;
  if(!title().includes('ワンちゃん')||!m.querySelector('input')){EON=false;return}
  if(!EON||document.getElementById('dp_card'))return;
  const c=document.createElement('div');c.id='dp_card';c.className='card';c.innerHTML=photoCard();m.insertBefore(c,m.firstChild)}
window.xDogPhoto=()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';
  i.onchange=async()=>{const f=i.files&&i.files[0];if(!f)return;let data;try{data=await shrink(f)}catch(e){return toast('写真を読み込めませんでした')}
    const d=EID?dog(EID):null;if(d){d.icon=data;await save();toast('写真を保存しました')}else PEND=data;photoCard()};i.click()};
window.xDogPhotoDel=async()=>{const d=EID?dog(EID):null;if(d){delete d.icon;await save()}else PEND=null;photoCard()};
async function newDogPhoto(){if(!PEND||EID)return;const ds=S.dogs||[];if(ds.length>N0){ds[ds.length-1].icon=PEND;PEND=null;N0=ds.length;await save()}}

/* トリミングオーダー履歴：画像を共有・保存 */
function orderShare(){const m=mainEl();if(!m||!/トリミングオーダー履歴|お店で見せる/.test(title()))return;
  const mw=m.clientWidth||300;
  m.querySelectorAll('.photo img').forEach(im=>{const ph=im.closest('.photo');if(!ph||ph.dataset.xs)return;
    if(!ph.classList.contains('big')&&ph.clientWidth<mw*0.6)return;ph.dataset.xs=1;
    const b=document.createElement('button');b.className='btn sub small';b.style.marginTop='8px';b.textContent='画像を共有・保存';
    b.onclick=async e=>{e.stopPropagation();try{const bl=await (await fetch(im.src)).blob();window.xShare([new File([bl],'trimming.jpg',{type:bl.type||'image/jpeg'})],'')}catch(err){toast('画像を準備できませんでした')}};
    ph.insertAdjacentElement('afterend',b)})}

let q=0;
function run(){q=0;try{rename()}catch(e){}try{rank()}catch(e){}try{addDogBtn()}catch(e){}try{dogCards()}catch(e){}
  try{editPhoto()}catch(e){}try{newDogPhoto()}catch(e){}try{orderShare()}catch(e){}try{if(window.xScanResv)xScanResv()}catch(e){}}
new MutationObserver(()=>{if(!q)q=requestAnimationFrame(run)}).observe(document.body,{childList:true,subtree:true});
run();
})();
