// ===== STATE =====
let feedItems = [], feedPage = 0, isLoading = false;
let currentTech = null, threeCtx = null, animId = null, searchTimeout = null;
let currentModel = null, currentCamera = null, currentCanvas = null;
let hoveredPartId = null, mouseDownPos = null;
const PAGE_SIZE = 6;

// ===== FUZZY SEARCH =====
function scoreMatch(tech, q) {
  if (!q) return 0;
  const ql = q.toLowerCase().trim();
  const name = tech.name.toLowerCase(), nameTH = tech.nameTH.toLowerCase();
  const tagsStr = tech.tags.join(' ').toLowerCase();
  let s = 0;
  if (name === ql || nameTH === ql) s += 100;
  else if (name.startsWith(ql) || nameTH.startsWith(ql)) s += 80;
  else if (name.includes(ql) || nameTH.includes(ql)) s += 60;
  tech.tags.forEach(t => { if (t.toLowerCase() === ql) s += 50; else if (t.toLowerCase().includes(ql)) s += 30; });
  if (tech.shortDesc.toLowerCase().includes(ql)) s += 20;
  if (tagsStr.includes(ql)) s += 15;
  let matched = 0, nameIdx = 0;
  for (const ch of ql) { const idx = name.indexOf(ch, nameIdx); if (idx !== -1) { matched++; nameIdx = idx + 1; } }
  s += (matched / ql.length) * 10;
  return s;
}
function searchTechs(q) {
  if (!q.trim()) return [];
  return TECHNOLOGIES.map(t => ({ tech: t, score: scoreMatch(t, q) })).filter(r => r.score > 5).sort((a, b) => b.score - a.score).map(r => r.tech);
}

