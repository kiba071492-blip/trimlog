/* ===== トリミングログ post.js 作り直し版 ① 投稿画像 ===== */
(function(){
const TPL={chihuahua:'チワワ',simple:'シンプル'};
const DEST={reel:'ストーリーズ・リール',feed:'インスタ投稿（4:5）'};
const SZ={reel:[1080,1920,[200,50,290,50]],feed:[1080,1350,[40,40,40,40]]};
const LAYS={h:'ビフォー・アフターを横に並べる',v:'ビフォー・アフターを縦に並べる',sep:'ビフォーとアフターを別々に2枚',after:'アフターだけ'};
const TS={s:['小',0.8],m:['中',1],l:['大',1.25]};
const X={id:null,sepK:'b',imgs:{},slots:[],files:null,tok:0,ft:0,st:0,raf:0,ptrs:new Map(),act:null,d0:0,z0:1,bulk:[],bt:'',bc:{},base:null};
const css=document.createElement('style');
css.textContent='#xcv{display:block;margin:0 auto;max-width:100%;max-height:50vh;border-radius:10px;box-shadow:0 1px 6px rgba(0,0,0,.15);touch-action:none;-webkit-user-select:none;user-select:none}.xsel{width:100%;font-size:16px;padding:10px;border-radius:10px;border:1px solid #ddd;background:#fff}.xl{font-size:13px;color:var(--sub);margin:14px 0 6px}.xl:first-child{margin-top:0}.xx{border:none;background:none;color:#bbb;font-size:15px;padding:0 2px 0 4px}label.xck{display:flex;align-items:center;gap:12px;font-size:15px;color:var(--text);margin:0}.xck input{width:24px;height:24px;flex:none;margin:0}';
document.head.appendChild(css);

/* 犬のイラスト */
function cutBg(im){const w=im.naturalWidth,h=im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(im,0,0);
  const D=x.getImageData(0,0,w,h),p=D.data,seen=new Uint8Array(w*h),q=new Int32Array(w*h);let qh=0,qt=0;
  const push=i=>{if(seen[i])return;seen[i]=1;const o=i*4;if(p[o+3]<20||(p[o]>232&&p[o+1]>232&&p[o+2]>232)){p[o+3]=0;q[qt++]=i}};
  for(let i=0;i<w;i++){push(i);push((h-1)*w+i)}for(let j=0;j<h;j++){push(j*w);push(j*w+w-1)}
  while(qh<qt){const i=q[qh++],X0=i%w;if(X0>0)push(i-1);if(X0<w-1)push(i+1);if(i>=w)push(i-w);if(i<w*h-w)push(i+w)}
  x.putImageData(D,0,0);return c}
const DOGS=[['dog.png','スムース'],['dog2.png','ロング'],['dog3.png','ブラタン']].map(([src,n])=>{
  const d={n,im:null},im=new Image();let alt=0;
  im.onload=()=>{try{d.im=cutBg(im)}catch(e){d.im=im}if(view==='xpost'||view==='xbulk')redraw()};
  im.onerror=()=>{if(!alt){alt=1;im.src=src.replace('.png','.PNG')}};
  im.src=src;return d});

/* 設定 */
function cfg(){S.settings=S.settings||{};const c=S.settings.xp=S.settings.xp||{};
  if(!TPL[c.tpl])c.tpl='chihuahua';if(!DEST[c.dest])c.dest='reel';if(!LAYS[c.lay])c.lay='h';if(!TS[c.ts])c.ts='m';
  c.style=Number(c.style)||0;if(c.style<0||c.style>=STYLES.length)c.style=0;
  c.dog=Number(c.dog)||0;if(c.dog<0||c.dog>=DOGS.length)c.dog=0;
  if(!Array.isArray(S.settings.myTags))S.settings.myTags=[];
  if(!Array.isArray(S.settings.tpPhrases))S.settings.tpPhrases=(typeof DEF_PHRASES!=='undefined'?DEF_PHRASES:[]).slice();
  return c}
function xp(r){const p=r.xp=r.xp||{},o=r.pt||{};
  if(p.title==null)p.title=o.title||'';if(p.sub==null)p.sub=o.sub||'';if(p.lb==null)p.lb=true;
  if(!p.lbB)p.lbB='BEFORE';if(!p.lbA)p.lbA='AFTER';if(!Array.isArray(p.off))p.off=[];p.crop=p.crop||{};return p}
const lay=(c,r)=>r.before&&r.after?c.lay:'one';
function laterSave(){clearTimeout(X.st);X.st=setTimeout(()=>save(),500)}
async function loadImgs(ids){for(const id of ids){if(id&&!X.imgs[id]){const s=await getImg(id);if(s){try{X.imgs[id]=await loadSrc(s)}catch(e){}}}}}

/* 描画の部品 */
function isLight(h){h=String(h).replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);if(isNaN(n))return false;return(0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255>0.7}
function rr(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function fit(ctx,t,maxW,size,w){let s=Math.round(size);do{ctx.font=(w?w+' ':'')+s+'px '+FONT;if(ctx.measureText(t).width<=maxW)break;s-=2}while(s>24);return s}
function paw(ctx,x,y,r,col,a){ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.fillStyle=col;
  ctx.beginPath();ctx.ellipse(0,r*0.35,r*0.62,r*0.5,0,0,7);ctx.fill();
  [[-0.62,-0.3],[-0.22,-0.68],[0.22,-0.68],[0.62,-0.3]].forEach(([dx,dy])=>{ctx.beginPath();ctx.ellipse(dx*r,dy*r,r*0.2,r*0.26,dx*0.5,0,7);ctx.fill()});ctx.restore()}
function bone(ctx,x,y,l,col,a){ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.fillStyle=col;const t=l*0.18;ctx.fillRect(-l/2,-t/2,l,t);
  [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sx,sy])=>{ctx.beginPath();ctx.arc(sx*l/2,sy*t*0.55,t*0.62,0,7);ctx.fill()});ctx.restore()}
function chi(ctx,cx,cy,s){const d=DOGS[cfg().dog]||DOGS[0];ctx.save();
  if(d.im){const w=s*2.4,h=w*d.im.height/d.im.width;ctx.drawImage(d.im,cx-w/2,cy-h/2-s*0.2,w,h)}
  else{ctx.font=Math.round(s*2.2)+'px "Apple Color Emoji",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🐶',cx,cy-s*0.2)}
  ctx.restore()}
