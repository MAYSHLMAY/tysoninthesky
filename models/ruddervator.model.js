/* flight-recall-model */
// Ruddervator on a V-tail. Units: 1 = 1 m. Nose points toward -Z, right is +X.
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const link=(T,m,a,b)=>{const d=b.clone().sub(a);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=d.length();m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize())};
const arm=(P,a,H,r,B0)=>{const dx=H[0]-P[0],dy=H[1]-P[1],d=Math.hypot(dx,dy),x=(a*a-r*r+d*d)/(2*d),h=Math.sqrt(Math.max(a*a-x*x,0)),ux=dx/d,uy=dy/d,mx=P[0]+ux*x,my=P[1]+uy*x;
  return [[mx-uy*h,my+ux*h],[mx+uy*h,my-ux*h]].sort((p,q)=>Math.hypot(p[0]-B0[0],p[1]-B0[1])-Math.hypot(q[0]-B0[0],q[1]-B0[1]))[0]};
const defl=v=>{const r=-v.pitch+v.yaw,l=-v.pitch-v.yaw,k=v.throw/100;
  return{R:clamp(r,-100,100)*k,L:clamp(l,-100,100)*k,sat:Math.abs(r)>100||Math.abs(l)>100}};
export default {
name:'Ruddervator (V-Tail)', category:'Control Surfaces', sub:'Ruddervators',
info:'A V-tail replaces the horizontal and vertical tail with two panels tilted up in a V. Each trailing-edge surface is a ruddervator doing both elevator and rudder work. Both surfaces moving the same way gives pitch; opposite gives yaw. The panel dihedral angle splits the authority: pitch effect scales with cos(angle), yaw effect with sin(angle). Positive deflection = trailing edge down. Mixing pitch into yaw makes V-tails prone to adverse yaw-roll coupling.',
parts:[
{id:'boom',label:'Tail boom',info:'Fuselage stub carrying the V-tail. Nose points toward -Z.'},
{id:'fin',label:'Fixed stabilizer',info:'The fixed forward part of each V panel. Provides stability the way a fixed stabilizer and fin would.'},
{id:'rv',label:'Ruddervator skin',info:'Moving trailing-edge surface, about 40% of local chord. Shown semi-transparent.'},
{id:'spar',label:'Spar',info:'Stiffens the surface and carries the hinge and horn loads.'},
{id:'ribs',label:'Ribs',info:'Keep the airfoil shape and spread the horn load.'},
{id:'hinge',label:'Hinge line & pin',info:'Straight hinge across each panel, parallel to the panel span, not to the ground, so the hinge tilts with the V angle.'},
{id:'horn',label:'Control horn',info:'Lever arm of 12 cm on the underside of the panel.'},
{id:'servo',label:'Servo & arm',info:'Each panel has its own servo. Two servos plus a mixer are required: the V-tail cannot work with one servo per axis.'},
{id:'rod',label:'Pushrod',info:'Fixed-length link; the servo arm solves its angle live.'}],
adjusters:[
{id:'pitch',label:'Pitch command',min:-100,max:100,value:0,unit:'%',sweep:1,hint:'+ = nose up (both surfaces trailing edge up)'},
{id:'yaw',label:'Yaw command',min:-100,max:100,value:0,unit:'%',sweep:1,hint:'+ = nose right (right surface down, left up)'},
{id:'throw',label:'Max throw',min:5,max:40,value:25,unit:'°',hint:'Mechanical limit of each ruddervator'},
{id:'vang',label:'V-tail dihedral',min:20,max:60,value:40,unit:'°',hint:'Tilt of each panel from horizontal'}],
build(THREE){
const G=new THREE.Group(),M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6,metalness:.1,side:THREE.DoubleSide},o));
const mB=M(0x8a8f99),mF=M(0xd8d2c4,{transparent:true,opacity:.55}),mE=M(0xcf5f27,{transparent:true,opacity:.6}),mSp=M(0x555a63,{metalness:.5}),mR=M(0xe8c27a),mM=M(0xb8bcc4,{metalness:.8,roughness:.3}),mS=M(0x2b6cb0);
const tag=(o,id)=>{o.userData.part=id;return o};
const slab=(pts,t)=>{const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));return new THREE.ExtrudeGeometry(s,{depth:t,bevelEnabled:false}).rotateX(Math.PI/2).translate(0,t/2,0)};
const boom=tag(new THREE.Mesh(new THREE.CylinderGeometry(.06,.035,1.5,20).rotateX(Math.PI/2),mB),'boom');boom.position.z=.5;G.add(boom);
const S=.7,hz=.19,Lh=S,P=[-.17,-.12],a=.09,B0=[P[0]+a*Math.cos(1.2),P[1]+a*Math.sin(1.2)],HT=[.03,-.12],hx=.3,rl=Math.hypot(B0[0]-HT[0],B0[1]-HT[1]);
G.userData.k={P,a,B0,HT,rl,hx,S:{}};
const mk=s=>{
 const W=new THREE.Group();W.position.set(s*.05,0,1.0);W.scale.x=s;G.add(W);
 const fin=tag(new THREE.Mesh(slab([[0,0],[S,.1],[S,hz],[0,hz]],.05),mF),'fin');fin.userData.ex=[0,.2,0];W.add(fin);
 const O=new THREE.Group();O.position.set(0,0,hz);O.userData.ex=[0,-.2,.2];W.add(O);const I=new THREE.Group();O.add(I);
 I.add(tag(new THREE.Mesh(slab([[0,0],[S,0],[S,.32-hz],[0,.35-hz]],.04),mE),'rv'));
 const sp=tag(new THREE.Mesh(new THREE.BoxGeometry(S,.035,.02),mSp),'spar');sp.position.set(S/2,0,.03);I.add(sp);
 for(let i=0;i<5;i++){const r=tag(new THREE.Mesh(new THREE.BoxGeometry(.012,.04,.12),mR),'ribs');r.position.set(S*i/4+(i==0?.01:i==4?-.01:0),0,.08);I.add(r)}
 const pin=tag(new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,S,10).rotateZ(Math.PI/2),mM),'hinge');pin.position.x=S/2;O.add(pin);
 [.12,.5,.88].forEach(f=>{const b=tag(new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.05,12).rotateZ(Math.PI/2),mM),'hinge');b.position.x=S*f;O.add(b)});
 const horn=tag(new THREE.Mesh(new THREE.BoxGeometry(.012,.12,.025),mM),'horn');horn.position.set(hx,-.06,.03);I.add(horn);
 const sv=tag(new THREE.Mesh(new THREE.BoxGeometry(.045,.035,.07),mS),'servo');sv.position.set(hx,P[1],P[0]-.035);O.add(sv);
 const ar=tag(new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,1,8),mM),'servo'),rod=tag(new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,1,8),mR),'rod');O.add(ar,rod);
 G.userData.k.S[s]={W,I,ar,rod}};
