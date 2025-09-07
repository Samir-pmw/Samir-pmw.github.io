const PROJECTS_URL = '../data/projects.json';
const TAGS_URL = '../data/tags.json';

let projects = [];
let tags = [];
const selectedTags = new Set();

const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

async function loadData(){
  const [pRes, tRes] = await Promise.all([
    fetch(PROJECTS_URL),
    fetch(TAGS_URL)
  ]);
  projects = await pRes.json();
  tags = await tRes.json();
  renderGlobalTags();
  renderGrid(projects);
}

function renderGlobalTags(){
  const container = qs('#global-tags');
  container.innerHTML = '';
  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'tag';
    btn.type = 'button';
    btn.textContent = tag;
    btn.dataset.tag = tag;
    btn.addEventListener('click', () => {
      const active = selectedTags.has(tag);
      if(active) selectedTags.delete(tag); else selectedTags.add(tag);
      updateGlobalTagStates();
      applyFilters();
    });
    container.appendChild(btn);
  });
}

function updateGlobalTagStates(){
  qsa('#global-tags .tag').forEach(el => {
    el.dataset.active = selectedTags.has(el.dataset.tag) ? 'true' : 'false';
  });
}

function addTiltListeners(card) {
  const wrapper = card.querySelector('.wrapper');
  if (!wrapper) return;

  let raf = null;
  let nx = 0, ny = 0; // normalized -1..1

  const style = getComputedStyle(card);
  // read CSS variables (fallbacks)
  const tiltMax = parseFloat(style.getPropertyValue('--tilt-max')) || 4;
  const translateMax = parseFloat(style.getPropertyValue('--card-translate')) || 6;
  // read tilt Z (string like "-10px"); fallback to -10px
  const tiltZVar = style.getPropertyValue('--tilt-z').trim() || '-10px';

  function update() {
    raf = null;
    // rotateX (around X axis) should respond to vertical cursor (ny)
    const rotateX = (-ny) * tiltMax; // invert so moving cursor down -> rotateX positive
    const rotateY = (nx) * tiltMax;
    // wrapper gets the 3D rotation + slight translateZ to reinforce depth
    wrapper.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${tiltZVar})`;
    // card itself translates a bit opposite to cursor to create parallax / afastar feeling
    const tx = -nx * translateMax;
    const ty = -ny * (translateMax * 0.5);
    card.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    card.classList.add('is-tilting');
  }

  const onMove = (clientX, clientY) => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const px = (clientX - cx) / (rect.width / 2); // -1..1
    const py = (clientY - cy) / (rect.height / 2);
    nx = Math.max(-1, Math.min(1, px));
    ny = Math.max(-1, Math.min(1, py));
    if (!raf) raf = requestAnimationFrame(update);
  };

  const mouseMoveHandler = (e) => onMove(e.clientX, e.clientY);
  const touchMoveHandler = (e) => {
    if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const reset = () => {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    nx = 0; ny = 0;
    wrapper.style.transform = '';
    card.style.transform = '';
    card.classList.remove('is-tilting');
  };

  card.addEventListener('mousemove', mouseMoveHandler);
  card.addEventListener('touchmove', touchMoveHandler, { passive: true });
  card.addEventListener('mouseleave', reset);
  card.addEventListener('touchend', reset);
}

function renderGrid(list){
  const grid = qs('#projects-grid');
  grid.innerHTML = '';
  if(!list.length){
    const p = document.createElement('p');
    p.textContent = 'Nenhum projeto encontrado.';
    p.style.color = 'var(--cor-texto)';
    grid.appendChild(p);
    return;
  }
  list.forEach(proj => {
    const a = document.createElement('a');
    a.className = 'project-link';
    a.href = proj.url || '#';
    a.target = '_blank';
    a.rel = 'noopener';

    const card = document.createElement('div');
    card.className = 'card';
    // add reveal class if you want scroll animations
    card.classList.add('js-reveal-up');

    // tags overlay (top)
    const tagsWrap = document.createElement('div');
    tagsWrap.className = 'card-tags';
    proj.tags.forEach(t => {
      const tbtn = document.createElement('button');
      tbtn.className = 'tag';
      tbtn.type = 'button';
      tbtn.textContent = t;
      tbtn.dataset.tag = t;
      // clicking a tag on card toggles global filter
      tbtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if(selectedTags.has(t)) selectedTags.delete(t); else selectedTags.add(t);
        updateGlobalTagStates();
        applyFilters();
      });
      tagsWrap.appendChild(tbtn);
    });
    card.appendChild(tagsWrap);

    // wrapper + cover image
    const wrap = document.createElement('div');
    wrap.className = 'wrapper';
    const img = document.createElement('img');
    img.className = 'cover-image';
    img.src = proj.cover || '';
    img.alt = proj.title || '';
    wrap.appendChild(img);
    card.appendChild(wrap);

    // title overlay (texto)
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = proj.title;
    card.appendChild(title);

    // character image optional
    if(proj.character){
      const ch = document.createElement('img');
      ch.className = 'character';
      ch.src = proj.character;
      ch.alt = proj.title + ' character';
      card.appendChild(ch);
    }

    // after appending the card to the grid, attach tilt listeners
    // (we append first so layout/bounding rect are correct)
    a.appendChild(card);
    grid.appendChild(a);
    addTiltListeners(card);
  });
}

function applyFilters(){
  const q = qs('#projects-search').value.trim().toLowerCase();
  const filtered = projects.filter(p => {
    const titleMatch = p.title.toLowerCase().includes(q);
    const tagsMatchText = p.tags.some(t => t.toLowerCase().includes(q));
    const textMatch = q === '' || titleMatch || tagsMatchText;

    if(!textMatch) return false;
    if(selectedTags.size === 0) return true;
    // match if project has at least one selected tag
    return p.tags.some(t => selectedTags.has(t));
  });
  renderGrid(filtered);
}

function debounce(fn, delay=200){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), delay); };
}

document.addEventListener('DOMContentLoaded', () => {
  // create search input handler
  const searchEl = qs('#projects-search');
  if(searchEl){
    searchEl.addEventListener('input', debounce(() => {
      applyFilters();
    }, 180));
  }
  loadData().catch(err => {
    console.error('Erro ao carregar projetos/tags', err);
  });
});