function mark(ctx,st,xr,y){ctx.save();ctx.globalAlpha=.6;ctx.fillStyle=st.text;ctx.font='bold 30px '+FONT;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(APP_NAME,xr,y);ctx.restore()}
function pill(ctx,text,x,y,st,f){const fs=Math.round(40*f);ctx.font='bold '+fs+'px '+FONT;const w=ctx.measureText(text).width+fs*1.2,h=fs*1.6;
  ctx.fillStyle=st.label;rr(ctx,x,y,w,h,h/2);ctx.fill();ctx.fillStyle=st.labelText;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(text,x+fs*0.6,y+h/2)}

/* テンプレート */
function frame(ctx,c,p,W,H,A,f){const st=STYLES[c.style]||STYLES[0],feed=c.dest==='feed';ctx.fillStyle=st.bg;ctx.fillRect(0,0,W,H);
  const pad=24,L=A.x0+pad,R=A.x1-pad;
  if(c.tpl==='chihuahua'){
    ctx.save();ctx.globalAlpha=.12;for(let i=0;i<16;i++)paw(ctx,(i*397+80)%W,(i*613+150)%H,26,st.label,((i*53)%360)*Math.PI/180);ctx.restore();
    const k=feed?0.76:1,hh=250*k,s=96*k,y0=A.y0;
    if(p.title||p.sub){const cx=L+s*1.05,cy=y0+hh*0.58;chi(ctx,cx,cy,s);
      const bx=cx+s*1.15,by=y0+hh*0.2,bw=R-bx,bh=hh*0.68;
      ctx.fillStyle='rgba(255,255,255,.92)';rr(ctx,bx,by,bw,bh,36*k);ctx.fill();
      ctx.beginPath();ctx.moveTo(bx+2,by+bh*0.45);ctx.lineTo(bx-30*k,by+bh*0.6);ctx.lineTo(bx+2,by+bh*0.72);ctx.closePath();ctx.fill();
      ctx.fillStyle=isLight(st.text)?'#2b2b2b':st.text;ctx.textAlign='center';ctx.textBaseline='middle';const mx=bx+bw/2,mw=bw-50;
      if(p.title&&p.sub){fit(ctx,p.title,mw,76*f*k,'bold');ctx.fillText(p.title,mx,by+bh*0.37);fit(ctx,p.sub,mw,44*f*k,'');ctx.fillText(p.sub,mx,by+bh*0.74)}
      else{const t=p.title||p.sub;fit(ctx,t,mw,(p.title?76:52)*f*k,p.title?'bold':'');ctx.fillText(t,mx,by+bh/2)}
    }else chi(ctx,(L+R)/2,y0+hh*0.55,s);
    const fh=100*k;
    return{st,L:L+6,R:R-6,top:y0+hh+14,bottom:A.y1-fh,gap:30*k,rad:22,fr:true,
      foot:()=>{const fy=A.y1-fh/2;chi(ctx,L+34,fy,30*k);for(let i=0;i<4;i++)paw(ctx,L+105+i*62,fy+(i%2?9:-9),16*k,st.label,0.3);bone(ctx,L+380,fy,62*k,st.label,-0.2);mark(ctx,st,R,fy)}}}
  let y=A.y0+pad;const mx=(L+R)/2,cw=R-L;ctx.fillStyle=st.text;ctx.textAlign='center';ctx.textBaseline='middle';
  if(p.title){const fs=fit(ctx,p.title,cw,84*f,'bold');y+=fs*0.6;ctx.fillText(p.title,mx,y);y+=fs*0.7}
  if(p.sub){const fs=fit(ctx,p.sub,cw,50*f,'');y+=fs*0.6;ctx.fillText(p.sub,mx,y);y+=fs*0.8}
  if(p.title||p.sub)y+=20;
  const fb=feed?60:80;return{st,L,R,top:y,bottom:A.y1-fb,gap:24,rad:24,fr:false,foot:()=>mark(ctx,st,R,A.y1-fb/2)}}

