/* トリミングログ 投稿画像の追加ファイル post.js */
(function(){
const TPL={chihuahua:'チワワ',simple:'シンプル'};
const SZ={post:[1080,1350],story:[1080,1920]};
const TS={s:['小',0.8],m:['中',1],l:['大',1.25]};
const MD={both:'ビフォー＋アフター',after:'アフターだけ'};
const T={id:null,imgs:{},slots:[],blob:null,bt:null,svt:null,raf:0,ptrs:new Map(),act:null,d0:0,z0:1};
const css=document.createElement('style');
css.textContent='.tpx{border:none;background:none;color:#bbb;font-size:15px;padding:0 2px 0 4px}.tpchips{margin-top:8px}';
document.head.appendChild(css);

function cfg(){S.settings=S.settings||{};const c=S.settings.tp=S.settings.tp||{};
  if(!TPL[c.tpl])c.tpl='chihuahua';
  if(!(c.style>=0&&c.style<STYLES.length))c.style=0;
  if(!SZ[c.size])c.size='post';
  if(!MD[c.mode])c.mode='both';
  if(!TS[c.ts])c.ts='m';
  if(!Array.isArray(S.settings.myTags))S.settings.myTags=[];
  if(!Array.isArray(S.settings.tpPhrases))S.settings.tpPhrases=typeof DEF_PHRASES!=='undefined'?DEF_PHRASES.slice():[];
  return c}
function pt(r){const p=r.pt=r.pt||{};
  if(p.title==null)p.title='';if(p.sub==null)p.sub='';if(p.lb==null)p.lb=true;
  if(p.lbB==null)p.lbB='BEFORE';if(p.lbA==null)p.lbA='AFTER';if(!Array.isArray(p.off))p.off=[];return p}
const isBoth=(c,r)=>c.mode==='both'&&!!r.before&&!!r.after;
const ckey=(c,r)=>c.tpl+'|'+c.size+'|'+(isBoth(c,r)?'both':'one');
function crop(r,k){const c=cfg();r.tpCrop=r.tpCrop||{};const key=ckey(c,r);const o=r.tpCrop[key]=r.tpCrop[key]||{};return o[k]=o[k]||{z:1,x:0,y:0}}
function isLight(h){h=String(h).replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);if(isNaN(n))return false;return(0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255>0.7}
function laterSave(){clearTimeout(T.svt);T.svt=setTimeout(()=>save(),500)}

/* ---- 描画の部品 ---- */
function rr(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function fit(ctx,t,maxW,size,w){let s=Math.round(size);do{ctx.font=(w?w+' ':'')+s+'px '+FONT;if(ctx.measureText(t).width<=maxW)break;s-=2}while(s>24);return s}
function paw(ctx,x,y,r,col,a){ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.fillStyle=col;
  ctx.beginPath();ctx.ellipse(0,r*0.35,r*0.62,r*0.5,0,0,7);ctx.fill();
  [[-0.62,-0.3],[-0.22,-0.68],[0.22,-0.68],[0.62,-0.3]].forEach(([dx,dy])=>{ctx.beginPath();ctx.ellipse(dx*r,dy*r,r*0.2,r*0.26,dx*0.5,0,7);ctx.fill()});ctx.restore()}
function bone(ctx,x,y,l,col,a){ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.fillStyle=col;const t=l*0.18;ctx.fillRect(-l/2,-t/2,l,t);
  [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sx,sy])=>{ctx.beginPath();ctx.arc(sx*l/2,sy*t*0.55,t*0.62,0,7);ctx.fill()});ctx.restore()}
function chi(ctx,cx,cy,s){ctx.save();const fur='#e9b47c',inner='#f7c6c0',cream='#fbe9d4',line='#5b3a26';
  ctx.lineWidth=s*0.05;ctx.strokeStyle=line;ctx.lineJoin='round';ctx.lineCap='round';
  [-1,1].forEach(d=>{
    ctx.beginPath();ctx.moveTo(cx+d*0.2*s,cy-0.6*s);ctx.quadraticCurveTo(cx+d*0.7*s,cy-1.45*s,cx+d*1.08*s,cy-1.18*s);ctx.quadraticCurveTo(cx+d*1.0*s,cy-0.6*s,cx+d*0.7*s,cy-0.25*s);ctx.closePath();ctx.fillStyle=fur;ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx+d*0.34*s,cy-0.55*s);ctx.quadraticCurveTo(cx+d*0.74*s,cy-1.22*s,cx+d*0.96*s,cy-1.06*s);ctx.quadraticCurveTo(cx+d*0.9*s,cy-0.65*s,cx+d*0.68*s,cy-0.38*s);ctx.closePath();ctx.fillStyle=inner;ctx.fill()});
  ctx.beginPath();ctx.ellipse(cx,cy,0.82*s,0.7*s,0,0,7);ctx.fillStyle=fur;ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx,cy-0.62*s);ctx.quadraticCurveTo(cx+0.12*s,cy-0.1*s,cx+0.36*s,cy+0.2*s);ctx.lineTo(cx-0.36*s,cy+0.2*s);ctx.quadraticCurveTo(cx-0.12*s,cy-0.1*s,cx,cy-0.62*s);ctx.fillStyle=cream;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+0.32*s,0.4*s,0.27*s,0,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,140,150,.45)';[-1,1].forEach(d=>{ctx.beginPath();ctx.ellipse(cx+d*0.56*s,cy+0.24*s,0.13*s,0.08*s,0,0,7);ctx.fill()});
  [-1,1].forEach(d=>{const ex=cx+d*0.34*s,ey=cy-0.02*s;ctx.fillStyle='#2b1d14';ctx.beginPath();ctx.arc(ex,ey,0.15*s,0,7);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex-0.05*s,ey-0.06*s,0.055*s,0,7);ctx.fill();ctx.beginPath();ctx.arc(ex+0.05*s,ey+0.06*s,0.025*s,0,7);ctx.fill()});
  ctx.fillStyle='#2b1d14';ctx.beginPath();ctx.ellipse(cx,cy+0.2*s,0.09*s,0.065*s,0,0,7);ctx.fill();
  ctx.lineWidth=s*0.035;ctx.beginPath();ctx.moveTo(cx,cy+0.26*s);ctx.lineTo(cx,cy+0.33*s);
  ctx.moveTo(cx-0.13*s,cy+0.33*s);ctx.quadraticCurveTo(cx-0.065*s,cy+0.42*s,cx,cy+0.33*s);ctx.quadraticCurveTo(cx+0.065*s,cy+0.42*s,cx+0.13*s,cy+0.33*s);ctx.stroke();
  ctx.restore()}
