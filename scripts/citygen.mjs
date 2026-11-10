// Generator miast NeonOS: port 1:1 z mockups/mapa-miasta.html (linie 85–298, 406–492)
// oraz tras wyjazdu z mockups/_src/wyjazd.tpl.html (linie 164–179).
// Uruchamiany tylko w Node (npm run gen:cities). Wynik zależy od Array.prototype.sort
// w V8 (TimSort, jak w Chrome), dlatego package.json wymaga node >= 22.
// Nie zmieniaj liczby ani kolejności wywołań R(): każda zmiana przestawia całe miasto.

export function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export const hashStr=s=>{let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
let R=rng(1);const rr=(a,b)=>a+R()*(b-a);const pick=a=>a[Math.floor(R()*a.length)];const ri=(a,b)=>Math.floor(rr(a,b+1));
const CARCOL=['#3a5a5e','#5e4a3a','#2f4650','#6b2b36','#4a5a3a','#55606a'];
export const FLOOR=6; // wysokość piętra w jednostkach

// ================= WZORY KWARTAŁÓW =================
function perim(o,L,{depth=[14,20],hmin=16,hmax=30,skip=null,kind='old',oficyny=.25}={}){
  const D=rr(...depth);
  const run=(x0,y0,len,horiz,inward)=>{let t=0;while(t<len-6){let Ls=Math.min(rr(20,44),len-t);if(len-t-Ls<12)Ls=len-t;
    const b=horiz?{x:x0+t,y:y0,w:Ls,d:D}:{x:x0,y:y0+t,w:D,d:Ls};b.h=ri(hmin,hmax);b.kind=kind;
    if(!(skip&&skip(b))){o.boxes.push(b);if(R()<.35)o.boxes.push({x:b.x+b.w*rr(.2,.7),y:b.y+b.d*rr(.25,.6),w:4,d:4,h:3,z0:b.h,kind:'roofbit'});
      if(R()<oficyny&&Ls>24){const len2=rr(18,Math.min(42,(horiz?L.h:L.w)/2-D-8));if(len2>14){const ww=rr(9,13),off=rr(2,Ls-ww-2);
        let of;if(horiz)of={x:b.x+off,y:inward>0?b.y+D:b.y-len2,w:ww,d:len2};else of={x:inward>0?b.x+D:b.x-len2,y:b.y+off,w:len2,d:ww};
        of.h=Math.max(10,b.h-ri(4,10));of.kind=kind;if(!(skip&&skip(of)))o.boxes.push(of)}}}
    t+=Ls+(R()<.1?8:0)}};
  run(0,0,L.w,true,1);run(0,L.h-D,L.w,true,-1);run(0,D,L.h-2*D,false,1);run(L.w-D,D,L.h-2*D,false,-1);
  return D}
function yard(o,x,y,w,h,{sheds=.6,trees=2400}={}){if(w<30||h<20)return;
  if(R()<sheds){const sw=Math.min(rr(24,40),w-6);o.boxes.push({x:x+rr(0,w-sw),y:y+rr(0,Math.max(0,h-12)),w:sw,d:11,h:6,kind:'shed'})}
  for(let k=0;k<Math.floor(w*h/trees);k++)o.trees.push({x:x+rr(4,w-4),y:y+rr(4,h-4)})}
const O=()=>({boxes:[],trees:[],cars:[],grounds:[]});
const TEMPLATES={
  kamienice:(L,op={})=>{const o=O();const D=perim(o,L,{oficyny:.35,hmin:op.hmin??16,hmax:op.hmax??30});yard(o,D+20,D+20,L.w-2*D-40,L.h-2*D-40,{trees:2000});return o},
  mieszana:(L,op={})=>{const o=O();const mw=L.w*rr(.55,.75),md=rr(24,30);const mh=op.modernH??[50,62];
      o.boxes.push({x:0,y:0,w:mw,d:md,h:ri(...mh),kind:'modern'});
      if(R()<.6)o.boxes.push({x:mw*.15,y:md,w:mw*.3,d:rr(14,22),h:ri(18,24),kind:'modern'});
      const gapStart=L.h*rr(.35,.5);
      perim(o,L,{oficyny:.3,skip:b=>(b.y<md+2&&b.x<mw+2)||(b.x>L.w-30&&b.y>gapStart&&b.y<L.h-26)});
      o.boxes.push({x:L.w*rr(.45,.6),y:L.h*rr(.45,.6),w:24,d:20,h:9,kind:'hip'});
      o.grounds.push({x:L.w-60,y:gapStart+4,w:44,d:L.h-gapStart-34,kind:'paved'});
      for(let y=gapStart+8;y<L.h-40;y+=12)if(R()<.7)o.cars.push({x:L.w-52,y,w:16,d:8,h:4,col:pick(CARCOL)});
      return o},
  szkola:(L)=>{const o=O();const d=22;
      o.boxes.push({x:0,y:0,w:L.w*.62,d,h:26,kind:'school',label:'szkoła'});o.boxes.push({x:0,y:d,w:d,d:L.h*.55,h:26,kind:'school'});
      o.grounds.push({x:L.w*.42,y:L.h*.42,w:L.w*.54,d:L.h*.52,kind:'pitch'});
      o.grounds.push({x:L.w*.68,y:4,w:L.w*.3,d:L.h*.32,kind:'paved'});
      for(let x=L.w*.70;x<L.w-16;x+=12)if(R()<.6)o.cars.push({x,y:8,w:8,d:14,h:4,col:pick(CARCOL)});
      for(let x=L.w*.44;x<L.w;x+=16)o.trees.push({x,y:L.h*.38});return o},
  bloki:(L)=>{const o=O();const n=L.h>150?3:2;const gap=(L.h-n*14)/n;
      for(let i=0;i<n;i++){const y=gap/2+i*(gap+14);o.boxes.push({x:12,y,w:L.w-24,d:14,h:ri(30,44),kind:'slab'});
        if(i<n-1){const py=y+14+gap*.3;o.grounds.push({x:16,y:py,w:L.w*.45,d:gap*.4,kind:'paved'});
          for(let x=20;x<L.w*.45;x+=11)if(R()<.7)o.cars.push({x,y:py+2,w:8,d:Math.min(14,gap*.4-4),h:4,col:pick(CARCOL)});
          o.grounds.push({x:L.w*.62,y:py,w:24,d:gap*.4,kind:'play'});
          for(let x=L.w*.5;x<L.w-10;x+=rr(14,22))o.trees.push({x,y:y+14+gap*.15})}}
      return o},
  domki:(L)=>{const o=O();const pw=rr(34,42),ph=rr(40,50);const cols=Math.max(1,Math.floor(L.w/pw)),rows=Math.max(1,Math.floor(L.h/ph));
      const cw=L.w/cols,chh=L.h/rows;
      for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const x=i*cw,y=j*chh;o.grounds.push({x:x+1.5,y:y+1.5,w:cw-3,d:chh-3,kind:'garden'});
        const along=R()<.5;const hw=along?rr(18,24):rr(14,18),hd=along?rr(14,18):rr(18,24);
        const front=j===rows-1?chh-hd-5:5;o.boxes.push({x:x+rr(4,cw-hw-4),y:y+front,w:hw,d:hd,h:ri(8,11),kind:R()<.65?'house':'hip',house:1});
        if(R()<.4)o.boxes.push({x:x+cw-13,y:y+(j===rows-1?chh-14:4),w:10,d:10,h:5,kind:'shed'});
        if(R()<.7)o.trees.push({x:x+rr(6,cw-6),y:y+chh/2+rr(-6,6)})}
      return o},
  rynek:(L)=>{const o=O();o.grounds.push({x:0,y:0,w:L.w,d:L.h,kind:'square'});
      const rw=Math.min(54,L.w*.4),rd=Math.min(36,L.h*.35);const rx=L.w/2-rw/2,ry=L.h/2-rd/2;
      o.boxes.push({x:rx,y:ry,w:rw,d:rd,h:18,kind:'place',label:'RATUSZ',tenants:[{n:'Urząd Miasta',f:'p. 0–1'},{n:'Informacja turystyczna',f:'parter'}]});
      o.boxes.push({x:rx+rw/2-5,y:ry+rd/2-5,w:10,d:10,h:22,z0:18,kind:'place'});
      for(let x=10;x<L.w-6;x+=22){o.trees.push({x,y:8});o.trees.push({x,y:L.h-8})}
      for(let y=30;y<L.h-26;y+=22){o.trees.push({x:8,y});o.trees.push({x:L.w-8,y})}
      return o},
  dyskont:(L)=>{const o=O();const mw=Math.min(80,L.w*.5),md=Math.min(50,L.h*.5);
      o.boxes.push({x:0,y:0,w:mw,d:md,h:10,kind:'market',label:'market'});
      o.grounds.push({x:mw+6,y:4,w:L.w-mw-10,d:L.h*.6,kind:'lot'});
      for(let x=mw+12;x<L.w-14;x+=11)if(R()<.6)o.cars.push({x,y:10,w:8,d:14,h:4,col:pick(CARCOL)});
      const rest=TEMPLATES.domki({w:L.w,h:L.h-md-14});rest.boxes.forEach(b=>{b.y+=md+14;o.boxes.push(b)});rest.grounds.forEach(g=>{g.y+=md+14;o.grounds.push(g)});rest.trees.forEach(t=>{t.y+=md+14;o.trees.push(t)});
      return o},
  supermarket:(L)=>{const o=O();const mw=L.w*.5,md=L.h*.62;
      o.boxes.push({x:0,y:0,w:mw,d:md,h:15,kind:'market',label:'SUPERMARKET'});
      for(let k=0;k<6;k++)o.boxes.push({x:8+k*(mw-24)/6,y:6,w:8,d:6,h:3,z0:15,kind:'roofbit'});
      o.grounds.push({x:mw+6,y:4,w:L.w-mw-10,d:L.h-8,kind:'lot'});o.grounds.push({x:4,y:md+10,w:mw,d:L.h-md-14,kind:'lot'});
      for(let x=mw+12;x<L.w-14;x+=11)for(let y=10;y<L.h-20;y+=30)if(R()<.6)o.cars.push({x,y,w:8,d:14,h:4,col:pick(CARCOL)});
      return o},
  skwer:(L)=>{const o=O();o.grounds.push({x:0,y:0,w:L.w,d:L.h,kind:'park',cross:1});
      for(let k=0;k<Math.floor(L.w*L.h/900);k++){const x=rr(8,L.w-8),y=rr(8,L.h-8);if(Math.hypot(x-L.w/2,y-L.h/2)>22&&Math.abs((x/L.w)-(y/L.h))>.06&&Math.abs((x/L.w)+(y/L.h)-1)>.06)o.trees.push({x,y})}return o},
  wiezowce:(L)=>{const o=O();o.grounds.push({x:0,y:0,w:L.w,d:L.h,kind:'plaza'});
      // celowo jak w makiecie (sort(()=>R()-.5)); generator działa tylko w Node, zob. engines w package.json
      const n=L.w*L.h>30000?ri(2,3):ri(1,2);const spots=[[.05,.05],[.55,.08],[.08,.55],[.55,.55]].sort(()=>R()-.5).slice(0,n);
      spots.forEach(([fx,fy])=>{const w=rr(34,Math.min(52,L.w*.38)),d=rr(34,Math.min(52,L.h*.38));const x=fx*L.w,y=fy*L.h;
        o.boxes.push({x:x-4,y:y-4,w:w+8,d:d+8,h:12,kind:'podium'});
        const h=ri(20,32)*FLOOR;o.boxes.push({x,y,w,d,h,z0:12,kind:'tower',tower:1});
        o.boxes.push({x:x+w/2-3,y:y+d/2-3,w:6,d:6,h:14,z0:12+h,kind:'antenna'})});
      for(let k=0;k<6;k++)o.trees.push({x:rr(10,L.w-10),y:rr(L.h*.42,L.h*.5)});
      return o},
};
function rot(b,k,LW,LH){let {x,y,w,d}=b,lw=LW,lh=LH;for(let i=0;i<k;i++){[x,y,w,d]=[lh-y-d,x,d,w];[lw,lh]=[lh,lw]}return{...b,x,y,w,d}}
function rotPt(p,k,LW,LH){let {x,y}=p,lw=LW,lh=LH;for(let i=0;i<k;i++){[x,y]=[lh-y,x];[lw,lh]=[lh,lw]}return{...p,x,y}}
function place(S,key,c,k,op){const odd=k%2===1;const L={w:odd?c.h:c.w,h:odd?c.w:c.h};const o=TEMPLATES[key](L,op);
  const tr=b=>{const r=rot(b,k,L.w,L.h);r.x+=c.x;r.y+=c.y;return r};
  o.boxes.forEach(b=>S.boxes.push(tr(b)));o.cars.forEach(b=>S.cars.push(tr(b)));o.grounds.forEach(g=>S.grounds.push(tr(g)));
  o.trees.forEach(t=>{const r=rotPt(t,k,L.w,L.h);S.trees.push({x:r.x+c.x,y:r.y+c.y})});c.tpl=key}