// ===== FEED =====
function shuffleArray(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function initFeed() { feedItems = shuffleArray(TECHNOLOGIES); feedPage = 0; }
function getNextPage() {
  const start = feedPage * PAGE_SIZE;
  if (start >= feedItems.length) feedItems = [...feedItems, ...shuffleArray(TECHNOLOGIES)];
  feedPage++;
  return feedItems.slice(start, start + PAGE_SIZE);
}

// ===== CARDS =====
function createCard(tech) {
  const card = document.createElement('article');
  card.className = 'tech-card';
  card.style.setProperty('--accent', tech.colors.primary);
  card.style.setProperty('--glow', tech.colors.glow);
  card.innerHTML = `
    <div class="card-glow"></div>
    <div class="card-top"><span class="card-icon">${tech.icon}</span><span class="card-category">${tech.category}</span></div>
    <h3 class="card-title">${tech.name}</h3>
    <p class="card-title-th">${tech.nameTH}</p>
    <p class="card-desc">${tech.shortDesc}</p>
    <div class="card-footer"><span class="card-year">${tech.year}</span><div class="card-tags">${tech.tags.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}</div></div>`;
  card.addEventListener('click', () => openArticle(tech));
  return card;
}
function renderFeedPage(items, container) {
  items.forEach((tech, i) => { const c = createCard(tech); c.style.animationDelay = `${i * 80}ms`; container.appendChild(c); });
}

// ===== WIKIPEDIA =====
async function fetchWikiExtract(query, lang = 'en') {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=false&explaintext=true&format=json&titles=${encodeURIComponent(query)}&origin=*&pithumbsize=600&redirects=1`;
    const data = await (await fetch(url)).json();
    const page = Object.values(data.query?.pages || {})[0];
    if (!page || page.missing) return null;
    return { title: page.title, extract: page.extract || '', thumbnail: page.thumbnail?.source || null };
  } catch { return null; }
}
function formatExtract(text, maxChars = 3000) {
  if (!text) return '<p>ไม่พบข้อมูล</p>';
  return text.slice(0, maxChars).split('\n').filter(p => p.trim().length > 20).map(p => `<p>${p.trim()}</p>`).join('');
}

// ===== 3D SCENE =====
function initThreeScene(tech) {
  destroyThreeScene();
  const canvas = document.getElementById('model-canvas');
  if (!canvas) return;

  const { renderer, scene, camera, controls, pointLight } = ModelBuilder.createScene(canvas, tech.colors);
  pointLight.color.set(new THREE.Color(tech.colors.glow));

  const model = ModelBuilder.build(tech.model, tech.colors);
  scene.add(model);
  currentModel = model;
  currentCamera = camera;
  currentCanvas = canvas;

  setupModelInteraction(canvas, model, camera);

  const resize = () => {
    const w = canvas.offsetWidth || 800, h = canvas.offsetHeight || 440;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);

  const startTime = performance.now();
  function animate() {
    animId = requestAnimationFrame(animate);
    const t = performance.now() - startTime;
    if (model.userData.animate) model.userData.animate(t);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  threeCtx = { renderer, controls, resize };
}

function destroyThreeScene() {
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  if (threeCtx) { window.removeEventListener('resize', threeCtx.resize); threeCtx.renderer.dispose(); threeCtx = null; }
  currentModel = null; currentCamera = null; currentCanvas = null;
  closePartPanel();
  if (threeCtx?.interactionCleanup) threeCtx.interactionCleanup();
}

// ===== MODEL INTERACTION =====
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getAllInteractiveMeshes(model) {
  const meshes = [];
  model.traverse(obj => { if (obj.userData.partId !== undefined && obj.type !== 'Line') meshes.push(obj); });
  return meshes;
}

function highlightPart(model, partId, on) {
  model.traverse(obj => {
    if (obj.userData.partId === partId && obj.material) {
      if (on) {
        if (obj.userData._origEI === undefined) obj.userData._origEI = obj.material.emissiveIntensity || 0;
        obj.material.emissiveIntensity = Math.min((obj.userData._origEI || 0) + 0.55, 1.0);
      } else {
        if (obj.userData._origEI !== undefined) obj.material.emissiveIntensity = obj.userData._origEI;
      }
    }
  });
}

function setupModelInteraction(canvas, model, camera) {
  const meshes = getAllInteractiveMeshes(model);

  const onMouseMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(meshes, false);
    const newId = hits.length > 0 ? hits[0].object.userData.partId : null;
    if (newId !== hoveredPartId) {
      if (hoveredPartId !== null) highlightPart(model, hoveredPartId, false);
      hoveredPartId = newId;
      if (hoveredPartId !== null) highlightPart(model, hoveredPartId, true);
      canvas.style.cursor = hoveredPartId !== null ? 'pointer' : 'grab';
    }
  };

  const onMouseDown = (e) => { mouseDownPos = { x: e.clientX, y: e.clientY }; };
  const onMouseUp = (e) => {
    if (!mouseDownPos) return;
    const dx = e.clientX - mouseDownPos.x, dy = e.clientY - mouseDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) < 6 && hoveredPartId !== null) {
      const part = (currentModel?.userData.parts || []).find(p => p.id === hoveredPartId);
      if (part) showPartPanel(part);
    }
    mouseDownPos = null;
  };

  // Touch support
  const onTouchStart = (e) => { if (e.touches.length === 1) mouseDownPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    if (!mouseDownPos || !e.changedTouches.length) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - mouseDownPos.x, dy = t.clientY - mouseDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) < 10) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((t.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const part = (currentModel?.userData.parts || []).find(p => p.id === hits[0].object.userData.partId);
        if (part) showPartPanel(part);
      }
    }
    mouseDownPos = null;
  };

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchend', onTouchEnd);

  return () => {
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchend', onTouchEnd);
  };
}

// ===== PART INFO PANEL =====
function showPartPanel(part) {
  const panel = document.getElementById('part-info-panel');
  document.getElementById('part-name').textContent = part.nameTH;
  document.getElementById('part-name-en').textContent = part.name;
  document.getElementById('part-desc').textContent = part.descTH;
  document.getElementById('part-desc-en').textContent = part.desc;
  panel.classList.remove('hidden', 'panel-exit');
  panel.classList.add('panel-enter');
}
function closePartPanel() {
  const panel = document.getElementById('part-info-panel');
  if (panel) panel.classList.add('hidden');
}

// ===== ARTICLE VIEW =====
async function openArticle(tech) {
  currentTech = tech;
  document.getElementById('home-view').classList.add('hidden');
  const articleView = document.getElementById('article-view');
  articleView.classList.remove('hidden');
  articleView.scrollTop = 0;
  window.scrollTo(0, 0);

  document.getElementById('article-title').textContent = tech.name;
  document.getElementById('article-title-main').textContent = tech.name;
  document.getElementById('article-title-th').textContent = tech.nameTH;
  document.getElementById('article-category').textContent = tech.category;
  document.getElementById('article-year').textContent = `เริ่มต้น ${tech.year}`;
  document.getElementById('article-tags').innerHTML = tech.tags.map(t => `<span class="tag tag-lg">${t}</span>`).join('');
  document.getElementById('model-wrapper').style.setProperty('--accent', tech.colors.primary);

  const contentEl = document.getElementById('article-content');
  contentEl.innerHTML = '<div class="loading-text">กำลังโหลดข้อมูล...</div>';

  // Show part count hint
  const partsCount = (TECHNOLOGIES.find(t => t.id === tech.id)?.model) ? 'มี' : '';
  document.getElementById('model-hint-text').textContent = `🖱 ลากหมุน · Scroll ซูม · คลิกชิ้นส่วนเพื่อดูรายละเอียด`;

  setTimeout(() => initThreeScene(tech), 80);

  const [enData, thData] = await Promise.all([
    fetchWikiExtract(tech.wikiEN, 'en'),
    fetchWikiExtract(tech.wikiTH, 'th')
  ]);

  let html = '';
  if (thData?.extract) html += `<div class="content-section"><h4 class="section-label">ภาษาไทย — Wikipedia</h4>${formatExtract(thData.extract)}</div>`;
  if (enData?.extract) html += `<div class="content-section"><h4 class="section-label">English — Wikipedia</h4>${formatExtract(enData.extract, 2000)}</div>`;
  if (!html) html = '<p class="no-data">ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</p>';
  contentEl.innerHTML = html;

  const sources = [];
  if (enData) sources.push({ label: `Wikipedia (EN): ${enData.title}`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(tech.wikiEN)}` });
  if (thData) sources.push({ label: `Wikipedia (TH): ${thData.title}`, url: `https://th.wikipedia.org/wiki/${encodeURIComponent(tech.wikiTH)}` });
  sources.push({ label: 'Simple Wikipedia', url: `https://simple.wikipedia.org/wiki/${encodeURIComponent(tech.wikiEN)}` });
  document.getElementById('article-sources').innerHTML = sources.map(s => `<a href="${s.url}" target="_blank" class="source-link">${s.label} ↗</a>`).join('');
}

