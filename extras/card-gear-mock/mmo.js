// ===== Classic MMO item tooltip (mockup) =====
(function(){
const RN={common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic',legendary:'Legendary',absurd:'Absurd',unhinged:'Unhinged'};
const PRIMARY=['atk','def','hp'], SECOND=['spd','crit','luck'];
const fmt=n=>n.toLocaleString('en-US');
const dps=it=>it.dmg?((it.dmg[0]+it.dmg[1])/2/it.speed):0;
function coins(c){const g=Math.floor(c/10000),s=Math.floor(c%10000/100),k=c%100;let o='';
  if(g)o+=`${fmt(g)}<i class="coin g"></i>`; if(s||g)o+=`${s}<i class="coin s"></i>`; o+=`${k}<i class="coin c"></i>`;return o}
function secLine(k,v){
  if(k==='spd')return `Equip: Increases your Speed by ${v}, so you act sooner.`;
  if(k==='crit')return `Equip: Increases your Crit Chance by ${v}%.`;
  if(k==='luck')return `Equip: Increases your Luck by ${v}. Better loot drops.`;
}
function slotType(it){
  const left=it.slot==='main'?(it.hand||'Main Hand'):it.slot==='belt'?'Belt':SLOT_NAMES[it.slot];
  const right=it.type&&it.type!==left?it.type:'';
  return `<div class="mt-row"><span>${left}</span><span>${right}</span></div>`;
}
function body(id,ctx={}){
  const it=ITEMS[id];if(!it)return '';
  const h=ctx.hero?HEROES_M[ctx.hero]:null;
  let o=`<div class="mt-name" style="color:var(--mt-${it.rarity})">${it.name}</div>`;
  o+=`<div class="mt-ilvl">Item Level ${it.ilvl}</div>`;
  if(it.bind)o+=`<div>${it.bind==='pickup'?'Binds when picked up':'Binds when equipped'}</div>`;
  if(it.unique)o+=`<div>Unique-Equipped</div>`;
  if(it.stack)o+=`<div>Max Stack: ${it.stack}</div>`;
  o+=slotType(it);
  if(it.dmg)o+=`<div class="mt-row"><span>${it.dmg[0]} - ${it.dmg[1]} Damage</span><span>Speed ${it.speed.toFixed(2)}</span></div><div>(${dps(it).toFixed(1)} damage per second)</div>`;
  if(it.armor)o+=`<div>${fmt(it.armor)} Armor</div>`;
  if(it.block)o+=`<div>${it.block} Block</div>`;
  const st=it.stats||{};
  PRIMARY.forEach(k=>{if(st[k])o+=`<div>+${st[k]} ${STAT_NAMES[k]}</div>`});
  SECOND.forEach(k=>{if(st[k])o+=`<div class="mt-g">${secLine(k,st[k])}</div>`});
  (it.equip||[]).forEach(e=>o+=`<div class="mt-g">Equip: ${e}</div>`);
  if(it.use)o+=`<div class="mt-g">Use: ${it.use}${it.cd?` (${it.cd})`:''}</div>`;
  if(it.set){const S=SETS[it.set];const worn=ctx.worn||[];const have=S.items.filter(x=>worn.includes(x));const on=have.length===S.items.length;
    o+=`<div class="mt-set"><div class="mt-sn">${S.name} (${have.length}/${S.items.length})</div>`;
    S.items.forEach(x=>o+=`<div class="mt-si ${have.includes(x)?'own':''}">${ITEMS[x].name}</div>`);
    o+=`<div class="mt-sb ${on?'on':''}">(3) Set: ${S.text}</div></div>`;}
  if(it.req){const bad=h&&h.lv<it.req;o+=`<div class="${bad?'mt-red':''}">Requires Card Level ${it.req}</div>`}
  if(it.sell)o+=`<div class="mt-sell">Sell Price: ${coins(it.sell)}</div>`;
  if(it.flavor)o+=`<div class="mt-flav">"${it.flavor}"</div>`;
  return o;
}
function diff(newId,oldId){
  const a=ITEMS[newId],b=ITEMS[oldId];const rows=[];
  const add=(label,v,dec)=>{if(!v)return;rows.push(`<div class="${v>0?'mt-up':'mt-down'}">${v>0?'+':''}${dec?v.toFixed(1):fmt(v)} ${label}</div>`)};
  if(a.dmg||b.dmg)add('Damage Per Second',dps(a)-dps(b),1);
  add('Armor',(a.armor||0)-(b.armor||0));
  [...PRIMARY,...SECOND].forEach(k=>add(k==='crit'?'Crit Chance (%)':STAT_NAMES[k],((a.stats||{})[k]||0)-((b.stats||{})[k]||0)));
  return rows.length?`<div class="mt-cmp"><div>If you replace this item, these stats change:</div>${rows.join('')}</div>`:'';
}
function emptyBody(slot){return `<div class="mt-name" style="color:#d9d9d9">${SLOT_NAMES[slot]||slot}</div><div class="mt-dim">Empty slot</div><div class="mt-flav">"Anything you find for this spot goes right here."</div>`}
let root,back,cur=null;
function ensure(){if(root)return;back=document.createElement('div');back.className='mt-back';root=document.createElement('div');root.className='mt-wrap';document.body.append(back,root);back.addEventListener('click',hide)}
function isPhone(){return matchMedia('(max-width: 719px)').matches}
function show(anchor,{id,slot,hero,worn,compare}){
  ensure();cur=anchor;
  const panels=[];
  const rc=id?ITEMS[id].rarity:'common';
  if(id){panels.push(`<div class="mt r-${rc}">${compare?'<div class="mt-tag">Just found</div>':''}${body(id,{hero,worn})}${compare?diff(id,compare):''}</div>`)}
  else panels.push(`<div class="mt">${emptyBody(slot)}</div>`);
  if(compare)panels.push(`<div class="mt eq r-${ITEMS[compare].rarity}"><div class="mt-tag">Currently equipped</div>${body(compare,{hero,worn})}</div>`);
  const phone=isPhone();
  root.className='mt-wrap'+(phone?' sheet':'')+(compare?' two':'');
  root.innerHTML=(phone?'<div class="mt-grip"></div>':'')+`<div class="mt-panels">${phone?panels.join(''):panels.slice().reverse().join('')}</div>`;
  back.classList.toggle('on',phone);
  root.classList.add('on');
  if(!phone){
    const sr=anchor.getBoundingClientRect(),cr=(anchor.closest('.flip3d')||anchor).getBoundingClientRect(),r={left:cr.left,right:cr.right,width:cr.width,top:sr.top},w=root.offsetWidth,hh=root.offsetHeight,vw=innerWidth,vh=innerHeight;
    let x=r.right+12; if(x+w>vw-8)x=r.left-12-w; if(x<8)x=Math.max(8,Math.min(vw-w-8,r.left+r.width/2-w/2));
    let y=r.top-8; y=Math.max(8,Math.min(vh-hh-8,y));
    root.style.left=x+'px';root.style.top=y+'px';
  } else {root.style.left='';root.style.top=''}
}
function hide(){if(!root||!root.classList.contains('on'))return false;root.classList.remove('on');back.classList.remove('on');document.querySelectorAll('.sel').forEach(s=>s.classList.remove('sel'));cur=null;return true}
window.MMO={show,hide,isOpen:()=>!!(root&&root.classList.contains('on')),current:()=>cur};
})();
