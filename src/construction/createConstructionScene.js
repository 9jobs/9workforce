import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const smooth = (a, b, p) => THREE.MathUtils.smoothstep(p, a, b);

/** A single persistent construction model. All motion is a pure function of scroll progress. */
export function createConstructionScene(host, onContextLost) {
  const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1 : 1.25));
  renderer.setClearColor(0x050f20, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = innerWidth >= 768;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050f20, .009);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 180);
  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const ownGeometry = geometry => { ownedGeometries.add(geometry); return geometry; };
  const material = (Type, options) => { const m = new Type(options); ownedMaterials.add(m); return m; };
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const concreteTexture = makeConcreteTexture();
  const concrete = material(THREE.MeshStandardMaterial, {color: 0xaaa99f, map: concreteTexture, roughness: .92, clippingPlanes: [clip], clipShadows: true});
  const timber = material(THREE.MeshStandardMaterial, {color: 0xb67f3e, roughness: .86});
  const dark = material(THREE.MeshStandardMaterial, {color: 0x182332, roughness: .8});
  const orange = material(THREE.MeshStandardMaterial, {color: 0xeb9b32, metalness: .25, roughness: .48});
  const glass = material(THREE.MeshStandardMaterial, {color: 0x80acbf, metalness: .6, roughness: .23});
  const wireMaterial = material(THREE.LineBasicMaterial, {color: 0x2c9cff, transparent: true, opacity: .9, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false});
  const planMaterial = material(THREE.LineBasicMaterial, {color: 0x38aaff, transparent: true, opacity: .8, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false});
  const scaffoldMaterial = material(THREE.LineBasicMaterial, {color: 0xb6a991, transparent: true, opacity: .85});
  const rebarMaterial = material(THREE.LineBasicMaterial, {color: 0x49433b});
  const craneLineMaterial = material(THREE.LineBasicMaterial, {color: 0xfbb352});

  const ambient = new THREE.HemisphereLight(0x9fcbff, 0x4b3526, 2.3);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffce94, 4.2);
  sun.position.set(-16, 28, 18);
  sun.castShadow = renderer.shadowMap.enabled;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {left: -25, right: 25, top: 25, bottom: -25, far: 90});
  sun.shadow.bias = -.0008;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x3999ff, 2);
  rim.position.set(14, 12, -15);
  scene.add(rim);

  function boxGeometry(w, h, d, x, y, z) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    return g;
  }
  function mergedMesh(parts, mat, parent = scene) {
    const geometry = ownGeometry(mergeGeometries(parts));
    parts.forEach(part => part.dispose());
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function box(w, h, d, x, y, z, mat, parent = scene) {
    const mesh = new THREE.Mesh(ownGeometry(boxGeometry(w, h, d, x, y, z)), mat);
    parent.add(mesh);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
  const segment = (array, a, b) => array.push(...a, ...b);
  function lines(points, mat, parent = scene) {
    const geometry = ownGeometry(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const mesh = new THREE.LineSegments(geometry, mat);
    parent.add(mesh);
    return mesh;
  }
  function rectangle(points, x1, z1, x2, z2, y = .035) {
    segment(points, [x1,y,z1],[x2,y,z1]); segment(points,[x2,y,z1],[x2,y,z2]);
    segment(points,[x2,y,z2],[x1,y,z2]); segment(points,[x1,y,z2],[x1,y,z1]);
  }

  // Architectural floor plan with double walls, circulation, door swings and dimension ticks.
  const planPoints = [];
  rectangle(planPoints,-10,-7,10,7);
  rectangle(planPoints,-9.65,-6.65,9.65,6.65);
  for (const x of [-8,-4,0,4,8]) {
    segment(planPoints,[x,.04,-6.6],[x,.04,6.6]);
    segment(planPoints,[x+.16,.04,-6.6],[x+.16,.04,6.6]);
    for(const z of [-5,0,5]) rectangle(planPoints,x-.38,z-.38,x+.38,z+.38,.07);
    segment(planPoints,[x,.04,7.7],[x,.04,9]);
    segment(planPoints,[x-.18,.04,8.35],[x+.18,.04,8.7]);
  }
  for (const z of [-5,-2.1,2.1,5]) {
    segment(planPoints,[-9.65,.04,z],[9.65,.04,z]);
    segment(planPoints,[-9.65,.04,z+.12],[9.65,.04,z+.12]);
  }
  segment(planPoints,[-9,.04,8.5],[9,.04,8.5]);
  rectangle(planPoints,-11.5,-8.5,11.5,10);
  for (let i=0;i<12;i++) segment(planPoints,[5,.06,-2+i*.34],[7,.06,-2+i*.34]);
  for (const x of [-7,-3,1]) for (const z of [-2,2]) {
    for (let j=0;j<12;j++) {
      const a=j/12*Math.PI/2, b=(j+1)/12*Math.PI/2;
      segment(planPoints,[x+Math.cos(a),.06,z+Math.sin(a)],[x+Math.cos(b),.06,z+Math.sin(b)]);
    }
  }
  const plan = lines(planPoints,planMaterial);
  const gridPoints=[];
  for(let i=-22;i<=22;i++) {
    segment(gridPoints,[i,0,-22],[i,0,22]);
    segment(gridPoints,[-22,0,i],[22,0,i]);
  }
  const gridMaterial=material(THREE.LineBasicMaterial,{color:0x17659e,transparent:true,opacity:.22,depthWrite:false});
  lines(gridPoints,gridMaterial);

  // The wireframe and concrete share identical floor/column geometry.
  const building = new THREE.Group();
  scene.add(building);
  const floors=[];
  const solidParts=[boxGeometry(19,.45,12,0,-.23,0)];
  for(let level=0;level<4;level++) {
    const parts=[boxGeometry(18,.32,11,0,3.15,0)];
    for(const x of [-8,-4,0,4,8]) for(const z of [-4.6,0,4.6]) {
      parts.push(boxGeometry(.58,3,.58,x,1.5,z));
      if(level===0) solidParts.push(boxGeometry(1.25,.4,1.25,x,.05,z));
    }
    // Substantial concrete edge beams, not an exposed steel structure.
    for (const z of [-4.6,0,4.6]) parts.push(boxGeometry(16.6,.5,.48,0,2.85,z));
    const g=mergeGeometries(parts);
    parts.forEach(part=>part.dispose());
    const edges=ownGeometry(new THREE.EdgesGeometry(g));
    const wire=new THREE.LineSegments(edges,wireMaterial);
    building.add(wire);
    floors.push({wire,base:level*3.2});
    g.translate(0,level*3.2,0);
    solidParts.push(g);
  }
  const solid=mergedMesh(solidParts,concrete,building);
  const steelPoints=[];
  for(const x of [-8,-4,0,4,8]) for(const z of [-4.6,4.6]) {
    for(const dx of [-.18,.18]) for(const dz of [-.18,.18]) segment(steelPoints,[x+dx,12.65,z+dz],[x+dx,14.5,z+dz]);
    for(let y=12.9;y<14.5;y+=.32) rectangle(steelPoints,x-.2,z-.2,x+.2,z+.2,y);
  }
  const rebar=lines(steelPoints,rebarMaterial,building);

  const site = new THREE.Group();
  scene.add(site);
  const earth=material(THREE.MeshStandardMaterial,{color:0x5f625d,roughness:1});
  box(32,.2,26,0,-.55,0,earth,site);
  const formParts=[];
  for(let level=1;level<=4;level++) for(let x=-8.4;x<=8.5;x+=1.25) {
    formParts.push(boxGeometry(.16,.22,11.8,x,level*3.2-.4,0));
  }
  for(let x=-8.5;x<9;x+=.8) formParts.push(boxGeometry(.72,.12,11.6,x,12.55,0));
  const formwork=mergedMesh(formParts,timber,site);
  const scaffoldPoints=[];
  for(const z of [-6.3,6.3]) {
    for(let x=-9.7;x<=9.8;x+=1.95) {
      segment(scaffoldPoints,[x,0,z],[x,13.7,z]);
      for(let y=1;y<=13;y+=3.2) {
        segment(scaffoldPoints,[x,y,z],[x+1.95,y,z]);
        segment(scaffoldPoints,[x,y+.6,z],[x+1.95,y+.6,z]);
        segment(scaffoldPoints,[x,y,z],[x+1.95,y+3.2,z]);
      }
    }
  }
  for(const x of [-9.7,9.8]) for(let z=-6.3;z<6;z+=2.1) {
    segment(scaffoldPoints,[x,0,z],[x,13.7,z]);
    for(let y=1;y<14;y+=3.2) segment(scaffoldPoints,[x,y,z],[x,y,z+2.1]);
  }
  const scaffolding=lines(scaffoldPoints,scaffoldMaterial,site);
  const stackParts=[];
  for(let i=0;i<6;i++) for(let j=0;j<3;j++) stackParts.push(boxGeometry(2.3,.21,.65,-5+j*2.5,.16+i*.25,9));
  mergedMesh(stackParts,concrete,site);
  const timberStack=[];
  for(let i=0;i<6;i++) timberStack.push(boxGeometry(4.2,.18,1.1,7,.1+i*.22,9.3));
  mergedMesh(timberStack,timber,site);

  // Tower crane: lattice mast, rotating jib, hanging cables and a lifted concrete panel.
  const crane=new THREE.Group();crane.position.set(12.3,0,-3);site.add(crane);
  const mast=[];
  for(const x of [-.48,.48]) for(const z of [-.48,.48]) segment(mast,[x,0,z],[x,21,z]);
  for(let y=0;y<21;y+=1.2) {
    rectangle(mast,-.48,-.48,.48,.48,y);
    for(const z of [-.48,.48]) segment(mast,[-.48,y,z],[.48,y+1.2,z]);
    for(const x of [-.48,.48]) segment(mast,[x,y,-.48],[x,y+1.2,.48]);
  }
  lines(mast,craneLineMaterial,crane);
  box(2,.6,2,0,.1,0,concrete,crane);
  const jib=new THREE.Group();jib.position.y=19.5;crane.add(jib);
  const truss=[];
  for(const y of [0,.9]) for(const z of [-.4,.4]) segment(truss,[-18,y,z],[5,y,z]);
  for(let x=-18;x<5;x+=1.15) {
    segment(truss,[x,0,-.4],[x+.575,.9,-.4]);segment(truss,[x+.575,.9,-.4],[x+1.15,0,-.4]);
    segment(truss,[x,0,.4],[x+.575,.9,.4]);segment(truss,[x+.575,.9,.4],[x+1.15,0,.4]);
    segment(truss,[x,.9,-.4],[x,.9,.4]);
  }
  segment(truss,[-15,.9,0],[0,3.2,0]);segment(truss,[0,3.2,0],[5,.9,0]);segment(truss,[0,.9,0],[0,3.2,0]);
  lines(truss,craneLineMaterial,jib);
  box(1.5,1.2,1.15,-.8,-.25,.5,orange,jib);
  box(1.05,.7,.05,-.8,-.1,1.09,glass,jib);
  box(2,1.3,1.1,3.7,.5,0,dark,jib);
  const load=new THREE.Group();load.position.x=-8;jib.add(load);
  lines([0,0,0,0,-4,0, 0,-4,0,-1,-5,0, 0,-4,0,1,-5,0],rebarMaterial,load);
  box(3,.65,1.6,0,-5.2,0,concrete,load);

  // Small excavator gives the site recognizable machinery and scroll-driven activity.
  const excavator=new THREE.Group();excavator.position.set(-12,0,6.5);excavator.rotation.y=.3;site.add(excavator);
  box(3,.55,.65,0,.25,-.8,dark,excavator);box(3,.55,.65,0,.25,.8,dark,excavator);
  box(2.5,.65,1.6,0,.8,0,orange,excavator);box(1.05,1.35,1.25,.55,1.6,0,glass,excavator);
  box(1.2,.12,1.5,.55,2.3,0,orange,excavator);
  const boom=new THREE.Group();boom.position.set(-.7,1.1,0);excavator.add(boom);
  function machineArm(a,b,thickness,mat) {
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);
    const mesh=box(thickness,start.distanceTo(end),thickness,0,0,0,mat,boom);
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());
  }
  machineArm([0,0,0],[-1.5,2.8,0],.34,orange);
  machineArm([-1.5,2.8,0],[-3.1,.2,0],.27,orange);
  machineArm([-.2,.3,.23],[-1.2,2.2,.23],.1,dark);
  box(.9,.65,1.1,-3.1,-.05,0,dark,boom);

  // Reveal full-size equipment upwards instead of vertically squashing the entire site.
  const siteClip=new THREE.Plane(new THREE.Vector3(0,-1,0),-.6);
  const siteMaterials=new Map();
  site.traverse(object=>{
    if(!object.material)return;
    const original=object.material;
    if(!siteMaterials.has(original)) {
      const copy=original.clone();
      copy.clippingPlanes=[siteClip];copy.clipShadows=true;
      ownedMaterials.add(copy);siteMaterials.set(original,copy);
    }
    object.material=siteMaterials.get(original);
  });

  let width=1,height=1,lastProgress=0,disposed=false;
  const target=new THREE.Vector3();
  function render(p) {
    if(disposed) return;
    lastProgress=p;
    // Once the photographic site fills the screen no hidden GPU renders are needed.
    if(p>.69) return;
    const rise=smooth(.11,.32,p);
    const physical=smooth(.31,.53,p);
    const active=smooth(.43,.59,p);
    const glow=1-smooth(.28,.43,p);
    // Alpha-backed canvas allows a cheap screen-space halo without a bloom render pipeline.
    const halo=glow>.01?`drop-shadow(0 0 ${width<768?3:4}px rgba(24,142,255,${Math.round(glow*17)/20}))`:'none';
    if(renderer.domElement.style.filter!==halo)renderer.domElement.style.filter=halo;
    plan.geometry.setDrawRange(0,Math.floor(planPoints.length/6*smooth(0,.115,p))*2);
    planMaterial.opacity=(1-smooth(.31,.5,p))*.85;
    gridMaterial.opacity=.22*(1-physical*.75);
    floors.forEach(({wire,base},index)=>{
      const growth=smooth(.105+index*.027,.23+index*.027,p);
      wire.position.y=base*growth;
      wire.scale.y=Math.max(.001,growth);
      wire.visible=p>.1;
    });
    wireMaterial.opacity=.9*(1-smooth(.4,.58,p));
    clip.constant=-.6+physical*16;
    solid.visible=p>.305;
    rebar.visible=p>.47;
    site.visible=p>.405;
    siteClip.constant=-.6+active*26;
    formwork.visible=p>.45;
    scaffolding.visible=p>.475;
    jib.rotation.y=-.12+smooth(.46,.66,p)*.45;
    load.position.y=smooth(.53,.66,p)*1.8;
    excavator.position.x=-12+active*1.3;
    boom.rotation.z=-.15+smooth(.48,.65,p)*.2;
    const angle=.3+smooth(.1,.66,p)*.8;
    const close=smooth(.32,.44,p)*(1-smooth(.47,.6,p));
    const framing=Math.max(1,1.05/(width/height));
    const radius=(40-rise*7-close*6+active*15)*framing;
    camera.position.set(Math.sin(angle)*radius,(36-rise*18-close*3+active*4)*Math.sqrt(framing),Math.cos(angle)*radius);
    target.set(0,rise*5.3+active*2,0);
    camera.lookAt(target);
    // Space for HTML copy on desktop; place the model beneath the copy on mobile.
    camera.setViewOffset(width,height,width<768?0:-width*(.19-active*.11),width<768?-height*.17:0,width,height);
    rim.intensity=2*(1-physical*.65);
    sun.intensity=1.8+physical*2.4;
    renderer.render(scene,camera);
  }
  const resize=new ResizeObserver(entries=>{
    const rect=entries[0].contentRect;
    width=Math.max(1,rect.width);height=Math.max(1,rect.height);
    renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();
    render(lastProgress);
  });
  resize.observe(host);
  const lost=event=>{event.preventDefault();onContextLost();};
  renderer.domElement.addEventListener('webglcontextlost',lost);
  return {
    render,
    dispose() {
      if(disposed)return;
      disposed=true;
      resize.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost',lost);
      ownedGeometries.forEach(g=>g.dispose());
      ownedMaterials.forEach(m=>m.dispose());
      concreteTexture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

function makeConcreteTexture() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');
  const pixels=ctx.createImageData(256,256);
  let seed=73;
  for(let i=0;i<pixels.data.length;i+=4) {
    seed=(seed*1664525+1013904223)>>>0;
    const value=178+(seed%43);
    pixels.data[i]=value;pixels.data[i+1]=value;pixels.data[i+2]=value-4;pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  ctx.strokeStyle='#6f706a35';ctx.lineWidth=1;
  for(let y=0;y<256;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}
  ctx.fillStyle='#6f706a55';
  for(let x=24;x<256;x+=64)for(let y=24;y<256;y+=64){ctx.beginPath();ctx.arc(x,y,1.3,0,Math.PI*2);ctx.fill();}
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  return texture;
}