function mark(ctx,st,W,H,pad,y){ctx.save();ctx.globalAlpha=.6;ctx.fillStyle=st.text;ctx.font='bold 30px '+FONT;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(APP_NAME,W-pad,y);ctx.restore()}
function pill(ctx,text,x,y,st,f){if(!text)return;const fs=Math.round(40*f);ctx.font='bold '+fs+'px '+FONT;const w=ctx.measureText(text).width+fs*1.2,h=fs*1.6;
  ctx.fillStyle=st.label;rr(ctx,x,y,w,h,h/2);ctx.fill();ctx.fillStyle=st.labelText;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(text,x+fs*0.6,y+h/2)}
function slotsFor(c,r,W,top,bottom,pad,gap){const h=bottom-top;
  if(!isBoth(c,r))return[{k:r.after?'a':'b',id:r.after||r.before,x:pad,y:top,w:W-2*pad,h,lab:r.after?'A':'B'}];
  if(c.size==='story'){const hh=(h-gap)/2;return[{k:'b',id:r.before,x:pad,y:top,w:W-2*pad,h:hh,lab:'B'},{k:'a',id:r.after,x:pad,y:top+hh+gap,w:W-2*pad,h:hh,lab:'A'}]}
  const ww=(W-2*pad-gap)/2;return[{k:'b',id:r.before,x:pad,y:top,w:ww,h,lab:'B'},{k:'a',id:r.after,x:pad+ww+gap,y:top,w:ww,h,lab:'A'}]}

/* ---- テンプレート ---- */
function laySimple(ctx,r,c,p,st,W,H,f){ctx.fillStyle=st.bg;ctx.fillRect(0,0,W,H);const pad=50;let y=pad;
  ctx.fillStyle=st.text;ctx.textAlign='center';ctx.textBaseline='middle';
  if(p.title){const fs=fit(ctx,p.title,W-2*pad,84*f,'bold');y+=fs*0.6;ctx.fillText(p.title,W/2,y);y+=fs*0.7}
  if(p.sub){const fs=fit(ctx,p.sub,W-2*pad,50*f,'');y+=fs*0.6;ctx.fillText(p.sub,W/2,y);y+=fs*0.8}
  if(p.title||p.sub)y+=20;
  return{slots:slotsFor(c,r,W,y,H-90,pad,24).map(o=>({...o,rad:24})),foot:()=>mark(ctx,st,W,H,pad,H-45)}}
