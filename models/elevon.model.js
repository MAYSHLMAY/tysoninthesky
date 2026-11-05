/* flight-recall-model */
// Elevon on a flying wing. Units: 1 = 1 m. Nose points toward -Z, right wing is +X.
const link=(T,m,a,b)=>{const d=b.clone().sub(a);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=d.length();m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize())};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const defl=v=>{const m=v.mix/100,r=-(v.pitch+v.roll*m),l=-(v.pitch-v.roll*m),k=v.throw/100;
  return{R:clamp(r,-100,100)*k,L:clamp(l,-100,100)*k,sat:Math.abs(r)>100||Math.abs(l)>100}};
const arm=(P,a,H,r,B0)=>{const dx=H[0]-P[0],dy=H[1]-P[1],d=Math.hypot(dx,dy),x=(a*a-r*r+d*d)/(2*d),h=Math.sqrt(Math.max(a*a-x*x,0)),ux=dx/d,uy=dy/d,mx=P[0]+ux*x,my=P[1]+uy*x;
  return [[mx-uy*h,my+ux*h],[mx+uy*h,my-ux*h]].sort((p,q)=>Math.hypot(p[0]-B0[0],p[1]-B0[1])-Math.hypot(q[0]-B0[0],q[1]-B0[1]))[0]};
export default {
name:'Elevon (Flying Wing)', category:'Control Surfaces', sub:'Elevons',
info:'An elevon combines elevator and aileron in one surface on a tailless or delta wing. Moving both elevons the same way pitches the aircraft; moving them oppositely rolls it. A mixer turns pitch and roll commands into left and right deflections. Positive deflection = trailing edge down. Because the wing has no tail, elevons sit far behind the CG and need a reflexed airfoil or sweep for pitch stability.',
parts:[
{id:'wing',label:'Wing structure',info:'Fixed swept wing carrying lift loads. Shown semi-transparent so the mechanism is visible.'},
{id:'elevon',label:'Elevon skin',info:'The moving surface. Its chord is about 30 cm of the 100 cm root chord, hinged on a swept line parallel to the trailing edge.'},
{id:'spar',label:'Elevon spar',info:'Carries bending and torsion along the span and anchors the horn and hinge points.'},
{id:'ribs',label:'Ribs',info:'Five ribs hold the airfoil shape and spread the horn load into the skin.'},
{id:'hinge',label:'Hinge line & pin',info:'Three hinge barrels on a continuous pin. Because the hinge is swept, a deflection also twists the surface slightly relative to the airflow (a built-in differential effect).'},
{id:'horn',label:'Control horn',info:'Lever arm of about 14 cm below the hinge. Longer horn = more surface travel per servo movement but less torque margin.'},
{id:'servo',label:'Servo & arm',info:'Underwing servo pod. The arm rotates to push or pull the rod; the servo solves the geometry live as you move the sliders.'},
{id:'rod',label:'Pushrod',info:'Fixed-length rod. Its geometry makes surface travel slightly non-linear vs servo angle.'}],
adjusters:[
{id:'pitch',label:'Pitch command',min:-100,max:100,value:0,unit:'%',sweep:1,hint:'+ = nose up (both elevons trailing edge up)'},
{id:'roll',label:'Roll command',min:-100,max:100,value:0,unit:'%',sweep:1,hint:'+ = roll right (right up, left down)'},
{id:'throw',label:'Max throw',min:5,max:35,value:25,unit:'°',hint:'Mechanical limit of each elevon'},
{id:'mix',label:'Roll mix gain',min:0,max:100,value:100,unit:'%',hint:'How much roll is mixed into the elevons'}],
build(THREE){
const G=new THREE.Group();
const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6,metalness:.1,side:THREE.DoubleSide},o));
const mW=M(0xd8d2c4,{transparent:true,opacity:.55}),mE=M(0xcf5f27,{transparent:true,opacity:.6}),mSp=M(0x555a63,{metalness:.5}),mR=M(0xe8c27a),mM=M(0xb8bcc4,{metalness:.8,roughness:.3}),mS=M(0x2b6cb0);
const tag=(o,id)=>{o.userData.part=id;return o};
const S=1.25,T=.07,x0=.12,teZ=x=>1-.1*x/S,hz=x=>teZ(x)-.3;
const H0=[x0,hz(x0)],H1=[S,hz(S)],dx=H1[0]-H0[0],dz=H1[1]-H0[1],Lh=Math.hypot(dx,dz),ux=dx/Lh,uz=dz/Lh;
const L=(x,z)=>{const a=x-H0[0],b=z-H0[1];return[a*ux+b*uz,-a*uz+b*ux]};
const slab=(pts,t)=>{const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));return new THREE.ExtrudeGeometry(s,{depth:t,bevelEnabled:false}).rotateX(Math.PI/2).translate(0,t/2,0)};
const hx=Lh*.45,P=[-.2,-.14],a=.1,B0=[P[0]+a*Math.cos(1.2),P[1]+a*Math.sin(1.2)],HT=[.04,-.14],rl=Math.hypot(B0[0]-HT[0],B0[1]-HT[1]);
G.userData.k={Lh,hx,P,a,B0,HT,rl,S:{}};
const mk=s=>{
 const H=new THREE.Group();H.scale.x=s;G.add(H);
 const wing=tag(new THREE.Mesh(slab([[0,0],[S,.55],[S,hz(S)],[x0,hz(x0)],[x0,teZ(x0)],[0,teZ(0)]],T),mW),'wing');wing.userData.ex=[0,.25,0];H.add(wing);
 const O=new THREE.Group();O.position.set(H0[0],0,H0[1]);O.rotation.y=-Math.atan2(dz,dx);O.userData.ex=[0,-.25,.2];H.add(O);
 const I=new THREE.Group();O.add(I);
 const te1=L(S,teZ(S)),te0=L(x0,teZ(x0));
 I.add(tag(new THREE.Mesh(slab([[0,0],[Lh,0],te1,te0],.05),mE),'elevon'));
 const sp=tag(new THREE.Mesh(new THREE.BoxGeometry(Lh,.04,.02),mSp),'spar');sp.position.set(Lh/2,0,.04);I.add(sp);
 const ch=.3*ux;for(let i=0;i<5;i++){const r=tag(new THREE.Mesh(new THREE.BoxGeometry(.012,.045,ch-.03),mR),'ribs');r.position.set(Lh*i/4+(i==0?.01:i==4?-.01:0),0,ch/2);I.add(r)}
 const pin=tag(new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,Lh,10).rotateZ(Math.PI/2),mM),'hinge');pin.position.x=Lh/2;O.add(pin);
 [.12,.5,.88].forEach(f=>{const b=tag(new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.06,12).rotateZ(Math.PI/2),mM),'hinge');b.position.x=Lh*f;O.add(b)});
 const horn=tag(new THREE.Mesh(new THREE.BoxGeometry(.015,.14,.03),mM),'horn');horn.position.set(hx,-.07,.04);I.add(horn);
 const sv=tag(new THREE.Mesh(new THREE.BoxGeometry(.05,.04,.08),mS),'servo');sv.position.set(hx,P[1],P[0]-.04);O.add(sv);
 const ar=tag(new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,1,8),mM),'servo'),rod=tag(new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,1,8),mR),'rod');O.add(ar,rod);
 G.userData.k.S[s]={I,ar,rod}};