// ================= NAJEMCY (fikcyjni) =================
export const SHOPS=['Fryzjer „Grzywka”','Kwiaciarnia Bratek','Piekarnia u Józka','Kebab Sułtan','Lombard Złoty Róg','Komis RTV Iskra','Biuro rachunkowe Suma','Gabinet stomatologiczny','Pizzeria Piec','Sklep Wiklina i Kosz','Zakład szewski','Kantor Grosz','Optyk Soczewka','Sklep zoologiczny Ara'];
export const OFFICES=['Kancelaria Wróbel i wsp.','Data-Tech sp. z o.o.','Agencja reklamowa Pixel','Coworking Rój','Ubezpieczenia Tarcza','Biuro podróży Albatros','Klinika Medica','Logistyka Mrówka S.A.','Fundusz Orzeł Capital','Software House Kłos'];
// [plan 04, zad. 2] Hotel Luksus jest tylko w wieżowcu celu; pick losuje raz, więc strumień R się nie przesuwa.
const TARGET_TENANTS=[{n:'Recepcja, kawiarnia Ziarno',f:'p. 0'},{n:'Bank Wiślany, centrala',f:'p. 1–4'},{n:'Hotel Luksus',f:'p. 5–10'},
  {n:'Data-Tech sp. z o.o.',f:'p. 11–14'},{n:'Agencja reklamowa Pixel',f:'p. 15–19'},{n:'Siłownia FitTower',f:'p. 20'},{n:'Restauracja Panorama',f:'p. 21 (ostatnie)'}];