/* 写真の置き場所 */
function slotsFor(c,r,p,G){const w=G.R-G.L,h=G.bottom-G.top,L=lay(c,r);
  const lb=k=>p.lb?(k==='a'?p.lbA:p.lbB):'';
  const one=k=>[{k,id:k==='a'?r.after:r.before,x:G.L,y:G.top,w,h,text:lb(k)}];
  if(L==='one')return one(r.after?'a':'b');if(L==='after')return one('a');if(L==='sep')return one(X.sepK);
  if(L==='v'){const hh=(h-G.gap)/2;return[{k:'b',id:r.before,x:G.L,y:G.top,w,h:hh,text:lb('b')},{k:'a',id:r.after,x:G.L,y:G.top+hh+G.gap,w,h:hh,text:lb('a')}]}
  const ww=(w-G.gap)/2;return[{k:'b',id:r.before,x:G.L,y:G.top,w:ww,h,text:lb('b')},{k:'a',id:r.after,x:G.L+ww+G.gap,y:G.top,w:ww,h,text:lb('a')}]}
function grid(items,G){const n=items.length;if(!n)return[];const cols=n===1?1:2,rows=Math.ceil(n/cols),w=G.R-G.L,h=G.bottom-G.top;
  const cw=(w-G.gap*(cols-1))/cols,ch=(h-G.gap*(rows-1))/rows;
  return items.map((r,i)=>{const row=Math.floor(i/cols),col=i%cols,inRow=Math.min(cols,n-row*cols);let x=G.L+col*(cw+G.gap);if(inRow<cols)x+=(cw+G.gap)/2;
    return{k:'g'+r.id,id:cover(r),x,y:G.top+row*(ch+G.gap),w:cw,h:ch,text:(dog(r.dogId)||{}).name||''}})}
function cropOf(r,c,k,id){const p=xp(r),key=c.dest+'|'+c.tpl+'|'+lay(c,r)+'|'+k;let o=p.crop[key];if(!o||o.pid!==id)o=p.crop[key]={z:1,x:0,y:0,pid:id};return o}
const bcrop=s=>X.bc[s.k]=X.bc[s.k]||{z:1,x:0,y:0};

