// Team page with Bootstrap + modal image integrity + Abraham-first + robust section ordering
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
el.year.textContent = new Date().getFullYear();

const normalize = (s='') => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
const slug = s => normalize(s||'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

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
  const roles = Array.from(new Set(data.map(p => p.role).filter(Boolean)))
    .sort((a,b)=>a.localeCompare(b));
  el.role.innerHTML = '<option value="">All roles</option>' +
    roles.map(r=>`<option value="${r}">${r}</option>`).join('');
}

function personCard(p){
  const imgSrc = p.image || `https://placehold.co/300x300/png?text=${encodeURIComponent(p.name.split(' ')[0]||'Member')}`;
  const tagsHtml = (p.tags||[]).map(t => `<span class="tag">${t}</span>`).join('');
  const links = p.links || {};
  const link = (label, href) => href ? `<a class="btn btn-sm btn-outline-light" href="${href}" target="_blank" rel="noopener" aria-label="${label}">${label}</a>` : '';
  return `
    <article class="person-card h-100" tabindex="0" data-person-id="${p.id}">
      <div class="avatar-wrap">
        <img class="avatar" loading="lazy" decoding="async" src="${imgSrc}" alt="${p.name}'s headshot"
          onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=${encodeURIComponent(p.name.split(' ')[0]||'Member')}';">
      </div>
      <h4 class="name">${p.name}</h4>
      <p class="role">${[p.role, p.trackOrDept, p.year].filter(Boolean).join(' • ')}</p>
      <p class="blurb">${p.blurb ?? shortText(p.bio, 120)}</p>
      <div class="tags">${tagsHtml}</div>
      <div class="links">${link('Website', links.website)}${link('GitHub', links.github)}${link('LinkedIn', links.linkedin)}${link('Email', links.email ? 'mailto:'+links.email : '')}</div>
    </article>
  `;
}

// --- canonicalize section names (handles typos, plurals, hyphens, etc.)
const canonicalSection = (name='') => {
  const key = name.toLowerCase()
    .replace(/[–—]/g,'-')  // normalize dashes
    .replace(/\s+/g,' ')   // collapse spaces
    .trim();
  const map = new Map([
    ['advisors','Advisors'], ['advisor','Advisors'],
    ['founder','Founder'],
    ['co-founder','Co-Founder'], ['co-founders','Co-Founder'], ['co founders','Co-Founder'],
    ['cofounder','Co-Founder'], ['co-founder(s)','Co-Founder'],
    ['leadership','Leadership'],
    ['bioscience team','BioScience Team'], ['bio science team','BioScience Team'],
    ['hardware innovation team','Hardware Innovation Team'],
    ['hardware inovation team','Hardware Innovation Team'], // common typo
    ['ai engineering team','AI Engineering Team'],
    ['members','Members']
  ]);
  return map.get(key) || name || 'Members';
};

// exact top-to-bottom section order
const SECTION_ORDER = [
  'Advisors',
  'Founder',
  'Co-Founder',
  'BioScience Team',
  'Hardware Innovation Team',
  'AI Engineering Team',
  'Leadership',   // include if you still use it
  'Members'
];

const orderMap  = new Map(SECTION_ORDER.map((n,i)=>[n.toLowerCase(), i]));
const sectionRank = s => orderMap.get((s||'').toLowerCase()) ?? 999;

function render(){
  const q = normalize(el.search.value);
  const roleVal = el.role.value;
  const sort = el.sort.value || 'name-asc';

  // filter
  let list = PEOPLE.filter(p => {
    const hay = normalize([p.name, p.role, p.trackOrDept, (p.tags||[]).join(' '), p.blurb||'', p.bio||''].join(' '));
    const roleOk = !roleVal || p.role === roleVal;
    const qOk = !q || hay.includes(q);
    return roleOk && qOk;
  });

  // sort alpha / role
  list.sort((a,b)=>{
    const cmp = (x,y)=>(x||'').localeCompare(y||'');
    switch(sort){
      case 'name-desc': return cmp(b.name, a.name);
      case 'role-asc':  return cmp(a.role, b.role) || cmp(a.name, b.name);
      case 'role-desc': return cmp(b.role, a.role) || cmp(a.name, b.name);
      default:          return cmp(a.name, b.name);
    }
  });

  // group by canonical section
  const groups = {};
  for(const p of list){
    const sec = canonicalSection(p.section || 'Members');
    (groups[sec] ||= []).push(p);
  }

  // Pin Abraham to the front (Founder + Leadership fallback)
  const pinFirst = (arr, test) => {
    if (!arr) return;
    const i = arr.findIndex(test);
    if (i > 0) { const [x] = arr.splice(i,1); arr.unshift(x); }
  };
  pinFirst(groups['Founder'],    p => /abraham\s+nakhal/i.test(p.name));
  pinFirst(groups['Leadership'], p => /abraham\s+nakhal/i.test(p.name));

  // stable order; unknown sections go after, alphabetical
  const ordered = Object.entries(groups).sort(([a],[b]) => {
    const ra = sectionRank(a), rb = sectionRank(b);
    return (ra - rb) || a.localeCompare(b);
  });

  // render
  el.groups.innerHTML = ordered.map(([name, people])=>{
    return `<section class="mb-4"><h4 class="mb-3">${name}</h4>
      <div class="row g-3">${
        people.map(p => `<div class="col-12 col-sm-6 col-md-4 col-lg-3">${personCard(p)}</div>`).join('')
      }</div></section>`;
  }).join('');

  el.empty.hidden = list.length !== 0;
}

// Modal
function openModal(person){
  const img = person.image || `https://placehold.co/600x600/png?text=${encodeURIComponent(person.name.split(' ')[0]||'Member')}`;
  el.modalAvatar.src = img;
  el.modalAvatar.alt = `${person.name}'s headshot`;
  el.modalName.textContent = person.name;
  el.modalMeta.textContent = [person.role, person.trackOrDept, person.year].filter(Boolean).join(' • ');
  el.modalBio.textContent = person.bio || 'No bio yet.';
  const L = person.links || {};
  const link = (label, href) => href ? `<a class="btn btn-sm btn-outline-light" href="${href}" target="_blank" rel="noopener" aria-label="${label}">${label}</a>` : '';
  el.modalLinks.innerHTML = [link('Website', L.website), link('GitHub', L.github), link('LinkedIn', L.linkedin), link('Email', L.email ? 'mailto:'+L.email : '')].join('');

  const modal = bootstrap.Modal.getOrCreateInstance(el.modalEl);
  modal.show();
}

// interactions
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

['input','change'].forEach(evt => {
  el.search.addEventListener(evt, render);
  el.role.addEventListener(evt, render);
  el.sort.addEventListener(evt, render);
});

load();