function towerTenants(b){const floors=Math.round(b.h/FLOOR);const t=[];let f=1;
  const fl=(a,e)=>e>a?`p. ${a}–${e}`:`p. ${a}`;
  t.push({n:pick(['Recepcja i lobby','Lobby, ochrona budynku','Recepcja, kawiarnia Ziarno','Lobby, kiosk Prasa']),f:'p. 0'});
  if(R()<.6){const e=f+ri(6,10);t.push({n:pick(['Hotel Horyzont','Hotel Meridian','Hotel Wieża']),f:fl(f,e)});f=e+1}
  const pool=OFFICES.slice(); // każda firma raz na budynek
  while(f<=floors-3){const e=Math.min(floors-3,f+ri(2,6));const k=Math.floor(R()*pool.length);t.push({n:pool.length?pool.splice(k,1)[0]:'Biura do wynajęcia',f:fl(f,e)});f=e+1}
  t.push({n:'Siłownia FitTower',f:`p. ${floors-2}`});t.push({n:'Restauracja Panorama',f:`p. ${floors-1} (ostatnie)`});return t}

// ================= GENERATOR MIASTA =================
const TIERS={
  small:{label:'Nowy Tomyśl',tag:'małe miasto · start',W:900,H:660,spacing:[120,180],short:.22,
    mains:{v:[],h:[[330,'ul. Poznańska',24]]},dual:false,rynek:true,home:true,market:'dyskont',
    blurb:'Rodzinne miasto gracza. Jedna mapa bez dzielnic, rynek z ratuszem, przez miasto biegnie jedna droga przelotowa (ul. Poznańska). Przeważają domki, a przy rynku stoją niskie kamienice. Bank mieści się na parterze kamienicy przy rynku.'},
  medium:{label:'Leszno',tag:'średnie miasto',W:1300,H:950,spacing:[130,200],short:.28,
    mains:{v:[[640,'ul. Kościuszki',22]],h:[[470,'ul. Poznańska',22]]},dual:false,rynek:true,home:false,market:'supermarket',
    blurb:'Leszno, 61 tys. mieszkańców, ok. 60 km od domu w linii prostej. Jedna mapa bez dzielnic, około dwa razy większa od małego miasta. Dwie szersze ulice jednopasmowe i rynek. Są wszystkie wzory, ale biurowce są niższe. Bank stoi w budynku z biurami.'},
  big:{label:'Poznań · Centrum',tag:'duże miasto · dzielnica',W:1800,H:1300,spacing:[140,220],short:.3,
    mains:{v:[[860,'ul. Bankowa',46],[1440,'al. Niepodległości',46]],h:[[620,'ul. Długa',46],[1080,'al. Wojska Polskiego',46]]},dual:true,rynek:false,home:false,market:'supermarket',towers:true,
    blurb:'Jedna z dzielnic dużego miasta. Drogi dwupasmowe, a w centrum wieżowce. Cel to centrala banku na piętrach 1–4 jednego z wieżowców. Hotel, restauracja i biura są w tym samym budynku. Wysokie budynki zasłaniające cel robią się półprzezroczyste.'},
};
const VN=['ul. Lipowa','ul. Polna','ul. Szkolna','ul. Ogrodowa','ul. Leśna','ul. Słoneczna','ul. Kolejowa','ul. Młyńska','ul. Klonowa','ul. Wąska','ul. Żwirki','ul. Wiklinowa'];
const HN=['ul. Kościelna','ul. Mickiewicza','ul. Łąkowa','ul. Rybaki','ul. Strzelecka','ul. Spokojna','ul. Parkowa','ul. Sienkiewicza','ul. Chmielna'];
const wpick=o=>{let x=R()*Object.values(o).reduce((a,b)=>a+b,0);for(const [k,v] of Object.entries(o)){x-=v;if(x<=0)return k}return Object.keys(o)[0]};
const SHORT=['ul. Krótka','Zaułek','ul. Cicha','pasaż Kupiecki','ul. Boczna','ul. Ciasna','ul. Mała','ul. Kręta'];
function build(tierKey,D){const T=D?{...TIERS.big,...D}:TIERS[tierKey];R=rng(hashStr(T.label+tierKey));const {W,H}=T;
  const STREETS=[];
  const lines=(max,names,mains)=>{const out=[];let p=rr(100,150);let ni=0;const used=new Set();
    while(p<max-70){const m=mains.find(m=>!used.has(m)&&Math.abs(p-m[0])<110);if(m)used.add(m);const c=m?m[0]:p;
      out.push({c,w:m?m[2]:pick([14,16,16,18]),main:!!m,dual:!!m&&T.dual,n:m?m[1]:names[ni++%names.length]});p=c+(m?m[2]/2:0)+rr(...T.spacing)}return out};
  // celowo jak w makiecie; generator działa tylko w Node, zob. engines w package.json
  lines(W,VN.slice().sort(()=>R()-.5),T.mains.v).forEach(s=>STREETS.push({...s,v:1}));
  lines(H,HN.slice().sort(()=>R()-.5),T.mains.h).forEach(s=>STREETS.push({...s,v:0}));
  const cuts=(list,max)=>{const iv=list.map(s=>[s.c-s.w/2,s.c+s.w/2]).sort((a,b)=>a[0]-b[0]);const out=[];let p=0;iv.forEach(([a,b])=>{out.push([p,a]);p=b});out.push([p,max]);return out};
  const xs=cuts(STREETS.filter(s=>s.v),W),ys=cuts(STREETS.filter(s=>!s.v),H);
  const M=6;let cells=[];xs.forEach(([x0,x1])=>ys.forEach(([y0,y1])=>cells.push({x:x0+M,y:y0+M,w:x1-x0-2*M,h:y1-y0-2*M})));
  let si=0;
  cells=cells.flatMap(c=>{if(R()>T.short||(c.w<160&&c.h<140))return[c];
    const v=c.w>=c.h*1.1;const w=pick([9,10,12]);const n=SHORT[si++%SHORT.length];
    if(v){const cx=c.x+c.w*rr(.4,.6);STREETS.push({n,v:1,c:cx,w,from:c.y-M,to:c.y+c.h+M,short:1});const a=cx-w/2-M,b=cx+w/2+M;return[{...c,w:a-c.x},{...c,x:b,w:c.x+c.w-b}]}
    const cy=c.y+c.h*rr(.4,.6);STREETS.push({n,v:0,c:cy,w,from:c.x-M,to:c.x+c.w+M,short:1});const a=cy-w/2-M,b=cy+w/2+M;return[{...c,h:a-c.y},{...c,y:b,h:c.y+c.h-b}]});
  const ctr={x:W*.48,y:H*.47};
  const near=(x,y,flt=()=>true)=>cells.filter(c=>!c.tpl&&flt(c)).reduce((m,c)=>{const d=Math.hypot(c.x+c.w/2-x,c.y+c.h/2-y);return d<m.d?{c,d}:m},{d:1e9}).c;
  const S={W,H,cells,streets:STREETS,boxes:[],trees:[],cars:[],grounds:[],tier:tierKey};
  const big=c=>c.w>110&&c.h>90;
  let rynekCell=null;
  if(T.rynek){rynekCell=near(ctr.x,ctr.y,c=>c.w>90&&c.h>80&&c.w<260&&c.h<230);place(S,'rynek',rynekCell,0)}
  const mainCell=near(W*.75,(T.mains.h[0]?.[0]??H/2)-60,c=>big(c));place(S,T.market,mainCell,ri(0,3));
  const nPark=tierKey==='small'?1:2;for(let i=0;i<nPark;i++){const c=near(rr(.15,.85)*W,rr(.15,.85)*H,big);if(c)place(S,'skwer',c,0)}
  let schools=0;const maxSchools=tierKey==='small'?1:2;
  // dom gracza – w kwartale domków na obrzeżu
  let homeCell=null;if(T.home){homeCell=near(W*.18,H*.78,c=>c.w>90&&c.h>80);place(S,'domki',homeCell,0);
    const hs=S.boxes.filter(b=>b.house&&b.x>=homeCell.x&&b.x<homeCell.x+homeCell.w&&b.y>=homeCell.y&&b.y<homeCell.y+homeCell.h);
    const hb=hs.reduce((m,b)=>{const d=Math.hypot(b.x-(homeCell.x+homeCell.w/2),b.y-(homeCell.y+homeCell.h/2));return d<m.d?{b,d}:m},{d:1e9}).b;
    hb.kind='house';hb.home=1;hb.label='DOM';hb.tenants=[{n:'Twój dom',f:'tu mieszkasz',h:1},{n:'Twój komputer i łącze',f:'stąd działasz',h:1}];S.home={x:hb.x+hb.w/2,y:hb.y+hb.d/2}}
  cells.forEach(c=>{if(c.tpl)return;const k=ri(0,3);
    if(c.w<60||c.h<60){S.boxes.push({x:c.x,y:c.y,w:c.w,d:c.h,h:tierKey==='small'?ri(10,16):ri(14,24),kind:'old'});return}
    const r=Math.hypot((c.x+c.w/2-ctr.x)/(W/2),(c.y+c.h/2-ctr.y)/(H/2));let key,op={};
    if(tierKey==='small'){
      if(r<.32){key='kamienice';op={hmin:12,hmax:20}}
      else if(r<.6){const x=R();key=x<.25?'kamienice':x<.42?'bloki':(schools<maxSchools&&big(c))?(schools++,'szkola'):'domki';op={hmin:12,hmax:20}}
      else key=R()<.88?'domki':'bloki';
    }else if(tierKey==='medium'){
      if(r<.32){const x=R();key=x<.55?'kamienice':'mieszana';op={modernH:[28,36]}}
      else if(r<.65){const x=R();key=x<.25?'kamienice':x<.35?'mieszana':x<.68?'bloki':(schools<maxSchools&&big(c))?(schools++,'szkola'):'domki';op={modernH:[28,36]}}
      else key=R()<.75?'domki':'bloki';
    }else if(T.mix){key=wpick(T.mix.find(([lim])=>r<lim)[1]);if(key==='szkola'){if(schools<maxSchools&&big(c))schools++;else key='bloki'}
    }else{
      if(r<.24&&big(c))key='wiezowce';
      else if(r<.4)key=R()<.6?'kamienice':'mieszana';
      else if(r<.7){const x=R();key=x<.3?'kamienice':x<.45?'mieszana':x<.75?'bloki':(schools<maxSchools&&big(c))?(schools++,'szkola'):'domki'}
      else key=R()<.75?'domki':'bloki';
    }
    place(S,key,c,k,op)});
  // najemcy wieżowców
  S.boxes.filter(b=>b.tower).forEach(b=>b.tenants=towerTenants(b));
  // cel zlecenia
  const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.d&&a.y+a.d>b.y;
  const SPECIAL=[];const special=(c,b)=>{if(!c)return;b.x=c.x+c.w-b.w;b.y=c.y+c.h-b.d;SPECIAL.push(b);return b};
  let target,targetCell;
  if(tierKey==='small'){targetCell=cells.filter(c=>c!==rynekCell&&c.tpl==='kamienice').reduce((m,c)=>{const d=Math.hypot(c.x-rynekCell.x,c.y-rynekCell.y);return d<m.d?{c,d}:m},{d:1e9}).c;
    target=special(targetCell,{w:44,d:20,h:18,kind:'old',target:1,tenants:[{n:'Bank Wiślany, oddział Nowy Tomyśl',f:'parter',t:1,floors:[0,0]},{n:'Biuro rachunkowe Suma',f:'p. 1'},{n:'mieszkania',f:'p. 2'}]})}
  else if(tierKey==='medium'){targetCell=cells.filter(c=>c.tpl==='mieszana'||(!cells.some(x=>x.tpl==='mieszana')&&c.tpl==='kamienice')).reduce((m,c)=>{const d=Math.hypot(c.x-ctr.x,c.y-ctr.y);return d<m.d?{c,d}:m},{d:1e9}).c;
    target=special(targetCell,{w:56,d:30,h:30,kind:'modern',target:1,tenants:[{n:'Bank Wiślany, oddział Leszno',f:'p. 0–1',t:1,floors:[0,1]},{n:'Ubezpieczenia Tarcza',f:'p. 2'},{n:'Kancelaria Wróbel i wsp.',f:'p. 3–4'}]})}
  else if(T.target!==false){const towers=S.boxes.filter(b=>b.tower);target=towers.reduce((m,b)=>{const d=Math.hypot(b.x-ctr.x,b.y-ctr.y);return d<m.d?{b,d}:m},{d:1e9}).b;
    // [plan 04, zad. 2] wieżowiec celu: stali lokatorzy (mapa-swiata.md rozdz. 8) i 22 piętra; antena na nowym dachu
    target.target=1;target.tenants=TARGET_TENANTS.map(t=>({...t}));target.h=22*FLOOR;
    const ant=S.boxes.find(b=>b.kind==='antenna'&&b.x===target.x+target.w/2-3&&b.y===target.y+target.d/2-3);
    // x/y/w/d celu do 0,5 (przesunięcie < 0,25 jednostki), żeby środek dachu był dokładny także po zaokrągleniu w JSON
    const half=v=>Math.round(v*2)/2;['x','y','w','d'].forEach(k=>target[k]=half(target[k]));
    if(ant){ant.x=target.x+target.w/2-3;ant.y=target.y+target.d/2-3;ant.z0=target.z0+target.h}}
  const PLACES={small:[['dworzec',70,26,12,'Dworzec kolejowy Nowy Tomyśl'],['poczta',40,24,14,'Poczta Krajowa'],['apteka',34,22,12,'Apteka Pod Wagą'],['kawiarnia',30,20,12,'Kawiarnia Ziarno'],['sklep',34,22,12,'Sklep „U Heńka”']],
    medium:[['URZĄD',80,40,26,'Urząd Miasta'],['poczta',50,30,20,'Poczta Krajowa'],['apteka',36,24,16,'Apteka Centralna'],['kawiarnia',36,22,16,'Kawiarnia Ziarno'],['dworzec',100,36,20,'Dworzec kolejowy']],
    big:[['URZĄD',90,46,34,'Urząd Dzielnicy'],['poczta',54,34,24,'Poczta Krajowa'],['kawiarnia',40,24,22,'Kawiarnia Ziarno'],['dworzec',120,40,24,'Dworzec Główny']]}[tierKey];
  if(T.places)PLACES.splice(0,PLACES.length,...T.places);
  const usedP=new Set([targetCell]);
  PLACES.forEach(([label,w,d,h,name])=>{const px=rr(.2,.8)*W,py=rr(.2,.8)*H;const c=cells.filter(c=>!usedP.has(c)&&c.w>w+10&&c.h>d+10&&!['rynek','skwer','supermarket','dyskont','wiezowce'].includes(c.tpl)).reduce((m,c)=>{const dd=Math.hypot(c.x+c.w/2-px,c.y+c.h/2-py);return dd<m.d?{c,d:dd}:m},{d:1e9}).c;
    if(c){usedP.add(c);special(c,{w,d,h,kind:'place',label,tenants:[{n:name,f:'p. 0'}]})}});
  if(target&&!target.tower){}
  S.boxes=S.boxes.filter(b=>!SPECIAL.some(s=>hit(b,s))||b.home).concat(SPECIAL);
  S.trees=S.trees.filter(t=>!SPECIAL.some(s=>t.x>s.x-4&&t.x<s.x+s.w+4&&t.y>s.y-4&&t.y<s.y+s.d+4));
  S.cars=S.cars.filter(b=>!SPECIAL.some(s=>hit(b,s)));
  S.target=target;
  // drzewa na pasach zieleni
  STREETS.filter(s=>s.dual).forEach(s=>{const len=s.v?H:W;const cr=STREETS.filter(o=>o.v!==s.v&&o.from==null);
    for(let t=18;t<len;t+=34){if(cr.some(o=>Math.abs(t-o.c)<o.w/2+10))continue;S.trees.push(s.v?{x:s.c,y:t}:{x:t,y:s.c})}});
  S.crossings=[];STREETS.filter(a=>a.v&&!a.short).forEach(a=>STREETS.filter(b=>!b.v&&!b.short&&(a.main||b.main)).forEach(b=>S.crossings.push([a.c,b.c,a.w,b.w])));
  // źródła wokół celu
  const tc=target?{x:target.x+target.w/2,y:target.y+target.d/2}:{x:W*.5,y:H*.5};const tcell=targetCell||cells.find(c=>tc.x>=c.x&&tc.x<=c.x+c.w&&tc.y>=c.y&&tc.y<=c.y+c.h)||cells.reduce((m,c)=>{const d=Math.hypot(c.x+c.w/2-tc.x,c.y+c.h/2-tc.y);return d<m.d?{c,d}:m},{d:1e9}).c;
  S.masts=[{k:'M1',x:W*.2,y:H*.2,r:Math.max(W,H)*.32,sec:1}];if(tierKey!=='small')S.masts.push({k:'M2',x:W*.8,y:H*.75,r:Math.max(W,H)*.25,sec:2});
  S.srcs=[{k:'S1',sec:1,x:tcell.x+tcell.w+2,y:tcell.y+tcell.h-24,w:8,d:6,h:9,range:{x:tcell.x-4,y:tcell.y-4,w:tcell.w+8,h:tcell.h+8}}];
  if(tierKey!=='small'){const c2=cells.filter(c=>c!==tcell).reduce((m,c)=>{const d=Math.hypot(c.x+c.w/2-tc.x-200,c.y+c.h/2-tc.y-60);return d<m.d?{c,d}:m},{d:1e9}).c||tcell;S.srcs.push({k:'S2',sec:3,x:c2.x+c2.w+2,y:c2.y+c2.h-24,w:8,d:6,h:9,range:{x:c2.x-4,y:c2.y-4,w:c2.w+8,h:c2.h+8}})}
  if(tierKey==='big'&&T.airportSign!==false)S.airport={x:W-30,y:1080};
  S.start=S.home||{x:20,y:(T.mains.h[0]?.[0]??H/2)};S.startLabel=S.home?null:'przyjazd z zewnątrz';
  return S}