mk(1);mk(-1);return G},
update(G,v,THREE){const k=G.userData.k,d=defl(v);
 [[1,d.R],[-1,d.L]].forEach(([s,dg])=>{const q=k.S[s],t=dg*Math.PI/180,c=Math.cos(t),n=Math.sin(t);q.W.rotation.z=s*v.vang*Math.PI/180;q.I.rotation.x=t;
  const H=[k.HT[1]*n+k.HT[0]*c,k.HT[1]*c-k.HT[0]*n],B=arm(k.P,k.a,H,k.rl,k.B0),V=(z,y)=>new THREE.Vector3(k.hx,y,z);
  link(THREE,q.ar,V(k.P[0],k.P[1]),V(B[0],B[1]));link(THREE,q.rod,V(B[0],B[1]),V(H[0],H[1]))})},
readout(v){const d=defl(v),g=v.vang*Math.PI/180,f=x=>Math.abs(x).toFixed(1)+'° '+(x<0?'TE up':x>0?'TE down':'neutral');
 return[['Right surface',f(d.R)],['Left surface',f(d.L)],['Effective elevator',(-(d.R+d.L)/2*Math.cos(g)).toFixed(1)+'° (+ nose up)'],['Effective rudder',((d.R-d.L)/2*Math.sin(g)).toFixed(1)+'° (+ nose right)'],['Pitch / yaw area share',(Math.cos(g)**2*100).toFixed(0)+'% / '+(Math.sin(g)**2*100).toFixed(0)+'%'],['Mixer',d.sat?'⚠ saturated: command clipped':'OK']]}
}