function layChi(ctx,r,c,p,st,W,H,f){ctx.fillStyle=st.bg;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalAlpha=.12;for(let i=0;i<16;i++)paw(ctx,(i*397+80)%W,(i*613+150)%H,26,st.label,((i*53)%360)*Math.PI/180);ctx.restore();
  const pad=56,story=c.size==='story',hh=story?430:300,s=story?128:112;
  if(p.title||p.sub){const cx=pad+s*1.05,cy=hh*0.58;chi(ctx,cx,cy,s);
    const bx=cx+s*1.15,by=hh*0.2,bw=W-pad-bx,bh=hh*0.68;
    ctx.fillStyle='rgba(255,255,255,.92)';rr(ctx,bx,by,bw,bh,36);ctx.fill();
    ctx.beginPath();ctx.moveTo(bx+2,by+bh*0.45);ctx.lineTo(bx-30,by+bh*0.6);ctx.lineTo(bx+2,by+bh*0.72);ctx.closePath();ctx.fill();
    ctx.fillStyle=isLight(st.text)?'#2b2b2b':st.text;ctx.textAlign='center';ctx.textBaseline='middle';const mx=bx+bw/2,mw=bw-50;
    if(p.title&&p.sub){fit(ctx,p.title,mw,80*f,'bold');ctx.fillText(p.title,mx,by+bh*0.37);fit(ctx,p.sub,mw,46*f,'');ctx.fillText(p.sub,mx,by+bh*0.74)}
    else{const t=p.title||p.sub;fit(ctx,t,mw,(p.title?80:54)*f,p.title?'bold':'');ctx.fillText(t,mx,by+bh/2)}
  }else chi(ctx,W/2,hh*0.58,s);
  return{slots:slotsFor(c,r,W,hh+10,H-130,pad+6,30).map(o=>({...o,rad:22,frame:true})),
    foot:()=>{const fy=H-66;chi(ctx,pad+40,fy,34);for(let i=0;i<4;i++)paw(ctx,pad+120+i*70,fy+(i%2?10:-10),18,st.label,0.3);bone(ctx,pad+430,fy,70,st.label,-0.2);mark(ctx,st,W,H,pad,fy)}}}

/* ---- 画像を作る ---- */
function draw(){const r=recOf(T.id),cv=document.getElementById('cmp');if(!r||!cv)return;
  const c=cfg(),p=pt(r),st=STYLES[c.style],[W,H]=SZ[c.size],f=TS[c.ts][1];
  if(cv.width!==W)cv.width=W;if(cv.height!==H)cv.height=H;const ctx=cv.getContext('2d');
  const L=(c.tpl==='chihuahua'?layChi:laySimple)(ctx,r,c,p,st,W,H,f);T.slots=L.slots;
  for(const s of L.slots){
    if(s.frame){ctx.save();ctx.shadowColor='rgba(0,0,0,.15)';ctx.shadowBlur=20;ctx.shadowOffsetY=6;ctx.fillStyle='#fff';rr(ctx,s.x-12,s.y-12,s.w+24,s.h+24,s.rad+10);ctx.fill();ctx.restore()}
    const im=T.imgs[s.id],cr=crop(r,s.k);ctx.save();rr(ctx,s.x,s.y,s.w,s.h,s.rad);ctx.clip();ctx.fillStyle='#fff';ctx.fillRect(s.x,s.y,s.w,s.h);
    if(im){const b=Math.max(s.w/im.naturalWidth,s.h/im.naturalHeight)*cr.z,dw=im.naturalWidth*b,dh=im.naturalHeight*b;ctx.drawImage(im,s.x+s.w/2-dw/2+cr.x,s.y+s.h/2-dh/2+cr.y,dw,dh)}
    ctx.restore();
    if(p.lb)pill(ctx,s.lab==='B'?p.lbB:p.lbA,s.x+20,s.y+20,st,f)}
  L.foot();
  T.blob=null;clearTimeout(T.bt);T.bt=setTimeout(()=>{const c2=document.getElementById('cmp');if(c2)c2.toBlob(b=>{T.blob=b},'image/jpeg',0.92)},250)}
function redraw(){cancelAnimationFrame(T.raf);T.raf=requestAnimationFrame(draw)}
function clampCrop(s,cr){const im=T.imgs[s.id];cr.z=Math.min(5,Math.max(0.5,cr.z));if(!im)return;
  const b=Math.max(s.w/im.naturalWidth,s.h/im.naturalHeight)*cr.z,lx=Math.abs(im.naturalWidth*b-s.w)/2,ly=Math.abs(im.naturalHeight*b-s.h)/2;
  cr.x=Math.max(-lx,Math.min(lx,cr.x));cr.y=Math.max(-ly,Math.min(ly,cr.y))}