// ================= DZIELNICE (prawdziwe nazwy, fikcyjny układ) =================
const DMAINS=(v1,v2,h1,h2)=>({v:[[860,v1,46],[1440,v2,46]],h:[[620,h1,46],[1080,h2,46]]});
const DISTRICTS={
  centrum:{name:'Centrum',label:'Poznań · Centrum',tag:'śródmieście',seed:[.5,.5],wt:1.25,kind:'centrum',
    rows:[['zabudowa','wieżowce, biurowce, kamienice'],['miejsca','Dworzec Główny, Urząd Dzielnicy, Poczta'],['zlecenie','centrala Banku Wiślanego, wieżowiec, p. 1–4','t']],
    appBlurb:'Śródmieście. Drogi dwupasmowe, a w środku wieżowce: na piętrach hotele, biura, banki i restauracje. Najedź na budynek, żeby zobaczyć lokatorów pięter. Kliknij, żeby zaplanować tam wyjazd.',
    blurb:'Śródmieście. Drogi dwupasmowe, a w środku wieżowce. Cel to centrala banku na piętrach 1–4 jednego z wieżowców. Hotel, restauracja i biura są w tym samym budynku. Wysokie budynki zasłaniające cel robią się półprzezroczyste.'},
  jezyce:{name:'Jeżyce',label:'Poznań · Jeżyce',tag:'kamienice',seed:[.34,.33],wt:1,kind:'kamienice',target:false,towers:false,airportSign:false,
    mains:DMAINS('ul. Słowackiego','ul. Kraszewskiego','ul. Dąbrowskiego','ul. Polna'),
    mix:[[.5,{kamienice:75,mieszana:25}],[.8,{kamienice:45,bloki:25,szkola:10,domki:20}],[9,{domki:50,bloki:50}]],
    places:[['URZĄD',90,46,34,'Urząd Dzielnicy Jeżyce'],['poczta',54,34,24,'Poczta Krajowa'],['targ',70,40,10,'Rynek Jeżycki (targowisko)'],['kawiarnia',40,24,22,'Kawiarnia Ziarno']],
    rows:[['zabudowa','kamienice z oficynami, podwórka'],['miejsca','targowisko, Urząd Dzielnicy, kawiarnie']],
    blurb:'Stara dzielnica kamienic z oficynami i ciasnymi podwórkami. Dużo małych lokali na parterach: kawiarnie, fryzjerzy, lombardy.'},
  winogrady:{name:'Winogrady',label:'Poznań · Winogrady',tag:'osiedla bloków',seed:[.55,.17],wt:1,kind:'bloki',target:false,towers:false,airportSign:false,
    mains:DMAINS('ul. Szeligowskiego','ul. Murawa','ul. Wilczak','al. Solidarności'),
    mix:[[.6,{bloki:80,szkola:20}],[9,{bloki:60,domki:40}]],
    places:[['poczta',54,34,24,'Poczta Krajowa'],['przychodnia',60,34,14,'Przychodnia Zdrowie'],['kawiarnia',40,24,22,'Kawiarnia Ziarno']],
    rows:[['zabudowa','bloki z wielkiej płyty, szkoły, place zabaw'],['miejsca','przychodnia, poczta, pawilony handlowe']],
    blurb:'Osiedla bloków z lat 70. i 80. Między blokami parkingi, place zabaw i szkoły. Sieci domowe i osiedlowi dostawcy internetu.'},
  grunwald:{name:'Grunwald',label:'Poznań · Grunwald',tag:'mieszana',seed:[.3,.7],wt:1,kind:'mieszana',target:false,towers:false,airportSign:false,
    mains:DMAINS('ul. Głogowska','ul. Grunwaldzka','ul. Bukowska','ul. Hetmańska'),
    mix:[[.4,{mieszana:40,kamienice:40,bloki:20}],[.75,{bloki:50,domki:30,szkola:20}],[9,{domki:80,bloki:20}]],
    places:[['URZĄD',90,46,34,'Urząd Dzielnicy Grunwald'],['szpital',110,50,30,'Szpital Miejski'],['poczta',54,34,24,'Poczta Krajowa']],
    rows:[['zabudowa','biurowce, kamienice, bloki, domki na obrzeżach'],['miejsca','Szpital Miejski, Urząd Dzielnicy, targi']],
    blurb:'Dzielnica mieszana: przy głównych ulicach biurowce i kamienice, dalej bloki, a na obrzeżach domki. Tu stoi szpital miejski.'},
  wilda:{name:'Wilda',label:'Poznań · Wilda',tag:'kamienice i zakłady',seed:[.54,.83],wt:1,kind:'kamienice',target:false,towers:false,airportSign:false,
    mains:DMAINS('ul. Górna Wilda','ul. Dolna Wilda','ul. Hetmańska','ul. Dmowskiego'),
    mix:[[.6,{kamienice:65,mieszana:35}],[9,{bloki:40,kamienice:30,domki:30}]],
    places:[['zakład',130,60,18,'Zakłady Metalowe Wilda S.A.'],['poczta',54,34,24,'Poczta Krajowa'],['kawiarnia',40,24,22,'Kawiarnia Ziarno']],
    rows:[['zabudowa','kamienice, hale dawnych zakładów'],['miejsca','zakłady metalowe, poczta, rynek wildecki']],
    blurb:'Robotnicza dzielnica kamienic i starych zakładów przemysłowych. Część hal zamieniono na biura i lofty.'},
  rataje:{name:'Rataje',label:'Poznań · Rataje',tag:'za rzeką, bloki',seed:[.83,.55],wt:1,kind:'bloki',target:false,towers:false,airportSign:false,
    mains:DMAINS('ul. Bobrzańska','ul. Inflancka','ul. Krzywoustego','ul. Piłsudskiego'),
    mix:[[.55,{bloki:75,szkola:15,mieszana:10}],[9,{bloki:50,domki:50}]],
    places:[['galeria',140,70,20,'Galeria Przystań (centrum handlowe)'],['poczta',54,34,24,'Poczta Krajowa'],['kawiarnia',40,24,22,'Kawiarnia Ziarno']],
    rows:[['zabudowa','osiedla bloków za Wartą'],['miejsca','Galeria Przystań, poczta, szkoły']],
    blurb:'Duże osiedla bloków po drugiej stronie Warty. Z centrum prowadzą tu mosty. Największa galeria handlowa w mieście.'},
  lawica:{name:'Ławica',label:'Poznań · Ławica',tag:'domki, przy lotnisku',seed:[.13,.32],wt:.95,kind:'domki',target:false,towers:false,
    mains:DMAINS('ul. Bukowska','ul. Lotnicza','ul. Złotowska','ul. Wichrowa'),
    mix:[[.4,{bloki:40,domki:50,szkola:10}],[9,{domki:95,bloki:5}]],
    places:[['poczta',54,34,24,'Poczta Krajowa'],['sklep',44,28,12,'Sklep „Pod Skrzydłem”']],
    rows:[['zabudowa','domki jednorodzinne, kilka bloków'],['miejsca','Port Lotniczy Poznań-Warta (obok), poczta']],
    blurb:'Spokojna dzielnica domków na zachodzie miasta, tuż przy lotnisku. Nad dachami przelatują samoloty podchodzące do lądowania.'},
};
const DKEYS=Object.keys(DISTRICTS);