function closeArticle() {
  destroyThreeScene();
  document.getElementById('home-view').classList.remove('hidden');
  document.getElementById('article-view').classList.add('hidden');
  window.scrollTo(0, 0);
}

// ===== SEARCH =====
function initSearch() {
  const input = document.getElementById('search-input');
  const suggestionsEl = document.getElementById('search-suggestions');
  const clearBtn = document.getElementById('search-clear');
  const resultsEl = document.getElementById('search-results-feed');
  const mainFeed = document.getElementById('main-feed');
  const searchFeedWrap = document.getElementById('search-feed-wrap');

  input.addEventListener('input', () => {
    const q = input.value;
    clearBtn.style.display = q ? 'flex' : 'none';
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (!q.trim()) { suggestionsEl.classList.add('hidden'); searchFeedWrap.classList.add('hidden'); mainFeed.classList.remove('hidden'); return; }
      const results = searchTechs(q);
      suggestionsEl.innerHTML = results.length > 0
        ? results.slice(0, 6).map(t => `<div class="suggestion-item" data-id="${t.id}"><span class="sug-icon">${t.icon}</span><div><span class="sug-name">${t.name}</span><span class="sug-cat">${t.category}</span></div></div>`).join('')
        : '<div class="sug-empty">ไม่พบผลลัพธ์</div>';
      suggestionsEl.classList.remove('hidden');
    }, 250);
  });

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const q = input.value;
    suggestionsEl.classList.add('hidden');
    if (!q.trim()) return;
    const results = searchTechs(q);
    resultsEl.innerHTML = results.length === 0
      ? '<div class="no-results">ไม่พบเทคโนโลยีที่ตรงกับคำค้นหา</div>'
      : '';
    results.forEach((t, i) => { const c = createCard(t); c.style.animationDelay = `${i * 60}ms`; resultsEl.appendChild(c); });
    searchFeedWrap.classList.remove('hidden');
    mainFeed.classList.add('hidden');
  });

  suggestionsEl.addEventListener('click', e => {
    const item = e.target.closest('.suggestion-item');
    if (!item) return;
    const tech = TECHNOLOGIES.find(t => t.id === item.dataset.id);
    if (tech) { suggestionsEl.classList.add('hidden'); input.value = tech.name; clearBtn.style.display = 'flex'; openArticle(tech); }
  });

  clearBtn.addEventListener('click', () => {
    input.value = ''; clearBtn.style.display = 'none';
    suggestionsEl.classList.add('hidden'); searchFeedWrap.classList.add('hidden'); mainFeed.classList.remove('hidden');
  });

  document.addEventListener('click', e => { if (!e.target.closest('.search-wrapper')) suggestionsEl.classList.add('hidden'); });
}

