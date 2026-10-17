import * as THREE from 'three';

export function createAccountScene(host){
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-6,6,5,-5,.1,60);
  camera.position.set(10,7.6,12);camera.lookAt(0,1.8,0);
  const geometries=new Set(),materials=new Set();
  const geometry=g=>{geometries.add(g);return g;};
  const material=m=>{materials.add(m);return m;};
  const blue=material(new THREE.LineBasicMaterial({color:0x29baff,transparent:true,opacity:.86}));
  const cyan=material(new THREE.LineBasicMaterial({color:0x79eaff,transparent:true,opacity:.95}));
  const faint=material(new THREE.LineBasicMaterial({color:0x168ed0,transparent:true,opacity:.3}));
  const amber=material(new THREE.LineBasicMaterial({color:0xf2842f,transparent:true,opacity:.9}));
  const root=new THREE.Group();scene.add(root);
  function line(points,mat=blue,parent=root){const g=geometry(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))));const l=new THREE.Line(g,mat);parent.add(l);return l;}
  function wireBox(w,h,d,x,y,z,parent=root,mat=blue){
    const box=geometry(new THREE.BoxGeometry(w,h,d));
    const edge=geometry(new THREE.EdgesGeometry(box));
    const lines=new THREE.LineSegments(edge,mat);lines.position.set(x,y,z);parent.add(lines);
    return lines;
  }
  const grid=new THREE.GridHelper(14,28,0x217fb5,0x12456a);grid.position.y=-.16;grid.material.transparent=true;grid.material.opacity=.5;
  geometries.add(grid.geometry);materials.add(grid.material);root.add(grid);
  line([[-3.65,-.05,-2.65],[3.65,-.05,-2.65],[3.65,-.05,2.65],[-3.65,-.05,2.65],[-3.65,-.05,-2.65]],faint);
  // Edge geometry, rather than triangulated wireframe faces, keeps the model
  // architectural: columns, perimeter beams, slabs and secondary floor joists.
  const levels=[];
  for(let floor=0;floor<4;floor++){
    const group=new THREE.Group();root.add(group);group.position.y=floor*1.45;levels.push(group);
    wireBox(6.4,.12,4.5,0,0,0,group,cyan);
    for(const z of [-2.12,2.12])wireBox(6.1,.17,.12,0,-.13,z,group);
    for(const x of [-3.05,3.05])wireBox(.12,.17,4.2,x,-.13,0,group);
    for(let x=-2.5;x<=2.5;x+=.5)line([[x,0,-2.15],[x,0,2.15]],faint,group);
    if(floor<3)for(const x of [-2.95,-1,1,2.95])for(const z of [-2.05,0,2.05]){
      wireBox(.16,1.45,.16,x,.725,z,group);
      wireBox(.26,.12,.26,x,.11,z,group,cyan);
    }
    const surface=material(new THREE.MeshBasicMaterial({color:0x1798e4,transparent:true,opacity:.025,depthWrite:false,side:THREE.DoubleSide}));
    const slab=new THREE.Mesh(geometry(new THREE.PlaneGeometry(6.35,4.45)),surface);slab.rotation.x=-Math.PI/2;group.add(slab);
  }
  // Technical ground markings and warm corner accents anchor the blue model.
  for(const x of [-3.6,3.6])for(const z of [-2.6,2.6]){
    line([[x,0,z+.2],[x,0,z],[x+.2*(x<0?1:-1),0,z]],amber);
  }
  line([[-3.6,-.02,3.1],[3.6,-.02,3.1]],faint);
  for(const x of [-3.6,0,3.6])line([[x,-.02,2.95],[x,-.02,3.25]],cyan);
  const scan=new THREE.Group();root.add(scan);
  line([[-3.25,0,-2.32],[3.25,0,-2.32],[3.25,0,2.32],[-3.25,0,2.32],[-3.25,0,-2.32]],cyan,scan);
  const scanMat=material(new THREE.MeshBasicMaterial({color:0x19b8ff,transparent:true,opacity:.045,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
  const plate=new THREE.Mesh(geometry(new THREE.PlaneGeometry(6.5,4.64)),scanMat);plate.rotation.x=-Math.PI/2;scan.add(plate);
  const nodeGeometry=geometry(new THREE.SphereGeometry(.035,6,5));
  const nodeMat=material(new THREE.MeshBasicMaterial({color:0x96eeff}));
  for(const x of [-2.95,2.95])for(const z of [-2.05,2.05]){const node=new THREE.Mesh(nodeGeometry,nodeMat);node.position.set(x,0,z);scan.add(node);}
  // A lattice tower crane shares the blueprint palette, with warm safety accents.
  const crane=new THREE.Group();crane.position.set(-4.15,0,-.7);root.add(crane);
  wireBox(1,.18,1,0,.02,0,crane,cyan);
  for(const x of [-.28,.28])for(const z of [-.28,.28])line([[x,.1,z],[x,6.35,z]],amber,crane);
  for(let y=.2;y<6.1;y+=.55){
    wireBox(.56,.035,.56,0,y,0,crane,amber);
    for(const z of [-.28,.28])line([[-.28,y,z],[.28,y+.55,z]],amber,crane);
    for(const x of [-.28,.28])line([[x,y,-.28],[x,y+.55,.28]],amber,crane);
  }
  const jib=new THREE.Group();jib.position.y=6.25;crane.add(jib);
  wireBox(6.4,.28,.42,1.55,0,0,jib,amber);
  for(let x=-1.6;x<4.6;x+=.4){
    line([[x,-.14,-.21],[x+.4,.14,-.21],[x+.4,-.14,-.21]],amber,jib);
    line([[x,-.14,.21],[x+.4,.14,.21],[x+.4,-.14,.21]],amber,jib);
  }
  line([[0,.15,0],[0,1.05,0],[4.65,.15,0]],cyan,jib);
  line([[0,1.05,0],[-1.6,.15,0]],cyan,jib);
  wireBox(.58,.58,.55,.1,-.48,.42,jib,cyan);
  wireBox(.85,.45,.65,-1.15,-.35,0,jib,blue);
  const trolley=new THREE.Group();jib.add(trolley);
  wireBox(.3,.18,.56,0,-.2,0,trolley,cyan);
  const cable=new THREE.Group();trolley.add(cable);
  line([[0,-.3,0],[0,-1.65,0]],cyan,cable);
  line([[0,-1.65,0],[.11,-1.76,0],[.11,-1.89,0],[0,-1.96,0],[-.09,-1.88,0]],amber,cable);
  wireBox(.8,.16,.46,0,-2.12,0,cable,amber);
  for(const x of [-.35,.35])line([[0,-1.96,0],[x,-2.04,0]],faint,cable);
  // Opaque, softly lit figures stay readable against the transparent structure.
  scene.add(new THREE.HemisphereLight(0xd9f3ff,0x173151,2.4));
  const keyLight=new THREE.DirectionalLight(0xffffff,2.2);keyLight.position.set(-3,8,6);scene.add(keyLight);
  const crewMaterial=color=>material(new THREE.MeshStandardMaterial({color,roughness:.75,metalness:.05}));
  const safety=crewMaterial(0xf2842f),helmetMat=crewMaterial(0xffcf68);
  const workerBody=crewMaterial(0x285376),skin=crewMaterial(0xdba881),boots=crewMaterial(0x101f31),reflective=crewMaterial(0xd7f5f5);
  function solidBox(w,h,d,x,y,z,parent,mat){const mesh=new THREE.Mesh(geometry(new THREE.BoxGeometry(w,h,d)),mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
  const jointGeometry=geometry(new THREE.SphereGeometry(1,10,8));
  const limbGeometry=geometry(new THREE.CylinderGeometry(1,1,1,8));
  function sphere(radius,x,y,z,parent,mat){const mesh=new THREE.Mesh(jointGeometry,mat);mesh.scale.setScalar(radius);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
  function segment(radius,length,y,parent,mat){const mesh=new THREE.Mesh(limbGeometry,mat);mesh.scale.set(radius,length,radius);mesh.position.y=y;parent.add(mesh);}
  function worker(x,y,z){
    const person=new THREE.Group();person.position.set(x,y,z);root.add(person);
    person.scale.setScalar(1.13);
    solidBox(.23,.29,.15,0,.57,0,person,safety);
    for(const side of [-1,1])solidBox(.025,.27,.157,side*.068,.57,0,person,reflective);
    solidBox(.235,.027,.158,0,.49,0,person,reflective);
    sphere(.085,0,.79,0,person,skin);
    const helmet=new THREE.Mesh(geometry(new THREE.SphereGeometry(.108,12,8,0,Math.PI*2,0,Math.PI/2)),helmetMat);helmet.position.y=.82;person.add(helmet);
    const brim=new THREE.Mesh(geometry(new THREE.CylinderGeometry(.13,.13,.025,16)),helmetMat);brim.position.y=.82;person.add(brim);
    const limbs=[];
    for(const side of [-1,1]){
      const leg=new THREE.Group();leg.position.set(side*.068,.43,0);person.add(leg);
      segment(.047,.19,-.095,leg,workerBody);sphere(.046,0,-.19,0,leg,workerBody);
      const shin=new THREE.Group();shin.position.y=-.19;leg.add(shin);
      segment(.039,.17,-.085,shin,workerBody);
      solidBox(.095,.065,.15,0,-.175,.025,shin,boots);limbs.push(leg);
      const arm=new THREE.Group();arm.position.set(side*.155,.69,0);person.add(arm);
      sphere(.05,0,0,0,arm,workerBody);segment(.04,.15,-.075,arm,workerBody);
      const elbow=new THREE.Group();elbow.position.y=-.15;elbow.rotation.x=-.22;arm.add(elbow);
      sphere(.038,0,0,0,elbow,workerBody);segment(.032,.13,-.065,elbow,workerBody);
      sphere(.038,0,-.15,0,elbow,skin);arm.rotation.z=side*.1;limbs.push(arm);
      leg.userData.shin=shin;
    }
    return {person,limbs,x,y,z};
  }
  const crew=[worker(-1.7,.13,2.8),worker(2.15,.13,2.85),worker(1.25,2.99,2.1)];
  host.dataset.crew=String(crew.length);host.dataset.crane='true';
  let frame=0,last=0,time=7,visible=true;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const ease=t=>1-Math.pow(1-t,3);
  function render(){
    const phase=time%20;
    const cycle=preference.matches?9:phase;
    levels.forEach((group,index)=>{
      const p=THREE.MathUtils.clamp((cycle-index*.72)/1.25,0,1);
      group.visible=p>0;
      group.position.y=index*1.45+(1-ease(p))*1.4;
      group.scale.y=Math.max(.02,ease(p));
    });
    root.rotation.y=-.12+Math.sin(time*.18)*.33;
    scan.position.y=(Math.sin(time*.8)+1)*2.25;
    scanMat.opacity=.035+Math.sin(time*.8)*.015;
    jib.rotation.y=Math.sin(time*.25)*.16;
    trolley.position.x=2.2+Math.sin(time*.45)*1.1;
    cable.scale.y=1+Math.sin(time*.65)*.22;
    crew.forEach(({person,limbs,x,z},index)=>{
      const walk=index===0?Math.sin(time*.5):0;
      person.position.x=x+walk*.5;
      person.position.z=z;
      person.rotation.y=index===0?Math.atan2(Math.cos(time*.5),.25):-.5;
      const walking=Math.abs(Math.cos(time*.5));
      limbs.forEach((limb,i)=>{
        const stride=Math.sin(time*3+([0,3].includes(i)?0:Math.PI));
        limb.rotation.x=index===0?stride*(i%2?.25:.32)*walking:Math.sin(time*1.2+index)*.035;
        if(limb.userData.shin)limb.userData.shin.rotation.x=index===0?Math.max(0,-stride)*.3*walking:0;
      });
      if(index===1){limbs[3].rotation.z=-2.35;limbs[3].rotation.x=Math.sin(time*1.4)*.15;}
      if(index===2){person.visible=levels[2].visible;person.position.y=levels[2].position.y+.09;}
    });
    renderer.render(scene,camera);
    host.dataset.progress=scan.position.y.toFixed(4);
  }
  function animate(now){frame=0;if(!visible||document.hidden||preference.matches){host.dataset.motion='paused';return;}if(!last)last=now;if(now-last>=32){time+=Math.min(now-last,100)/1000;last=now;render();}frame=requestAnimationFrame(animate);}
  function sync(){cancelAnimationFrame(frame);last=0;const active=visible&&!document.hidden&&!preference.matches;host.dataset.motion=active?'running':'paused';if(active)frame=requestAnimationFrame(animate);else render();}
  function resize(){
    const {width,height}=host.getBoundingClientRect();
    if(width<=0||height<=0)return;
    const aspect=width/height;
    camera.lookAt(-.6,3,0);camera.updateMatrixWorld(true);
    // Fit the full crane, including the mast tip and its rotation envelope.
    // The decorative ground grid can extend beyond this architectural frame.
    const bounds=new THREE.Box3();
    const point=new THREE.Vector3(),axis=new THREE.Vector3(0,1,0);
    for(const yaw of [-.45,0,.21])for(const x of [-5,3.8])for(const y of [-.25,7.45])for(const z of [-3.3,3.3]){
      point.set(x,y,z).applyAxisAngle(axis,yaw).applyMatrix4(camera.matrixWorldInverse);
      bounds.expandByPoint(point);
    }
    const center=bounds.getCenter(new THREE.Vector3());
    const halfHeight=Math.max((bounds.max.y-bounds.min.y)/2,(bounds.max.x-bounds.min.x)/2/aspect)*1.08;
    camera.left=center.x-halfHeight*aspect;camera.right=center.x+halfHeight*aspect;
    camera.top=center.y+halfHeight;camera.bottom=center.y-halfHeight;
    camera.updateProjectionMatrix();renderer.setSize(width,height,false);render();
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});intersection.observe(host);
  const lost=event=>{event.preventDefault();visible=false;cancelAnimationFrame(frame);host.dataset.motion='paused';host.dataset.renderer='fallback';};
  renderer.domElement.addEventListener('webglcontextlost',lost);
  preference.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  host.dataset.renderer='webgl';host.dataset.style='blueprint';resize();sync();
  return()=>{cancelAnimationFrame(frame);resizeObserver.disconnect();intersection.disconnect();preference.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);renderer.domElement.removeEventListener('webglcontextlost',lost);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();renderer.dispose();renderer.domElement.remove();};
}