mk(1);mk(-1);return G},
update(G,v,THREE){const k=G.userData.k,d=defl(v);
 [[1,d.R],[-1,d.L]].forEach(([s,dg])=>{const q=k.S[s],t=dg*Math.PI/180,c=Math.cos(t),n=Math.sin(t);q.I.rotation.x=t;
  const H=[k.HT[1]*n+.04*c,k.HT[1]*c-.04*n],B=arm(k.P,k.a,H,k.rl,k.B0),V=(z,y)=>new THREE.Vector3(k.hx,y,z);
  link(THREE,q.ar,V(k.P[0],k.P[1]),V(B[0],B[1])); link(THREE,q.rod,V(B[0],B[1]),V(H[0],H[1]))})},
readout(v){const d=defl(v),f=x=>Math.abs(x).toFixed(1)+'° '+(x<0?'TE up':x>0?'TE down':'neutral');
 return[['Right elevon',f(d.R)],['Left elevon',f(d.L)],['Effective pitch',(-(d.R+d.L)/2).toFixed(1)+'° (+ nose up)'],['Effective roll',((d.L-d.R)/2).toFixed(1)+'° (+ right)'],['Horn arc travel',(.14*Math.abs(d.R)*Math.PI/180*1000).toFixed(0)+' mm (right)'],['Mixer',d.sat?'⚠ saturated: command clipped':'OK']]}
}
