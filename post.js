/* ===== トリミングログ post.js ① 投稿画像 ===== */
(function(){
const TPL={chihuahua:'チワワ',none:'シンプル'};
const DEST={reel:'縦長（9:16）',feed:'少し縦長（4:5）',wide:'横長（4:3）'};
const SZ={reel:[1080,1920,[200,50,290,50]],feed:[1080,1350,[40,40,40,40]],wide:[1440,1080,[30,30,30,30]]};
const LAYS={h:'ビフォー・アフターを横に並べる',v:'ビフォー・アフターを縦に並べる',sep:'ビフォーとアフターを別々に2枚',after:'アフターだけ'};
const FITS={cover:'枠いっぱいに大きく',contain:'写真を切らずに全部'};
const TS={s:['小',0.8],m:['中',1],l:['大',1.25]};
const X={id:null,sepK:'b',imgs:{},slots:[],files:null,tok:0,ft:0,st:0,raf:0,ptrs:new Map(),act:null,d0:0,z0:1,bulk:[],bt:'',bc:{},base:null};
const css=document.createElement('style');
css.textContent='#xcv{display:block;margin:0 auto;max-width:100%;max-height:50vh;border-radius:10px;box-shadow:0 1px 6px rgba(0,0,0,.15);touch-action:none;-webkit-user-select:none;user-select:none}.xsel{width:100%;font-size:16px;padding:10px;border-radius:10px;border:1px solid #ddd;background:#fff}.xl{font-size:13px;color:var(--sub);margin:14px 0 6px}.xl:first-child{margin-top:0}.xx{border:none;background:none;color:#bbb;font-size:15px;padding:0 2px 0 4px}label.xck{display:flex;align-items:center;gap:12px;font-size:15px;color:var(--text);margin:0}.xck input{width:24px;height:24px;flex:none;margin:0}.xnote{font-size:12px;color:var(--sub);margin:6px 0 0}';
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
  if(!TPL[c.tpl])c.tpl='chihuahua';if(!DEST[c.dest])c.dest='reel';if(!LAYS[c.lay])c.lay='h';if(!TS[c.ts])c.ts='m';if(!FITS[c.fit])c.fit='cover';
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
const sc=(s,im)=>(cfg().fit==='contain'?Math.min:Math.max)(s.w/im.naturalWidth,s.h/im.naturalHeight);

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
  function frame(ctx,c,p,W,H,A,f){const st=STYLES[c.style]||STYLES[0],feed=c.dest!=='reel';ctx.fillStyle=st.bg;ctx.fillRect(0,0,W,H);
  if(c.tpl==='none'){const FN='"Hiragino Sans",sans-serif',T=(t,fs,y,w)=>{let s=fs;do{ctx.font=w+' '+s+'px '+FN;s-=4}while(s>20&&ctx.measureText(t).width>A.x1-A.x0-60);ctx.fillText(t,W/2,y)};return{st,L:0,R:W,top:0,bottom:H,gap:6,rad:0,fr:false,foot:()=>{ctx.save();ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=14;ctx.globalAlpha=.85;ctx.font='bold 34px '+FN;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(APP_NAME,A.x1-30,A.y1-30);ctx.globalAlpha=1;ctx.textAlign='center';let y=A.y1-110;if(p.sub){T(p.sub,50*f,y,'');y-=70*f}if(p.title)T(p.title,84*f,y,'bold');ctx.restore()}}}
  if(c.tpl==='none')return{st,L:A.x0,R:A.x1,top:A.y0,bottom:A.y1-50,gap:20,rad:16,fr:false,foot:()=>mark(ctx,st,A.x1,A.y1-22)};
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
const ckPre=(c,r)=>c.dest+'|'+c.tpl+'|'+lay(c,r)+'|'+c.fit+'|';
function cropOf(r,c,k,id){const p=xp(r),key=ckPre(c,r)+k;let o=p.crop[key];if(!o||o.pid!==id)o=p.crop[key]={z:1,x:0,y:0,pid:id};return o}
const bcrop=s=>X.bc[s.k]=X.bc[s.k]||{z:1,x:0,y:0};

/* 画像を作る */
function paint(cv,c,p,mk,getCrop){const[W,H,sf0]=SZ[c.dest],f=TS[c.ts][1];cv.width=W;cv.height=H;const ctx=cv.getContext('2d');
  const sf=c.tpl==='none'&&c.dest==='feed'?[20,20,20,20]:sf0;
  const A={x0:sf[3],y0:sf[0],x1:W-sf[1],y1:H-sf[2]};const G=frame(ctx,c,p,W,H,A,f);const slots=mk(G);
  for(const s of slots){
    if(G.fr){ctx.save();ctx.shadowColor='rgba(0,0,0,.15)';ctx.shadowBlur=20;ctx.shadowOffsetY=6;ctx.fillStyle='#fff';rr(ctx,s.x-12,s.y-12,s.w+24,s.h+24,G.rad+10);ctx.fill();ctx.restore()}
    const im=X.imgs[s.id],cr=getCrop(s);ctx.save();rr(ctx,s.x,s.y,s.w,s.h,G.rad);ctx.clip();ctx.fillStyle='#fff';ctx.fillRect(s.x,s.y,s.w,s.h);
    if(im){const b=sc(s,im)*cr.z,dw=im.naturalWidth*b,dh=im.naturalHeight*b;ctx.drawImage(im,s.x+s.w/2-dw/2+cr.x,s.y+s.h/2-dh/2+cr.y,dw,dh)}
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
  const b=sc(s,im)*cr.z,lx=Math.abs(im.naturalWidth*b-s.w)/2,ly=Math.abs(im.naturalHeight*b-s.h)/2;
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
const destNote='<p class="xnote">※ 縦長はインスタのストーリーズ・リール向け、4:5はインスタの通常の投稿向けです。LINEで送るだけならどちらでも大丈夫です。</p>';
const fitNote='<p class="xnote">※ 横向きの写真が切れるときは「全体を入れる」を選んでください。</p>';
V.xpost=id=>{X.id=id;const r=recOf(id);if(!r)return shell('投稿画像','<p class="muted">記録が見つかりません。</p>',{back:1});
  const c=cfg(),p=xp(r),L=lay(c,r),none=c.tpl==='none';
  const how=L==='one'?'<p class="muted" style="margin:0">写真が1枚なので、1枚の画像で作ります。</p>':`<select class="xsel" onchange="xpSet('lay',this.value)">${Object.entries(LAYS).map(([k,v])=>`<option value="${k}"${k===L?' selected':''}>${v}</option>`).join('')}</select>${L==='sep'?`<div class="seg" style="margin-top:10px"><button class="${X.sepK==='b'?'on':''}" onclick="xpSep('b')">1枚目 ビフォー</button><button class="${X.sepK==='a'?'on':''}" onclick="xpSep('a')">2枚目 アフター</button></div><p class="xnote">押したほうの写真を下の画面で調整できます。共有すると2枚まとめて渡ります。</p>`:''}`;
  const dogsSel=c.tpl==='chihuahua'?`<div class="xl">イラスト</div>${seg(Object.fromEntries(DOGS.map((d,i)=>[i,d.n])),c.dog,'dog')}`:'';
  const sws=`<div class="sws">${STYLES.map((s,i)=>`<button class="sw ${i===c.style?'on':''}" onclick="xpSet('style','${i}')"><i style="background:${s.bg}"></i>${esc(s.name)}</button>`).join('')}</div>`;
  const phr=S.settings.tpPhrases.map((t,i)=>`<span class="chip mine" onclick="xpPhrase(${i})">${esc(t)}<button class="xx" onclick="event.stopPropagation();xpPhraseDel(${i})">✕</button></span>`).join('');
  const tags=allTags(r).map((t,i)=>`<span class="tag ${p.off.includes(t)?'off':''}" onclick="xpTag(${i})">${esc(t)}</span>`).join('');
  const my=S.settings.myTags.length?`<div class="xl">自分で追加したタグ</div>${S.settings.myTags.map((t,i)=>`<span class="chip mine">${esc(t)}<button class="xx" onclick="xpMyDel(${i})">✕</button></span>`).join('')}`:'';
  const titleBlock=none?'<p class="muted" style="margin-top:0">「写真だけ」では、タイトルとひとことは出ません。</p>':`<div class="xl">タイトル（空欄なら出ません）</div><input id="xt_title" value="${esc(p.title)}" oninput="xpTxt('title',this.value)" placeholder="例：モカ　2026/11/23">
<div><span class="chip" onclick="xpIns('n')">名前</span><span class="chip" onclick="xpIns('d')">日付</span><span class="chip" onclick="xpIns('nd')">名前と日付</span></div>
<div class="xl">ひとこと（空欄なら出ません）</div><input id="xt_sub" value="${esc(p.sub)}" oninput="xpTxt('sub',this.value)" placeholder="例：さっぱりしました"><div>${phr}</div><button class="link" onclick="xpPhraseAdd()">＋ いまのひとことをテンプレートに保存</button>`;
  return shell('投稿画像',`<div class="card"><div class="xl">どこに投稿する？</div>${seg(DEST,c.dest,'dest')}${destNote}<div class="xl">作り方</div>${how}<div class="xl">写真の入れ方</div>${seg(FITS,c.fit,'fit')}${fitNote}</div>
<div class="card" style="padding:10px"><canvas id="xcv"></canvas><p class="muted" style="text-align:center;margin:8px 0 0">写真は指で動かせます。2本指で拡大・縮小できます</p><button class="link" onclick="xpReset()">写真の位置を元に戻す</button></div>
<div class="sec">デザイン</div><div class="card"><div class="xl">テンプレート</div>${seg(TPL,c.tpl,'tpl')}${dogsSel}<div class="xl">色</div>${sws}<div class="xl">文字の大きさ</div>${seg({s:'小',m:'中',l:'大'},c.ts,'ts')}</div>
<div class="sec">文字</div><div class="card">${titleBlock}
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
window.xpReset=()=>{if(view==='xbulk'){X.bc={};return redraw()}const r=recOf(X.id);if(!r)return;const c=cfg(),p=xp(r),pre=ckPre(c,r);
  Object.keys(p.crop).forEach(k=>{if(k.indexOf(pre)===0)delete p.crop[k]});save();redraw()};

/* まとめて1枚 */
V.xbulk=id=>{if(X.base!==id){X.base=id;X.bulk=[id];X.bt='';X.bc={}}const c=cfg();
  const rows=S.records.filter(r=>cover(r)).sort(byNew).slice(0,40).map(r=>{const on=X.bulk.includes(r.id);
    return `<div class="card list-item" onclick="xbTog('${r.id}')"><input type="checkbox" ${on?'checked':''} style="width:24px;height:24px;flex:none;margin:0;pointer-events:none"><div class="photo"><img data-img="${cover(r)}"></div><div style="flex:1"><b>${esc((dog(r.dogId)||{}).name||'')}</b><div class="muted">${esc(visitStr(r))}・${esc((place(r.placeId)||{}).name||'')}</div></div></div>`}).join('');
  return shell('まとめて1枚',`<div class="card"><div class="xl">どこに投稿する？</div>${seg(DEST,c.dest,'dest')}${destNote}<div class="xl">写真の入れ方</div>${seg(FITS,c.fit,'fit')}${c.tpl==='none'?'':`<div class="xl">タイトル（空欄なら出ません）</div><input value="${esc(X.bt)}" oninput="xbTitle(this.value)" placeholder="例：今月のトリミング">`}</div>
<div class="card" style="padding:10px"><canvas id="xcv"></canvas><p class="muted" style="text-align:center;margin:8px 0 0">写真は指で動かせます。デザインと色は投稿画像の画面と同じです</p><button class="link" onclick="xpReset()">写真の位置を元に戻す</button></div>
<div class="sec">のせる記録（6つまで）</div>${rows}`,{back:1,bar:'<button class="btn" onclick="xpShare()">画像を共有・保存</button>'})};
AFTER.xbulk=async()=>{bindCv();redraw();await loadImgs(X.bulk.map(i=>{const r=recOf(i);return r&&cover(r)}));redraw()};
window.xbTitle=v=>{X.bt=v;redraw()};
window.xbTog=id=>{if(X.bulk.includes(id))X.bulk=X.bulk.filter(x=>x!==id);else if(X.bulk.length<6)X.bulk.push(id);else return toast('6つまで選べます');render()};

/* 記録の画面のボタンを投稿画面につなぐ */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(!b||view!=='rec')return;const t=b.textContent.trim();
  if(t==='インスタに投稿する'||t==='投稿画像を作る'){e.preventDefault();e.stopImmediatePropagation();go('xpost',param)}},true);
new MutationObserver(()=>document.querySelectorAll('#app button').forEach(b=>{if(b.textContent.trim()==='インスタに投稿する')b.textContent='投稿画像を作る'})).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
/* ===== ①ここまで ===== */
/* ===== ② ホーム・ワンちゃん・履歴・設定 ===== */
(function(){
const css=document.createElement('style');
css.textContent='.dphoto{width:56px;height:56px;flex:none;border-radius:50%;background:#f3e3e6;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:11px}.dphoto img{width:100%;height:100%;object-fit:cover}.xedit{flex:none;padding:8px 12px;border:2px solid var(--main);border-radius:10px;color:var(--main);background:#fff;font-weight:bold;font-size:13px}.xstar{flex:none;width:44px;height:44px;border:none;background:none;font-size:28px;color:#f5b301;padding:0}.xmemo{font-size:22px;line-height:1.6;white-space:pre-wrap;font-weight:bold}.xlink{flex:none;color:var(--main);font-weight:bold;font-size:14px}';
document.head.appendChild(css);
const DAY=86400000;
const set=()=>{S.settings=S.settings||{};return S.settings};
const ymd=t=>{const d=new Date(t);return d.getFullYear()+'/'+(d.getMonth()+1)+'/'+d.getDate()};

/* ランキングをなくす */
const ri=TABS.findIndex(t=>t[0]==='ranking');if(ri>=0)TABS.splice(ri,1);
const ti=TAB_IDS.indexOf('ranking');if(ti>=0)TAB_IDS.splice(ti,1);

/* ワンちゃんの丸い写真 */
const dogPic=(d,size)=>{const s=size?`width:${size}px;height:${size}px`:'';
  if(d&&d.icon)return `<div class="dphoto" style="${s}"><img src="${d.icon}"></div>`;
  const r=d?recsOf(d.id)[0]:null,c=r&&cover(r);
  return `<div class="dphoto" style="${s}">${c?`<img data-img="${c}">`:'写真なし'}</div>`};

/* バックアップのお知らせ（ホーム） */
function bkNotice(){const s=set();if(!S.records.length)return'';const now=Date.now();
  if(s.bkSnooze&&s.bkSnooze>now)return'';if(s.lastBk&&now-s.lastBk<14*DAY)return'';
  const msg=s.lastBk?`前回のバックアップから${Math.floor((now-s.lastBk)/DAY)}日たちました。`:'まだバックアップしていません。';
  return `<div class="card alert"><b>バックアップしませんか？</b><div class="muted">${msg}アプリを消したときなどに、記録と写真が消えてしまうことがあります。</div><div class="row" style="margin-top:10px"><button class="btn sub small" onclick="xBkLater()">あとで</button><button class="btn small" onclick="xGoBk()">バックアップする</button></div></div>`}
window.xBkLater=()=>{set().bkSnooze=Date.now()+3*DAY;save();render()};
window.xGoBk=()=>{try{BK=null}catch(e){}go('backup')};

/* バックアップ画面：保存のお知らせと日付の記録（バックアップ画面のときだけ動く） */
const bBtns=()=>[...document.querySelectorAll('main button')];
const isMk=b=>/作る|作成/.test(b.textContent)&&!/復元/.test(b.textContent);
const svBtn=()=>bBtns().find(b=>/保存|共有/.test(b.textContent)&&!/復元|作る|作成|削除/.test(b.textContent));
function bkPop(){if(view!=='backup'||document.getElementById('x_bkpop')||!svBtn())return;
  const w=document.createElement('div');w.id='x_bkpop';
  w.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99;display:flex;align-items:center;justify-content:center;padding:24px';
  w.innerHTML='<div style="background:#fff;border-radius:16px;padding:20px;max-width:340px;width:100%"><b style="font-size:17px">バックアップができました</b><p style="margin:10px 0 4px">まだ保存されていません。「保存する」を押して、「“ファイル”に保存」を選んでください。</p><button class="btn" id="x_bkgo">保存する</button><button class="link" id="x_bkno">あとで</button></div>';
  document.body.appendChild(w);
  w.querySelector('#x_bkgo').onclick=()=>{w.remove();const b=svBtn();if(b)b.click()};
  w.querySelector('#x_bkno').onclick=()=>w.remove()}
document.addEventListener('click',e=>{if(view!=='backup')return;const b=e.target.closest&&e.target.closest('main button');if(!b)return;
  if(isMk(b)){let t=0;const iv=setInterval(()=>{if(view!=='backup')return clearInterval(iv);if(svBtn()){clearInterval(iv);bkPop()}else if(++t>150)clearInterval(iv)},200)}
  else if(/保存|共有/.test(b.textContent)&&!/復元|削除/.test(b.textContent)){const s=set();s.lastBk=Date.now();s.bkSnooze=0;save()}},true);
new MutationObserver(()=>{const p=document.getElementById('x_bkpop');if(p&&view!=='backup')p.remove()}).observe(document.getElementById('app')||document.body,{childList:true});

/* ホーム */
V.home=()=>{
  if(!S.dogs.length)return shell(APP_NAME,`<div class="card"><p>まずはワンちゃんを登録しましょう。</p><button class="btn" onclick="go('dogEdit')">ワンちゃんを登録する</button></div>${installHint()}`);
  const ups=upcoming(),ad=activeDogs();
  const dues=ad.map(d=>({d,x:dueOf(d,ups)})).filter(o=>o.x);
  const dueHtml=dues.length?`<div class="sec">そろそろ予約</div>${dues.map(o=>{const p=place(o.x.r.placeId)||{};const since=-daysTo(o.x.r.date+'T00:00');
    return `<div class="card alert"><b>${esc(o.d.name)}</b><div class="muted">前回のトリミングから${since}日たちました</div><div class="row" style="margin-top:10px">${p.tel&&p.id!=='home'?`<a class="btn sub small" href="${telHref(p.tel)}">${esc(p.name)}に電話</a>`:''}<button class="btn small" onclick="newRes('${o.d.id}')">予約を追加</button></div></div>`}).join('')}`:'';
  let nx='<p class="muted" style="margin:4px 0 0">予約はまだありません</p>';
  if(ups.length){const days=daysTo(ups[0].at);nx=`<div class="count">${days===0?'今日':'あと'+days+'日'}</div>${ups.map((x,i)=>resRow(x,i===0)).join('')}`}
  nx+=`<button class="link" onclick="newRes()">＋ 予約を追加</button>`;
  const dogs=ad.map(d=>`<div class="card list-item" onclick="go('xdog','${d.id}')">${dogPic(d)}<div style="flex:1"><b>${esc(d.name)}</b>${d.breed?`<div class="muted">${esc(d.breed)}</div>`:''}</div><span class="xlink">予約・履歴 ›</span></div>`).join('')||'<p class="muted">表示中のワンちゃんがいません。「設定」から表示を戻せます。</p>';
  return shell(APP_NAME,`${bkNotice()}${dueHtml}<div class="sec">次回の予約</div><div class="card">${nx}</div>
<button class="btn big" onclick="newRec()">今回のトリミングを記録する</button>
<div class="sec">ワンちゃん</div>${dogs}<button class="btn sub" onclick="go('dogEdit')">＋ ワンちゃんを追加</button>${installHint()}`)};

/* ワンちゃんのページ */
const favOfRec=r=>S.favs.find(f=>f.recId===r.id);
const histRow=r=>{const p=place(r.placeId)||{},on=!!favOfRec(r);
  return `<div class="card list-item"><div class="photo" onclick="go('order','${r.id}')">${cover(r)?`<img data-img="${cover(r)}">`:''}</div><div style="flex:1" onclick="go('order','${r.id}')"><b>${esc(visitStr(r))}</b><div class="muted">${esc(p.name||'')}</div>${(r.menus||[]).length?`<div class="muted">${esc(r.menus.join('・'))}</div>`:''}</div><button class="xstar" onclick="xFav('${r.id}')">${on?'★':'☆'}</button></div>`};
V.xdog=id=>{const d=dog(id);if(!d)return shell('ワンちゃん','<p class="muted">見つかりません。</p>',{back:1});
  const ups=upcoming().filter(x=>x.dogId===id);
  const res=(ups.length?ups.map((x,i)=>resRow(x,i===0)).join(''):'<p class="muted" style="margin:4px 0 0">予約はまだありません</p>')+`<button class="link" onclick="newRes('${id}')">＋ 予約を追加</button>`;
  const favs=S.favs.filter(f=>f.dogId===id),recs=recsOf(id);
  return shell(d.name,`<div class="sec">次回の予約</div><div class="card">${res}</div>
<div class="card list-item" style="margin-top:18px">${dogPic(d,64)}<div style="flex:1"><b style="font-size:18px">${esc(d.name)}</b>${d.breed?`<div class="muted">${esc(d.breed)}</div>`:''}</div><button class="xedit" onclick="go('dogEdit','${id}')">編集</button></div>
<div class="sec">お気に入り</div>${favs.map(favCard).join('')||'<p class="muted">履歴の☆を押すと、ここに入ります。</p>'}
<div class="sec">履歴</div>${recs.map(histRow).join('')||'<p class="muted">まだ記録がありません。</p>'}`,{back:1})};
window.xFav=async id=>{const r=recOf(id);if(!r)return;const f=favOfRec(r);
  if(f){if(!confirm('お気に入りから外しますか？'))return;S.favs=S.favs.filter(x=>x!==f);if(f.xcopy&&f.img)await delImg(f.img);await save();render();return toast('お気に入りから外しました')}
  const name=prompt('お気に入りの名前',(r.menus||[]).join('・')||'お気に入りのカット');if(name===null)return;
  let img=null;const src=cover(r)?await getImg(cover(r)):null;if(src)img=await putImg(src);
  S.favs.push({id:uid(),dogId:r.dogId,name:name.trim()||'お気に入り',img,memo:memoOf(r),recId:r.id,xcopy:1,created:Date.now()});
  await save();render();toast('お気に入りに入れました')};

/* お店で見せる（点数・金額なし） */
const idOf=p=>typeof p==='string'?p:(p&&(p.rec||p.id||p.fav))||'';
V.order=p=>{const id=idOf(p),r=recOf(id),f=!r&&favOf(id);
  if(!r&&!f)return shell('お店で見せる','<p class="muted">記録が見つかりません。</p>',{back:1});
  const main=r?(r.after||r.before):f.img,memo=r?memoOf(r):(f.memo||''),staff=r?(r.staff||r.stylist||r.tanto||''):'';
  const d=dog(r?r.dogId:f.dogId);
  const btns=r?`<button class="btn" onclick="go('xpost','${r.id}')">投稿画像を作る</button>${main?`<button class="link" style="padding-top:2px" onclick="xShowShare('${main}')">この写真をそのまま共有・保存</button>`:''}`:(main?`<button class="btn" onclick="xShowShare('${main}')">画像を共有・保存</button>`:'');
  return `<div class="order"><button class="back" onclick="back()">‹ 戻る</button>
<h2>${esc(d?d.name:'')}</h2><div class="muted">${r?esc(visitStr(r))+'・'+esc((place(r.placeId)||{}).name||''):esc(f.name)}</div>
<div class="photo big" style="margin-top:14px">${main?`<img data-img="${main}">`:'写真なし'}</div>
${btns}
${memo?`<div class="xmemo" style="margin-top:12px">${esc(memo)}</div>`:'<p class="muted">オーダーのメモはありません</p>'}
${staff?`<div style="margin-top:10px;font-size:18px">担当：${esc(staff)}</div>`:''}
${r&&r.before&&r.after?`<div class="muted" style="margin-top:18px">ビフォー</div><div class="photo big" style="width:55%;margin-top:6px"><img data-img="${r.before}"></div>`:''}
${r?`<button class="link" style="margin-top:16px" onclick="go('rec','${r.id}')">記録の詳細・編集</button>`:''}</div>`};
AFTER.order=async()=>{try{if(!wl&&navigator.wakeLock)wl=await navigator.wakeLock.request('screen')}catch(e){}};
window.xShowShare=id=>{const src=imgCache.get(id);if(!src)return toast('写真を読み込み中です。もう一度押してください');
  const[h,b]=src.split(',');const bin=atob(b),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  const file=new File([u],'trimming.jpg',{type:(h.match(/:(.*?);/)||[])[1]||'image/jpeg'});
  if(navigator.canShare&&navigator.canShare({files:[file]}))navigator.share({files:[file]}).catch(()=>{});else toast('この端末では共有できません')};

/* 記録タブ（見返し専用） */
V.history=p=>{if(p)HF={dog:p.dog&&dog(p.dog)?p.dog:'',tab:p.tab||'rec'};if(HF.dog&&!dog(HF.dog))HF.dog='';const dg=HF.dog,tab=HF.tab;
  if(!S.dogs.length)return V.home();let body;
  if(tab==='rec'){const l=S.records.filter(r=>!dg||r.dogId===dg).sort(byNew);body=l.map(recCard).join('')||'<p class="muted">まだ記録がありません。</p>'}
  else{const l=S.favs.filter(f=>!dg||f.dogId===dg);body=l.map(favCard).join('')||'<p class="muted">ワンちゃんのページの履歴で☆を押すと追加できます。</p>'}
  return shell('記録',`<div class="seg"><button class="${tab==='rec'?'on':''}" onclick="go('history',{dog:'${dg}',tab:'rec'})">履歴</button><button class="${tab==='fav'?'on':''}" onclick="go('history',{dog:'${dg}',tab:'fav'})">お気に入り</button></div>${dogFilter(dg,`go('history',{dog:this.value,tab:'${tab}'})`)}${body}`)};

/* 設定 */
V.dogs=()=>shell('ワンちゃん',`${S.dogs.map(d=>`<div class="card list-item" onclick="go('dogEdit','${d.id}')" style="${d.hidden?'opacity:.55':''}">${dogPic(d)}<div style="flex:1"><b>${dogLabel(d)}</b>${d.breed?`<div class="muted">${esc(d.breed)}</div>`:''}</div><span class="muted">›</span></div>`).join('')}<button class="btn" onclick="go('dogEdit')">＋ ワンちゃんを追加</button>`,{back:1});
const oSet=V.settings;
V.settings=()=>{const s=set();
  const extra=`<div class="sec">データ</div><div class="card"><p class="muted" style="margin-top:0">前回のバックアップ：${s.lastBk?ymd(s.lastBk):'まだしていません'}</p><button class="link danger" style="margin-top:0" onclick="xWipe()">すべてのデータを削除</button></div>`;
  return oSet().replace('</main>',extra+'</main>')};
window.xWipe=async()=>{
  if(!confirm('ワンちゃん・記録・写真・お店など、すべてのデータを削除します。元に戻せません。\n\n先にバックアップするのがおすすめです。続けますか？'))return;
  if(!confirm('本当にすべて削除しますか？'))return;
  await dbClear();toast('削除しました');setTimeout(()=>location.reload(),700)};

/* ワンちゃんの写真（登録・編集画面のいちばん上） */
let PEND=null;
const dpCard=(id,src)=>`<div class="card list-item" id="x_dpc"><div class="dphoto" style="width:72px;height:72px">${src?`<img src="${src}">`:'写真なし'}</div><div style="flex:1"><button class="btn sub small" onclick="xDogPhoto('${id}')">${src?'写真を変える':'写真を選ぶ'}</button>${src?`<button class="link danger" style="margin-top:4px;padding-top:6px" onclick="xDogPhotoDel('${id}')">写真を消す</button>`:''}</div></div>`;
const oDE=V.dogEdit;
V.dogEdit=id=>{if(!id)PEND=null;const d=dog(id);const src=id?(d&&d.icon):PEND;return oDE(id).replace(/(<main[^>]*>)/,'$1'+dpCard(id||'',src||''))};
window.xDogPhoto=async id=>{const f=await pickFile('image/*');if(!f)return;const url=URL.createObjectURL(f);
  try{const im=await loadSrc(url);const s=Math.min(im.naturalWidth,im.naturalHeight),c=document.createElement('canvas');c.width=c.height=360;
    c.getContext('2d').drawImage(im,(im.naturalWidth-s)/2,(im.naturalHeight-s)/2,s,s,0,0,360,360);const data=c.toDataURL('image/jpeg',0.85);
    if(id){const d=dog(id);if(d){d.icon=data;await save();toast('写真を保存しました')}}else PEND=data;
    const el=document.getElementById('x_dpc');if(el)el.outerHTML=dpCard(id,data)}
  catch(e){toast('写真を読み込めませんでした')}finally{URL.revokeObjectURL(url)}};
window.xDogPhotoDel=async id=>{if(!confirm('写真を消しますか？'))return;
  if(id){const d=dog(id);if(d){delete d.icon;await save()}}else PEND=null;
  const el=document.getElementById('x_dpc');if(el)el.outerHTML=dpCard(id,'')};
if(typeof saveDog==='function'){const oSD=saveDog;
  window.saveDog=async id=>{const before=S.dogs.map(d=>d.id),pic=PEND;await oSD(id);
    if(id){PEND=null;return}
    const d=S.dogs.find(x=>!before.includes(x.id));
    if(d){if(pic){d.icon=pic;await save();render()}PEND=null}}}

/* 予約：前回と同じお店・内容を最初から入れる */
let FILL=0;
if(typeof newRes==='function'){const o=newRes;window.newRes=(...a)=>{FILL=1;return o(...a)}}
if(typeof editRes==='function'){const o=editRes;window.editRes=(...a)=>{FILL=0;return o(...a)}}
function lastFor(dogId){if(!dogId)return null;
  const rs=S.resv.filter(x=>x.dogId===dogId&&x.at).sort((a,b)=>b.at.localeCompare(a.at));
  if(rs[0])return{placeId:rs[0].placeId,menu:rs[0].menu||''};
  const r=recsOf(dogId)[0];return r?{placeId:r.placeId,menu:(r.menus||[]).join('＋')}:null}
function selOf(ids){return[...document.querySelectorAll('main select')].find(s=>{const v=[...s.options].map(o=>o.value).filter(Boolean);return v.length&&v.every(x=>ids.includes(x))})}
const menuInp=()=>[...document.querySelectorAll('main input,main textarea')].find(i=>i.dataset.rsc||/カット＋シャンプー|顔まわり短め/.test(i.placeholder||''));
function curDog(){const ids=S.dogs.map(d=>d.id);const s=selOf(ids);if(s)return s.value;
  const h=[...document.querySelectorAll('main input[type=hidden]')].find(i=>ids.includes(i.value));if(h)return h.value;
  try{return R&&R.dogId}catch(e){return null}}
function fill(){const L=lastFor(curDog());if(!L)return;
  const ps=selOf(S.places.map(p=>p.id));
  if(ps&&L.placeId&&[...ps.options].some(o=>o.value===L.placeId)){ps.value=L.placeId;ps.dispatchEvent(new Event('change',{bubbles:true}))}
  const mi=menuInp();if(mi&&L.menu){mi.value=L.menu;mi.dispatchEvent(new Event('input',{bubbles:true}))}
  toast('前回と同じお店・内容を入れました')}
const oRE=AFTER.resEdit;
AFTER.resEdit=p=>{if(oRE)oRE(p);
  const ds=selOf(S.dogs.map(d=>d.id));
  if(ds&&!ds.dataset.xf){ds.dataset.xf=1;ds.addEventListener('change',()=>{if(FILL)fill()})}
  if(FILL===1){FILL=2;fill()}};

/* ホーム画面のアイコン（ピンクに白い足あと） */
(function(){const c=document.createElement('canvas');c.width=c.height=180;const x=c.getContext('2d');
  x.fillStyle='#e8758f';x.fillRect(0,0,180,180);x.fillStyle='#fff';
  x.beginPath();x.ellipse(90,112,34,28,0,0,7);x.fill();
  [[-38,-14],[-14,-40],[14,-40],[38,-14]].forEach(([dx,dy])=>{x.beginPath();x.ellipse(90+dx,90+dy,12,16,dx/80,0,7);x.fill()});
  const l=document.createElement('link');l.rel='apple-touch-icon';l.href=c.toDataURL('image/png');document.head.appendChild(l)})();

/* 読み込み後に画面を描き直す */
try{if(typeof db!=='undefined'&&db&&V[view])render()}catch(e){}
})();
/* ===== ②ここまで ===== */
/* ===== 追加：説明文 ===== */
(function(){
const A='※ 縦長はストーリーズ・リール、4:5と横長はインスタの通常の投稿向けです。横向きの写真は「横長」がおすすめです。LINEで送るだけならどれでも大丈夫です。';
const B='※「枠いっぱいに大きく」は写真のはしが少し切れます。「写真を切らずに全部」は切れませんが、すき間が白くなります。';
const fix=()=>{document.querySelectorAll('.xnote').forEach(p=>{if(p.dataset.x)return;const t=p.textContent;
  if(t.includes('縦長')){p.textContent=A;p.dataset.x=1}
  else if(t.includes('枠いっぱい')||t.includes('全体')){p.textContent=B;p.dataset.x=1}})};
new MutationObserver(fix).observe(document.body,{childList:true,subtree:true});
})();
/* ===== 説明文ここまで ===== */
/* ===== 追加：お気に入り・LINE・お店の住所 ===== */
(function(){
const q=(s,r)=>[...(r||document).querySelectorAll(s)];
const byText=t=>q('button,a').filter(b=>b.textContent.trim()===t);
const mapUrl=a=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(a);
const placeIn=t=>(S.places||[]).filter(p=>p.addr&&p.name&&t.includes(p.name)).sort((a,b)=>b.name.length-a.name.length)[0];

/* お気に入り：ボタン整理＋お願いした内容 */
function fav(){const rec=byText('この内容で記録する')[0];if(!rec)return;
  rec.style.display='none';byText('お店で見せる').forEach(b=>b.style.display='none');
  if(document.getElementById('xfmemo'))return;
  const f=(S.favs||[]).find(f=>f.name&&q('h1,h2,h3,div,p').some(e=>e.children.length===0&&e.textContent.trim()===f.name));
  let memo=f?(f.memo||f.order||f.note||''):'';
  if(f&&!memo){const ids=[f.recId,f.rid,f.rec,f.fromRec,f.from].filter(Boolean);
    const r=(S.records||[]).find(r=>ids.includes(r.id)||(f.photo&&(r.after===f.photo||r.before===f.photo))||(f.img&&(r.after===f.img||r.before===f.img)));
    if(r)memo=memoOf(r)}
  const d=document.createElement('div');d.id='xfmemo';d.className='card';
  d.innerHTML='<div class="muted">お願いした内容</div><div class="pre" style="font-size:18px;font-weight:bold;margin-top:6px"></div>';
  d.querySelector('.pre').textContent=memo||'メモはありません';
  const ph=document.querySelector('.photo.big');if(ph)ph.after(d);else rec.before(d)}

/* 次回の予約：LINEで送る・地図 */
const skip=/予約を追加|^電話|LINEで送る|^地図$|^あと\d+日|^次回の予約|^今日$|^明日$/;
function lines(c){return c.innerText.split('\n').map(s=>s.replace(/[›＞]/g,'').trim()).filter(s=>s&&!skip.test(s))}
function line(){q('.card').forEach(c=>{if(c.dataset.xl)return;
  const add=q('button,a',c).find(b=>b.textContent.includes('予約を追加'));if(!add)return;
  if(!/\d+\/\d+\(.\)/.test(c.innerText))return;c.dataset.xl=1;
  const p=placeIn(c.innerText);const w=document.createElement('div');w.className='row';w.style.margin='10px 0 4px';
  w.innerHTML='<button class="btn sub small" type="button">LINEで送る</button>'+(p?'<a class="btn sub small" target="_blank">地図</a>':'');
  w.querySelector('button').onclick=e=>{e.stopPropagation();const p2=placeIn(c.innerText);
    const t='次回のトリミング予約\n'+lines(c).join('\n')+(p2&&p2.addr?'\n住所：'+p2.addr:'');
    location.href='https://line.me/R/share?text='+encodeURIComponent(t)};
  if(p){const a=w.querySelector('a');a.href=mapUrl(p.addr);a.onclick=e=>e.stopPropagation()}
  add.before(w)})}

/* お店の登録：住所・メモ */
let P=null;
function inpOf(l){let e=l.nextElementSibling;while(e&&!/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName))e=e.nextElementSibling;return e||l.querySelector('input')}
function shop(){const labs=q('label');const tl=labs.find(l=>l.textContent.includes('電話'));
  if(!tl){P=null;return}if(document.getElementById('xaddr'))return;
  const nl=labs.find(l=>l.textContent.includes('名')&&!l.textContent.includes('担当'));
  const tin=inpOf(tl),nin=nl&&inpOf(nl);if(!tin||!nin)return;
  const ex=(S.places||[]).find(p=>p.name===nin.value.trim());
  P={addr:ex&&ex.addr||'',memo:ex&&ex.xmemo||'',nin};
  const w=document.createElement('div');w.id='xaddr';
  w.innerHTML='<label>住所</label><input id="xa" placeholder="例：東京都〇〇区〇〇1-2-3" autocomplete="street-address"><a id="xam" class="link" target="_blank" style="display:none">Googleマップで見る</a><label>メモ</label><textarea id="xm" placeholder="例：駐車場あり・2階・駅から5分"></textarea>';
  tin.after(w);const a=w.querySelector('#xa'),m=w.querySelector('#xm'),ml=w.querySelector('#xam');
  const upd=()=>{P.addr=a.value.trim();ml.style.display=P.addr?'block':'none';if(P.addr)ml.href=mapUrl(P.addr)};
  a.value=P.addr;m.value=P.memo;upd();a.oninput=upd;m.oninput=()=>{P.memo=m.value}}
if(typeof save==='function'&&!window.__xsave){window.__xsave=1;const o=save;
  window.save=function(){try{if(P){const n=P.nin.value.trim();const p=(S.places||[]).find(p=>p.name===n);if(p){p.addr=P.addr;p.xmemo=P.memo}}}catch(e){}return o.apply(this,arguments)}}

const run=()=>{try{fav()}catch(e){}try{line()}catch(e){}try{shop()}catch(e){}};
new MutationObserver(run).observe(document.body,{childList:true,subtree:true});run();
})();
/* ===== お気に入り・LINE・住所ここまで ===== */
/* ===== 追加：お店のLINE・地図 ===== */
(function(){
const q=(s,r)=>[...(r||document).querySelectorAll(s)];
const dg=s=>String(s||'').replace(/\D/g,'');
const X=()=>{S.settings=S.settings||{};return S.settings.shopX=S.settings.shopX||{}};
const mapUrl=a=>'https://maps.apple.com/?q='+encodeURIComponent(a);
function lineUrl(v){v=String(v||'').trim();if(!v)return'';if(/^https?:\/\//.test(v))return v;if(v[0]!=='@')v='@'+v;return 'https://line.me/R/oaMessage/'+encodeURIComponent(v)+'/'}
function infoByTel(h){const t=dg(h);if(!t)return null;const p=(S.places||[]).find(p=>p.tel&&dg(p.tel)===t);if(!p)return null;const x=X()[p.name]||{};return{line:x.line||'',addr:x.addr||p.addr||''}}
function mini(t,url){const a=document.createElement('a');a.className='minicall';a.textContent=t;a.href=url;a.style.marginLeft='6px';a.onclick=e=>e.stopPropagation();return a}
function btns(){
  q('button,a').forEach(b=>{if(b.textContent.trim()==='LINEで送る'){const r=b.parentElement;(r&&r.classList.contains('row')?r:b).style.display='none'}});
  q('a.minicall[href^="tel:"]').forEach(t=>{if(t.dataset.x2)return;t.dataset.x2=1;const i=infoByTel(t.getAttribute('href'));if(!i)return;
    let last=t;if(i.line){const a=mini('LINE',lineUrl(i.line));last.after(a);last=a}
    if(i.addr){last.after(mini('地図',mapUrl(i.addr)))}})}
function inpOf(l){let e=l.nextElementSibling;while(e&&!/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName))e=e.nextElementSibling;return e||l.querySelector('input,textarea')}
function shop(){const labs=q('label');const tl=labs.find(l=>l.textContent.includes('電話'));if(!tl)return;
  const old=document.getElementById('xaddr');if(old){if(old.dataset.v2)return;old.remove()}
  const nl=labs.find(l=>/名/.test(l.textContent)&&!/担当/.test(l.textContent));const tin=inpOf(tl),nin=nl&&inpOf(nl);if(!tin||!nin)return;
  let key=nin.value.trim();const p=(S.places||[]).find(p=>p.name===key);
  const v=Object.assign({addr:p&&p.addr||'',line:'',memo:p&&p.xmemo||''},X()[key]||{});
  const w=document.createElement('div');w.id='xaddr';w.dataset.v2=1;
  w.innerHTML='<label>住所</label><input id="xa" placeholder="例：東京都〇〇区〇〇1-2-3"><a id="xam" class="link" style="display:none">マップで見る</a><label>お店のLINE</label><input id="xl" placeholder="例：@abc1234 またはLINEのURL" autocapitalize="off" autocorrect="off"><a id="xlt" class="link" style="display:none">LINEを開いて確かめる</a><label>メモ</label><textarea id="xm" placeholder="例：駐車場あり・2階・駅から5分"></textarea>';
  tin.after(w);
  const a=w.querySelector('#xa'),l=w.querySelector('#xl'),m=w.querySelector('#xm'),am=w.querySelector('#xam'),lt=w.querySelector('#xlt');
  a.value=v.addr;l.value=v.line;m.value=v.memo;let tm=0;
  const show=()=>{am.style.display=v.addr?'block':'none';if(v.addr)am.href=mapUrl(v.addr);lt.style.display=v.line?'block':'none';if(v.line)lt.href=lineUrl(v.line)};
  const put=()=>{v.addr=a.value.trim();v.line=l.value.trim();v.memo=m.value;show();
    const n=nin.value.trim(),x=X();if(key&&key!==n)delete x[key];key=n;
    if(n){x[n]={addr:v.addr,line:v.line,memo:v.memo};clearTimeout(tm);tm=setTimeout(()=>save(),400)}};
  show();a.oninput=put;l.oninput=put;m.oninput=put;nin.addEventListener('input',put)}
const run=()=>{try{btns()}catch(e){}try{shop()}catch(e){}};
new MutationObserver(run).observe(document.body,{childList:true,subtree:true});run();
})();
/* ===== LINE・地図ここまで ===== */
/* ===== 追加：ホームにお店 ===== */
(function(){
const q=(s,r)=>[...(r||document).querySelectorAll(s)];
const ex=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const X=()=>(S.settings&&S.settings.shopX)||{};
const mapUrl=a=>'https://maps.apple.com/?q='+encodeURIComponent(a);
function lineUrl(v){v=String(v||'').trim();if(!v)return'';if(/^https?:\/\//.test(v))return v;if(v[0]!=='@')v='@'+v;return 'https://line.me/R/oaMessage/'+encodeURIComponent(v)+'/'}
const byText=t=>q('button,a,div,span,li').filter(e=>e.textContent.trim()===t);
function openSet(cb){const tab=q('button,a,div').filter(e=>e.textContent.trim()==='設定'&&e.children.length===0).pop();if(!tab)return;tab.click();setTimeout(cb,350)}
function clickName(name,step){
  const hit=q('[onclick]').find(e=>e.textContent.includes(name)&&!e.closest('#xshops')&&e.textContent.length<name.length+60);
  if(hit){hit.click();return}
  if(step<2){const m=q('button,a,[onclick]').find(e=>/お店/.test(e.textContent)&&e.textContent.length<30&&!e.closest('#xshops'));if(m){m.click();setTimeout(()=>clickName(name,step+1),350);return}}
  toast('設定の「お店」から開いてください')}
window.xShopOpen=i=>{const p=shops()[i];if(!p)return;openSet(()=>clickName(p.name,0))};
window.xShopAdd=()=>openSet(()=>{const b=q('button,a,[onclick]').find(e=>/お店を追加|お店の登録|お店/.test(e.textContent)&&e.textContent.length<30);if(b)b.click()});
const shops=()=>(S.places||[]).filter(p=>p&&p.id!=='home'&&p.name&&!p.hidden);
function render(){
  const add=q('button,a').find(b=>b.textContent.replace(/\s/g,'')==='＋ワンちゃんを追加'||b.textContent.replace(/\s/g,'')==='+ワンちゃんを追加');
  const old=document.getElementById('xshops');
  if(!add){if(old)old.remove();return}
  const list=shops(),sig=JSON.stringify(list.map(p=>[p.name,p.tel,X()[p.name]]));
  if(old&&old.dataset.sig===sig)return;if(old)old.remove();
  const w=document.createElement('div');w.id='xshops';w.dataset.sig=sig;
  let h='<div class="sec">お店</div>';
  list.forEach((p,i)=>{const x=X()[p.name]||{},addr=x.addr||p.addr||'',memo=x.memo||p.xmemo||'';
    h+=`<div class="card" onclick="xShopOpen(${i})" style="cursor:pointer"><div style="display:flex;align-items:center;gap:8px">
<div style="flex:1;min-width:0"><div style="font-weight:bold;font-size:16px">${ex(p.name)}</div>${addr?`<div class="muted" style="margin-top:2px">${ex(addr)}</div>`:''}${memo?`<div class="muted" style="margin-top:2px">${ex(memo)}</div>`:''}</div>
<span style="color:#bbb">›</span></div><div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
${p.tel?`<a class="minicall" href="tel:${ex(String(p.tel).replace(/[^\d+]/g,''))}" onclick="event.stopPropagation()">電話</a>`:''}
${x.line?`<a class="minicall" href="${ex(lineUrl(x.line))}" onclick="event.stopPropagation()">LINE</a>`:''}
${addr?`<a class="minicall" href="${ex(mapUrl(addr))}" onclick="event.stopPropagation()">地図</a>`:''}</div></div>`});
  if(!list.length)h+='<p class="muted">行ったお店を登録すると、ここから電話やLINEができます。</p>';
  h+='<button class="btn sub" onclick="xShopAdd()">＋ お店を追加</button>';
  w.innerHTML=h;add.after(w)}
new MutationObserver(()=>{try{render()}catch(e){}}).observe(document.body,{childList:true,subtree:true});
try{render()}catch(e){}
})();
/* ===== ホームにお店ここまで ===== */
/* ===== 追加：お店のLINEが2つ出るのを直す ===== */
(function(){const s=document.createElement('style');s.textContent='#xshops a.minicall[style*="margin-left"]{display:none!important}';document.head.appendChild(s)})();
/* ===== LINE重複ここまで ===== */
/* ===== 追加：電話・LINE・マップをそろえる ===== */
(function(){
const q=(s,r)=>[...(r||document).querySelectorAll(s)];
const dg=s=>String(s||'').replace(/\D/g,'');
const X=()=>(S.settings&&S.settings.shopX)||{};
const mapUrl=a=>'https://maps.apple.com/?q='+encodeURIComponent(a);
const st=document.createElement('style');st.textContent='#xshops a.minicall[style*="margin-left"]{display:none!important}';document.head.appendChild(st);
function mk(href){const a=document.createElement('a');a.className='minicall xmap';a.textContent='マップ';a.href=href;a.onclick=e=>e.stopPropagation();return a}
const hideOld=box=>q('a.minicall',box).forEach(a=>{if(a.textContent.trim()==='地図')a.style.display='none'});
function fix(){
  q('#xshops .card').forEach(c=>{const box=c.children[1];if(!box||box.querySelector('.xmap'))return;hideOld(box);
    const n=((c.querySelector('div[style*="font-weight:bold"]')||{}).textContent||'').trim();if(!n)return;
    const p=(S.places||[]).find(p=>p.name===n)||{},x=X()[n]||{};
    box.appendChild(mk(mapUrl(x.addr||p.addr||n)))});
  q('a.minicall[href^="tel:"]').forEach(t=>{if(t.closest('#xshops'))return;const par=t.parentElement;if(!par||par.querySelector('.xmap'))return;
    const p=(S.places||[]).find(p=>p.tel&&dg(p.tel)===dg(t.getAttribute('href')));if(!p)return;hideOld(par);
    const x=X()[p.name]||{};let last=t;q('a.minicall',par).forEach(a=>{if(a.textContent.trim()==='LINE')last=a});
    const m=mk(mapUrl(x.addr||p.addr||p.name));m.style.marginLeft='6px';last.after(m)});
}
new MutationObserver(()=>{try{fix()}catch(e){}}).observe(document.body,{childList:true,subtree:true});try{fix()}catch(e){}
})();
/* ===== 電話・LINE・マップここまで ===== */
/* ===== 追加：次回の予約の見た目 ===== */
(function(){
const q=(s,r)=>[...(r||document).querySelectorAll(s)];
const DT=/\d+\/\d+\(.\)/g;
const cnt=t=>(t.match(DT)||[]).length;
function rowsIn(card){let el=card;for(let i=0;i<6;i++){const kids=[...el.children].filter(k=>cnt(k.textContent)>0);
  if(kids.length>=2)return kids;if(kids.length===1){if(cnt(kids[0].textContent)>1){el=kids[0];continue}return kids}return[]}return[]}
function fix(){
  q('button,a').forEach(b=>{if(b.dataset.xr)return;if(!b.textContent.includes('予約を追加'))return;if(b.closest('#xshops'))return;
    b.dataset.xr=1;b.classList.remove('link');b.classList.add('btn','sub');b.style.marginTop='14px';
    const card=b.closest('.card');if(!card)return;
    rowsIn(card).forEach((r,i)=>{r.style.padding='14px 0';r.style.borderTop=i?'2px solid #f0d5db':'none'})});
  q('div,span,p').forEach(e=>{if(e.children.length)return;const t=e.textContent.trim();
    if(!/^(あと\d+日|今日|明日)$/.test(t))return;const pv=e.previousElementSibling;if(pv&&pv.classList.contains('xnear'))return;
    const l=document.createElement('div');l.className='muted xnear';l.textContent='直近の予約まで';l.style.fontWeight='bold';l.style.marginBottom='2px';e.before(l)});
}
new MutationObserver(()=>{try{fix()}catch(e){}}).observe(document.body,{childList:true,subtree:true});try{fix()}catch(e){}
})();
/* ===== 予約の見た目ここまで ===== */
/* ===== 追加：予約のボタンを下の段に ===== */
(function(){
const q=(s,r)=>[...(r||document).querySelectorAll(s)];
function fix(){
  q('a.minicall[href^="tel:"]').forEach(t=>{if(t.closest('#xshops'))return;const par=t.parentElement;if(!par||par.classList.contains('xbtns'))return;
    const w=document.createElement('div');w.className='xbtns';w.style.cssText='flex-basis:100%;display:flex;gap:8px;flex-wrap:wrap;order:9;margin-top:10px';
    par.style.flexWrap='wrap';q('a.minicall',par).forEach(a=>{if(a.parentElement===par){a.style.marginLeft='0';w.appendChild(a)}});
    w.onclick=e=>{if(e.target===w)e.stopPropagation()};par.appendChild(w)});
  q('.xbtns').forEach(w=>{const par=w.parentElement;if(!par)return;q('a.minicall',par).forEach(a=>{if(a.parentElement===par){a.style.marginLeft='0';w.appendChild(a)}})});
}
new MutationObserver(()=>{try{fix()}catch(e){}}).observe(document.body,{childList:true,subtree:true});try{fix()}catch(e){}
})();
/* ===== ボタン下の段ここまで ===== */
/* ===== 追加：アルバム ===== */
(function(){
const FN='"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif';
const KINDS={xmas:'クリスマス',ny:'お正月',grow:'成長アルバム',year:'1年まとめ'};
const SHAPES={reel:['縦長（9:16）',1080,1920],feed:['少し縦長（4:5）',1080,1350],sq:['正方形',1080,1080]};
const CN=['ピンク','ダーク','ミント','ベージュ','スカイ','モノクロ'];
const V={scr:'top',dog:'',flt:'all',key:'',file:null};
const M={kind:'xmas',per:'all',shape:'feed',style:0,title:'',edited:false,sel:[],file:null,t:0};
const SRC={},IMS={},KEYS={};let root=null,tok=0,LIST=[];

/* 普段の写真の保存場所 */
let dbp=null;
const adb=()=>dbp=dbp||new Promise((res,rej)=>{const q=indexedDB.open('trimlog_album',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
async function aget(k){const d=await adb();return new Promise(res=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)})}
async function aset(k,v){const d=await adb();return new Promise((res,rej)=>{const t=d.transaction('kv','readwrite'),s=t.objectStore('kv');if(v===undefined)s.delete(k);else s.put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
const ready=aget('list').then(v=>{if(Array.isArray(v))LIST=v}).catch(()=>{});
const saveList=()=>aset('list',LIST).catch(()=>alert('保存できませんでした'));

const css=document.createElement('style');
css.textContent='#xa{position:fixed;inset:0;z-index:9999;background:#f7f7f7;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(env(safe-area-inset-top) + 10px) 14px calc(env(safe-area-inset-bottom) + 110px);font-family:'+FN+';color:#333;box-sizing:border-box}#xa .xa-h{display:flex;align-items:center;justify-content:space-between;margin:2px 0 14px}#xa .xa-h b{font-size:17px}#xa .xa-b{border:none;background:#e9e9e9;border-radius:10px;padding:8px 12px;font-size:15px;color:#333;width:auto;margin:0}#xa .xa-row{display:flex;align-items:center;gap:12px;background:#fff;border-radius:14px;padding:12px;margin-bottom:10px}#xa .xa-av{width:56px;height:56px;border-radius:50%;overflow:hidden;background:#fde8ee;display:flex;align-items:center;justify-content:center;font-size:28px;flex:none}#xa .xa-av img{width:100%;height:100%;object-fit:cover}#xa .xa-s{font-size:12px;color:#888}#xa .xa-btns{display:flex;gap:8px;margin-bottom:12px}#xa .xa-btns button{flex:1;width:auto;margin:0}#xa .xa-go{border:none;border-radius:12px;background:#e8758f;color:#fff;font-size:16px;font-weight:bold;padding:13px}#xa .xa-go2{border:2px solid #e8758f;border-radius:12px;background:#fff;color:#e8758f;font-size:16px;font-weight:bold;padding:11px}#xa .xa-chips{display:flex;gap:6px;margin-bottom:4px}#xa .xa-chip{border:1px solid #ddd;background:#fff;border-radius:20px;padding:6px 14px;font-size:14px;color:#555;width:auto;margin:0}#xa .xa-chip.on{background:#e8758f;border-color:#e8758f;color:#fff}#xa .xa-m{font-size:14px;font-weight:bold;margin:16px 0 8px}#xa .xa-g{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}#xa .xa-t{position:relative;aspect-ratio:1/1;background:#eee;border-radius:6px;overflow:hidden}#xa .xa-t img{width:100%;height:100%;object-fit:cover;display:block}#xa .xa-t.on{outline:4px solid #e8758f;outline-offset:-4px}#xa .xa-tag{position:absolute;left:4px;bottom:4px;background:rgba(0,0,0,.5);color:#fff;font-size:10px;border-radius:6px;padding:1px 5px}#xa .xa-ck{position:absolute;top:4px;right:4px;background:#e8758f;color:#fff;border-radius:50%;width:22px;height:22px;font-size:12px;display:flex;align-items:center;justify-content:center}#xa .xa-c{background:#fff;border-radius:14px;padding:14px;margin-bottom:12px}#xa .xa-l{font-size:13px;color:#888;margin:12px 0 6px}#xa .xa-l:first-child{margin-top:0}#xa select,#xa input{width:100%;font-size:16px;padding:10px;border-radius:10px;border:1px solid #ddd;background:#fff;box-sizing:border-box;color:#333}#xa .xa-del{width:100%;margin-top:10px;border:none;background:none;color:#d33;font-size:15px;padding:12px}#xacv{display:block;margin:0 auto;max-width:100%;max-height:50vh;border-radius:10px;box-shadow:0 1px 6px rgba(0,0,0,.15)}#xa .xa-bar{position:fixed;left:0;right:0;bottom:0;padding:10px 14px calc(env(safe-area-inset-bottom) + 10px);background:rgba(255,255,255,.97);box-shadow:0 -1px 6px rgba(0,0,0,.08)}#xa .xa-bar .xa-go{width:100%}';
document.head.appendChild(css);

/* 共通 */
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const msg=m=>{try{if(typeof toast==='function'){toast(m);return}}catch(e){}alert(m)};
const dogs=()=>S.dogs||[];
const dogOf=id=>dogs().find(d=>d.id===id)||{};
const dname=id=>dogOf(id).name||'';
const hid=d=>!!(d.hidden||d.hide||d.off);
const ymd=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function rdate(r){const v=r.date||r.visit||r.visitAt||r.at||r.when||r.dt||r.day||'';return typeof v==='number'?ymd(v):String(v).slice(0,10)}
const fmt=d=>{const m=String(d||'').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);return m?m[1]+'.'+m[2].padStart(2,'0')+'.'+m[3].padStart(2,'0'):''};
function shopName(r){const id=r.placeId||r.shopId||r.place||r.shop;const p=(S.places||[]).find(x=>x.id===id);return p?(p.name||''):''}
const season=()=>M.kind==='xmas'||M.kind==='ny';

function items(dogId){const out=[];
  (S.records||[]).filter(r=>r.dogId===dogId).forEach(r=>{const d=rdate(r),sh=shopName(r);
    if(r.before)out.push({key:'r'+r.id+'b',src:'rec',img:r.before,date:d,label:'ビフォー',shop:sh});
    if(r.after)out.push({key:'r'+r.id+'a',src:'rec',img:r.after,date:d,label:'アフター',shop:sh})});
  LIST.filter(a=>a.dogId===dogId).forEach(a=>out.push({key:'p'+a.id,src:'own',img:a.id,date:a.date||'',label:'',memo:a.memo||'',a}));
  out.forEach(it=>KEYS[it.key]=it);
  return out.sort((x,y)=>x.date<y.date?1:x.date>y.date?-1:(x.label==='ビフォー'?1:-1))}
async function srcOf(it){if(SRC[it.key])return SRC[it.key];let s=null;try{s=it.src==='rec'?await getImg(it.img):await aget('img_'+it.img)}catch(e){}if(s&&typeof s!=='string')s=URL.createObjectURL(s);if(s)SRC[it.key]=s;return s}
async function imOf(it){if(IMS[it.key])return IMS[it.key];const s=await srcOf(it);if(!s)return null;const im=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=s});if(im)IMS[it.key]=im;return im}
function shrink(file){return new Promise(res=>{const u=URL.createObjectURL(file),i=new Image();i.onload=()=>{const k=Math.min(1,1600/Math.max(i.naturalWidth,i.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(i.naturalWidth*k);c.height=Math.round(i.naturalHeight*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',0.85))};i.onerror=()=>{URL.revokeObjectURL(u);res(null)};i.src=u})}
function shareFile(f){if(!f){msg('準備中です。もう一度押してください');return}if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f]}).catch(()=>{});else{const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=f.name;document.body.appendChild(a);a.click();a.remove()}}

/* 画面 */
function head(t,back){return '<div class="xa-h"><button class="xa-b" data-a="'+(back?'back':'close')+'">'+(back?'‹ 戻る':'閉じる')+'</button><b>'+E(t)+'</b><span style="width:64px"></span></div>'}
function scrTop(){const ds=dogs().slice().sort((a,b)=>hid(a)-hid(b));
  return head('アルバム',0)+(ds.length?ds.map(d=>{const L=items(d.id),c=L.find(x=>x.label==='アフター')||L[0];
    return '<div class="xa-row" data-a="dog" data-id="'+E(d.id)+'"><div class="xa-av">'+(c?'<img data-k="'+E(c.key)+'">':'🐶')+'</div><div style="flex:1;min-width:0"><b>'+E(d.name||'名前なし')+'</b>'+(hid(d)?' <span class="xa-s">（非表示中）</span>':'')+'<div class="xa-s">写真 '+L.length+'枚</div></div><span class="xa-s" style="font-size:22px">›</span></div>'}).join(''):'<p class="xa-s">先にワンちゃんを登録してください。</p>')}
function scrDog(){let L=items(V.dog);if(V.flt==='rec')L=L.filter(x=>x.src==='rec');if(V.flt==='own')L=L.filter(x=>x.src==='own');
  const chip=(k,t)=>'<button class="xa-chip'+(V.flt===k?' on':'')+'" data-a="flt" data-id="'+k+'">'+t+'</button>';
  let h=head(dname(V.dog)+'のアルバム',1)+'<div class="xa-btns"><button class="xa-go2" data-a="add">＋ 写真を追加</button><button class="xa-go" data-a="make">🎄 画像を作る</button></div><div class="xa-chips">'+chip('all','すべて')+chip('rec','トリミング')+chip('own','普段の写真')+'</div>';
  if(!L.length)return h+'<p class="xa-s" style="text-align:center;margin-top:30px">まだ写真がありません。<br>「＋ 写真を追加」から入れられます。</p>';
  let cur=null;L.forEach(it=>{const m=(it.date||'').slice(0,7);if(m!==cur){if(cur!==null)h+='</div>';cur=m;const mm=m.match(/^(\d{4})-(\d{2})/);h+='<div class="xa-m">'+(mm?mm[1]+'年'+Number(mm[2])+'月':'日付なし')+'</div><div class="xa-g">'}
    h+='<div class="xa-t" data-a="open" data-id="'+E(it.key)+'"><img data-k="'+E(it.key)+'">'+(it.src==='rec'?'<span class="xa-tag">✂ '+(it.label==='ビフォー'?'ビフォー':'アフター')+'</span>':'')+'</div>'});
  return h+'</div>'}
function scrOpen(){const it=KEYS[V.key];if(!it){V.scr='dog';return scrDog()}
  let h=head(fmt(it.date)||'写真',1)+'<div class="xa-c"><img data-k="'+E(it.key)+'" style="width:100%;border-radius:10px;display:block"></div><div class="xa-c">';
  if(it.src==='rec')h+='<div>✂ トリミング（'+it.label+'）</div>'+(it.shop?'<div class="xa-s" style="margin-top:4px">'+E(it.shop)+'</div>':'')+'<p class="xa-s">日付などはトリミングの記録から変えられます。</p>';
  else h+='<div class="xa-l">日付</div><input type="date" data-a="date" value="'+E(it.date)+'"><div class="xa-l">メモ</div><input type="text" data-a="memo" value="'+E(it.memo)+'" placeholder="お散歩、誕生日など">';
  return h+'</div><button class="xa-go" style="width:100%" data-a="share1">共有・保存</button>'+(it.src==='own'?'<button class="xa-del" data-a="del">この写真を消す</button>':'')}
function years(){return[...new Set(items(V.dog).map(x=>(x.date||'').slice(0,4)).filter(y=>/^\d{4}$/.test(y)))].sort().reverse()}
function pool(){return items(V.dog).filter(x=>M.per==='all'||(x.date||'').slice(0,4)===M.per).reverse()}
function defTitle(){const n=dname(V.dog);if(M.kind==='xmas')return'Merry Christmas';if(M.kind==='ny')return'あけましておめでとう';if(M.kind==='grow')return n+'の成長アルバム';return n+'の'+(M.per==='all'?new Date().getFullYear():M.per)+'年'}
function defSel(){const L=pool().filter(x=>x.label!=='ビフォー'),n=L.length;M.sel=[];if(!n)return;if(season()){M.sel=[L[n-1].key];return}const m=Math.min(9,n);for(let i=0;i<m;i++){const j=m===1?n-1:Math.round(i*(n-1)/(m-1));if(!M.sel.includes(L[j].key))M.sel.push(L[j].key)}}
function scrMake(){const yrs=years(),P=pool(),opt=(o,v)=>Object.keys(o).map(k=>'<option value="'+k+'"'+(k===v?' selected':'')+'>'+E(Array.isArray(o[k])?o[k][0]:o[k])+'</option>').join('');
  return head('画像を作る',1)+'<div class="xa-c"><canvas id="xacv"></canvas></div><div class="xa-c">'
  +'<div class="xa-l">作るもの</div><select data-a="mset" data-k="kind">'+opt(KINDS,M.kind)+'</select>'
  +'<div class="xa-l">期間</div><select data-a="mset" data-k="per"><option value="all">すべて</option>'+yrs.map(y=>'<option value="'+y+'"'+(y===M.per?' selected':'')+'>'+y+'年</option>').join('')+'</select>'
  +'<div class="xa-l">形</div><select data-a="mset" data-k="shape">'+opt(SHAPES,M.shape)+'</select>'
  +(season()?'':'<div class="xa-l">色</div><select data-a="mset" data-k="style">'+STYLES.map((s,i)=>'<option value="'+i+'"'+(i===M.style?' selected':'')+'>'+E(s.name||CN[i]||'色'+(i+1))+'</option>').join('')+'</select>')
  +'<div class="xa-l">タイトル</div><input type="text" data-a="mtitle" value="'+E(M.title)+'"><p class="xa-s">空にするとタイトルなしになります。</p></div>'
  +'<div class="xa-c"><div class="xa-l">使う写真（'+(season()?'1枚えらぶ':'9枚まで・日付の古い順に並びます')+'）</div>'
  +(P.length?'<div class="xa-g">'+P.map(it=>{const on=M.sel.includes(it.key);return '<div class="xa-t'+(on?' on':'')+'" data-a="pick" data-id="'+E(it.key)+'"><img data-k="'+E(it.key)+'"><span class="xa-tag">'+E(fmt(it.date))+(it.src==='rec'?' ✂':'')+'</span>'+(on?'<b class="xa-ck">✓</b>':'')+'</div>'}).join('')+'</div>':'<p class="xa-s">この期間の写真がありません。</p>')
  +'</div><div class="xa-bar"><button class="xa-go" data-a="mshare">画像を共有・保存</button></div>'}

/* 描画 */
function rr(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function photo(c,im,x,y,w,h,r){c.save();rr(c,x,y,w,h,r);c.clip();if(im){const s=Math.max(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*s,dh=im.naturalHeight*s;c.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh)}else{c.fillStyle='#ddd';c.fillRect(x,y,w,h)}c.restore()}
function txt(c,t,x,y,size,col,w,maxW){let s=Math.round(size);for(;;){c.font=(w?w+' ':'')+s+'px '+FN;if(c.measureText(t).width<=maxW||s<=20)break;s-=2}c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';c.fillText(t,x,y)}
function mark(c,x,y,col){c.save();c.globalAlpha=.7;c.font='bold 28px '+FN;c.fillStyle=col;c.textAlign='right';c.textBaseline='bottom';c.fillText(typeof APP_NAME!=='undefined'?APP_NAME:'トリミングログ',x,y);c.restore()}
function holly(c,x,y){c.save();c.translate(x,y);c.fillStyle='#2e8b57';[-0.7,0.7].forEach(a=>{c.save();c.rotate(a);c.beginPath();c.ellipse(0,-34,17,36,0,0,7);c.fill();c.restore()});c.fillStyle='#e74c3c';[[-12,4],[12,4],[0,-10]].forEach(([dx,dy])=>{c.beginPath();c.arc(dx,dy,13,0,7);c.fill()});c.restore()}
function plum(c,x,y,r){c.save();c.translate(x,y);c.fillStyle='#e8758f';for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;c.beginPath();c.arc(Math.cos(a)*r*0.6,Math.sin(a)*r*0.6,r*0.5,0,7);c.fill()}c.fillStyle='#f6d77a';c.beginPath();c.arc(0,0,r*0.3,0,7);c.fill();c.restore()}
function pawS(c,x,y,r){c.beginPath();c.ellipse(x,y+r*0.35,r*0.6,r*0.5,0,0,7);c.fill();[[-0.6,-0.3],[-0.2,-0.68],[0.2,-0.68],[0.6,-0.3]].forEach(([dx,dy])=>{c.beginPath();c.arc(x+dx*r,y+dy*r,r*0.22,0,7);c.fill()})}
function box(W,y,bottom,ratio,side){const maxW=W-side*2,maxH=bottom-y;let pw=maxW,ph=pw*ratio;if(ph>maxH){ph=maxH;pw=Math.min(maxW,ph/ratio)}return{px:(W-pw)/2,py:y+(maxH-ph)/2,pw,ph}}
function nyYear(){const d=new Date();return d.getMonth()>=9?d.getFullYear()+1:d.getFullYear()}
function xmas(c,W,H,ims){const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1b5e40');g.addColorStop(1,'#0d3324');c.fillStyle=g;c.fillRect(0,0,W,H);
  for(let i=0;i<80;i++){c.globalAlpha=.2+(i*13%60)/100;c.fillStyle='#fff';c.beginPath();c.arc((i*389+57)%W,(i*631+91)%H,3+(i*7)%8,0,7);c.fill()}c.globalAlpha=1;
  const tall=H/W>1.6,T=tall?210:60,B=H-(tall?300:60);let y=T;
  if(M.title){txt(c,M.title,W/2,y+55,100,'#f3d27a','bold',W-140);y+=125}
  const cols=['#e74c3c','#f1c40f','#3498db','#ecf0f1','#e67e22'],x0=60,x1=W-60,ly=y+5;
  c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=3;c.beginPath();c.moveTo(x0,ly);c.quadraticCurveTo(W/2,ly+60,x1,ly);c.stroke();
  for(let i=0;i<=12;i++){const t=i/12,x=(1-t)*(1-t)*x0+2*(1-t)*t*W/2+t*t*x1,yy=(1-t)*(1-t)*ly+2*(1-t)*t*(ly+60)+t*t*ly;c.fillStyle=cols[i%5];c.beginPath();c.ellipse(x,yy+14,9,14,0,0,7);c.fill()}
  y+=90;const nm=dname(V.dog),fy=B-(nm?110:50);const{px,py,pw,ph}=box(W,y,fy-20,1.25,100);
  c.fillStyle='#c0392b';rr(c,px-22,py-22,pw+44,ph+44,34);c.fill();c.fillStyle='#fff';rr(c,px-8,py-8,pw+16,ph+16,24);c.fill();
  photo(c,(ims[0]||{}).im,px,py,pw,ph,18);holly(c,px-6,py-6);holly(c,px+pw+6,py+ph+6);
  if(nm)txt(c,'from '+nm,W/2,fy+40,56,'#fff','bold',W-160);mark(c,W-50,B,'#fff')}
function ny(c,W,H,ims){c.fillStyle='#fbf4e6';c.fillRect(0,0,W,H);c.fillStyle='rgba(200,16,46,.08)';c.beginPath();c.arc(W*0.82,H*0.12,W*0.3,0,7);c.fill();
  c.strokeStyle='#c8102e';c.lineWidth=12;c.strokeRect(28,28,W-56,H-56);c.strokeStyle='#c9a227';c.lineWidth=3;c.strokeRect(50,50,W-100,H-100);
  const tall=H/W>1.6,T=tall?210:90,B=H-(tall?300:90);let y=T;
  if(M.title){txt(c,M.title,W/2,y+50,92,'#c8102e','bold',W-200);y+=105}
  txt(c,String(nyYear()),W/2,y+30,60,'#b8901a','bold',W-200);y+=85;
  const nm=dname(V.dog),fy=B-(nm?150:90);const{px,py,pw,ph}=box(W,y,fy-10,1.25,130);
  c.fillStyle='#c9a227';rr(c,px-14,py-14,pw+28,ph+28,28);c.fill();photo(c,(ims[0]||{}).im,px,py,pw,ph,18);
  plum(c,px-4,py-4,34);plum(c,px+pw+4,py+ph+4,34);plum(c,px+pw-30,py-14,22);
  txt(c,'今年もよろしくお願いします',W/2,fy+45,46,'#5a3b1e','',W-200);if(nm)txt(c,nm,W/2,fy+110,44,'#c8102e','bold',W-200);
  mark(c,W-70,tall?B+60:H-62,'#5a3b1e')}
function subText(ims){if(M.kind==='grow'){if(ims.length<2)return'';const a=fmt(ims[0].it.date),b=fmt(ims[ims.length-1].it.date);return a&&b?a+' → '+b:''}
  const n=(S.records||[]).filter(r=>r.dogId===V.dog&&(M.per==='all'||rdate(r).slice(0,4)===M.per)).length;return n?'トリミング '+n+'回':''}
function album(c,W,H,ims){const st=STYLES[M.style]||STYLES[0];c.fillStyle=st.bg;c.fillRect(0,0,W,H);
  c.save();c.globalAlpha=.1;c.fillStyle=st.label;for(let i=0;i<14;i++)pawS(c,(i*397+80)%W,(i*613+150)%H,24);c.restore();
  const tall=H/W>1.6,T=tall?200:60,B=H-(tall?300:70);let y=T;
  if(M.title){txt(c,M.title,W/2,y+50,84,st.text,'bold',W-120);y+=100}
  const sub=subText(ims);if(sub){txt(c,sub,W/2,y+20,44,st.text,'',W-120);y+=65}
  y+=10;const n=ims.length,bottom=B-50;
  if(!n){txt(c,'写真をえらんでください',W/2,(y+bottom)/2,44,st.text,'',W-120);mark(c,W-60,B,st.text);return}
  let cols=n===1?1:n<=4?2:3;if(tall&&n<=3)cols=1;
  const rows=Math.ceil(n/cols),gap=24,lh=50,L=60,R=W-60,cw=(R-L-gap*(cols-1))/cols,ch=(bottom-y-gap*(rows-1))/rows;
  ims.forEach((o,i)=>{const row=Math.floor(i/cols),col=i%cols,inRow=Math.min(cols,n-row*cols);let x=L+col*(cw+gap);if(inRow<cols)x+=(cols-inRow)*(cw+gap)/2;const yy=y+row*(ch+gap);
    photo(c,o.im,x,yy,cw,ch-lh,20);const d=fmt(o.it.date);if(d)txt(c,d,x+cw/2,yy+ch-lh/2+4,32,st.text,'bold',cw)});
  mark(c,W-60,B,st.text)}
async function draw(){const my=++tok;const cv=root&&root.querySelector('#xacv');if(!cv)return;const[,W,H]=SHAPES[M.shape];
  const ims=[];for(const it of pool().filter(x=>M.sel.includes(x.key)))ims.push({it,im:await imOf(it)});
  if(my!==tok||!root)return;cv.width=W;cv.height=H;const c=cv.getContext('2d');
  if(M.kind==='xmas')xmas(c,W,H,ims);else if(M.kind==='ny')ny(c,W,H,ims);else album(c,W,H,ims);
  M.file=null;cv.toBlob(b=>{if(my===tok&&b)M.file=new File([b],'trimlog-'+M.kind+'.jpg',{type:'image/jpeg'})},'image/jpeg',0.92)}

/* 動き */
function ui(){if(!root)return;const y=V.scr===root.dataset.s?root.scrollTop:0;root.dataset.s=V.scr;
  root.innerHTML=V.scr==='dog'?scrDog():V.scr==='open'?scrOpen():V.scr==='make'?scrMake():scrTop();root.scrollTop=y;
  root.querySelectorAll('img[data-k]').forEach(async im=>{const it=KEYS[im.dataset.k];if(!it)return;const s=await srcOf(it);if(s)im.src=s});
  if(V.scr==='make')draw();if(V.scr==='open')prep1()}
async function prep1(){V.file=null;const it=KEYS[V.key];if(!it)return;const s=await srcOf(it);if(!s)return;try{const b=await(await fetch(s)).blob();V.file=new File([b],'trimlog-photo.jpg',{type:b.type||'image/jpeg'})}catch(e){}}
function marks(){root.querySelectorAll('.xa-t[data-a="pick"]').forEach(el=>{const on=M.sel.includes(el.dataset.id);el.classList.toggle('on',on);let b=el.querySelector('.xa-ck');if(on&&!b){b=document.createElement('b');b.className='xa-ck';b.textContent='✓';el.appendChild(b)}if(!on&&b)b.remove()})}
function add(){const f=document.createElement('input');f.type='file';f.accept='image/*';f.multiple=true;f.style.display='none';document.body.appendChild(f);
  f.onchange=async()=>{const fs=[...f.files];f.remove();if(!fs.length)return;let n=0;
    for(const file of fs){const s=await shrink(file);if(!s)continue;const id='a'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      try{await aset('img_'+id,s)}catch(e){alert('保存できませんでした');break}LIST.push({id,dogId:V.dog,date:ymd(file.lastModified||Date.now()),memo:''});n++}
    await saveList();if(n)msg(n+'枚追加しました');V.flt='all';ui()};f.click()}
async function del(){const it=KEYS[V.key];if(!it||!it.a||!confirm('この写真を消しますか？'))return;LIST=LIST.filter(a=>a.id!==it.a.id);await saveList();try{await aset('img_'+it.a.id,undefined)}catch(e){}delete SRC[it.key];delete IMS[it.key];delete KEYS[it.key];V.scr='dog';ui()}
function make(){M.per='all';M.edited=false;M.title=defTitle();defSel();V.scr='make';ui()}
function pick(k){if(season())M.sel=[k];else{const i=M.sel.indexOf(k);if(i>=0)M.sel.splice(i,1);else{if(M.sel.length>=9){msg('写真は9枚までです');return}M.sel.push(k)}}marks();draw()}
function mshare(){if(!M.sel.length){msg('写真をえらんでください');return}
  const tags=(M.kind==='xmas'?'#クリスマス ':M.kind==='ny'?'#年賀状 #お正月 ':'#成長記録 ')+'#犬のいる暮らし '+(typeof APP_TAG!=='undefined'?APP_TAG:'#トリミングログ');
  try{navigator.clipboard.writeText(tags).catch(()=>{})}catch(e){}shareFile(M.file)}
function onClick(e){const t=e.target.closest('[data-a]');if(!t||!root||!root.contains(t))return;const a=t.dataset.a,id=t.dataset.id;
  if(a==='close'){root.remove();root=null;return}
  if(a==='back'){V.scr=V.scr==='dog'?'top':'dog';return ui()}
  if(a==='dog'){V.dog=id;V.flt='all';V.scr='dog';return ui()}
  if(a==='flt'){V.flt=id;return ui()}
  if(a==='open'){V.key=id;V.scr='open';return ui()}
  if(a==='add')return add();if(a==='make')return make();if(a==='pick')return pick(id);
  if(a==='share1')return shareFile(V.file);if(a==='del')return del();if(a==='mshare')return mshare()}
function onChange(e){const t=e.target,a=t.dataset&&t.dataset.a;if(!a)return;
  if(a==='date'||a==='memo'){const it=KEYS[V.key];if(!it||!it.a)return;it.a[a]=t.value;saveList();return}
  if(a==='mset'){const k=t.dataset.k,v=t.value;if(k==='style'){M.style=Number(v)||0;return draw()}if(k==='shape'){M.shape=v;return draw()}
    M[k]=v;if(k==='kind'){M.edited=false;if(v==='year'&&M.per==='all'){const y=years()[0];if(y)M.per=y}}if(!M.edited)M.title=defTitle();defSel();ui()}}
function onInput(e){const t=e.target;if(t.dataset&&t.dataset.a==='mtitle'){M.title=t.value;M.edited=true;clearTimeout(M.t);M.t=setTimeout(draw,150)}}
async function openAlbum(){await ready;if(root)root.remove();root=document.createElement('div');root.id='xa';
  root.addEventListener('click',onClick);root.addEventListener('change',onChange);root.addEventListener('input',onInput);
  document.body.appendChild(root);V.scr='top';ui()}
window.xOpenAlbum=openAlbum;

/* 下のタブに「アルバム」を足す */
function tab(){if(document.getElementById('xatab'))return;
  const els=[...document.querySelectorAll('body *')].filter(e=>!e.closest('#xa')&&e.children.length<=2&&/設定$/.test(e.textContent.trim())&&e.textContent.trim().length<=6);
  for(const e of els){let t=e;while(t.parentElement&&!/ホーム/.test(t.parentElement.textContent))t=t.parentElement;const bar=t.parentElement;if(!bar||bar===document.body)continue;
    let fx=bar,ok=false;for(let i=0;i<4&&fx;i++,fx=fx.parentElement){const p=getComputedStyle(fx).position;if(p==='fixed'||p==='sticky'){ok=true;break}}if(!ok)continue;
    const b=t.cloneNode(true);b.id='xatab';b.removeAttribute('onclick');b.removeAttribute('href');b.querySelectorAll('[onclick]').forEach(x=>x.removeAttribute('onclick'));
    ['on','active','sel','cur','current'].forEach(c=>{b.classList.remove(c);b.querySelectorAll('.'+c).forEach(x=>x.classList.remove(c))});
    const w=document.createTreeWalker(b,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())n.nodeValue=n.nodeValue.replace('設定','アルバム').replace(/⚙\uFE0F?/,'📷');
    b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();openAlbum()},true);bar.insertBefore(b,t);return}}
let tq=0;new MutationObserver(()=>{if(document.getElementById('xatab'))return;clearTimeout(tq);tq=setTimeout(()=>{try{tab()}catch(e){}},150)}).observe(document.body,{childList:true,subtree:true});
setTimeout(()=>{try{tab()}catch(e){}},300);
})();
/* ===== アルバムここまで ===== */