/* ---- ハッシュタグ ---- */
function allTags(r){const pl=place(r.placeId),d=dog(r.dogId);
  const breed=d&&d.breed?'#'+String(d.breed).replace(/[\s　#＃]+/g,''):null;
  return[...new Set([shopTag(pl),...tagsOf(pl),breed,...S.settings.myTags,APP_TAG].filter(t=>t&&t.length>1))]}
const caption=r=>allTags(r).filter(t=>!pt(r).off.includes(t)).join(' ');

/* ---- 画面 ---- */
const seg=(obj,cur,key)=>`<div class="seg sm">${Object.entries(obj).map(([k,v])=>`<button class="${k===cur?'on':''}" onclick="tpSet('${key}','${k}')">${esc(Array.isArray(v)?v[0]:v)}</button>`).join('')}</div>`;
V.compare=prm=>{const id=typeof prm==='string'?prm:(prm&&(prm.id||prm.rec));T.id=id;const r=recOf(id);
  if(!r)return shell('投稿画像','<p class="muted">記録が見つかりません。</p>',{back:1});
  if(!r.before&&!r.after)return shell('投稿画像','<p class="muted">写真がありません。記録の「編集する」から写真を追加してください。</p>',{back:1});
  const c=cfg(),p=pt(r),my=S.settings.myTags;
  const tags=allTags(r).map((t,i)=>{const j=my.indexOf(t);return `<span class="tag ${p.off.includes(t)?'off':''}" onclick="tpTag(${i})">${esc(t)}${j>=0?`<button class="tpx" onclick="event.stopPropagation();tpDelMy(${j})">✕</button>`:''}</span>`}).join('');
  const phr=S.settings.tpPhrases.map((t,i)=>`<span class="chip" onclick="tpPhrase(${i})">${esc(t)}<button class="tpx" onclick="event.stopPropagation();tpDelPhrase(${i})">✕</button></span>`).join('');
  return shell('投稿画像',`<canvas id="cmp"></canvas>
<p class="muted" style="text-align:center;margin:4px 0 0">写真は指で動かせます。2本指で拡大・縮小できます</p>
<button class="link" onclick="tpResetCrop()">写真の位置を元に戻す</button>
<div class="sec">デザイン</div><div class="card">
<label style="margin-top:0">テンプレート</label>${seg(TPL,c.tpl,'tpl')}
<label>色</label><div class="sws">${STYLES.map((st,i)=>`<button class="sw ${i===c.style?'on':''}" onclick="tpSet('style',${i})"><i style="background:${st.bg};border-color:${st.label}"></i>${esc(st.name)}</button>`).join('')}</div>
<label>サイズ</label>${seg(SIZES,c.size,'size')}
${r.before&&r.after?`<label>写真</label>${seg(MD,c.mode,'mode')}`:''}
</div>
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
<p class="muted" style="margin-top:0">押すとオン・オフが切り替わります。投稿するときにオンのタグが自動でコピーされます。</p>
<div>${tags}</div>
<div class="row" style="margin-top:10px"><input id="tp_newtag" placeholder="例：#チワワのいる生活"><button class="btn small" style="flex:none;width:80px" onclick="tpAddTag()">追加</button></div>
<p class="muted">追加したタグは、次から全部の記録で使えます。</p>
<button class="btn sub small" onclick="tpCopy()">ハッシュタグだけコピー</button>
</div>`,{back:1,bar:`<button class="btn" onclick="tpPost()">インスタに投稿する</button>`})};

AFTER.compare=async()=>{const r=recOf(T.id),cv=document.getElementById('cmp');if(!r||!cv)return;
  for(const k of['before','after']){const id=r[k];if(id&&!T.imgs[id]){const src=await getImg(id);if(src){try{T.imgs[id]=await loadSrc(src)}catch(e){}}}}
  draw();
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

/* ---- ボタンの動き ---- */
window.tpSet=(k,v)=>{const c=cfg();c[k]=k==='style'?Number(v):v;save();render()};
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
  const t=caption(r);if(t&&navigator.clipboard)navigator.clipboard.writeText(t).catch(()=>{});
  const name='trimming_'+String(r.date||'').replace(/-/g,'')+'.jpg',file=new File([T.blob],name,{type:'image/jpeg'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file]}).catch(()=>{});if(t)toast('ハッシュタグをコピーしました。インスタの文章欄を長押しして貼り付けてください')}
  else{const a=document.createElement('a');a.href=URL.createObjectURL(T.blob);a.download=name;a.click();toast('画像を保存しました')}};
window.postNow=function(id){const rid=typeof id==='string'&&recOf(id)?id:(typeof JUST==='string'&&recOf(JUST)?JUST:(JUST&&JUST.id));if(rid)go('compare',rid)};
})();