/* 画像を作る */
function paint(cv,c,p,mk,getCrop){const[W,H,sf]=SZ[c.dest],f=TS[c.ts][1];cv.width=W;cv.height=H;const ctx=cv.getContext('2d');
  const A={x0:sf[3],y0:sf[0],x1:W-sf[1],y1:H-sf[2]};const G=frame(ctx,c,p,W,H,A,f);const slots=mk(G);
  for(const s of slots){
    if(G.fr){ctx.save();ctx.shadowColor='rgba(0,0,0,.15)';ctx.shadowBlur=20;ctx.shadowOffsetY=6;ctx.fillStyle='#fff';rr(ctx,s.x-12,s.y-12,s.w+24,s.h+24,G.rad+10);ctx.fill();ctx.restore()}
    const im=X.imgs[s.id],cr=getCrop(s);ctx.save();rr(ctx,s.x,s.y,s.w,s.h,G.rad);ctx.clip();ctx.fillStyle='#fff';ctx.fillRect(s.x,s.y,s.w,s.h);
    if(im){const b=Math.max(s.w/im.naturalWidth,s.h/im.naturalHeight)*cr.z,dw=im.naturalWidth*b,dh=im.naturalHeight*b;ctx.drawImage(im,s.x+s.w/2-dw/2+cr.x,s.y+s.h/2-dh/2+cr.y,dw,dh)}
    ctx.restore();if(s.text)pill(ctx,s.text,s.x+20,s.y+20,G.st,f*(c.dest==='feed'?0.85:1))}
  G.foot();return slots}
function onePaint(cv,r){const c=cfg(),p=xp(r);return paint(cv,c,p,G=>slotsFor(c,r,p,G),s=>cropOf(r,c,s.k,s.id))}
function bulkPaint(cv){const items=X.bulk.map(recOf).filter(r=>r&&cover(r)).slice(0,6);return paint(cv,cfg(),{title:X.bt,sub:''},G=>grid(items,G),bcrop)}
function draw(){const cv=document.getElementById('xcv');if(!cv)return;
  if(view==='xbulk')X.slots=bulkPaint(cv);else{const r=recOf(X.id);if(!r)return;X.slots=onePaint(cv,r)}prep()}
function redraw(){cancelAnimationFrame(X.raf);X.raf=requestAnimationFrame(draw)}
const blobOf=cv=>new Promise(res=>cv.toBlob(res,'image/jpeg',0.92));
async function build(){const out=[];
  if(view==='xbulk'){const cv=document.createElement('canvas');bulkPaint(cv);const b=await blobOf(cv);return b?[new File([b],'trimming.jpg',{type:'image/jpeg'})]:null}
  const r=recOf(X.id);if(!r)return null;const ks=lay(cfg(),r)==='sep'?['b','a']:[null],keep=X.sepK;
  for(const k of ks){if(k)X.sepK=k;const cv=document.createElement('canvas');onePaint(cv,r);X.sepK=keep;const b=await blobOf(cv);if(!b)return null;
    out.push(new File([b],(k?(k==='b'?'1_before':'2_after'):'trimming')+'.jpg',{type:'image/jpeg'}))}
  return out}
function prep(){X.files=null;const tok=++X.tok;clearTimeout(X.ft);X.ft=setTimeout(async()=>{const f=await build();if(tok===X.tok)X.files=f},300)}
function clamp(s,cr){const im=X.imgs[s.id];cr.z=Math.min(5,Math.max(0.5,cr.z));if(!im)return;
  const b=Math.max(s.w/im.naturalWidth,s.h/im.naturalHeight)*cr.z,lx=Math.abs(im.naturalWidth*b-s.w)/2,ly=Math.abs(im.naturalHeight*b-s.h)/2;
  cr.x=Math.max(-lx,Math.min(lx,cr.x));cr.y=Math.max(-ly,Math.min(ly,cr.y))}