// ================= MIASTO W CAŁOŚCI =================
function buildCity(){R=rng(hashStr('Poznań/dzielnice'));const W=4600,H=3300;
  const grid=(max)=>{const out=[];let p=rr(80,140),i=0;while(p<max-80){const main=i%5===2;out.push({c:p,w:main?40:14,main});p+=rr(150,215)+(main?20:0);i++}return out};
  const V=grid(W),Hs=grid(H);
  const cuts=l=>{const out=[];let p=0;l.forEach(s=>{out.push([p,s.c-s.w/2]);p=s.c+s.w/2});out.push([p,l===V?W:H]);return out};
  const xs=cuts(V),ys=cuts(Hs);
  const river=[];for(let y=-300;y<=H+300;y+=60)river.push([W*.69+170*Math.sin(y/560)+50*Math.sin(y/170+1),y]);
  const rdist=(x,y)=>{let m=1e9;for(let i=0;i<river.length-1;i++){const [ax,ay]=river[i],[bx,by]=river[i+1];const t=Math.max(0,Math.min(1,((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2)));m=Math.min(m,Math.hypot(x-ax-t*(bx-ax),y-ay-t*(by-ay)))}return m};
  const AIR={x:120,y:1250,w:820,h:560};
  const inAir=(x,y)=>x>AIR.x-60&&x<AIR.x+AIR.w+60&&y>AIR.y-60&&y<AIR.y+AIR.h+60;
  const C={W,H,V,Hs,xs,ys,river,AIR,cells:[],boxes:[],parks:[],dists:{}};
  DKEYS.forEach(k=>C.dists[k]={k,cells:[],sx:0,sy:0});
  xs.forEach(([x0,x1],i)=>ys.forEach(([y0,y1],j)=>{const c={i,j,x:x0+8,y:y0+8,w:x1-x0-16,h:y1-y0-16};const mx=c.x+c.w/2,my=c.y+c.h/2;
    const edge=((mx-W*.5)/(W*.53))**2+((my-H*.5)/(H*.55))**2+.12*Math.sin(mx/300)*Math.cos(my/260);
    c.ring=edge;
    if(edge>1.02||inAir(mx,my)){c.d=null;c.out=1}
    else if(rdist(mx,my)<85){c.d=null;c.water=1}
    else{let best=null,bd=1e9;DKEYS.forEach(k=>{const D=DISTRICTS[k];const d=Math.hypot(mx-D.seed[0]*W,(my-D.seed[1]*H)*1.15)*D.wt;
        // rzeka jest granicą: Rataje tylko za rzeką
        const east=mx>river.reduce((m,p)=>Math.abs(p[1]-my)<Math.abs(m[1]-my)?p:m)[0];if((k==='rataje')!==east)return;
        if(d<bd){bd=d;best=k}});c.d=best;if(rdist(mx,my)<170||R()<.05)c.park=1}
    C.cells.push(c);if(c.d){const D=C.dists[c.d];D.cells.push(c);D.sx+=mx;D.sy+=my}}));
  // zabudowa kwartałów (uproszczona)
  const cc={x:W*.5,y:H*.5};
  C.cells.forEach(c=>{if(!c.d||c.park)return;const K=DISTRICTS[c.d].kind;const rc=Math.hypot(c.x+c.w/2-cc.x,c.y+c.h/2-cc.y);
    const push=(x,y,w,d,h,kind)=>C.boxes.push({x,y,w,d,h,kind,dk:c.d});
    let kind=K;if(K!=='domki'&&c.ring>.8)kind=R()<.6?'domki':'bloki';
    if(kind==='centrum'){if(rc<520&&R()<.75){const n=R()<.5?2:1;for(let k=0;k<n;k++){const w=rr(40,c.w*.42),d=rr(40,c.h*.42);push(c.x+(k?c.w-w-6:6),c.y+(k?c.h-d-6:6),w,d,rr(90,170),'tower')}push(c.x,c.y+c.h-20,c.w*.5,20,24,'old');return}kind=R()<.5?'kamienice':'mieszana'}
    if(kind==='kamienice'||kind==='mieszana'){const D=18,h=rr(18,26);push(c.x,c.y,c.w,D,h,'old');push(c.x,c.y+c.h-D,c.w,D,h,'old');push(c.x,c.y+D,D,c.h-2*D,h,'old');push(c.x+c.w-D,c.y+D,D,c.h-2*D,h,'old');
      if(kind==='mieszana')push(c.x+c.w*.3,c.y+c.h*.3,c.w*.4,c.h*.35,rr(40,60),'modern');return}
    if(kind==='bloki'){const along=c.w>c.h;const n=Math.max(2,Math.floor((along?c.h:c.w)/60));for(let k=0;k<n;k++){const t=(k+.5)/n;
      if(along)push(c.x+12,c.y+c.h*t-7,c.w-24,14,rr(30,48),'slab');else push(c.x+c.w*t-7,c.y+12,14,c.h-24,rr(30,48),'slab')}return}
    const nx=Math.max(1,Math.floor(c.w/40)),ny=Math.max(1,Math.floor(c.h/45));for(let a=0;a<nx;a++)for(let b=0;b<ny;b++)if(R()<.85)push(c.x+a*c.w/nx+8,c.y+b*c.h/ny+10,18,16,9,'house')});
  Object.values(C.dists).forEach(D=>{D.cx=D.sx/D.cells.length;D.cy=D.sy/D.cells.length});
  // kolej z dworcem
  const rail=Hs.reduce((m,s)=>Math.abs(s.c-H*.6)<Math.abs(m.c-H*.6)&&!s.main?s:m);C.rail=rail.c;
  const dwX=V.reduce((m,s)=>Math.abs(s.c-W*.47)<Math.abs(m.c-W*.47)?s:m).c+40;C.dworzec={x:dwX,y:rail.c+12,w:200,d:56,h:22};
  C.boxes=C.boxes.filter(b=>!(b.x<C.dworzec.x+C.dworzec.w&&b.x+b.w>C.dworzec.x&&b.y<C.dworzec.y+C.dworzec.d&&b.y+b.d>C.dworzec.y));
  // cel zlecenia: wieżowiec najbliżej środka Centrum
  const tw=C.boxes.filter(b=>b.kind==='tower'&&b.dk==='centrum');C.target=tw.reduce((m,b)=>Math.hypot(b.x-C.dists.centrum.cx,b.y-C.dists.centrum.cy)<Math.hypot(m.x-C.dists.centrum.cx,m.y-C.dists.centrum.cy)?b:m,tw[0]);
  return C}

// ================= WYJŚCIE (JSON dla gry) =================
export const SCENE_KEYS = ['nt', 'leszno', 'centrum', 'jezyce', 'winogrady', 'grunwald', 'wilda', 'rataje', 'lawica'];

function buildScene(key) {
  if (key === 'nt') return build('small');
  if (key === 'leszno') return build('medium');
  return build('big', DISTRICTS[key]);
}

// Gra nie zdradza celu: w danych nie ma flag `target`, `t` ani `floors`.
function cleanBox(b) {
  const o = { ...b };
  delete o.target;
  if (o.tenants) o.tenants = o.tenants.map(({ t, floors, ...rest }) => rest);
  return o;
}

function sceneOut(key, S) {
  const targetIndex = key === 'centrum' && S.target ? S.boxes.indexOf(S.target) : null;
  return {
    key, tier: S.tier, W: S.W, H: S.H,
    cells: S.cells.map(c => (c.tpl ? { x: c.x, y: c.y, w: c.w, h: c.h, tpl: c.tpl } : { x: c.x, y: c.y, w: c.w, h: c.h })),
    streets: S.streets,
    boxes: S.boxes.map(cleanBox),
    trees: S.trees,
    cars: S.cars.map(c => ({ x: c.x, y: c.y, w: c.w, d: c.d, h: c.h, col: CARCOL.indexOf(c.col) })),
    grounds: S.grounds,
    crossings: S.crossings,
    masts: S.masts,
    srcs: S.srcs,
    airport: S.airport ?? null,
    start: S.start,
    startLabel: S.startLabel,
    home: S.home ?? null,
    targetIndex,
  };
}

// Poznań w całości: buildCity i, tym samym strumieniem R, losowe drobiazgi z drawCity
// (pola za miastem, linia 504; drzewa w parkach, linia 514), żeby renderer nic nie losował.
function cityOut() {
  const C = buildCity();
  const { W, H } = C;
  const fields = [];
  for (let k = 0; k < 160; k++) {
    const x = rr(-250, W + 250), y = rr(-250, H + 250);
    const e = ((x - W * .5) / (W * .53)) ** 2 + ((y - H * .5) / (H * .55)) ** 2;
    if (e > 1.1) { const w = rr(120, 260), d = rr(80, 180); fields.push({ x, y, w, d }); }
  }
  const parkTrees = [];
  C.cells.filter(c => c.park && c.d).forEach(c => {
    for (let k = 0; k < 5; k++) { const x = c.x + rr(10, c.w - 10), y = c.y + rr(10, c.h - 10); parkTrees.push({ x, y }); }
  });
  const dists = {};
  DKEYS.forEach(k => { const D = C.dists[k]; dists[k] = { cx: D.cx, cy: D.cy, n: D.cells.length }; });
  return {
    W, H, V: C.V, Hs: C.Hs, xs: C.xs, ys: C.ys, river: C.river, AIR: C.AIR,
    cells: C.cells.map(c => {
      const o = { i: c.i, j: c.j, x: c.x, y: c.y, w: c.w, h: c.h, d: c.d ?? null };
      if (c.water) o.water = 1;
      if (c.out) o.out = 1;
      if (c.park) o.park = 1;
      return o;
    }),
    boxes: C.boxes,
    dists,
    rail: C.rail,
    dworzec: C.dworzec,
    fields,
    parkTrees,
  };
}

// Trasy wyjazdu: port wyjazd.tpl.html linie 164–179. Czasów dojścia nie zapisujemy (stałe w silniku).
function tripRoutes(NT, PZ) {
  const stNT = NT.boxes.find(b => b.label === 'dworzec'), stPZ = PZ.boxes.find(b => b.label === 'dworzec'), S1 = PZ.srcs[0];
  const ctr = b => ({ x: b.x + b.w / 2, y: b.y + b.d / 2 });
  function streetAt(S, p) { let best = null, bd = 1e9; S.streets.filter(s => !s.short).forEach(s => { const d = Math.abs((s.v ? p.x : p.y) - s.c); if (d < bd) { bd = d; best = s } }); return best }
  function route(S, a, b) {
    const v = S.streets.filter(s => s.v && !s.short).reduce((m, s) => Math.abs(s.c - a.x) < Math.abs(m.c - a.x) ? s : m);
    const h = S.streets.filter(s => !s.v && !s.short).reduce((m, s) => Math.abs(s.c - b.y) < Math.abs(m.c - b.y) ? s : m);
    return [[a.x, a.y], [v.c, a.y], [v.c, h.c], [b.x, h.c], [b.x, b.y]];
  }
  const homeStreet = streetAt(NT, NT.home).n, s1Street = streetAt(PZ, S1).n;
  const rNT = route(NT, NT.home, ctr(stNT)), rNTcar = [[NT.home.x, NT.home.y], ...route(NT, NT.home, { x: NT.W, y: 330 }).slice(1, 3), [NT.W + 40, 330]];
  const rPZ = route(PZ, ctr(stPZ), { x: S1.x, y: S1.y });
  const rC = route(PZ, PZ.start, { x: S1.x, y: S1.y }), rPZcar = rC.slice(0, 4), rPZwalk = rC.slice(3);
  const parkStreet = streetAt(PZ, { x: rC[3][0], y: rC[3][1] }).n;
  return {
    rNT, rNTcar, rPZ, rPZcar, rPZwalk,
    homeStreet, s1Street, parkStreet,
    stationStreet: streetAt(PZ, ctr(stPZ)).n.replace(/^(ul\.|al\.) /, ''),
    entryStreet: streetAt(PZ, PZ.start).n,
    targetIndex: PZ.boxes.indexOf(PZ.target),
    s1: { x: S1.x, y: S1.y },
  };
}

export function generateAll() {
  const raw = {};
  const out = {};
  for (const k of SCENE_KEYS) { raw[k] = buildScene(k); out[k] = sceneOut(k, raw[k]); }
  out.poznan = cityOut();
  out['trip-routes'] = tripRoutes(raw.nt, raw.centrum);
  out.names = { SHOPS, OFFICES };
  return out;
}

export function serialize(data) {
  return JSON.stringify(data, (_k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v)) + '\n';
}
