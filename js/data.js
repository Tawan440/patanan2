const TECHNOLOGIES = [
  {
    id: 'ai', name: 'Artificial Intelligence', nameTH: 'ปัญญาประดิษฐ์',
    category: 'Computing', icon: '🧠',
    tags: ['AI', 'Machine Learning', 'Deep Learning', 'Neural Network'],
    model: 'neural', colors: { primary: '#4fc3f7', secondary: '#0277bd', glow: '#4fc3f7' },
    wikiEN: 'Artificial intelligence', wikiTH: 'ปัญญาประดิษฐ์',
    shortDesc: 'ระบบที่จำลองความฉลาดของมนุษย์เพื่อทำงานและเรียนรู้จากข้อมูล', year: 1956
  },
  {
    id: 'quantum', name: 'Quantum Computing', nameTH: 'คอมพิวเตอร์ควอนตัม',
    category: 'Computing', icon: '⚛️',
    tags: ['Quantum', 'Qubit', 'Superposition', 'Entanglement'],
    model: 'quantum', colors: { primary: '#ce93d8', secondary: '#7b1fa2', glow: '#e040fb' },
    wikiEN: 'Quantum computing', wikiTH: 'การประมวลผลควอนตัม',
    shortDesc: 'การประมวลผลโดยใช้ปรากฏการณ์ควอนตัมเพื่อความเร็วสูงอย่างก้าวกระโดด', year: 1980
  },
  {
    id: 'blockchain', name: 'Blockchain', nameTH: 'บล็อกเชน',
    category: 'Computing', icon: '🔗',
    tags: ['Blockchain', 'Cryptocurrency', 'Decentralized', 'Web3'],
    model: 'blockchain', colors: { primary: '#ffd54f', secondary: '#f57f17', glow: '#ffcc02' },
    wikiEN: 'Blockchain', wikiTH: 'บล็อกเชน',
    shortDesc: 'ระบบฐานข้อมูลกระจายศูนย์ที่ปลอดภัยและโปร่งใสไม่สามารถแก้ไขได้', year: 2008
  },
  {
    id: 'robotics', name: 'Robotics', nameTH: 'หุ่นยนต์',
    category: 'Engineering', icon: '🤖',
    tags: ['Robots', 'Automation', 'Mechanical', 'AI'],
    model: 'robot', colors: { primary: '#80cbc4', secondary: '#00695c', glow: '#4db6ac' },
    wikiEN: 'Robotics', wikiTH: 'หุ่นยนต์',
    shortDesc: 'วิทยาศาสตร์และวิศวกรรมในการออกแบบสร้างและควบคุมหุ่นยนต์', year: 1954
  },
  {
    id: '5g', name: '5G Network', nameTH: 'เครือข่าย 5G',
    category: 'Communication', icon: '📡',
    tags: ['5G', 'Wireless', 'Mobile', 'IoT'],
    model: 'tower5g', colors: { primary: '#a5d6a7', secondary: '#2e7d32', glow: '#66bb6a' },
    wikiEN: '5G', wikiTH: '5จี',
    shortDesc: 'เทคโนโลยีเครือข่ายไร้สายรุ่นที่ 5 ความเร็วสูงพิเศษและ latency ต่ำ', year: 2019
  },
  {
    id: 'crispr', name: 'CRISPR Gene Editing', nameTH: 'การตัดแต่งยีน CRISPR',
    category: 'Biotechnology', icon: '🧬',
    tags: ['CRISPR', 'DNA', 'Genetics', 'Medicine'],
    model: 'dna', colors: { primary: '#ef9a9a', secondary: '#c62828', glow: '#e57373' },
    wikiEN: 'CRISPR', wikiTH: 'คริสเปอร์',
    shortDesc: 'เทคโนโลยีแก้ไขจีโนมที่แม่นยำสูงปฏิวัติวงการชีววิทยาและการแพทย์', year: 2012
  },
  {
    id: 'ar', name: 'Augmented Reality', nameTH: 'ความจริงเสริม',
    category: 'Immersive Tech', icon: '🥽',
    tags: ['AR', 'Mixed Reality', 'Spatial Computing', 'Hologram'],
    model: 'ar_device', colors: { primary: '#80deea', secondary: '#00838f', glow: '#4dd0e1' },
    wikiEN: 'Augmented reality', wikiTH: 'ความจริงเสริม',
    shortDesc: 'การซ้อนทับข้อมูลดิจิทัลบนโลกจริงผ่านอุปกรณ์สวมใส่', year: 1990
  },
  {
    id: 'vr', name: 'Virtual Reality', nameTH: 'ความจริงเสมือน',
    category: 'Immersive Tech', icon: '🎮',
    tags: ['VR', 'Immersive', 'Simulation', 'Gaming'],
    model: 'vr_headset', colors: { primary: '#b39ddb', secondary: '#4527a0', glow: '#9575cd' },
    wikiEN: 'Virtual reality', wikiTH: 'ความเป็นจริงเสมือน',
    shortDesc: 'สภาพแวดล้อมจำลองที่ดื่มด่ำผู้ใช้ในโลกดิจิทัลแบบสมจริง', year: 1987
  },
  {
    id: 'bci', name: 'Brain-Computer Interface', nameTH: 'อินเทอร์เฟซสมอง-คอมพิวเตอร์',
    category: 'Neurotechnology', icon: '🔬',
    tags: ['BCI', 'Neuralink', 'Neuroscience', 'Implant'],
    model: 'bci_chip', colors: { primary: '#ffab40', secondary: '#e65100', glow: '#ffa726' },
    wikiEN: 'Brain–computer interface', wikiTH: 'ส่วนต่อประสานสมอง-คอมพิวเตอร์',
    shortDesc: 'อุปกรณ์เชื่อมต่อโดยตรงระหว่างสมองกับคอมพิวเตอร์เพื่อควบคุมและสื่อสาร', year: 1970
  },
  {
    id: 'self-driving', name: 'Autonomous Vehicles', nameTH: 'ยานพาหนะอัตโนมัติ',
    category: 'Transportation', icon: '🚗',
    tags: ['Self-driving', 'Tesla', 'Lidar', 'Autonomous'],
    model: 'auto_car', colors: { primary: '#f48fb1', secondary: '#880e4f', glow: '#f06292' },
    wikiEN: 'Autonomous car', wikiTH: 'รถยนต์ไร้คนขับ',
    shortDesc: 'ยานพาหนะขับเคลื่อนตัวเองโดย AI และ sensor ไม่ต้องการผู้ขับ', year: 1985
  },
  {
    id: 'space-tourism', name: 'Space Tourism', nameTH: 'การท่องเที่ยวอวกาศ',
    category: 'Space', icon: '🚀',
    tags: ['SpaceX', 'Space', 'Rocket', 'Blue Origin'],
    model: 'rocket', colors: { primary: '#b0bec5', secondary: '#37474f', glow: '#90a4ae' },
    wikiEN: 'Space tourism', wikiTH: 'การท่องเที่ยวอวกาศ',
    shortDesc: 'การเดินทางสู่อวกาศเพื่อการพักผ่อนและท่องเที่ยวเชิงพาณิชย์', year: 2001
  },
  {
    id: 'solar', name: 'Solar Energy', nameTH: 'พลังงานแสงอาทิตย์',
    category: 'Energy', icon: '☀️',
    tags: ['Solar', 'Photovoltaic', 'Renewable', 'Clean Energy'],
    model: 'solar_array', colors: { primary: '#fff176', secondary: '#f9a825', glow: '#ffee58' },
    wikiEN: 'Solar energy', wikiTH: 'พลังงานแสงอาทิตย์',
    shortDesc: 'การแปลงพลังงานแสงอาทิตย์เป็นพลังงานไฟฟ้าด้วย photovoltaic cells', year: 1954
  },
  {
    id: 'fusion', name: 'Nuclear Fusion', nameTH: 'พลังงานฟิวชันนิวเคลียร์',
    category: 'Energy', icon: '💥',
    tags: ['Fusion', 'Plasma', 'Tokamak', 'ITER'],
    model: 'tokamak', colors: { primary: '#ff8a65', secondary: '#bf360c', glow: '#ff7043' },
    wikiEN: 'Nuclear fusion', wikiTH: 'นิวเคลียร์ฟิวชัน',
    shortDesc: 'พลังงานสะอาดไม่จำกัดจากการรวมนิวเคลียสอะตอมเหมือนดวงอาทิตย์', year: 1950
  },
  {
    id: 'nano', name: 'Nanotechnology', nameTH: 'นาโนเทคโนโลยี',
    category: 'Materials', icon: '⚗️',
    tags: ['Nano', 'Nanomaterials', 'Molecular Engineering'],
    model: 'nano_struct', colors: { primary: '#80cbc4', secondary: '#004d40', glow: '#4db6ac' },
    wikiEN: 'Nanotechnology', wikiTH: 'นาโนเทคโนโลยี',
    shortDesc: 'การควบคุมสสารในระดับนาโนเมตรเพื่อสร้างวัสดุและอุปกรณ์ใหม่', year: 1959
  },
  {
    id: '3d-printing', name: '3D Printing', nameTH: 'การพิมพ์ 3 มิติ',
    category: 'Manufacturing', icon: '🖨️',
    tags: ['3D Printing', 'Additive Manufacturing', 'Prototyping'],
    model: 'printer3d', colors: { primary: '#ce93d8', secondary: '#6a1b9a', glow: '#ab47bc' },
    wikiEN: '3D printing', wikiTH: 'การพิมพ์สามมิติ',
    shortDesc: 'การสร้างวัตถุสามมิติจากไฟล์ดิจิทัลทีละชั้นด้วยวัสดุต่างๆ', year: 1984
  },
  {
    id: 'drone', name: 'Drone Technology', nameTH: 'เทคโนโลยีโดรน',
    category: 'Engineering', icon: '🚁',
    tags: ['Drone', 'UAV', 'Autonomous', 'Aerial'],
    model: 'drone', colors: { primary: '#90caf9', secondary: '#1565c0', glow: '#64b5f6' },
    wikiEN: 'Unmanned aerial vehicle', wikiTH: 'อากาศยานไร้คนขับ',
    shortDesc: 'อากาศยานไร้นักบินที่ควบคุมจากระยะไกลหรือบินอัตโนมัติ', year: 1917
  },
  {
    id: 'metaverse', name: 'Metaverse', nameTH: 'เมทาเวิร์ส',
    category: 'Immersive Tech', icon: '🌐',
    tags: ['Metaverse', 'Virtual World', 'Web3', 'Social VR'],
    model: 'metaverse_globe', colors: { primary: '#81d4fa', secondary: '#0277bd', glow: '#4fc3f7' },
    wikiEN: 'Metaverse', wikiTH: 'เมตาเวิร์ส',
    shortDesc: 'โลกเสมือนจริงที่เชื่อมต่อกันซึ่งผู้คนใช้ชีวิตและทำงานร่วมกัน', year: 2021
  },
  {
    id: 'hyperloop', name: 'Hyperloop', nameTH: 'ไฮเปอร์ลูป',
    category: 'Transportation', icon: '🚄',
    tags: ['Hyperloop', 'High Speed', 'Vacuum Tube', 'Elon Musk'],
    model: 'hyperloop_pod', colors: { primary: '#b0bec5', secondary: '#455a64', glow: '#78909c' },
    wikiEN: 'Hyperloop', wikiTH: 'ไฮเปอร์ลูป',
    shortDesc: 'ระบบขนส่งความเร็วสูงมากในท่อสูญญากาศความเร็วเกิน 1000 กม./ชม.', year: 2013
  },
  {
    id: 'exoskeleton', name: 'Powered Exoskeleton', nameTH: 'โครงร่างภายนอกพลังงาน',
    category: 'Wearable Tech', icon: '🦾',
    tags: ['Exoskeleton', 'Wearable', 'Medical', 'Military'],
    model: 'exo_suit', colors: { primary: '#a5d6a7', secondary: '#1b5e20', glow: '#66bb6a' },
    wikiEN: 'Powered exoskeleton', wikiTH: 'โครงร่างภายนอกที่ขับเคลื่อนด้วยพลังงาน',
    shortDesc: 'ชุดเสริมกำลังสวมใส่ได้เพื่อเพิ่มความสามารถทางกายภาพของมนุษย์', year: 1965
  },
  {
    id: 'satellite-internet', name: 'Satellite Internet', nameTH: 'อินเทอร์เน็ตดาวเทียม',
    category: 'Communication', icon: '🛰️',
    tags: ['Starlink', 'Satellite', 'Internet', 'SpaceX'],
    model: 'satellite', colors: { primary: '#c5cae9', secondary: '#1a237e', glow: '#9fa8da' },
    wikiEN: 'Satellite internet access', wikiTH: 'การเชื่อมต่ออินเทอร์เน็ตผ่านดาวเทียม',
    shortDesc: 'การเชื่อมต่ออินเทอร์เน็ตทั่วโลกผ่านดาวเทียมโคจรต่ำ เช่น Starlink', year: 1993
  },
  {
    id: 'edge-computing', name: 'Edge Computing', nameTH: 'การประมวลผลที่ขอบ',
    category: 'Computing', icon: '💻',
    tags: ['Edge', 'IoT', 'Cloud', 'Distributed'],
    model: 'server_rack', colors: { primary: '#ffcc80', secondary: '#e65100', glow: '#ffb74d' },
    wikiEN: 'Edge computing', wikiTH: 'การประมวลผลที่ขอบเครือข่าย',
    shortDesc: 'การประมวลผลข้อมูลใกล้แหล่งกำเนิดเพื่อลด latency และประหยัดแบนด์วิดท์', year: 2015
  },
  {
    id: 'bioprinting', name: 'Bioprinting', nameTH: 'การพิมพ์ชีวภาพ',
    category: 'Biotechnology', icon: '🫀',
    tags: ['Bioprinting', 'Tissue Engineering', '3D Bio', 'Medicine'],
    model: 'bio_print', colors: { primary: '#f48fb1', secondary: '#880e4f', glow: '#f06292' },
    wikiEN: 'Bioprinting', wikiTH: 'การพิมพ์ชีวภาพสามมิติ',
    shortDesc: 'การพิมพ์เนื้อเยื่อและอวัยวะมนุษย์ด้วยเซลล์ที่มีชีวิตจริง', year: 2000
  },
  {
    id: 'smart-grid', name: 'Smart Grid', nameTH: 'ระบบไฟฟ้าอัจฉริยะ',
    category: 'Energy', icon: '⚡',
    tags: ['Smart Grid', 'Energy', 'IoT', 'Electricity'],
    model: 'smart_grid', colors: { primary: '#ffe082', secondary: '#ff6f00', glow: '#ffd54f' },
    wikiEN: 'Smart grid', wikiTH: 'ระบบไฟฟ้าอัจฉริยะ',
    shortDesc: 'ระบบจัดการพลังงานไฟฟ้าอัจฉริยะด้วย IoT เพื่อประสิทธิภาพสูงสุด', year: 2000
  },
  {
    id: 'carbon-capture', name: 'Carbon Capture', nameTH: 'การดักจับคาร์บอน',
    category: 'Environment', icon: '🌿',
    tags: ['Carbon', 'Climate', 'CCS', 'Clean Tech'],
    model: 'carbon_cap', colors: { primary: '#a5d6a7', secondary: '#1b5e20', glow: '#81c784' },
    wikiEN: 'Carbon capture and storage', wikiTH: 'การดักจับและกักเก็บคาร์บอน',
    shortDesc: 'เทคโนโลยีดักจับและกักเก็บก๊าซ CO₂ เพื่อต่อสู้กับการเปลี่ยนแปลงสภาพภูมิอากาศ', year: 1970
  },
  {
    id: 'quantum-sensor', name: 'Quantum Sensors', nameTH: 'เซนเซอร์ควอนตัม',
    category: 'Computing', icon: '🔭',
    tags: ['Quantum', 'Sensors', 'Precision', 'Navigation'],
    model: 'q_sensor', colors: { primary: '#e1bee7', secondary: '#4a148c', glow: '#ce93d8' },
    wikiEN: 'Quantum sensor', wikiTH: 'เซนเซอร์ควอนตัม',
    shortDesc: 'เซนเซอร์ที่ใช้ปรากฏการณ์ควอนตัมเพื่อความแม่นยำสูงกว่าเซนเซอร์ทั่วไปมาก', year: 2000
  }
];