// ===== MODEL CONTROLS =====
function initModelControls() {
  document.getElementById('btn-rotate').addEventListener('click', function () {
    if (!threeCtx) return;
    threeCtx.controls.autoRotate = !threeCtx.controls.autoRotate;
    this.classList.toggle('active', threeCtx.controls.autoRotate);
    this.title = threeCtx.controls.autoRotate ? 'หยุดหมุน' : 'หมุนอัตโนมัติ';
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!threeCtx) return;
    threeCtx.controls.reset();
    closePartPanel();
  });

  document.getElementById('part-info-close').addEventListener('click', closePartPanel);

  // Parts list toggle
  document.getElementById('btn-parts').addEventListener('click', () => {
    if (!currentModel) return;
    const parts = currentModel.userData.parts || [];
    if (!parts.length) return;
    const list = document.getElementById('parts-list-panel');
    list.innerHTML = parts.map(p =>
      `<div class="parts-list-item" data-id="${p.id}">
        <span class="parts-list-name">${p.nameTH}</span>
        <span class="parts-list-en">${p.name}</span>
      </div>`
    ).join('');
    list.classList.toggle('hidden');
    list.querySelectorAll('.parts-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const part = parts.find(p => p.id === parseInt(item.dataset.id));
        if (part) { showPartPanel(part); list.classList.add('hidden'); if (currentModel) highlightPart(currentModel, part.id, true); setTimeout(() => { if (currentModel) highlightPart(currentModel, part.id, false); }, 1800); }
      });
    });
  });

  document.addEventListener('click', e => {
    const list = document.getElementById('parts-list-panel');
    if (!e.target.closest('#btn-parts') && !e.target.closest('#parts-list-panel')) list.classList.add('hidden');
  });
}

// ===== INFINITE SCROLL =====
function initInfiniteScroll() {
  const sentinel = document.getElementById('feed-sentinel');
  const feed = document.getElementById('feed-grid');
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || isLoading) return;
    isLoading = true;
    const ind = document.getElementById('load-indicator');
    ind.classList.remove('hidden');
    setTimeout(() => { renderFeedPage(getNextPage(), feed); ind.classList.add('hidden'); isLoading = false; }, 550);
  }, { rootMargin: '200px' }).observe(sentinel);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initFeed();
  renderFeedPage(getNextPage(), document.getElementById('feed-grid'));
  document.getElementById('back-btn').addEventListener('click', closeArticle);
  initSearch();
  initInfiniteScroll();
  initModelControls();
});
