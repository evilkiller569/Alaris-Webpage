// Team page — classic layout, Abraham-first, full bio in modal

const el = {
  search: document.getElementById('search'),
  role: document.getElementById('role'),
  sort: document.getElementById('sort'),
  groups: document.getElementById('groups'),
  empty: document.getElementById('empty'),
  year: document.getElementById('year'),
  modalEl: document.getElementById('personModal'),
  modalAvatar: document.getElementById('modalAvatar'),
  modalName: document.getElementById('modalName'),
  modalMeta: document.getElementById('modalMeta'),
  modalBio: document.getElementById('modalBio'),
  modalLinks: document.getElementById('modalLinks'),
};
if (el.year) el.year.textContent = new Date().getFullYear();

const normalize = (s='') => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
const slug = s => normalize(s||'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

// Collapse whitespace + strip any accidental HTML
function cleanText(v=''){
  return String(v).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Pick the best available blurb field from a person object
function getBlurb(p){
  const candidates = [p.cardBlurb, p.blurb, p.bio, p.description, p.about];
  const first = candidates.find(v => v && cleanText(v).length);
  return first ? cleanText(first) : '';
}


// Normalize a section label to a stable key (handles typos & variants)
function sectionKey(name = "") {
  const n = normalize(name).replace(/team|the/g, "").trim();
  if (/advisor/.test(n)) return "advisors";
  if (/co[-\s]*founder/.test(n)) return "co-founders";
  if (/founder/.test(n)) return "founder";
  if (/bio|bioscience|biology/.test(n)) return "bioscience";
  if (/hardware|integration|innov/.test(n)) return "hardware";
  if (/ai|engineering|coding|software/.test(n)) return "ai-engineering";
  if (/member/.test(n)) return "members";
  return "other";
}

// Desired section order (lower is earlier)
const SECTION_WEIGHT = {
  "advisors": 0,
  "founder": 1,
  "co-founders": 2,
  "bioscience": 3,
  "hardware": 4,
  "ai-engineering": 5,
  "members": 6,
  "other": 9
};

function sectionOrder(name) {
  return SECTION_WEIGHT[sectionKey(name)] ?? 9;
}

function shortText(text, max=160){
  if(!text) return '';
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace>80? cut.slice(0,lastSpace):cut).trim() + '…';
}

function assignIds(list){
  const seen = new Map();
  for (const p of list){
    let base = slug(p.name||'member');
    let id = base, n = 1;
    while(seen.has(id)){ id = base + '-' + (++n); }
    seen.set(id, true);
    p.id = id;
  }
  return list;
}

let PEOPLE = [];
const PEOPLE_BY_ID = new Map();

async function load(){
  try{
    const res = await fetch('team.json', {cache:'no-cache'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    PEOPLE = await res.json();
  }catch(e){
    console.error('Failed to load team.json', e);
    PEOPLE = [];
  }
  assignIds(PEOPLE);
  PEOPLE.forEach(p => PEOPLE_BY_ID.set(p.id, p));
  populateRoleFilter(PEOPLE);
  render();
}

function populateRoleFilter(data){
  const roles = Array.from(new Set(data.map(p => p.role).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
  role.innerHTML = '<option value="">All roles</option>' + roles.map(r=>`<option value="${r}">${r}</option>`).join('');
}

function personCard(p){
  const imgSrc = p.image || `https://placehold.co/300x300/png?text=${encodeURIComponent((p.name||'Member').split(' ')[0])}`;
  const tagsHtml = (p.tags||[]).map(t => `<span class="tag">${t}</span>`).join('');
  const links = p.links || {};
  const link = (label, href) => href ? `<a class="btn btn-sm btn-outline-light" href="${href}" target="_blank" rel="noopener" aria-label="${label}">${label}</a>` : '';

  const blurb = getBlurb(p); // NEW

  return `
    <article class="person-card h-100" tabindex="0" data-person-id="${p.id}">
      <div class="avatar-wrap">
        <img class="avatar" loading="lazy" decoding="async" src="${imgSrc}" alt="${p.name}'s headshot"
          onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=${encodeURIComponent((p.name||'Member').split(' ')[0])}';">
      </div>
      <h4 class="name">${p.name}</h4>
      <p class="role">${[p.role, p.trackOrDept, p.year].filter(Boolean).join(' • ')}</p>

      ${ blurb
          ? `<p class="blurb">${shortText(blurb, 160)}</p>`
          // or use the next line if you want a visible placeholder:
          // : `<p class="blurb text-muted">Bio coming soon.</p>`
          : ''
      }

      <div class="tags">${tagsHtml}</div>
      <div class="links">
        ${link('Website', links.website)}
        ${link('GitHub', links.github)}
        ${link('LinkedIn', links.linkedin)}
        ${link('Email', links.email ? 'mailto:'+links.email : '')}
      </div>
    </article>
  `;
}


function render(){
  const q = normalize(el.search.value);
  const roleVal = el.role.value;
  const sort = el.sort.value || 'name-asc';

  let list = PEOPLE.filter(p => {
    const hay = normalize([p.name, p.role, p.trackOrDept, (p.tags||[]).join(' '), p.bio||''].join(' '));
    const roleOk = !roleVal || p.role === roleVal;
    const qOk = !q || hay.includes(q);
    return roleOk && qOk;
  });

  list.sort((a,b)=>{
    const cmp = (x,y)=>(x||'').localeCompare(y||'');
    switch(sort){
      case 'name-desc': return cmp(b.name, a.name);
      case 'role-asc':  return cmp(a.role, b.role) || cmp(a.name, b.name);
      case 'role-desc': return cmp(b.role, a.role) || cmp(a.name, b.name);
      default:          return cmp(a.name, b.name);
    }
  });

  const groups = {};
  for(const p of list){ (groups[p.section||'Members'] ||= []).push(p); }

  // Abraham-first within Founder
  if(groups['Founder']){
    const i = groups['Founder'].findIndex(p => /abraham\s+nakhal/i.test(p.name));
    if(i > -1){
      const [ab] = groups['Founder'].splice(i,1);
      groups['Founder'].unshift(ab);
    }
  }

  const SECTION_ORDER = ["Advisors","Founder","Co-Founders","BioScience Team","Hardware Inovation Team","AI Engineering Team","Members"];
  const ordered = Object.entries(groups).sort(([a],[b]) => {
  const aw = sectionOrder(a);
  const bw = sectionOrder(b);
  return aw === bw ? a.localeCompare(b) : aw - bw;
});

  el.groups.innerHTML = ordered.map(([name, people])=>{
    return `<section class="mb-4">
      <h4 class="mb-3">${name}</h4>
      <div class="row g-3">
        ${people.map(p => `<div class="col-12 col-sm-6 col-md-4 col-lg-3">${personCard(p)}</div>`).join('')}
      </div>
    </section>`;
  }).join('');

  el.empty.hidden = list.length !== 0;
}

// Modal population
function openModal(person){
  const img = person.image || `https://placehold.co/600x600/png?text=${encodeURIComponent((person.name||'Member').split(' ')[0])}`;
  el.modalAvatar.src = img;
  el.modalAvatar.alt = `${person.name}'s headshot`;
  el.modalName.textContent = person.name;
  el.modalMeta.textContent = [person.role, person.trackOrDept, person.year].filter(Boolean).join(' • ');
  el.modalBio.textContent = person.bio || 'No bio yet.';
  const L = person.links || {};
  const link = (label, href) => href ? `<a class="btn btn-sm btn-outline-light" href="${href}" target="_blank" rel="noopener" aria-label="${label}">${label}</a>` : '';
  el.modalLinks.innerHTML = [
    link('Website', L.website),
    link('GitHub', L.github),
    link('LinkedIn', L.linkedin),
    link('Email', L.email ? 'mailto:'+L.email : '')
  ].join('');

  const modal = bootstrap.Modal.getOrCreateInstance(el.modalEl);
  modal.show();
}

// Events: open modal from card
el.groups.addEventListener('click', e => {
  const card = e.target.closest('.person-card'); if(!card) return;
  const id = card.getAttribute('data-person-id');
  const person = PEOPLE_BY_ID.get(id);
  if(person) openModal(person);
});
el.groups.addEventListener('keydown', e => {
  if((e.key === 'Enter' || e.key === ' ') && e.target.closest('.person-card')){
    e.preventDefault();
    const id = e.target.closest('.person-card').getAttribute('data-person-id');
    const person = PEOPLE_BY_ID.get(id);
    if(person) openModal(person);
  }
});

// Filters: re-render on input/change
['input','change'].forEach(evt => {
  el.search.addEventListener(evt, render);
  el.role.addEventListener(evt, render);
  el.sort.addEventListener(evt, render);
});

// Go
load();