/* 指で動かす */
function bindCv(){const cv=document.getElementById('xcv');if(!cv||cv.dataset.b)return;cv.dataset.b=1;
  const pos=e=>{const b=cv.getBoundingClientRect();return{x:(e.clientX-b.left)*cv.width/b.width,y:(e.clientY-b.top)*cv.height/b.height}};
  const hit=q=>X.slots.find(s=>q.x>=s.x&&q.x<=s.x+s.w&&q.y>=s.y&&q.y<=s.y+s.h);
  const crOf=s=>view==='xbulk'?bcrop(s):cropOf(recOf(X.id),cfg(),s.k,s.id);
  cv.addEventListener('pointerdown',e=>{const q=pos(e);if(!X.ptrs.size){const s=hit(q);if(!s)return;X.act=s}else if(!X.act)return;
    try{cv.setPointerCapture(e.pointerId)}catch(err){}X.ptrs.set(e.pointerId,q);
    if(X.ptrs.size===2){const[a,b]=[...X.ptrs.values()];X.d0=Math.hypot(a.x-b.x,a.y-b.y);X.z0=crOf(X.act).z}});
  cv.addEventListener('pointermove',e=>{if(!X.act||!X.ptrs.has(e.pointerId))return;e.preventDefault();const q=pos(e),o=X.ptrs.get(e.pointerId),cr=crOf(X.act);
    if(X.ptrs.size===1){cr.x+=q.x-o.x;cr.y+=q.y-o.y}X.ptrs.set(e.pointerId,q);
    if(X.ptrs.size===2){const[a,b]=[...X.ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(X.d0>0)cr.z=X.z0*d/X.d0}
    clamp(X.act,cr);redraw()});
  const up=e=>{X.ptrs.delete(e.pointerId);if(!X.ptrs.size){X.act=null;if(view==='xpost')laterSave()}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up)}

/* ハッシュタグ */
function allTags(r){if(!r)return[];const pl=place(r.placeId),d=dog(r.dogId);const breed=d&&d.breed?'#'+String(d.breed).replace(/[\s　#＃]+/g,''):null;
  return[...new Set([shopTag(pl),...tagsOf(pl),breed,...S.settings.myTags,APP_TAG].filter(t=>t&&t.length>1))]}
function capText(){if(view==='xbulk')return[...new Set(X.bulk.flatMap(i=>allTags(recOf(i))))].join(' ');
  const r=recOf(X.id);if(!r)return'';const p=xp(r);return allTags(r).filter(t=>!p.off.includes(t)).join(' ')}

/* 共有・保存 */
window.xpShare=async()=>{let files=X.files;if(!files){toast('画像を準備しています…');files=await build()}if(!files)return toast('画像を作れませんでした');
  const cap=capText();if(cap&&navigator.clipboard)navigator.clipboard.writeText(cap).then(()=>toast('ハッシュタグをコピーしました。インスタでは貼り付けてください')).catch(()=>{});
  if(navigator.canShare&&navigator.canShare({files})){try{await navigator.share({files})}catch(e){}}
  else files.forEach(f=>{const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=f.name;a.click()})};

/* 投稿画像の画面 */
const seg=(obj,cur,key)=>`<div class="seg sm">${Object.entries(obj).map(([k,v])=>`<button class="${String(k)===String(cur)?'on':''}" onclick="xpSet('${key}','${k}')">${v}</button>`).join('')}</div>`;
V.xpost=id=>{X.id=id;const r=recOf(id);if(!r)return shell('投稿画像','<p class="muted">記録が見つかりません。</p>',{back:1});
  const c=cfg(),p=xp(r),L=lay(c,r);
  const how=L==='one'?'<p class="muted" style="margin:0">写真が1枚なので、1枚の画像で作ります。</p>':`<select class="xsel" onchange="xpSet('lay',this.value)">${Object.entries(LAYS).map(([k,v])=>`<option value="${k}"${k===L?' selected':''}>${v}</option>`).join('')}</select>${L==='sep'?`<div class="seg" style="margin-top:10px"><button class="${X.sepK==='b'?'on':''}" onclick="xpSep('b')">1枚目 ビフォー</button><button class="${X.sepK==='a'?'on':''}" onclick="xpSep('a')">2枚目 アフター</button></div><p class="muted" style="margin:6px 0 0">押したほうの写真を下の画面で調整できます。共有すると2枚まとめて渡ります。</p>`:''}`;
  const dogsSel=c.tpl==='chihuahua'?`<div class="xl">イラスト</div>${seg(Object.fromEntries(DOGS.map((d,i)=>[i,d.n])),c.dog,'dog')}`:'';
  const sws=`<div class="sws">${STYLES.map((s,i)=>`<button class="sw ${i===c.style?'on':''}" onclick="xpSet('style','${i}')"><i style="background:${s.bg}"></i>${esc(s.name)}</button>`).join('')}</div>`;
  const phr=S.settings.tpPhrases.map((t,i)=>`<span class="chip mine" onclick="xpPhrase(${i})">${esc(t)}<button class="xx" onclick="event.stopPropagation();xpPhraseDel(${i})">✕</button></span>`).join('');
  const tags=allTags(r).map((t,i)=>`<span class="tag ${p.off.includes(t)?'off':''}" onclick="xpTag(${i})">${esc(t)}</span>`).join('');
  const my=S.settings.myTags.length?`<div class="xl">自分で追加したタグ</div>${S.settings.myTags.map((t,i)=>`<span class="chip mine">${esc(t)}<button class="xx" onclick="xpMyDel(${i})">✕</button></span>`).join('')}`:'';
  return shell('投稿画像',`<div class="card"><div class="xl">どこに投稿する？</div>${seg(DEST,c.dest,'dest')}<div class="xl">作り方</div>${how}</div>
<div class="card" style="padding:10px"><canvas id="xcv"></canvas><p class="muted" style="text-align:center;margin:8px 0 0">写真は指で動かせます。2本指で拡大・縮小できます</p><button class="link" onclick="xpReset()">写真の位置を元に戻す</button></div>
<div class="sec">デザイン</div><div class="card"><div class="xl">テンプレート</div>${seg(TPL,c.tpl,'tpl')}${dogsSel}<div class="xl">色</div>${sws}<div class="xl">文字の大きさ</div>${seg({s:'小',m:'中',l:'大'},c.ts,'ts')}</div>
<div class="sec">文字</div><div class="card"><div class="xl">タイトル（空欄なら出ません）</div><input id="xt_title" value="${esc(p.title)}" oninput="xpTxt('title',this.value)" placeholder="例：モカ　2026/11/23">
<div><span class="chip" onclick="xpIns('n')">名前</span><span class="chip" onclick="xpIns('d')">日付</span><span class="chip" onclick="xpIns('nd')">名前と日付</span></div>
<div class="xl">ひとこと（空欄なら出ません）</div><input id="xt_sub" value="${esc(p.sub)}" oninput="xpTxt('sub',this.value)" placeholder="例：さっぱりしました"><div>${phr}</div><button class="link" onclick="xpPhraseAdd()">＋ いまのひとことをテンプレートに保存</button>
<div class="xl">ラベル</div><label class="xck"><input type="checkbox" ${p.lb?'checked':''} onchange="xpLb(this.checked)">BEFORE・AFTERを表示する</label>
<div class="row" style="margin-top:8px"><input value="${esc(p.lbB)}" oninput="xpTxt('lbB',this.value)"><input value="${esc(p.lbA)}" oninput="xpTxt('lbA',this.value)"></div></div>
<div class="sec">ハッシュタグ</div><div class="card"><p class="muted" style="margin-top:0">押すとオン・オフが切り替わります。オンのタグが共有のときにコピーされます。</p><div>${tags}</div>${my}
<div class="row" style="margin-top:10px"><input id="xt_tag" placeholder="#追加するタグ"><button class="btn small" style="flex:none;width:80px" onclick="xpMyAdd()">追加</button></div></div>
<button class="btn sub" onclick="go('xbulk','${r.id}')">ほかの記録とまとめて1枚にする</button>`,{back:1,bar:'<button class="btn" onclick="xpShare()">画像を共有・保存</button>'})};
AFTER.xpost=async id=>{const r=recOf(id);if(!r)return;bindCv();redraw();await loadImgs([r.before,r.after]);redraw()};

window.xpSet=(k,v)=>{const c=cfg();c[k]=(k==='style'||k==='dog')?Number(v):v;if(k==='lay')X.sepK='b';save();render()};
window.xpSep=k=>{X.sepK=k;render()};
window.xpTxt=(k,v)=>{const r=recOf(X.id);if(!r)return;xp(r)[k]=v;laterSave();redraw()};
window.xpIns=k=>{const r=recOf(X.id);if(!r)return;const d=dog(r.dogId),n=d?d.name:'',dt=fmtDate(r.date);const v=k==='n'?n:k==='d'?dt:n+'　'+dt;
  xp(r).title=v;const el=document.getElementById('xt_title');if(el)el.value=v;laterSave();redraw()};
window.xpPhrase=i=>{const r=recOf(X.id),t=S.settings.tpPhrases[i];if(!r||t==null)return;xp(r).sub=t;const el=document.getElementById('xt_sub');if(el)el.value=t;laterSave();redraw()};
window.xpPhraseDel=i=>{S.settings.tpPhrases.splice(i,1);save();render()};
window.xpPhraseAdd=()=>{const r=recOf(X.id);const t=r?xp(r).sub.trim():'';if(!t)return toast('ひとことを入れてから押してください');
  if(!S.settings.tpPhrases.includes(t))S.settings.tpPhrases.push(t);save();render();toast('テンプレートに保存しました')};
window.xpLb=on=>{const r=recOf(X.id);if(!r)return;xp(r).lb=on;save();redraw()};
window.xpTag=i=>{const r=recOf(X.id);if(!r)return;const t=allTags(r)[i],p=xp(r);if(!t)return;
  p.off=p.off.includes(t)?p.off.filter(x=>x!==t):[...p.off,t];save();render()};
window.xpMyDel=i=>{S.settings.myTags.splice(i,1);save();render()};
window.xpMyAdd=()=>{const el=document.getElementById('xt_tag');const v=el?el.value.trim().replace(/^[#＃]+/,'').replace(/[\s　]+/g,''):'';if(!v)return;
  const t='#'+v;if(!S.settings.myTags.includes(t))S.settings.myTags.push(t);save();render()};
window.xpReset=()=>{if(view==='xbulk'){X.bc={};return redraw()}const r=recOf(X.id);if(!r)return;const c=cfg(),p=xp(r),pre=c.dest+'|'+c.tpl+'|'+lay(c,r)+'|';
  Object.keys(p.crop).forEach(k=>{if(k.indexOf(pre)===0)delete p.crop[k]});save();redraw()};

/* まとめて1枚 */
V.xbulk=id=>{if(X.base!==id){X.base=id;X.bulk=[id];X.bt='';X.bc={}}const c=cfg();
  const rows=S.records.filter(r=>cover(r)).sort(byNew).slice(0,40).map(r=>{const on=X.bulk.includes(r.id);
    return `<div class="card list-item" onclick="xbTog('${r.id}')"><input type="checkbox" ${on?'checked':''} style="width:24px;height:24px;flex:none;margin:0;pointer-events:none"><div class="photo"><img data-img="${cover(r)}"></div><div style="flex:1"><b>${esc((dog(r.dogId)||{}).name||'')}</b><div class="muted">${esc(visitStr(r))}・${esc((place(r.placeId)||{}).name||'')}</div></div></div>`}).join('');
  return shell('まとめて1枚',`<div class="card"><div class="xl">どこに投稿する？</div>${seg(DEST,c.dest,'dest')}<div class="xl">タイトル（空欄なら出ません）</div><input value="${esc(X.bt)}" oninput="xbTitle(this.value)" placeholder="例：今月のトリミング"></div>
<div class="card" style="padding:10px"><canvas id="xcv"></canvas><p class="muted" style="text-align:center;margin:8px 0 0">写真は指で動かせます。デザインと色は投稿画像の画面と同じです</p><button class="link" onclick="xpReset()">写真の位置を元に戻す</button></div>
<div class="sec">のせる記録（6つまで）</div>${rows}`,{back:1,bar:'<button class="btn" onclick="xpShare()">画像を共有・保存</button>'})};
AFTER.xbulk=async()=>{bindCv();redraw();await loadImgs(X.bulk.map(i=>{const r=recOf(i);return r&&cover(r)}));redraw()};
window.xbTitle=v=>{X.bt=v;redraw()};
window.xbTog=id=>{if(X.bulk.includes(id))X.bulk=X.bulk.filter(x=>x!==id);else if(X.bulk.length<6)X.bulk.push(id);else return toast('6つまで選べます');render()};

/* 記録の画面のボタンを新しい投稿画面につなぐ */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(!b||view!=='rec')return;const t=b.textContent.trim();
  if(t==='インスタに投稿する'||t==='投稿画像を作る'){e.preventDefault();e.stopImmediatePropagation();go('xpost',param)}},true);
new MutationObserver(()=>document.querySelectorAll('#app button').forEach(b=>{if(b.textContent.trim()==='インスタに投稿する')b.textContent='投稿画像を作る'})).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
/* ===== ①ここまで ===== */
