// ── Label sprite (always faces camera) ──────────────────────────────────────
function makeLabel(text, color = '#ffffff', bg = 'rgba(10,12,20,0.85)') {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 52;
  const ctx = cv.getContext('2d');
  const r = 26;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(r, r, r, Math.PI / 2, -Math.PI / 2);
  ctx.arc(256 - r, r, r, -Math.PI / 2, Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 17px "Segoe UI",Arial,sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 26);
  const tex = new THREE.CanvasTexture(cv);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(1.9, 0.38, 1);
  sp.renderOrder = 999;
  return sp;
}

// Mark meshes with a partId for raycasting
function tag(mesh, id) { mesh.userData.partId = id; return mesh; }
function tagAll(meshes, id) { meshes.forEach(m => tag(m, id)); return meshes; }

// ── Shared scene builder ─────────────────────────────────────────────────────
const ModelBuilder = {

  createScene(canvas, colors) {
    const w = canvas.offsetWidth || 800;
    const h = canvas.offsetHeight || 440;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 7);

    scene.add(new THREE.AmbientLight(0x404040, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 8, 5);
    scene.add(dir);

    const pt = new THREE.PointLight(new THREE.Color(colors.primary), 1.8, 18);
    pt.position.set(-3, 2, 4);
    scene.add(pt);

    const controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.7;
    controls.minDistance = 2.5;
    controls.maxDistance = 14;

    return { renderer, scene, camera, controls, pointLight: pt };
  },

  mat(col, emit, ei = 0.3, extra = {}) {
    return new THREE.MeshPhongMaterial({
      color: new THREE.Color(col),
      emissive: new THREE.Color(emit || col),
      emissiveIntensity: ei,
      shininess: 70,
      ...extra
    });
  },

  // ── NEURAL NETWORK (AI) ────────────────────────────────────────────────────
  neural(colors) {
    const group = new THREE.Group();
    const LAYERS = [
      { count: 3, label: 'Input Layer', labelTH: 'รับข้อมูล', col: '#66bb6a' },
      { count: 5, label: 'Hidden 1',    labelTH: 'ซ่อน 1',    col: colors.primary },
      { count: 5, label: 'Hidden 2',    labelTH: 'ซ่อน 2',    col: colors.primary },
      { count: 3, label: 'Output Layer',labelTH: 'ผลลัพธ์',   col: '#ffa726' }
    ];
    const nodeMap = [];
    LAYERS.forEach((layer, li) => {
      const x = (li - (LAYERS.length - 1) / 2) * 1.7;
      const nodes = [];
      for (let n = 0; n < layer.count; n++) {
        const y = (n - (layer.count - 1) / 2) * 0.85;
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.19, 16, 16),
          this.mat(layer.col, layer.col, 0.45)
        );
        m.position.set(x, y, 0);
        tag(m, li);
        group.add(m);
        nodes.push(m);
      }
      nodeMap.push(nodes);
      // Label above layer
      const lbl = makeLabel(layer.labelTH, layer.col);
      lbl.position.set(x, (layer.count / 2) * 0.85 + 0.55, 0);
      group.add(lbl);
    });

    // Connections
    const lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(colors.primary), transparent: true, opacity: 0.18 });
    for (let li = 0; li < LAYERS.length - 1; li++) {
      nodeMap[li].forEach(from => {
        nodeMap[li + 1].forEach(to => {
          const geo = new THREE.BufferGeometry().setFromPoints([from.position.clone(), to.position.clone()]);
          group.add(new THREE.Line(geo, lineMat));
        });
      });
    }

    // Particles that travel along connections
    const particles = [];
    nodeMap.forEach((layerNodes, li) => {
      if (li >= LAYERS.length - 1) return;
      layerNodes.forEach(from => {
        nodeMap[li + 1].forEach(to => {
          if (Math.random() > 0.45) return;
          const p = new THREE.Mesh(
            new THREE.SphereGeometry(0.055, 8, 8),
            this.mat('#ffffff', '#ffffff', 1.0, { transparent: true, opacity: 0.9 })
          );
          group.add(p);
          particles.push({ mesh: p, from: from.position, to: to.position, t: Math.random(), speed: 0.4 + Math.random() * 0.4 });
        });
      });
    });

    group.userData.parts = [
      { id: 0, nameTH: 'Input Layer — ชั้นรับข้อมูล', name: 'Input Layer', descTH: 'รับข้อมูลดิบเข้าสู่เครือข่าย เช่น รูปภาพ ข้อความ เสียง แต่ละ neuron แทนค่าหนึ่งตัวแปร', desc: 'Receives raw data such as pixels, words, or sensor values.' },
      { id: 1, nameTH: 'Hidden Layer 1 — ค้นหาแพทเทิร์น', name: 'Hidden Layer 1', descTH: 'เรียนรู้ลักษณะเฉพาะระดับต่ำ เช่น ขอบ สี รูปทรงเบื้องต้น', desc: 'Learns low-level features like edges, textures and basic shapes.' },
      { id: 2, nameTH: 'Hidden Layer 2 — สังเคราะห์ข้อมูล', name: 'Hidden Layer 2', descTH: 'รวมแพทเทิร์นย่อยเป็นลักษณะที่ซับซ้อนขึ้น เช่น ใบหน้า วัตถุ', desc: 'Combines simple features into complex abstract representations.' },
      { id: 3, nameTH: 'Output Layer — ผลลัพธ์', name: 'Output Layer', descTH: 'แสดงผลการตัดสินใจ เช่น "แมว 92%" หรือค่าที่ทำนาย', desc: 'Outputs the prediction or classification result.' }
    ];

    group.userData.animate = (t) => {
      particles.forEach(p => {
        p.t += p.speed * 0.006;
        if (p.t > 1) p.t = 0;
        p.mesh.position.lerpVectors(p.from, p.to, p.t);
        p.mesh.material.opacity = Math.sin(p.t * Math.PI) * 0.9;
      });
      nodeMap.flat().forEach((n, i) => {
        n.material.emissiveIntensity = 0.3 + 0.35 * Math.abs(Math.sin(t * 0.002 + i * 0.6));
      });
    };
    return group;
  },

  // ── QUANTUM COMPUTER (Bloch Sphere) ───────────────────────────────────────
  quantum(colors) {
    const group = new THREE.Group();

    // Bloch sphere (wireframe)
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 16, 16),
      new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.primary), transparent: true, opacity: 0.12, wireframe: true })
    );
    group.add(sphere);
    tag(sphere, 0);

    // Solid inner sphere
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 32, 32),
      this.mat(colors.secondary, colors.primary, 0.08, { transparent: true, opacity: 0.18 })
    );
    group.add(inner);

    // State vector (arrow: cylinder + cone)
    const arrowGroup = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9), this.mat(colors.glow, colors.glow, 1.0));
    shaft.position.y = 0.45;
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 12), this.mat(colors.glow, colors.glow, 1.0));
    arrowHead.position.y = 1.05;
    arrowGroup.add(shaft, arrowHead);
    tag(shaft, 1); tag(arrowHead, 1);
    group.add(arrowGroup);

    // Poles
    const poleMat = this.mat('#ffffff', '#ffffff', 0.6);
    const pole0 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), poleMat.clone());
    pole0.position.y = 1.1;
    const pole1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), poleMat.clone());
    pole1.position.y = -1.1;
    group.add(pole0, pole1);
    tag(pole0, 2); tag(pole1, 2);

    // Equator ring
    const eq = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.018, 8, 60), this.mat(colors.primary, colors.primary, 0.5));
    eq.rotation.x = Math.PI / 2;
    group.add(eq);

    // Axis labels
    const l0 = makeLabel('|0⟩  สถานะศูนย์', '#a5d6a7');
    l0.position.set(0, 1.55, 0);
    group.add(l0);
    const l1 = makeLabel('|1⟩  สถานะหนึ่ง', '#ef9a9a');
    l1.position.set(0, -1.55, 0);
    group.add(l1);
    const lsup = makeLabel('Superposition', colors.glow);
    lsup.position.set(1.4, 0.1, 0);
    group.add(lsup);

    group.userData.parts = [
      { id: 0, nameTH: 'Bloch Sphere — ทรงกลมบล็อค', name: 'Bloch Sphere', descTH: 'แทนสถานะควอนตัมของ qubit ทุกจุดบนผิวทรงกลมคือสถานะที่เป็นไปได้', desc: 'Represents all possible quantum states of one qubit as points on its surface.' },
      { id: 1, nameTH: 'State Vector — เวกเตอร์สถานะ', name: 'State Vector', descTH: 'ลูกศรชี้สถานะปัจจุบันของ qubit ระหว่าง |0⟩ และ |1⟩ พร้อมกัน (Superposition)', desc: 'Points to current qubit state — it can be anywhere on the sphere before measurement.' },
      { id: 2, nameTH: 'Poles |0⟩ |1⟩', name: 'Classical Poles', descTH: 'ขั้วบน = สถานะ 0, ขั้วล่าง = สถานะ 1 เมื่อวัดค่าจะได้ผลหนึ่งในสอง', desc: 'North pole = |0⟩, South pole = |1⟩. Measuring collapses the state to one pole.' }
    ];

    group.userData.animate = (t) => {
      const time = t * 0.001;
      arrowGroup.rotation.z = Math.sin(time * 0.7) * 0.8;
      arrowGroup.rotation.x = Math.cos(time * 0.5) * 0.5;
      sphere.rotation.y = time * 0.3;
      inner.material.opacity = 0.1 + 0.1 * Math.sin(time * 1.5);
    };
    return group;
  },

  // ── BLOCKCHAIN ──────────────────────────────────────────────────────────────
  blockchain(colors) {
    const group = new THREE.Group();
    const blockColors = ['#4fc3f7', '#ce93d8', '#80cbc4', '#ffd54f', '#ef9a9a'];
    const blocks = [], blockGroups = [];

    for (let i = 0; i < 5; i++) {
      const bg = new THREE.Group();
      bg.position.x = (i - 2) * 1.3;
      // Block body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.9, 0.9),
        this.mat(blockColors[i], blockColors[i], 0.25)
      );
      tag(body, i < 4 ? 0 : 1);
      bg.add(body);
      // Hash face (small grid of dots)
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const dot = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.08, 0.02),
            this.mat(blockColors[i], blockColors[i], 0.9)
          );
          dot.position.set((c - 1) * 0.25, (r - 1) * 0.25, 0.46);
          bg.add(dot);
        }
      }
      blocks.push(body);
      blockGroups.push(bg);
      group.add(bg);

      // Chain link
      if (i < 4) {
        const link = new THREE.Mesh(
          new THREE.TorusGeometry(0.18, 0.045, 6, 16),
          this.mat(colors.glow, colors.glow, 0.7)
        );
        link.position.x = (i - 2) * 1.3 + 0.65;
        link.rotation.y = Math.PI / 2;
        group.add(link);
      }
    }

    // Labels
    const lBlock = makeLabel('Block (บล็อก)', colors.primary);
    lBlock.position.set(-2.6, 0.85, 0);
    group.add(lBlock);
    const lChain = makeLabel('Chain Link', colors.glow);
    lChain.position.set(-0.65, -0.85, 0);
    group.add(lChain);
    const lNew = makeLabel('New Block ⛏', '#ffd54f');
    lNew.position.set(2.6, 0.85, 0);
    group.add(lNew);

    // Transaction particles
    const txParticles = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        this.mat('#ffff00', '#ffff00', 1.0, { transparent: true, opacity: 0.8 })
      );
      group.add(p);
      txParticles.push({ mesh: p, t: Math.random(), fromX: (Math.random() - 0.5) * 4, speed: 0.3 + Math.random() * 0.3 });
    }

    group.userData.parts = [
      { id: 0, nameTH: 'Block — บล็อกข้อมูล', name: 'Block', descTH: 'แต่ละบล็อกเก็บข้อมูล transactions พร้อม Hash ของตัวเองและ Hash ของบล็อกก่อนหน้า ทำให้เชื่อมต่อกัน', desc: 'Each block stores transaction data + its own hash + the previous block\'s hash, creating an unbreakable chain.' },
      { id: 1, nameTH: 'New Block — บล็อกใหม่กำลัง Mine', name: 'New Block (Mining)', descTH: 'กระบวนการ Mining: นักขุดแข่งกันแก้สมการ cryptographic เพื่อเพิ่มบล็อกใหม่และได้รับรางวัล', desc: 'Mining: computers race to solve a cryptographic puzzle to add this block and earn a reward.' }
    ];

    group.userData.animate = (t) => {
      const time = t * 0.001;
      blockGroups.forEach((bg, i) => { bg.rotation.y = Math.sin(time * 0.4 + i * 0.8) * 0.15; });
      blocks[4].material.emissiveIntensity = 0.2 + 0.5 * Math.abs(Math.sin(time * 2));
      txParticles.forEach(p => {
        p.t += p.speed * 0.005;
        if (p.t > 1) { p.t = 0; p.fromX = (Math.random() - 0.5) * 4; }
        p.mesh.position.set(THREE.MathUtils.lerp(p.fromX, 2.6, p.t), Math.sin(p.t * Math.PI) * 0.6, 0);
        p.mesh.material.opacity = Math.sin(p.t * Math.PI) * 0.8;
      });
    };
    return group;
  },

  // ── DNA / CRISPR ──────────────────────────────────────────────────────────
  dna(colors) {
    const group = new THREE.Group();
    const steps = 32;
    const R = 0.75;
    const H = 4.2;
    // 4 base pair colors
    const bases = [
      { col: '#ef5350', name: 'A' }, // Adenine
      { col: '#42a5f5', name: 'T' }, // Thymine
      { col: '#66bb6a', name: 'G' }, // Guanine
      { col: '#ffca28', name: 'C' }  // Cytosine
    ];
    const backbone1 = [], backbone2 = [];
    const pairMeshes = [];

    for (let i = 0; i < steps; i++) {
      const frac = i / steps;
      const angle = frac * Math.PI * 4;
      const y = frac * H - H / 2;
      const b1 = bases[i % 4];
      const b2 = bases[(i + 2) % 4]; // complementary

      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), this.mat(b1.col, b1.col, 0.5));
      s1.position.set(R * Math.cos(angle), y, R * Math.sin(angle));
      tag(s1, 0);
      group.add(s1); backbone1.push(s1);

      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), this.mat(b2.col, b2.col, 0.5));
      s2.position.set(R * Math.cos(angle + Math.PI), y, R * Math.sin(angle + Math.PI));
      tag(s2, 0);
      group.add(s2); backbone2.push(s2);

      // Rungs (base pairs)
      if (i % 2 === 0) {
        const pts = [s1.position.clone(), s2.position.clone()];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const rung = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: new THREE.Color('#ffffff'), transparent: true, opacity: 0.35 }));
        group.add(rung);
        pairMeshes.push(s1, s2);
      }
    }

    // CRISPR scissors highlight (middle)
    const scissorGroup = new THREE.Group();
    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), this.mat('#ff6f00', '#ff6f00', 0.9));
    blade1.position.set(0.3, 0, 0); blade1.rotation.z = 0.4;
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), this.mat('#ff6f00', '#ff6f00', 0.9));
    blade2.position.set(-0.3, 0, 0); blade2.rotation.z = -0.4;
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), this.mat('#ff6f00', '#ff6f00', 1.0));
    scissorGroup.add(blade1, blade2, hub);
    scissorGroup.position.set(1.1, 0.1, 0);
    tagAll([blade1, blade2, hub], 1);
    group.add(scissorGroup);

    // Labels
    const lDNA = makeLabel('สายดีเอ็นเอ', '#a5d6a7');
    lDNA.position.set(-1.4, 2.4, 0);
    group.add(lDNA);
    const lCRISPR = makeLabel('Cas9 (CRISPR)', '#ffab40');
    lCRISPR.position.set(2.2, 0.1, 0);
    group.add(lCRISPR);
    const lBase = makeLabel('A-T  G-C คู่เบส', '#f48fb1');
    lBase.position.set(-1.6, -1.0, 0);
    group.add(lBase);

    group.userData.parts = [
      { id: 0, nameTH: 'Double Helix — เกลียวคู่ DNA', name: 'DNA Double Helix', descTH: 'DNA ประกอบด้วยสายสองสาย พันกันเป็นเกลียว มีคู่เบส 4 ชนิด: A-T (แดง-น้ำเงิน) และ G-C (เขียว-เหลือง)', desc: 'Two strands wound in a helix. Base pairs A-T and G-C hold the strands together like a zipper.' },
      { id: 1, nameTH: 'CRISPR-Cas9 — กรรไกรตัดยีน', name: 'CRISPR-Cas9 Enzyme', descTH: 'โปรตีน Cas9 ทำงานเหมือนกรรไกร ตัด DNA ณ ตำแหน่งที่แม่นยำ ช่วยให้แก้ไขยีนได้ตามต้องการ', desc: 'Acts like molecular scissors, cutting DNA at a precise location so it can be edited or replaced.' }
    ];

    group.userData.animate = (t) => {
      scissorGroup.position.y = 0.15 * Math.sin(t * 0.003);
      scissorGroup.material?.forEach(m => m);
      blade1.rotation.z = 0.4 + 0.25 * Math.abs(Math.sin(t * 0.002));
      blade2.rotation.z = -(0.4 + 0.25 * Math.abs(Math.sin(t * 0.002)));
      hub.material.emissiveIntensity = 0.7 + 0.3 * Math.sin(t * 0.004);
    };
    return group;
  },

  // ── ROBOT ─────────────────────────────────────────────────────────────────
  robot(colors) {
    const group = new THREE.Group();
    const m = this.mat(colors.primary, colors.primary, 0.3);
    const jm = this.mat(colors.glow, colors.glow, 0.9);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.6), m.clone());
    head.position.y = 1.7; tag(head, 0); group.add(head);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), this.mat(colors.glow, colors.glow, 1.0));
    eyeL.position.set(-0.17, 1.72, 0.31); tag(eyeL, 0); group.add(eyeL);
    const eyeR = eyeL.clone(); eyeR.position.x = 0.17; tag(eyeR, 0); group.add(eyeR);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.1, 0.55), m.clone());
    torso.position.y = 0.75; tag(torso, 1); group.add(torso);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.1), this.mat(colors.glow, colors.glow, 0.5));
    chest.position.set(0, 0.85, 0.33); tag(chest, 1); group.add(chest);

    const arms = [], hands = [];
    [[-0.7, 1.0], [0.7, 1.0]].forEach(([x, y]) => {
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.7), m.clone());
      upper.position.set(x, y - 0.35, 0); tag(upper, 2); group.add(upper);
      const joint = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), jm.clone());
      joint.position.set(x, y - 0.7, 0); tag(joint, 2); group.add(joint);
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.65), m.clone());
      lower.position.set(x, y - 1.05, 0); tag(lower, 2); group.add(lower); arms.push(lower);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), m.clone());
      hand.position.set(x, y - 1.4, 0); tag(hand, 2); group.add(hand); hands.push(hand);
    });

    [[-0.24, -0.22], [0.24, -0.22]].forEach(([x]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 1.0), m.clone());
      leg.position.set(x, -0.75, 0); tag(leg, 3); group.add(leg);
      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), jm.clone());
      knee.position.set(x, -1.25, 0); tag(knee, 3); group.add(knee);
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.7), m.clone());
      lower.position.set(x, -1.6, 0); tag(lower, 3); group.add(lower);
    });

    const lHead = makeLabel('หัว + เซนเซอร์', colors.glow); lHead.position.set(0, 2.35, 0); group.add(lHead);
    const lArm = makeLabel('แขนกล', colors.primary); lArm.position.set(1.4, 0.6, 0); group.add(lArm);
    const lTorso = makeLabel('ตัวถัง + CPU', colors.primary); lTorso.position.set(-1.5, 0.75, 0); group.add(lTorso);

    group.userData.parts = [
      { id: 0, nameTH: 'หัวและเซนเซอร์', name: 'Head & Sensors', descTH: 'กล้อง LIDAR ไมโครโฟน และ sensor หลายชนิดช่วยให้หุ่นยนต์รับรู้สภาพแวดล้อม', desc: 'Cameras, LIDAR, microphones and sensors let the robot perceive its environment.' },
      { id: 1, nameTH: 'แผงหน้าอก + CPU', name: 'Torso & Computer', descTH: 'ตัวถังหลักบรรจุ CPU/GPU, แบตเตอรี่ และระบบควบคุมกลาง', desc: 'Houses the main CPU, GPU, battery and central control system.' },
      { id: 2, nameTH: 'แขนกล', name: 'Robotic Arms', descTH: 'ข้อต่อหมุนได้หลายแกน มอเตอร์ servo ให้ความแม่นยำสูง', desc: 'Multi-axis servo joints provide precise movement and force control.' },
      { id: 3, nameTH: 'ขา', name: 'Legs', descTH: 'ขาสองขาช่วยให้เดิน วิ่ง และรักษาสมดุลบนพื้นผิวต่างๆ', desc: 'Bipedal locomotion for walking, running and balancing on uneven terrain.' }
    ];

    group.userData.animate = (t) => {
      const time = t * 0.001;
      head.rotation.y = 0.5 * Math.sin(time * 0.7);
      arms[0].rotation.x = 0.3 * Math.sin(time * 1.2);
      arms[1].rotation.x = 0.3 * Math.sin(time * 1.2 + Math.PI);
      eyeL.material.emissiveIntensity = eyeR.material.emissiveIntensity = 0.7 + 0.4 * Math.sin(time * 3);
    };
    return group;
  },

  // ── 5G TOWER ──────────────────────────────────────────────────────────────
  tower5g(colors) {
    const group = new THREE.Group();
    const m = this.mat(colors.primary, colors.primary, 0.3);

    for (let i = 0; i < 5; i++) {
      const r = 0.06 + (4 - i) * 0.035;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.025, 0.75, 6), m.clone());
      seg.position.y = i * 0.75 - 1.5; tag(seg, 0); group.add(seg);
    }

    // Antenna panels
    const antMat = this.mat(colors.glow, colors.glow, 0.6);
    const ants = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const ant = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.08), antMat.clone());
      ant.position.set(Math.cos(a) * 0.35, 2.1, Math.sin(a) * 0.35);
      ant.rotation.y = a; tag(ant, 1); group.add(ant); ants.push(ant);
    }

    // Signal rings
    const rings = [];
    for (let r = 1; r <= 4; r++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r * 0.65, 0.018, 6, 50),
        new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.glow), transparent: true, opacity: 0.0 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 2.2; tag(ring, 1); group.add(ring); rings.push(ring);
    }

    // Ground base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.15, 6), this.mat(colors.secondary, colors.secondary, 0.2));
    base.position.y = -1.9; tag(base, 0); group.add(base);

    const lTower = makeLabel('เสาสัญญาณ', colors.primary); lTower.position.set(-1.2, 0, 0); group.add(lTower);
    const lAnt = makeLabel('แผง 5G Antenna', colors.glow); lAnt.position.set(1.2, 2.1, 0); group.add(lAnt);
    const lSig = makeLabel('คลื่น mm-Wave', '#a5d6a7'); lSig.position.set(1.8, 2.9, 0); group.add(lSig);

    group.userData.parts = [
      { id: 0, nameTH: 'เสาและฐานรองรับ', name: 'Tower Structure', descTH: 'โครงสร้างโลหะรองรับอุปกรณ์ เชื่อมต่อกับสายไฟเบอร์ออปติกและระบบไฟฟ้า', desc: 'Steel structure supporting equipment, connected to fiber optic backhaul.' },
      { id: 1, nameTH: 'แผงเสาอากาศ 5G', name: '5G Antenna Array', descTH: 'แผง Massive MIMO มีเสาอากาศหลายร้อยตัว ส่งสัญญาณ Beamforming ไปยังผู้ใช้แต่ละคน', desc: 'Massive MIMO array with hundreds of antennas, using beamforming to target individual users.' }
    ];

    let ringPhase = 0;
    group.userData.animate = (t) => {
      ringPhase = (t * 0.002) % (Math.PI * 2);
      rings.forEach((r, i) => {
        const phase = ringPhase - i * 0.7;
        const cycle = ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        r.scale.setScalar(0.2 + cycle / (Math.PI * 2) * 1.6);
        r.material.opacity = Math.max(0, 0.55 * (1 - cycle / (Math.PI * 2)));
      });
      ants.forEach(a => { a.material.emissiveIntensity = 0.4 + 0.4 * Math.sin(t * 0.003); });
    };
    return group;
  },

  // ── AR DEVICE ─────────────────────────────────────────────────────────────
  ar_device(colors) {
    const group = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.22), this.mat(colors.primary, colors.primary, 0.3));
    tag(frame, 0); group.add(frame);
    [-0.65, 0.65].forEach(x => {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 32), this.mat(colors.glow, colors.glow, 0.8, { transparent: true, opacity: 0.55 }));
      lens.rotation.x = Math.PI / 2; lens.position.set(x, 0, 0.16); tag(lens, 1); group.add(lens);
    });
    [[-1.3, 0], [1.3, 0]].forEach(([x]) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.14), this.mat(colors.secondary, colors.secondary, 0.2));
      arm.position.set(x, 0, -0.12); tag(arm, 0); group.add(arm);
    });
    // Holographic projection
    const holo = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.2), new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.glow), emissive: new THREE.Color(colors.glow), emissiveIntensity: 0.5, transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
    holo.position.z = 1.4; tag(holo, 2); group.add(holo);
    // Holo grid
    const holoGrid = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.2), new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.primary), wireframe: true, transparent: true, opacity: 0.25 }));
    holoGrid.position.z = 1.4; group.add(holoGrid);

    const lLens = makeLabel('Waveguide Lens', colors.glow); lLens.position.set(0, -0.62, 0); group.add(lLens);
    const lHolo = makeLabel('โฮโลแกรม AR', colors.primary); lHolo.position.set(0, 0.9, 1.4); group.add(lHolo);

    group.userData.parts = [
      { id: 0, nameTH: 'กรอบและโครงสร้าง', name: 'Frame & Processor', descTH: 'บรรจุ CPU GPU ขนาดเล็ก แบตเตอรี่ และเซนเซอร์ Depth สำหรับรับรู้พื้นที่รอบตัว', desc: 'Houses miniaturized CPU, GPU, battery and depth sensors for spatial awareness.' },
      { id: 1, nameTH: 'Waveguide Lens', name: 'Waveguide Display', descTH: 'เลนส์พิเศษที่นำแสงจากโปรเจกเตอร์ขนาดจิ๋วเข้าตา ทำให้เห็นภาพเสมือนซ้อนทับโลกจริง', desc: 'Special optics that guide light from a micro-projector into the eye, overlaying virtual images.' },
      { id: 2, nameTH: 'Holographic Projection', name: 'AR Overlay', descTH: 'ภาพดิจิทัลที่ระบบ AR วางซ้อนทับบนโลกจริง ผู้สวมใส่เห็นภาพนี้แต่คนอื่นไม่เห็น', desc: 'Digital imagery overlaid on the real world, visible only to the wearer.' }
    ];
    group.userData.animate = (t) => { holo.material.opacity = 0.08 + 0.07 * Math.sin(t * 0.002); holoGrid.material.opacity = 0.15 + 0.1 * Math.sin(t * 0.003 + 1); };
    return group;
  },

  // ── VR HEADSET ────────────────────────────────────────────────────────────
  vr_headset(colors) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.05, 0.95), this.mat(colors.primary, colors.primary, 0.3));
    tag(body, 0); group.add(body);
    [-0.5, 0.5].forEach(x => {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 32), this.mat(colors.glow, colors.glow, 0.9, { transparent: true, opacity: 0.65 }));
      lens.rotation.x = Math.PI / 2; lens.position.set(x, 0, 0.52); tag(lens, 1); group.add(lens);
    });
    const strap = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.065, 6, 30, Math.PI), this.mat(colors.secondary, colors.secondary, 0.2));
    strap.rotation.x = Math.PI / 2; strap.position.z = -0.2; tag(strap, 2); group.add(strap);
    // IPD dial
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 12), this.mat(colors.glow, colors.glow, 0.5));
    dial.position.set(0, -0.55, 0.3); tag(dial, 1); group.add(dial);

    const lBody = makeLabel('6DoF Tracking', colors.primary); lBody.position.set(-1.5, 0.7, 0); group.add(lBody);
    const lLens = makeLabel('Fresnel Lens', colors.glow); lLens.position.set(0, -0.82, 0.5); group.add(lLens);

    group.userData.parts = [
      { id: 0, nameTH: 'ตัว Headset + IMU', name: 'Headset Body', descTH: 'ภายในมีจอ OLED/LCD ความละเอียดสูง และ IMU ติดตามการเคลื่อนไหว 6 แกน (6DoF)', desc: 'Houses high-res OLED/LCD displays and an IMU for 6-axis (6DoF) head tracking.' },
      { id: 1, nameTH: 'Fresnel Lens', name: 'Fresnel Lenses', descTH: 'เลนส์แบบ Fresnel ขยายภาพจากจอขนาดเล็กให้ครอบคลุมมุมมองกว้าง ลดน้ำหนักและความหนา', desc: 'Fresnel optics expand the small display to a wide field of view while reducing weight.' },
      { id: 2, nameTH: 'Head Strap', name: 'Comfort Strap', descTH: 'กระจายน้ำหนักไปรอบศีรษะ มักมีแบตเตอรี่ในตัวและปุ่มปรับความแน่น', desc: 'Distributes weight evenly and often contains a built-in battery for extra runtime.' }
    ];
    group.userData.animate = () => {};
    return group;
  },

  // ── BCI CHIP ──────────────────────────────────────────────────────────────
  bci_chip(colors) {
    const group = new THREE.Group();
    const chip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 1.5), this.mat(colors.primary, colors.primary, 0.4));
    tag(chip, 0); group.add(chip);

    const electrodes = [];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if (Math.random() > 0.35) {
          const h = 0.25 + Math.random() * 0.5;
          const elec = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, h), this.mat(colors.glow, colors.glow, 0.85));
          elec.position.set((i - 2.5) * 0.24, 0.09 + h / 2, (j - 2.5) * 0.24);
          tag(elec, 1); group.add(elec); electrodes.push(elec);
        }
      }
    }

    // Brain wave curves
    const waveGroup = new THREE.Group();
    waveGroup.position.y = 0.9;
    for (let w = 0; w < 4; w++) {
      const pts = [];
      for (let i = 0; i < 40; i++) {
        pts.push(new THREE.Vector3((i / 40 - 0.5) * 3, Math.sin(i * 0.5 + w * 1.5) * 0.2, (w - 1.5) * 0.3));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const wave = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: new THREE.Color(colors.glow), transparent: true, opacity: 0.6 - w * 0.1 }));
      tag(wave, 2); waveGroup.add(wave);
    }
    group.add(waveGroup);

    const lChip = makeLabel('Neural Implant', colors.primary); lChip.position.set(-1.4, 0.15, 0); group.add(lChip);
    const lElec = makeLabel('Microelectrodes', colors.glow); lElec.position.set(1.4, 0.55, 0); group.add(lElec);
    const lWave = makeLabel('คลื่นสมอง EEG', '#ffab40'); lWave.position.set(0, 1.5, 0); group.add(lWave);

    group.userData.parts = [
      { id: 0, nameTH: 'Neural Implant Chip', name: 'Neural Chip', descTH: 'ชิปขนาดเล็กฝังในกะโหลก ประมวลผลสัญญาณประสาทแบบ Real-time ด้วย AI', desc: 'Tiny chip implanted in the skull that processes neural signals in real-time using AI.' },
      { id: 1, nameTH: 'Microelectrodes', name: 'Electrode Array', descTH: 'เข็มขนาดจิ๋วหลายร้อยตัวสัมผัสกับ neurons โดยตรง อ่านและส่งสัญญาณไฟฟ้า', desc: 'Hundreds of tiny needles contact individual neurons, reading and sending electrical signals.' },
      { id: 2, nameTH: 'สัญญาณสมอง', name: 'Brain Signals (EEG)', descTH: 'สัญญาณไฟฟ้าจากเซลล์ประสาท ถูกแปลงเป็นคำสั่งควบคุมอุปกรณ์ภายนอก', desc: 'Electrical patterns from neurons decoded into commands that control external devices.' }
    ];

    group.userData.animate = (t) => {
      electrodes.forEach((e, i) => { e.material.emissiveIntensity = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.004 + i * 0.4)); });
      waveGroup.children.forEach((w, wi) => {
        const pts = [];
        for (let i = 0; i < 40; i++) {
          pts.push(new THREE.Vector3((i / 40 - 0.5) * 3, Math.sin(i * 0.5 + wi * 1.5 + t * 0.004) * 0.2, (wi - 1.5) * 0.3));
        }
        w.geometry.setFromPoints(pts);
      });
    };
    return group;
  },

  // ── AUTONOMOUS CAR ────────────────────────────────────────────────────────
  auto_car(colors) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.65, 1.15), this.mat(colors.primary, colors.primary, 0.3));
    body.position.y = 0.3; tag(body, 0); group.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.58, 1.0), this.mat(colors.secondary, colors.primary, 0.15, { transparent: true, opacity: 0.75 }));
    cabin.position.y = 0.89; tag(cabin, 0); group.add(cabin);

    [[-0.85, -0.55], [0.85, -0.55], [-0.85, 0.55], [0.85, 0.55]].forEach(([x, z]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 20), this.mat('#2a2a2a', colors.primary, 0.1));
      w.rotation.z = Math.PI / 2; w.position.set(x, 0, z); tag(w, 0); group.add(w);
    });

    // LIDAR on roof
    const lidar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 16), this.mat(colors.glow, colors.glow, 0.9));
    lidar.position.y = 1.2; tag(lidar, 1); group.add(lidar);

    // LIDAR ray fan
    const rayMat = new THREE.LineBasicMaterial({ color: new THREE.Color(colors.glow), transparent: true, opacity: 0.5 });
    const rays = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const length = 2.5 + Math.random();
      const pts = [new THREE.Vector3(0, 1.2, 0), new THREE.Vector3(Math.cos(a) * length, 0.1, Math.sin(a) * length)];
      const ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), rayMat.clone());
      rays.push(ray); tag(ray, 1); group.add(ray);
    }

    // Radar waves (front)
    const radars = [];
    for (let r = 0; r < 3; r++) {
      const radar = new THREE.Mesh(new THREE.TorusGeometry(0.5 + r * 0.4, 0.015, 6, 30, Math.PI), new THREE.MeshPhongMaterial({ color: new THREE.Color('#4fc3f7'), transparent: true, opacity: 0.0 }));
      radar.rotation.y = Math.PI / 2;
      radar.position.set(1.3, 0.3, 0); tag(radar, 2); group.add(radar); radars.push(radar);
    }

    const lLidar = makeLabel('LIDAR 360°', colors.glow); lLidar.position.set(0, 1.75, 0); group.add(lLidar);
    const lBody = makeLabel('AI Computing', colors.primary); lBody.position.set(-1.8, 0.6, 0); group.add(lBody);
    const lRadar = makeLabel('Radar + Camera', '#4fc3f7'); lRadar.position.set(2.0, 0.7, 0); group.add(lRadar);

    group.userData.parts = [
      { id: 0, nameTH: 'ตัวรถ + ระบบ AI', name: 'Vehicle & AI Brain', descTH: 'คอมพิวเตอร์ทรงพลังภายในประมวลผลข้อมูล sensor ทั้งหมดเพื่อตัดสินใจขับรถ Real-time', desc: 'Powerful onboard computers process all sensor data to make real-time driving decisions.' },
      { id: 1, nameTH: 'LIDAR 360°', name: 'LIDAR Sensor', descTH: 'ยิงแสงเลเซอร์รอบทิศ 360° สร้างแผนที่ 3D ของสิ่งรอบข้างแม่นยำระดับเซนติเมตร', desc: 'Fires laser pulses in all directions to create a precise 3D map of the surroundings.' },
      { id: 2, nameTH: 'Radar + กล้อง', name: 'Radar & Cameras', descTH: 'Radar ตรวจวัดความเร็วและระยะทาง กล้องจำแนกวัตถุ คนเดิน และป้ายจราจร', desc: 'Radar measures speed and distance; cameras identify objects, pedestrians and road signs.' }
    ];

    group.userData.animate = (t) => {
      lidar.rotation.y = t * 0.006;
      rays.forEach((r, i) => { r.material.opacity = 0.15 + 0.4 * Math.abs(Math.sin(t * 0.005 + i * 0.32)); });
      radars.forEach((r, i) => {
        const phase = ((t * 0.003 - i * 0.8) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        r.scale.setScalar(0.2 + phase / (Math.PI * 2) * 1.5);
        r.material.opacity = Math.max(0, 0.5 * (1 - phase / (Math.PI * 2)));
      });
    };
    return group;
  },

  // ── ROCKET ────────────────────────────────────────────────────────────────
  rocket(colors) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 2.8, 16), this.mat(colors.primary, colors.primary, 0.3));
    body.position.y = 0.4; tag(body, 0); group.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.1, 16), this.mat(colors.primary, colors.primary, 0.4));
    nose.position.y = 2.35; tag(nose, 1); group.add(nose);
    const payload = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 12), this.mat(colors.glow, colors.glow, 0.5));
    payload.position.y = 1.65; tag(payload, 1); group.add(payload);

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.5), this.mat(colors.secondary, colors.secondary, 0.25));
      fin.position.set(Math.cos(a) * 0.42, -0.85, Math.sin(a) * 0.42);
      fin.rotation.y = a; tag(fin, 0); group.add(fin);
    }

    const engines = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const eng = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 10), this.mat('#555', '#888', 0.2));
      eng.rotation.x = Math.PI; eng.position.set(Math.cos(a) * 0.2, -1.6, Math.sin(a) * 0.2);
      tag(eng, 2); group.add(eng); engines.push(eng);

      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 10), new THREE.MeshPhongMaterial({ color: new THREE.Color('#ff6600'), emissive: new THREE.Color('#ff3300'), emissiveIntensity: 1.0, transparent: true, opacity: 0.8 }));
      flame.rotation.x = Math.PI; flame.position.set(Math.cos(a) * 0.2, -2.2, Math.sin(a) * 0.2);
      tag(flame, 2); group.add(flame); engines.push(flame);
    }

    const lPayload = makeLabel('Payload Fairing', colors.glow); lPayload.position.set(1.2, 2.35, 0); group.add(lPayload);
    const lFuel = makeLabel('ถังเชื้อเพลิง', colors.primary); lFuel.position.set(-1.2, 0.4, 0); group.add(lFuel);
    const lEngine = makeLabel('Engines 🔥', '#ff8a65'); lEngine.position.set(1.2, -2.0, 0); group.add(lEngine);

    group.userData.parts = [
      { id: 0, nameTH: 'ถังเชื้อเพลิงและโครงสร้าง', name: 'Fuel Tank & Body', descTH: 'บรรจุเชื้อเพลิงเหลว (LOX + RP-1) คิดเป็น 80-90% ของน้ำหนักรวม โครงทำจาก Al-Li alloy', desc: 'Holds liquid propellants (LOX + fuel), making up 80-90% of total mass. Made from Al-Li alloy.' },
      { id: 1, nameTH: 'Payload Fairing (ฝาครอบ)', name: 'Payload Fairing', descTH: 'ครอบดาวเทียมหรืออุปกรณ์ระหว่างบิน เมื่อพ้นชั้นบรรยากาศจะแยกออกเพื่อลดน้ำหนัก', desc: 'Protects the payload during ascent, then separates in space to reduce mass.' },
      { id: 2, nameTH: 'เครื่องยนต์จรวด', name: 'Rocket Engines', descTH: 'เผาไหม้เชื้อเพลิงเหลวสร้างแรงขับดัน กฎของนิวตัน: แรงปฏิกิริยาดันจรวดขึ้น', desc: 'Burn liquid propellants to create thrust via Newton\'s 3rd law: action-reaction.' }
    ];

    group.userData.animate = (t) => {
      engines.forEach((e, i) => { if (i % 2 === 1) { e.material.opacity = 0.6 + 0.25 * Math.random() * 0.1; e.scale.y = 0.85 + 0.3 * Math.random() * 0.1; } });
    };
    return group;
  },

  // ── SOLAR ARRAY ───────────────────────────────────────────────────────────
  solar_array(colors) {
    const group = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.55), this.mat(colors.primary, colors.primary, 0.5));
        panel.position.set((i - 1.5) * 0.65, 0, (j - 1.5) * 0.65); tag(panel, 0); group.add(panel);
        const cell = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.secondary), emissive: new THREE.Color(colors.secondary), emissiveIntensity: 0.3, transparent: true, opacity: 0.85 }));
        cell.rotation.x = -Math.PI / 2; cell.position.set((i - 1.5) * 0.65, 0.02, (j - 1.5) * 0.65); group.add(cell);
      }
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 1.6), this.mat('#888', '#aaa', 0.1));
    pole.position.y = -0.8; tag(pole, 1); group.add(pole);
    // Sun ray particles
    const sunRays = [];
    for (let i = 0; i < 12; i++) {
      const ray = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshPhongMaterial({ color: new THREE.Color('#ffff88'), emissive: new THREE.Color('#ffcc00'), emissiveIntensity: 1.0, transparent: true, opacity: 0.0 }));
      ray.position.set((Math.random() - 0.5) * 2.2, 2.5, (Math.random() - 0.5) * 2.2);
      group.add(ray); sunRays.push({ mesh: ray, startY: 2.5, speed: 0.8 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2 });
    }
    group.rotation.x = -Math.PI / 10;

    const lPanel = makeLabel('Photovoltaic Cells', colors.primary); lPanel.position.set(-2.0, 0.3, 0); group.add(lPanel);
    const lSun = makeLabel('แสงอาทิตย์ → ไฟฟ้า', '#ffcc00'); lSun.position.set(0, 2.0, 0); group.add(lSun);

    group.userData.parts = [
      { id: 0, nameTH: 'Photovoltaic Cells', name: 'Solar Cells', descTH: 'เซลล์ซิลิกอนดูดซับโฟตอนจากแสงแดด กระตุ้นอิเล็กตรอนสร้างกระแสไฟฟ้า DC (Photovoltaic Effect)', desc: 'Silicon cells absorb photons, exciting electrons to create DC electricity via the photovoltaic effect.' },
      { id: 1, nameTH: 'โครงยึด Mounting', name: 'Mounting Structure', descTH: 'ปรับมุมเงยเพื่อรับแสงได้มากที่สุด ระบบ Solar Tracker สมัยใหม่หมุนตามดวงอาทิตย์', desc: 'Angle-adjustable mount. Modern solar trackers follow the sun for 25-35% more energy.' }
    ];

    group.userData.animate = (t) => {
      sunRays.forEach(r => {
        r.mesh.position.y -= 0.025 * r.speed;
        r.mesh.material.opacity = Math.max(0, 0.8 * (1 - (r.startY - r.mesh.position.y) / 2.5));
        if (r.mesh.position.y < -0.1) { r.mesh.position.set((Math.random() - 0.5) * 2.2, r.startY, (Math.random() - 0.5) * 2.2); }
      });
    };
    return group;
  },

  // ── TOKAMAK (FUSION) ──────────────────────────────────────────────────────
  tokamak(colors) {
    const group = new THREE.Group();
    const torus = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.58, 18, 80), this.mat(colors.secondary, colors.primary, 0.15));
    tag(torus, 0); group.add(torus);
    const plasma = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.32, 12, 60), new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.glow), emissive: new THREE.Color(colors.glow), emissiveIntensity: 0.9, transparent: true, opacity: 0.75 }));
    tag(plasma, 1); group.add(plasma);

    const coils = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.055, 6, 20), this.mat(colors.primary, colors.primary, 0.4));
      coil.rotation.y = a; coil.position.set(Math.cos(a) * 1.45, 0, Math.sin(a) * 1.45);
      tag(coil, 2); group.add(coil); coils.push(coil);
    }

    const lPlasma = makeLabel('Plasma 150M°C', colors.glow); lPlasma.position.set(0, 0.45, 0); group.add(lPlasma);
    const lCoils = makeLabel('Magnetic Coils', colors.primary); lCoils.position.set(2.4, 0, 0); group.add(lCoils);
    const lTorus = makeLabel('Tokamak Chamber', colors.secondary); lTorus.position.set(-2.4, 0, 0); group.add(lTorus);

    group.userData.parts = [
      { id: 0, nameTH: 'ห้องปฏิกิริยา Tokamak', name: 'Tokamak Chamber', descTH: 'ห้องรูปทอรัส (โดนัท) ทนแรงดันและอุณหภูมิสูง บรรจุ plasma ที่ร้อนกว่าดวงอาทิตย์', desc: 'Donut-shaped vacuum chamber containing plasma hotter than the core of the Sun.' },
      { id: 1, nameTH: 'Plasma ไฮโดรเจน', name: 'Hydrogen Plasma', descTH: 'ก๊าซ Deuterium + Tritium ถูกให้ความร้อนถึง 150 ล้านองศา รวมตัวปล่อยพลังงานมหาศาล', desc: 'Deuterium + Tritium heated to 150 million°C fuse together, releasing enormous energy.' },
      { id: 2, nameTH: 'Magnetic Coils', name: 'Superconducting Coils', descTH: 'ขดลวดตัวนำยิ่งยวดสร้างสนามแม่เหล็กกักขัง plasma ไม่ให้แตะผนัง', desc: 'Superconducting electromagnets create fields to confine plasma away from the walls.' }
    ];

    group.userData.animate = (t) => { plasma.material.emissiveIntensity = 0.7 + 0.4 * Math.sin(t * 0.003); coils.forEach((c, i) => { c.material.emissiveIntensity = 0.3 + 0.3 * Math.abs(Math.sin(t * 0.002 + i * 0.63)); }); };
    return group;
  },

  // ── NANO STRUCTURE ────────────────────────────────────────────────────────
  nano_struct(colors) {
    const group = new THREE.Group();
    const r = 1.3;
    const positions = [];
    for (let i = 0; i < 60; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / 60);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      const atom = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), this.mat(colors.primary, colors.primary, 0.5));
      atom.position.set(x, y, z); tag(atom, 0); group.add(atom); positions.push(new THREE.Vector3(x, y, z));
    }
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[i].distanceTo(positions[j]) < 0.62) {
          group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([positions[i], positions[j]]), new THREE.LineBasicMaterial({ color: new THREE.Color(colors.secondary), transparent: true, opacity: 0.4 })));
        }
      }
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), this.mat(colors.glow, colors.glow, 1.0));
    tag(core, 1); group.add(core);

    const lStruct = makeLabel('Nanostructure', colors.primary); lStruct.position.set(-1.8, 0, 0); group.add(lStruct);
    const lCore = makeLabel('Nano Core', colors.glow); lCore.position.set(0, 0, 0); group.add(lCore);

    group.userData.parts = [
      { id: 0, nameTH: 'โครงสร้าง Nano', name: 'Nanostructure', descTH: 'วัสดุที่มีโครงสร้างในระดับ 1-100 นาโนเมตร มีคุณสมบัติพิเศษแตกต่างจากวัสดุชนิดเดียวกันในระดับใหญ่', desc: 'Material with structure at 1-100nm scale, showing unique properties absent in bulk materials.' },
      { id: 1, nameTH: 'Nano Core', name: 'Active Core', descTH: 'ศูนย์กลางออกฤทธิ์ของ nanoparticle ควบคุมได้ด้วยแม่เหล็ก ความร้อน หรือแสง', desc: 'Active center of nanoparticle, controllable by magnetic fields, heat or light.' }
    ];
    group.userData.animate = () => {};
    return group;
  },

  // ── Remaining models (drone, satellite, server, etc.) ───────────────────
  drone(colors) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), this.mat(colors.primary, colors.primary, 0.4));
    tag(body, 0); group.add(body);
    const rotors = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), this.mat(colors.secondary, colors.secondary, 0.2));
      arm.rotation.z = Math.PI / 2; arm.rotation.y = a; arm.position.set(Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6);
      tag(arm, 0); group.add(arm);
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16), this.mat(colors.primary, colors.primary, 0.5));
      motor.position.set(Math.cos(a) * 1.1, 0.12, Math.sin(a) * 1.1); tag(motor, 1); group.add(motor);
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 3), this.mat(colors.glow, colors.glow, 0.7, { transparent: true, opacity: 0.6 }));
      rotor.position.set(Math.cos(a) * 1.1, 0.22, Math.sin(a) * 1.1); tag(rotor, 1); group.add(rotor);
      rotors.push({ mesh: rotor, dir: i % 2 === 0 ? 1 : -1 });
    }
    // Camera gimbal
    const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), this.mat(colors.glow, colors.glow, 0.8));
    gimbal.position.y = -0.45; tag(gimbal, 2); group.add(gimbal);
    // FOV cone
    const fov = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.2, 12, 1, true), new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.glow), transparent: true, opacity: 0.1, side: THREE.DoubleSide }));
    fov.rotation.x = Math.PI; fov.position.y = -1.0; tag(fov, 2); group.add(fov);

    const lRotor = makeLabel('Propellers', colors.glow); lRotor.position.set(1.5, 0.5, 0); group.add(lRotor);
    const lCamera = makeLabel('กล้อง Gimbal', colors.primary); lCamera.position.set(0, -1.6, 0); group.add(lCamera);

    group.userData.parts = [
      { id: 0, nameTH: 'ตัวโดรน + Flight Controller', name: 'Body & FC', descTH: 'ตัวถังบรรจุแบตเตอรี่ LiPo และ Flight Controller ที่คำนวณสมดุลและเส้นทางบิน', desc: 'Houses LiPo battery and the Flight Controller computing balance and trajectory.' },
      { id: 1, nameTH: 'มอเตอร์ + ใบพัด', name: 'Motors & Propellers', descTH: 'มอเตอร์ Brushless BLDC หมุนใบพัดเพื่อสร้างแรงยกและควบคุมทิศทาง', desc: 'Brushless BLDC motors spin propellers to generate lift and directional control.' },
      { id: 2, nameTH: 'กล้องและ FOV', name: 'Camera Gimbal & FOV', descTH: 'กล้องติดบน Gimbal 3 แกนลดสั่นสะเทือน กรวยแสดงมุมมองการถ่ายภาพ', desc: '3-axis gimbal stabilizes the camera; cone shows the field of view during flight.' }
    ];
    group.userData.animate = (t) => { rotors.forEach(r => { r.mesh.rotation.y += 0.18 * r.dir; }); };
    return group;
  },

  satellite(colors) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 1.25), this.mat(colors.primary, colors.primary, 0.4));
    tag(body, 0); group.add(body);
    [-1.55, 1.55].forEach(x => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.04, 0.85), this.mat(colors.glow, colors.glow, 0.5));
      panel.position.x = x; tag(panel, 1); group.add(panel);
      new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.02, 0.75), new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.secondary), wireframe: true }));
    });
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.18, 16, 1, true), this.mat(colors.primary, colors.primary, 0.3, { side: THREE.BackSide }));
    dish.position.set(0.42, 0.52, 0); dish.rotation.z = -Math.PI / 4; tag(dish, 2); group.add(dish);
    // Signal beam from dish
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.5, 12, 1, true), new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.glow), transparent: true, opacity: 0.08, side: THREE.DoubleSide }));
    beam.rotation.z = -Math.PI * 0.75; beam.position.set(1.0, -0.8, 0); tag(beam, 2); group.add(beam);

    const lBody = makeLabel('Satellite Bus', colors.primary); lBody.position.set(-1.4, 0.7, 0); group.add(lBody);
    const lPanel = makeLabel('Solar Arrays', colors.glow); lPanel.position.set(0, -0.75, 0); group.add(lPanel);
    const lDish = makeLabel('Dish Antenna', colors.glow); lDish.position.set(1.4, 0.8, 0); group.add(lDish);

    group.userData.parts = [
      { id: 0, nameTH: 'Satellite Bus', name: 'Satellite Bus', descTH: 'โครงสร้างหลักบรรจุ on-board computer, transponder, แบตเตอรี่ และระบบ attitude control', desc: 'Main structure housing the onboard computer, transponders, batteries and attitude control.' },
      { id: 1, nameTH: 'Solar Arrays', name: 'Solar Panels', descTH: 'แผงโซลาร์เซลล์ชาร์จแบตเตอรี่และจ่ายไฟให้ระบบทั้งหมด', desc: 'Generate power from sunlight to charge batteries and run all onboard systems.' },
      { id: 2, nameTH: 'Dish Antenna + Beam', name: 'Antenna & Signal Beam', descTH: 'จานรับ-ส่งสัญญาณ beam ลงมายังพื้นโลก ใช้ในการสื่อสาร GPS หรืออินเทอร์เน็ต', desc: 'Transmits and receives signals to/from Earth for communications, GPS or internet.' }
    ];
    group.userData.animate = (t) => { beam.material.opacity = 0.05 + 0.05 * Math.sin(t * 0.003); };
    return group;
  },

  server_rack(colors) {
    const group = new THREE.Group();
    new THREE.Mesh(new THREE.BoxGeometry(1.85, 3.1, 0.92), this.mat(colors.secondary, colors.secondary, 0.1, { transparent: true, opacity: 0.3 }));
    const units = [];
    for (let i = 0; i < 8; i++) {
      const unit = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.28, 0.78), this.mat(colors.primary, colors.primary, 0.2));
      unit.position.y = -1.25 + i * 0.38; tag(unit, i < 4 ? 0 : 1); group.add(unit); units.push(unit);
      for (let j = 0; j < 5; j++) {
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), this.mat(j < 3 ? colors.glow : '#00ff00', j < 3 ? colors.glow : '#00ff00', 1.0));
        led.position.set(0.55 + j * 0.12, -1.25 + i * 0.38, 0.4); group.add(led);
      }
    }
    const lServer = makeLabel('Compute Nodes', colors.primary); lServer.position.set(-1.5, 0.5, 0); group.add(lServer);
    const lEdge = makeLabel('Edge Processing', colors.glow); lEdge.position.set(1.5, -0.5, 0); group.add(lEdge);

    group.userData.parts = [
      { id: 0, nameTH: 'Compute Nodes (Server)', name: 'Compute Nodes', descTH: 'เซิร์ฟเวอร์ที่ทำงานใกล้ผู้ใช้ ลด latency จาก 100ms (Cloud) เหลือ <5ms', desc: 'Servers deployed near users, reducing latency from 100ms (cloud) to under 5ms.' },
      { id: 1, nameTH: 'Edge AI Accelerator', name: 'AI Accelerator', descTH: 'ชิป GPU/TPU สำหรับ AI inference ใกล้แหล่งข้อมูล ไม่ต้องส่งไป Cloud', desc: 'GPU/TPU chips running AI inference locally, eliminating round-trips to the cloud.' }
    ];
    group.userData.animate = (t) => { units.forEach((u, i) => { u.material.emissiveIntensity = 0.1 + 0.2 * Math.abs(Math.sin(t * 0.002 + i * 0.7)); }); };
    return group;
  },

  printer3d(colors) {
    const group = new THREE.Group();
    const m = this.mat(colors.primary, colors.primary, 0.3);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.6), m.clone());
      p.position.set(x, 0, z); tag(p, 0); group.add(p);
    });
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.07, 2.2), this.mat(colors.secondary, colors.secondary, 0.2));
    bed.position.y = -1.1; tag(bed, 1); group.add(bed);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.07, 0.07), m.clone());
    rail.position.y = 0.7; tag(rail, 0); group.add(rail);
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.38, 8), this.mat(colors.glow, colors.glow, 0.9));
    nozzle.rotation.x = Math.PI; nozzle.position.y = 0.55; tag(nozzle, 2); group.add(nozzle);
    const printed = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), this.mat(colors.glow, colors.glow, 0.4));
    printed.position.y = -1.05; tag(printed, 1); group.add(printed);
    const lNozzle = makeLabel('Extruder Nozzle', colors.glow); lNozzle.position.set(1.4, 0.55, 0); group.add(lNozzle);
    const lBed = makeLabel('Print Bed', colors.secondary); lBed.position.set(-1.5, -1.0, 0); group.add(lBed);

    group.userData.parts = [
      { id: 0, nameTH: 'โครงสร้างและ Rail', name: 'Frame & Rails', descTH: 'โครงอลูมิเนียมและ linear rail ควบคุมตำแหน่ง nozzle ด้วยมอเตอร์ stepper', desc: 'Aluminum frame and linear rails control nozzle position via stepper motors.' },
      { id: 1, nameTH: 'แท่นพิมพ์ (Print Bed)', name: 'Heated Print Bed', descTH: 'ฐานให้ความร้อน 50-110°C ช่วยให้วัสดุเกาะติดระหว่างพิมพ์', desc: 'Heated platform (50-110°C) ensures printed material adheres during printing.' },
      { id: 2, nameTH: 'Extruder Nozzle', name: 'Extruder & Nozzle', descTH: 'หลอมวัสดุ (PLA, ABS, Resin) ที่อุณหภูมิ 200-280°C แล้วพ่นออกเป็นชั้นๆ', desc: 'Melts material (PLA/ABS/Resin) at 200-280°C and deposits it layer by layer.' }
    ];
    group.userData.animate = (t) => { nozzle.position.x = 0.75 * Math.sin(t * 0.002); printed.scale.y = Math.min(1 + (t % 8000) * 0.00008, 4); };
    return group;
  },

  metaverse_globe(colors) {
    const group = new THREE.Group();
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1.25, 18, 18), new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.primary), transparent: true, opacity: 0.25, wireframe: true }));
    tag(globe, 0); group.add(globe);
    const solid = new THREE.Mesh(new THREE.SphereGeometry(1.22, 32, 32), this.mat(colors.secondary, colors.primary, 0.08, { transparent: true, opacity: 0.22 }));
    group.add(solid);
    const nodes = [];
    for (let i = 0; i < 22; i++) {
      const phi = Math.random() * Math.PI; const theta = Math.random() * Math.PI * 2;
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), this.mat(colors.glow, colors.glow, 0.9));
      node.position.set(1.28 * Math.sin(phi) * Math.cos(theta), 1.28 * Math.sin(phi) * Math.sin(theta), 1.28 * Math.cos(phi));
      tag(node, 1); group.add(node); nodes.push(node);
    }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].position.distanceTo(nodes[j].position) < 1.3) {
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([nodes[i].position.clone(), nodes[j].position.clone()]), new THREE.LineBasicMaterial({ color: new THREE.Color(colors.glow), transparent: true, opacity: 0.28 })));
      }
    }
    const lGlobe = makeLabel('Virtual World', colors.primary); lGlobe.position.set(-1.8, 1.0, 0); group.add(lGlobe);
    const lNode = makeLabel('User Node', colors.glow); lNode.position.set(1.8, -0.6, 0); group.add(lNode);

    group.userData.parts = [
      { id: 0, nameTH: 'Virtual World Globe', name: 'Virtual World', descTH: 'โลกเสมือนขนาดใหญ่เชื่อมต่อกันด้วย Internet ผู้ใช้เข้าถึงผ่าน VR/AR หรือหน้าจอปกติ', desc: 'A vast virtual world accessible via VR/AR headsets or regular screens.' },
      { id: 1, nameTH: 'User Nodes (ผู้ใช้)', name: 'User Nodes', descTH: 'แต่ละจุดแทน Avatar ผู้ใช้ สามารถโต้ตอบ ทำงาน เล่น และซื้อขายสินค้า digital ได้', desc: 'Each node represents a user\'s avatar — they can interact, work, play and trade digital assets.' }
    ];
    group.userData.animate = (t) => { nodes.forEach((n, i) => { n.material.emissiveIntensity = 0.5 + 0.5 * Math.sin(t * 0.002 + i); }); };
    return group;
  },

  hyperloop_pod(colors) {
    const group = new THREE.Group();
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 4.2, 24), this.mat(colors.secondary, colors.secondary, 0.1, { transparent: true, opacity: 0.32, side: THREE.BackSide }));
    tube.rotation.z = Math.PI / 2; tag(tube, 0); group.add(tube);
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 1.7, 12), this.mat(colors.primary, colors.primary, 0.5));
    pod.rotation.z = Math.PI / 2; tag(pod, 1); group.add(pod);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.39, 0.65, 12), this.mat(colors.primary, colors.primary, 0.4));
    nose.rotation.z = -Math.PI / 2; nose.position.x = 1.18; tag(nose, 1); group.add(nose);
    const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.32, 1.1, 8), new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.glow), emissive: new THREE.Color(colors.glow), emissiveIntensity: 0.9, transparent: true, opacity: 0.6 }));
    trail.rotation.z = Math.PI / 2; trail.position.x = -1.65; tag(trail, 1); group.add(trail);

    const lTube = makeLabel('Vacuum Tube', colors.secondary); lTube.position.set(0, 0.95, 0); group.add(lTube);
    const lPod = makeLabel('Maglev Pod', colors.primary); lPod.position.set(0, -0.78, 0); group.add(lPod);

    group.userData.parts = [
      { id: 0, nameTH: 'ท่อสูญญากาศ (Vacuum Tube)', name: 'Vacuum Tube', descTH: 'ท่อแรงดันต่ำมาก (1/1000 ของบรรยากาศ) ลดแรงต้านอากาศเกือบเป็นศูนย์', desc: 'Near-vacuum tube (1/1000 atm) eliminates nearly all air resistance.' },
      { id: 1, nameTH: 'Maglev Pod (แคปซูล)', name: 'Maglev Pod', descTH: 'แคปซูลลอยตัวด้วยแม่เหล็กไฟฟ้า ไม่มีการสัมผัสพื้น ความเร็วได้ถึง 1200 กม./ชม.', desc: 'Magnetically levitated capsule — no contact with walls, enabling speeds up to 1200 km/h.' }
    ];
    group.userData.animate = (t) => { trail.material.opacity = 0.4 + 0.3 * Math.sin(t * 0.005); };
    return group;
  },

  exo_suit(colors) {
    const group = new THREE.Group();
    const m = this.mat(colors.primary, colors.primary, 0.3);
    const jm = this.mat(colors.glow, colors.glow, 0.9);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.05, 0.48), m.clone()); torso.position.y = 0.5; tag(torso, 0); group.add(torso);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.42), m.clone()); head.position.y = 1.42; tag(head, 0); group.add(head);
    [[-0.58, 0.9], [0.58, 0.9]].forEach(([x, y]) => {
      const u = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.65), m.clone()); u.position.set(x, y - 0.3, 0); tag(u, 1); group.add(u);
      const j1 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), jm.clone()); j1.position.set(x, y - 0.65, 0); tag(j1, 1); group.add(j1);
      const lo = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.65), m.clone()); lo.position.set(x, y - 1.0, 0); tag(lo, 1); group.add(lo);
    });
    [[-0.23, -0.2], [0.23, -0.2]].forEach(([x]) => {
      const u = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.115, 0.75), m.clone()); u.position.set(x, -0.55, 0); tag(u, 2); group.add(u);
      const kn = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), jm.clone()); kn.position.set(x, -0.95, 0); tag(kn, 2); group.add(kn);
      const lo = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 0.75), m.clone()); lo.position.set(x, -1.35, 0); tag(lo, 2); group.add(lo);
    });
    const lJoint = makeLabel('Power Joint', colors.glow); lJoint.position.set(1.2, 0.3, 0); group.add(lJoint);
    const lTorso = makeLabel('Power Unit', colors.primary); lTorso.position.set(-1.3, 0.5, 0); group.add(lTorso);

    group.userData.parts = [
      { id: 0, nameTH: 'ตัวถัง + Power Unit', name: 'Torso & Power', descTH: 'บรรจุแบตเตอรี่หรือระบบ hydraulic และ computer ควบคุม เพิ่มกำลังกล้ามเนื้อได้หลายสิบเท่า', desc: 'Houses battery/hydraulics and control computer, amplifying muscle force many times over.' },
      { id: 1, nameTH: 'ข้อต่อแขนพลังงาน', name: 'Powered Arm Joints', descTH: 'ข้อต่อ servo หรือ hydraulic ขยายแรงของแขน ใช้ในงาน logistics หรือฟื้นฟูผู้ป่วย', desc: 'Servo/hydraulic joints amplify arm strength for logistics work or medical rehabilitation.' },
      { id: 2, nameTH: 'ขาและเข่าพลังงาน', name: 'Powered Leg Joints', descTH: 'ขาเสริมกำลังช่วยเดินบนพื้นขรุขระ แบกน้ำหนักหนัก หรือช่วยผู้พิการ', desc: 'Assists walking on rough terrain, carrying heavy loads, or helping paralyzed patients.' }
    ];
    group.userData.animate = () => {};
    return group;
  },

  bio_print(colors) {
    const group = new THREE.Group();
    const m = this.mat(colors.primary, colors.primary, 0.3);
    [[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]].forEach(([x, z]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.6), m.clone()); p.position.set(x, 0, z); tag(p, 0); group.add(p);
    });
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.07, 1.85), this.mat(colors.secondary, colors.secondary, 0.2)); bed.position.y = -1.1; tag(bed, 1); group.add(bed);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.07, 0.07), m.clone()); rail.position.y = 0.7; group.add(rail);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.38, 8), this.mat(colors.glow, colors.glow, 0.8)); head.rotation.x = Math.PI; head.position.y = 0.55; tag(head, 2); group.add(head);
    const organ = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 18), new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.primary), emissive: new THREE.Color(colors.glow), emissiveIntensity: 0.4, transparent: true, opacity: 0.82 }));
    organ.position.y = -1.03; tag(organ, 1); group.add(organ);
    const lHead = makeLabel('Bio-printhead', colors.glow); lHead.position.set(1.3, 0.55, 0); group.add(lHead);
    const lOrgan = makeLabel('Living Tissue 🫀', colors.primary); lOrgan.position.set(-1.5, -0.95, 0); group.add(lOrgan);

    group.userData.parts = [
      { id: 0, nameTH: 'โครงเครื่องพิมพ์', name: 'Bioprinter Frame', descTH: 'โครง precision สำหรับพิมพ์ชีวภาพในสภาวะปลอดเชื้อ ควบคุมอุณหภูมิและความชื้น', desc: 'Precision sterile frame for bioprinting, with controlled temperature and humidity.' },
      { id: 1, nameTH: 'เนื้อเยื่อที่พิมพ์', name: 'Printed Living Tissue', descTH: 'ชั้น hydrogel ผสมเซลล์ที่มีชีวิต พิมพ์ทีละชั้น หลังพิมพ์เซลล์เจริญเติบโตและเชื่อมกัน', desc: 'Layers of hydrogel seeded with living cells, printed one layer at a time until cells fuse.' },
      { id: 2, nameTH: 'Bio-Printhead', name: 'Bio-Printhead', descTH: 'หัวพิมพ์หลายช่องพ่น bioink (เซลล์ + hydrogel) ในตำแหน่งแม่นยำระดับ 50 ไมครอน', desc: 'Multi-channel head deposits bioink (cells + hydrogel) with ~50 micron precision.' }
    ];
    group.userData.animate = (t) => { head.position.x = 0.65 * Math.sin(t * 0.002); organ.material.emissiveIntensity = 0.2 + 0.3 * Math.sin(t * 0.003); };
    return group;
  },

  smart_grid(colors) {
    const group = new THREE.Group();
    const nodes = [];
    const positions = [];
    const types = [{ col: '#fff176', label: 'Solar' }, { col: '#ef9a9a', label: 'Factory' }, { col: '#80cbc4', label: 'Home' }, { col: '#ce93d8', label: 'Storage' }];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = i % 3 === 0 ? 2.1 : (i % 3 === 1 ? 1.3 : 0.6);
      const pos = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * 0.25, Math.sin(a) * r);
      const t = types[i % 4];
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), this.mat(t.col, t.col, 0.7));
      node.position.copy(pos); tag(node, i % 4); group.add(node); nodes.push({ mesh: node, pos }); positions.push(pos);
    }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].pos.distanceTo(nodes[j].pos) < 1.6) {
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([nodes[i].pos.clone(), nodes[j].pos.clone()]), new THREE.LineBasicMaterial({ color: new THREE.Color(colors.primary), transparent: true, opacity: 0.35 })));
      }
    }
    const hub = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), this.mat(colors.glow, colors.glow, 0.9));
    hub.position.y = 0; tag(hub, 0); group.add(hub);
    const lHub = makeLabel('Smart Hub / AI', colors.glow); lHub.position.set(0, 0.55, 0); group.add(lHub);
    const lNode = makeLabel('Grid Nodes', colors.primary); lNode.position.set(2.5, 1.0, 0); group.add(lNode);

    group.userData.parts = [
      { id: 0, nameTH: 'Smart Hub (AI Controller)', name: 'Smart Hub', descTH: 'AI วิเคราะห์และสมดุลการจ่ายไฟทั้งระบบ ตอบสนองต่อ demand ในแบบ Real-time', desc: 'AI analyzes and balances power flow across the whole grid in real time.' },
      { id: 1, nameTH: 'แหล่งผลิตไฟ (Solar)', name: 'Generation Node', descTH: 'โหนดผลิตพลังงาน เช่น โซลาร์ กังหันลม ส่งข้อมูล output ไปยัง hub', desc: 'Generation nodes (solar, wind) report output to the hub for balancing.' },
      { id: 2, nameTH: 'ผู้ใช้ไฟ', name: 'Consumer Node', descTH: 'บ้านและโรงงานติด smart meter รายงานการใช้ไฟ ช่วยปรับค่า demand ได้แม่นยำ', desc: 'Homes and factories with smart meters report usage, enabling precise demand management.' }
    ];
    group.userData.animate = (t) => { nodes.forEach((n, i) => { n.mesh.material.emissiveIntensity = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.002 + i * 0.52)); }); hub.rotation.y = t * 0.002; };
    return group;
  },

  carbon_cap(colors) {
    const group = new THREE.Group();
    const funnel = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.6, 6, 1, true), this.mat(colors.primary, colors.primary, 0.3, { side: THREE.DoubleSide }));
    funnel.position.y = 0.6; tag(funnel, 0); group.add(funnel);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.55), this.mat(colors.secondary, colors.secondary, 0.2));
    tank.position.y = -1.3; tag(tank, 1); group.add(tank);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55), this.mat(colors.primary, colors.primary, 0.2));
    pipe.position.y = -0.28; group.add(pipe);
    const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.22, 12), this.mat(colors.glow, colors.glow, 0.5));
    filter.position.y = -0.05; tag(filter, 2); group.add(filter);
    const particles = [];
    for (let i = 0; i < 18; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), new THREE.MeshPhongMaterial({ color: new THREE.Color('#aaaaaa'), transparent: true, opacity: 0.0 }));
      p.position.set((Math.random() - 0.5) * 2.2, 1.8 + Math.random() * 0.8, (Math.random() - 0.5) * 2.2);
      group.add(p); particles.push({ mesh: p, speed: 0.6 + Math.random(), phase: Math.random() * Math.PI * 2, startY: 1.8 + Math.random() * 0.8 });
    }
    const lFunnel = makeLabel('Air Capture', colors.primary); lFunnel.position.set(-1.8, 1.2, 0); group.add(lFunnel);
    const lFilter = makeLabel('Sorbent Filter', colors.glow); lFilter.position.set(1.5, 0.0, 0); group.add(lFilter);
    const lTank = makeLabel('CO₂ Storage', colors.secondary); lTank.position.set(-1.5, -1.3, 0); group.add(lTank);

    group.userData.parts = [
      { id: 0, nameTH: 'Air Capture Funnel', name: 'Air Capture Unit', descTH: 'ดูดอากาศปริมาณมหาศาลผ่าน sorbent material ที่จับ CO₂ ออกจากอากาศ', desc: 'Fans pull large volumes of air through sorbent materials that capture CO₂.' },
      { id: 1, nameTH: 'CO₂ Storage Tank', name: 'CO₂ Storage', descTH: 'CO₂ ที่จับได้จะถูกบีบอัดและฉีดลงดินใต้โขดหิน หรือนำไปผลิตเป็นวัสดุ', desc: 'Captured CO₂ is compressed and stored underground or converted into materials.' },
      { id: 2, nameTH: 'Sorbent Filter', name: 'Chemical Sorbent', descTH: 'วัสดุเคมีดูดซับ CO₂ แบบเฉพาะเจาะจง เมื่อให้ความร้อนจะปล่อย CO₂ บริสุทธิ์ออกมา', desc: 'Chemical material selectively absorbs CO₂; heating releases it as pure gas.' }
    ];
    group.userData.animate = (t) => { particles.forEach(p => { p.mesh.position.y -= 0.022 * p.speed; p.mesh.material.opacity = Math.max(0, 0.7 * (1 - (p.startY - p.mesh.position.y) / 2.4)); if (p.mesh.position.y < -0.2) { p.mesh.position.set((Math.random() - 0.5) * 2.2, p.startY, (Math.random() - 0.5) * 2.2); } }); };
    return group;
  },

  q_sensor(colors) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 2), this.mat(colors.primary, colors.primary, 0.7, { transparent: true, opacity: 0.88 }));
    tag(core, 0); group.add(core);
    const wire = new THREE.Mesh(new THREE.OctahedronGeometry(0.64, 2), new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.glow), wireframe: true, transparent: true, opacity: 0.45 }));
    group.add(wire);
    const rings = [];
    for (let r = 1; r <= 3; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.58, 0.022, 6, 50), new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.glow), transparent: true, opacity: 0.5 - r * 0.1 }));
      ring.rotation.set((r * Math.PI) / 5, 0, (r * Math.PI) / 7); tag(ring, 1); group.add(ring); rings.push(ring);
    }
    const lCore = makeLabel('Diamond NV Center', colors.primary); lCore.position.set(-1.7, 0.7, 0); group.add(lCore);
    const lRings = makeLabel('Quantum Field', colors.glow); lRings.position.set(1.7, 0, 0); group.add(lRings);

    group.userData.parts = [
      { id: 0, nameTH: 'Diamond NV Center', name: 'Diamond Defect Core', descTH: 'ข้อบกพร่องในผลึกเพชร (Nitrogen-Vacancy) ที่ไวต่อสนามแม่เหล็กและไฟฟ้าในระดับควอนตัม', desc: 'Nitrogen-Vacancy defects in diamond crystal that are ultra-sensitive to magnetic and electric fields.' },
      { id: 1, nameTH: 'Quantum Sensing Field', name: 'Sensing Fields', descTH: 'วงแหวนแสดงสนามควอนตัมรอบ sensor ความแม่นยำสูงกว่า conventional sensor ถึง 1 ล้านเท่า', desc: 'Quantum sensing fields — up to 1 million times more sensitive than conventional sensors.' }
    ];
    group.userData.animate = (t) => { wire.rotation.y = t * 0.001; wire.rotation.x = t * 0.0007; core.material.emissiveIntensity = 0.5 + 0.3 * Math.sin(t * 0.003); rings.forEach((r, i) => { r.rotation.z += 0.003 * (i + 1); }); };
    return group;
  },

  // ── Build dispatch ────────────────────────────────────────────────────────
  build(modelType, colors) {
    const map = {
      neural: 'neural', quantum: 'quantum', blockchain: 'blockchain',
      robot: 'robot', tower5g: 'tower5g', dna: 'dna', ar_device: 'ar_device',
      vr_headset: 'vr_headset', bci_chip: 'bci_chip', auto_car: 'auto_car',
      rocket: 'rocket', solar_array: 'solar_array', tokamak: 'tokamak',
      nano_struct: 'nano_struct', printer3d: 'printer3d', drone: 'drone',
      metaverse_globe: 'metaverse_globe', hyperloop_pod: 'hyperloop_pod',
      exo_suit: 'exo_suit', satellite: 'satellite', server_rack: 'server_rack',
      bio_print: 'bio_print', smart_grid: 'smart_grid',
      carbon_cap: 'carbon_cap', q_sensor: 'q_sensor'
    };
    const fn = map[modelType] || 'nano_struct';
    return this[fn](colors);
  }
};
