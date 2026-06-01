'use strict';

const UNSPLASH_KEY = '';

const PALETTES = {
  event: [
    { h:'#D2B1F0', n:'PinkMinded 200'  }, { h:'#BE9DDC', n:'PinkMinded 300'  },
    { h:'#F0DEFD', n:'PinkMinded 100'  }, { h:'#ECD8A1', n:'CreamMinded 200' },
    { h:'#FBEEC8', n:'CreamMinded 150' }, { h:'#CBF6D2', n:'MintMinded 100'  },
    { h:'#6BCA79', n:'MintMinded 300'  }, { h:'#FDFCF7', n:'White'           },
  ],
  spotlight: [
    { h:'#ECD8A1', n:'CreamMinded 200' }, { h:'#FBEEC8', n:'CreamMinded 150' },
    { h:'#F9F2DF', n:'CreamMinded 100' }, { h:'#D2B1F0', n:'PinkMinded 200'  },
    { h:'#F0DEFD', n:'PinkMinded 100'  }, { h:'#CBF6D2', n:'MintMinded 100'  },
    { h:'#E0F5E8', n:'MintMinded 50'   }, { h:'#FDFCF7', n:'White'           },
  ],
  offer: [
    { h:'#17382A', n:'MintMinded 800'  }, { h:'#032416', n:'MintMinded 900'  },
    { h:'#1c1228', n:'Plum'            }, { h:'#0c1e30', n:'Navy'            },
    { h:'#281210', n:'Burgundy'        }, { h:'#241c0c', n:'Espresso'        },
  ],
  announcement: [
    { h:'#6BCA79', n:'MintMinded 300'  }, { h:'#17382A', n:'MintMinded 800'  },
    { h:'#D2B1F0', n:'PinkMinded 200'  }, { h:'#ECD8A1', n:'CreamMinded 200' },
    { h:'#d45c38', n:'Terracotta'      }, { h:'#1c3858', n:'Navy'            },
    { h:'#501c40', n:'Plum'            }, { h:'#032416', n:'MintMinded 900'  },
  ],
};

const ADV_PALETTES = {
  event: [
    { h:'#A48ABC', n:'PinkMinded 600'  }, { h:'#BE9DDC', n:'PinkMinded 300'  },
    { h:'#D2B1F0', n:'PinkMinded 200'  }, { h:'#6BCA79', n:'MintMinded 300'  },
    { h:'#D8C48D', n:'CreamMinded 300' }, { h:'#B9AA80', n:'CreamMinded 600' },
    { h:'#FDFCF7', n:'White'           }, { h:'#032416', n:'MintMinded 900'  },
  ],
  spotlight: [
    { h:'#FDFCF7', n:'White'           }, { h:'#F9F2DF', n:'CreamMinded 100' },
    { h:'#ECD8A1', n:'CreamMinded 200' }, { h:'#D8C48D', n:'CreamMinded 300' },
    { h:'#F0DEFD', n:'PinkMinded 100'  }, { h:'#D2B1F0', n:'PinkMinded 200'  },
    { h:'#E0F5E8', n:'MintMinded 50'   }, { h:'#CBF6D2', n:'MintMinded 100'  },
  ],
  offer: [
    { h:'#032416', n:'MintMinded 900'  }, { h:'#17382A', n:'MintMinded 800'  },
    { h:'#0d1b2a', n:'Midnight'        }, { h:'#1a0a2e', n:'Deep Plum'       },
    { h:'#2e0a0a', n:'Deep Red'        }, { h:'#1a1000', n:'Espresso'        },
  ],
  announcement: [
    { h:'#6BCA79', n:'MintMinded 300'  }, { h:'#17382A', n:'MintMinded 800'  },
    { h:'#A48ABC', n:'PinkMinded 600'  }, { h:'#ECD8A1', n:'CreamMinded 200' },
    { h:'#d45c38', n:'Terracotta'      }, { h:'#032416', n:'MintMinded 900'  },
  ],
};

const ADV_FONTS = [
  { key:'Playfair Display', label:'Brand Serif',  style:'italic', weight:'700' },
  { key:'Abril Fatface',    label:'Abril Heavy',  style:'normal', weight:'400' },
  { key:'Bebas Neue',       label:'Bebas Block',  style:'normal', weight:'400' },
  { key:'Dancing Script',   label:'Handwritten',  style:'normal', weight:'700' },
  { key:'Space Mono',       label:'Mono',         style:'italic', weight:'400' },
];

const TEMPLATES = {
  event: {
    title: 'Event Poster',
    hint:  'What\'s happening, when, and where.',
    fields: [
      { id:'brand',    label:'Label',                type:'text',     ph:'MINDSPACE HOUR',                   xl:true },
      { id:'headline', label:'Event name',           type:'text',     ph:'Doggo Playdate',                   xl:true },
      { id:'tagline',  label:'One-liner (optional)', type:'text',     ph:'Bring your dog & make some friends'        },
      { id:'date',     label:'Date',                 type:'text',     ph:'14/08'                                     },
      { id:'time',     label:'Time',                 type:'text',     ph:'15:00–16:00'                               },
      { id:'location', label:'Location',             type:'text',     ph:'Eventspace'                                },
      { id:'photo',    label:'Event photo',          type:'image'                                                     },
    ],
  },
  spotlight: {
    title: 'Member Spotlight',
    hint:  'Introduce someone. Keep it real, keep it warm.',
    fields: [
      { id:'brand', label:'Label',              type:'text',     ph:'MINDSPACE SPOTLIGHT', xl:true },
      { id:'name',  label:'Member name',        type:'text',     ph:'Liza Holiarchuk',     xl:true },
      { id:'bio',   label:'Bio',                type:'textarea', ph:'Liza is a freelance photographer based in Hamburg, specialising in **corporate portraits** and event photography.\n\nHer work focuses on natural, confident portraits that feel professional but not staged.' },
      { id:'link',  label:'Website (optional)', type:'text',     ph:'lizaholiarchuk.com'            },
      { id:'photo', label:'Portrait photo',     type:'image'                                        },
    ],
  },
  offer: {
    title: 'Member Special',
    hint:  'Lead with the number. Make the deal look as good as it is.',
    fields: [
      { id:'brand',    label:'Brand line',       type:'text', ph:'Mindspace',                               xl:true },
      { id:'title',    label:'Offer title',      type:'text', ph:'Member\'s Special',                       xl:true },
      { id:'stat',     label:'Big number',       type:'text', ph:'30%'                                              },
      { id:'headline', label:'Offer text',       type:'text', ph:'discount on your event booking for 2026!'         },
      { id:'note',     label:'Fine print',       type:'text', ph:"Don't miss out – valid only for June events"       },
      { id:'photo',    label:'Background photo', type:'image'                                                        },
    ],
  },
  announcement: {
    title: 'Announcement',
    hint:  'Short. Loud. Readable from the elevator.',
    fields: [
      { id:'brand',    label:'Brand line',           type:'text',     ph:'Mindspace',                     xl:true },
      { id:'headline', label:'Headline',             type:'text',     ph:"We're on the 4th floor lounge", xl:true },
      { id:'body',     label:'Body text (optional)', type:'textarea', ph:'If needed / bring back cards call:' },
      { id:'contact',  label:'Contact',              type:'textarea', ph:'Anna\n015120511147'                  },
    ],
  },
};

const DESIGNS = {
  event:        [
    { key:'editorial', label:'Editorial'       },
    { key:'bold',      label:'Bold — photo fill' },
    { key:'frame',     label:'Frame'            },
  ],
  spotlight:    [
    { key:'editorial', label:'Editorial'        },
    { key:'cover',     label:'Cover — full photo' },
    { key:'minimal',   label:'Minimal — text only' },
  ],
  offer:        [
    { key:'editorial', label:'Editorial'        },
    { key:'bold',      label:'Bold — no photo'  },
  ],
  announcement: [
    { key:'editorial', label:'Editorial'        },
    { key:'bold',      label:'Bold — massive type' },
    { key:'split',     label:'Split — two-tone'  },
  ],
};

/* ── State ── */
let tpl = null, bgColor = null, imgs = {}, adventure = false,
    advFont = ADV_FONTS[0], design = 'editorial';

/* ── DOM refs ── */
const $pick       = id('screen-pick');
const $build      = id('screen-build');
const $poster     = id('poster');
const $fields     = id('formFields');
const $title      = id('formTitle');
const $hint       = id('formHint');
const $colorRow   = id('colorRow');
const $dlBtn      = id('btnDownload');
const $printBtn   = id('btnPrint');
const $backBtn    = id('btnBack');
const $navLogo    = id('navLogo');
const $advBtn     = id('btnAdventure');
const $advFontSec = id('advFontSection');
const $fontPicker = id('fontPicker');
const $designRow  = id('designPickerRow');

/* ── Card click → launch animation ── */
qsa('.pcard').forEach(c => c.addEventListener('click', () => launchCard(c, c.dataset.tpl)));

[$backBtn, $navLogo].forEach(el => el.addEventListener('click', () => {
  $build.classList.add('hidden');
  $pick.classList.remove('hidden');
  tpl = null; imgs = {}; adventure = false; design = 'editorial';
  $advBtn.classList.remove('active');
}));

$advBtn.addEventListener('click', () => {
  adventure = !adventure;
  $advBtn.classList.toggle('active', adventure);
  $advFontSec.classList.toggle('hidden', !adventure);
  buildPalette(adventure ? ADV_PALETTES[tpl] : PALETTES[tpl]);
  render();
});

/* ════════════════════════════════════════════════════════════════════════════
   LAUNCH ANIMATION
   ════════════════════════════════════════════════════════════════════════════ */
function launchCard(card, key) {
  const rect = card.getBoundingClientRect();
  const ox = (rect.left + rect.width / 2) + 'px';
  const oy = (rect.top  + rect.height / 2) + 'px';
  const bg = getComputedStyle(card).getPropertyValue('--bg').trim() || '#D2B1F0';

  card.classList.add('popping');
  qsa('.pcard').forEach((c, i) => {
    if (c !== card) setTimeout(() => c.classList.add('flying'), i * 30);
  });

  const splash = mk('div', 'color-splash');
  splash.style.background = bg;
  splash.style.setProperty('--ox', ox);
  splash.style.setProperty('--oy', oy);
  document.body.appendChild(splash);
  requestAnimationFrame(() => requestAnimationFrame(() => splash.classList.add('go')));

  setTimeout(() => {
    open(key);
    splash.remove();
    qsa('.pcard').forEach(c => c.classList.remove('popping', 'flying'));
  }, 520);
}

/* ════════════════════════════════════════════════════════════════════════════
   OPEN
   ════════════════════════════════════════════════════════════════════════════ */
function open(key) {
  tpl = key; imgs = {}; adventure = false; design = 'editorial';
  $advBtn.classList.remove('active');
  $advFontSec.classList.add('hidden');
  const def = TEMPLATES[key];
  $title.textContent = def.title;
  $hint.textContent  = def.hint;
  buildForm(def.fields);
  buildFontPicker();
  buildPalette(PALETTES[key]);
  buildDesignPicker(key);
  $pick.classList.add('hidden');
  $build.classList.remove('hidden');
  render();
}

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN PICKER
   ════════════════════════════════════════════════════════════════════════════ */
function buildDesignPicker(key) {
  const opts = DESIGNS[key] || [];
  $designRow.innerHTML = `
    <p class="field-label" style="margin-bottom:8px">Design style</p>
    <div class="design-chips">${opts.map(d =>
      `<button type="button" class="design-chip${d.key==='editorial'?' on':''}" data-design="${d.key}">${d.label}</button>`
    ).join('')}</div>`;
  qsa('.design-chip', $designRow).forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.design-chip', $designRow).forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      design = btn.dataset.design;
      render();
    });
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   FORM BUILDER
   ════════════════════════════════════════════════════════════════════════════ */
function buildForm(fields) {
  $fields.innerHTML = '';
  fields.forEach(f => {
    const wrap = mk('div', 'field');
    const lbl  = mk('label', 'field-label');
    lbl.setAttribute('for', 'f-' + f.id);
    lbl.textContent = f.label;
    wrap.appendChild(lbl);
    if (f.type === 'image') {
      wrap.appendChild(buildImageField(f.id));
    } else if (f.type === 'textarea') {
      const ta = mk('textarea', 'tall');
      ta.id = 'f-' + f.id; ta.placeholder = f.ph || '';
      ta.addEventListener('input', render);
      wrap.appendChild(ta);
    } else {
      const inp = mk('input');
      inp.type = 'text'; inp.id = 'f-' + f.id; inp.placeholder = f.ph || '';
      if (f.xl) inp.classList.add('xl');
      inp.addEventListener('input', render);
      wrap.appendChild(inp);
    }
    $fields.appendChild(wrap);
  });
}

function buildImageField(fieldId) {
  const wrapper = mk('div', 'img-field');
  const zone = mk('label', 'upload-zone');
  zone.id = 'zone-' + fieldId;
  zone.innerHTML = `
    <svg class="uz-icon" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.4"/>
      <path d="M3 16l5-5 4 4 4-6 5 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="uz-hint">Click to upload photo</span>`;
  const fileInp = mk('input');
  fileInp.type = 'file'; fileInp.accept = 'image/*';
  fileInp.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => { imgs[fieldId] = ev.target.result; setZoneThumb(zone, ev.target.result, fileInp); render(); };
    r.readAsDataURL(file);
  });
  zone.appendChild(fileInp);
  wrapper.appendChild(zone);

  const ur = mk('div', 'unsplash-row');
  ur.innerHTML = `
    <span class="unsplash-label">or search Unsplash</span>
    <div class="unsplash-input-row">
      <input type="text" class="unsplash-input" placeholder="e.g. coworking space" id="us-${fieldId}">
      <button type="button" class="unsplash-btn" data-field="${fieldId}">Search</button>
    </div>
    <div class="unsplash-results" id="usr-${fieldId}"></div>`;
  wrapper.appendChild(ur);
  const usInput = ur.querySelector('.unsplash-input');
  const usBtn   = ur.querySelector('.unsplash-btn');
  const usRes   = ur.querySelector('.unsplash-results');
  const doSearch = () => searchUnsplash(usInput.value, fieldId, usRes, zone, fileInp);
  usBtn.addEventListener('click', doSearch);
  usInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  return wrapper;
}

function setZoneThumb(zone, src, fileInp) {
  zone.innerHTML = '';
  const thumb = mk('img', 'uz-thumb'); thumb.src = src;
  const hint  = mk('span', 'uz-hint'); hint.textContent = 'Click to change';
  zone.append(thumb, hint, fileInp);
}

async function searchUnsplash(query, fieldId, resultEl, zone, fileInp) {
  if (!query.trim()) return;
  resultEl.innerHTML = '<span class="us-loading">Searching…</span>';
  try {
    let photos = [];
    if (UNSPLASH_KEY) {
      const res  = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=6&orientation=portrait`, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } });
      const data = await res.json();
      photos = (data.results || []).map(p => ({ thumb: p.urls.small, full: p.urls.regular, credit: p.user.name }));
    } else {
      const src = `https://source.unsplash.com/featured/720x1280/?${encodeURIComponent(query)}`;
      photos = [{ thumb: src, full: src, credit: 'Unsplash' }];
    }
    if (!photos.length) { resultEl.innerHTML = '<span class="us-loading">No results.</span>'; return; }
    resultEl.innerHTML = '';
    photos.forEach(p => {
      const img = mk('img', 'us-thumb');
      img.src = p.thumb; img.title = `Photo by ${p.credit}`;
      img.addEventListener('click', async () => {
        resultEl.querySelectorAll('.us-thumb').forEach(t => t.classList.remove('us-selected'));
        img.classList.add('us-selected');
        try {
          const blob = await fetch(p.full).then(r => r.blob());
          const reader = new FileReader();
          reader.onload = ev => { imgs[fieldId] = ev.target.result; setZoneThumb(zone, ev.target.result, fileInp); render(); };
          reader.readAsDataURL(blob);
        } catch { imgs[fieldId] = p.full; setZoneThumb(zone, p.full, fileInp); render(); }
      });
      resultEl.appendChild(img);
    });
  } catch (err) { console.error(err); resultEl.innerHTML = '<span class="us-loading">Search failed.</span>'; }
}

function buildFontPicker() {
  advFont = ADV_FONTS[0]; $fontPicker.innerHTML = '';
  ADV_FONTS.forEach((f, i) => {
    const btn = mk('button', 'font-chip' + (i === 0 ? ' on' : ''));
    btn.type = 'button'; btn.textContent = f.label;
    btn.style.fontFamily = `'${f.key}', serif`; btn.style.fontStyle = f.style;
    btn.addEventListener('click', () => {
      qsa('.font-chip', $fontPicker).forEach(b => b.classList.remove('on'));
      btn.classList.add('on'); advFont = f; render();
    });
    $fontPicker.appendChild(btn);
  });
}

function buildPalette(palette) {
  $colorRow.innerHTML = ''; bgColor = palette[0].h;
  palette.forEach((p, i) => {
    const s = mk('button', 'swatch' + (i === 0 ? ' on' : ''));
    s.type = 'button'; s.style.background = p.h; s.title = p.n; s.setAttribute('aria-label', p.n);
    s.addEventListener('click', () => {
      qsa('.swatch', $colorRow).forEach(x => x.classList.remove('on'));
      s.classList.add('on'); bgColor = p.h; render();
    });
    $colorRow.appendChild(s);
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   RENDER
   ════════════════════════════════════════════════════════════════════════════ */
function render() {
  $poster.className = `poster t-${tpl} d-${design}`;
  $poster.style.setProperty('--pb', bgColor);
  const font    = adventure ? advFont.key    : 'Instrument Serif';
  const fstyle  = adventure ? advFont.style  : 'normal';
  const fweight = adventure ? advFont.weight : '400';
  $poster.style.setProperty('--hf', `'${font}', Georgia, serif`);
  $poster.style.setProperty('--hs', fstyle);
  $poster.style.setProperty('--hw', fweight);
  ({ event:renderEvent, spotlight:renderSpotlight, offer:renderOffer, announcement:renderAnnouncement })[tpl]();
}

function v(fid) { const e = id('f-' + fid); return e ? e.value.trim() : ''; }
function x(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function bioToHtml(t) {
  return t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .split(/\n{2,}/).map(p => `<p>${x(p).replace(/\n/g,'<br>')}</p>`).join('');
}
function hs() { return `font-family:var(--hf);font-style:var(--hs);font-weight:var(--hw);`; }

/* ── EVENT ── */
function renderEvent() {
  if (design === 'bold')  return renderEventBold();
  if (design === 'frame') return renderEventFrame();
  const brand = v('brand') || 'MINDSPACE HOUR', headline = v('headline'),
        tagline = v('tagline'), date = v('date'), time = v('time'),
        location = v('location'), photo = imgs['photo'] || '';
  $poster.innerHTML = `
    <span class="ev-label">${x(brand)}</span>
    <div class="ev-title" style="${hs()}">${headline||'<span style="opacity:.22">Event name</span>'}</div>
    ${tagline ? `<span class="ev-tagline">${x(tagline)}</span>` : ''}
    <div class="ev-meta">
      <div class="ev-date">${x(date)}</div>
      <div class="ev-timeloc">${[time,location].filter(Boolean).map(x).join('<br>')}</div>
    </div>
    <div class="ev-photo">
      ${photo ? `<img src="${photo}" alt="" crossorigin="anonymous">` : '<div class="ev-photo-empty">Add a photo above ↑</div>'}
    </div>`;
}

function renderEventBold() {
  const brand = v('brand') || 'MINDSPACE', headline = v('headline'),
        date = v('date'), time = v('time'), loc = v('location'), photo = imgs['photo'] || '';
  $poster.innerHTML = `
    <div class="evb-bg">${photo?`<img src="${photo}" alt="" crossorigin="anonymous">`:''}</div>
    <div class="evb-overlay"></div>
    <div class="evb-body">
      <span class="evb-brand">${x(brand)}</span>
      <div class="evb-title" style="${hs()}">${headline||'<span style="opacity:.35">Event name</span>'}</div>
      <div class="evb-meta">${[date,time,loc].filter(Boolean).map(x).join(' · ')}</div>
    </div>`;
}

function renderEventFrame() {
  const brand = v('brand') || 'MINDSPACE', headline = v('headline'),
        date = v('date'), time = v('time'), loc = v('location'), photo = imgs['photo'] || '';
  $poster.innerHTML = `
    <div class="evf-inner">
      <div class="evf-top">
        <span class="evf-brand">${x(brand)}</span>
        <div class="evf-title" style="${hs()}">${headline||'<span style="opacity:.28">Event name</span>'}</div>
      </div>
      <div class="evf-photo">
        ${photo?`<img src="${photo}" alt="" crossorigin="anonymous">`:'<div class="evf-photo-empty">Add photo ↑</div>'}
      </div>
      <div class="evf-foot">${[date,time,loc].filter(Boolean).map(x).join(' · ')}</div>
    </div>`;
}

/* ── SPOTLIGHT ── */
function renderSpotlight() {
  if (design === 'cover')   return renderSpotlightCover();
  if (design === 'minimal') return renderSpotlightMinimal();
  const brand = v('brand') || 'MINDSPACE SPOTLIGHT', name = v('name'),
        bio = v('bio'), link = v('link'), photo = imgs['photo'] || '';
  $poster.innerHTML = `
    <div class="sp-label">${x(brand)}</div>
    <div class="sp-name" style="${hs()}">${name||'<span style="opacity:.22">Member name</span>'}</div>
    <div class="sp-photo">
      ${photo?`<img src="${photo}" alt="" crossorigin="anonymous">`:'<div class="sp-photo-empty">Add portrait ↑</div>'}
    </div>
    <div class="sp-rule"></div>
    ${bio  ? `<div class="sp-bio">${bioToHtml(bio)}</div>` : ''}
    ${link ? `<div class="sp-link">${x(link)}</div>` : ''}`;
}

function renderSpotlightCover() {
  const brand = v('brand') || 'MINDSPACE SPOTLIGHT', name = v('name'),
        bio = v('bio'), photo = imgs['photo'] || '';
  $poster.innerHTML = `
    <div class="spc-photo">${photo?`<img src="${photo}" alt="" crossorigin="anonymous">`:''}</div>
    <div class="spc-overlay"></div>
    <div class="spc-body">
      <span class="spc-label">${x(brand)}</span>
      <div class="spc-name" style="${hs()}">${name||'<span style="opacity:.3">Member name</span>'}</div>
      ${bio ? `<div class="spc-bio">${x(bio)}</div>` : ''}
    </div>`;
}

function renderSpotlightMinimal() {
  const brand = v('brand') || 'MINDSPACE SPOTLIGHT', name = v('name'),
        bio = v('bio'), link = v('link');
  $poster.innerHTML = `
    <div class="spm-label">${x(brand)}</div>
    <div class="spm-name" style="${hs()}">${name||'<span style="opacity:.22">Member name</span>'}</div>
    <div class="spm-rule"></div>
    ${bio  ? `<div class="spm-bio">${bioToHtml(bio)}</div>` : ''}
    ${link ? `<div class="spm-link">${x(link)}</div>` : ''}`;
}

/* ── OFFER ── */
function renderOffer() {
  if (design === 'bold') return renderOfferBold();
  const brand = v('brand') || 'Mindspace', title = v('title'), stat = v('stat'),
        headline = v('headline'), note = v('note'), photo = imgs['photo'] || '';
  $poster.innerHTML = `
    ${photo ? `<div class="of-bg"><img src="${photo}" alt="" crossorigin="anonymous"></div>` : ''}
    <div class="of-overlay"></div>
    <div class="of-body">
      <div class="of-brand">${x(brand)}</div>
      ${title    ? `<div class="of-title" style="${hs()}">${x(title)}</div>`   : ''}
      ${stat     ? `<div class="of-stat"  style="${hs()}">${x(stat)}</div>`   : ''}
      ${headline ? `<div class="of-desc">${x(headline)}</div>`  : ''}
      ${note     ? `<div class="of-note">${x(note)}</div>`      : ''}
    </div>`;
}

function renderOfferBold() {
  const brand = v('brand') || 'Mindspace', title = v('title'), stat = v('stat'),
        headline = v('headline'), note = v('note');
  $poster.innerHTML = `
    <div class="ofb-body">
      <span class="ofb-brand">${x(brand)}</span>
      ${stat     ? `<div class="ofb-stat"  style="${hs()}">${x(stat)}</div>`  : ''}
      ${title    ? `<div class="ofb-title" style="${hs()}">${x(title)}</div>` : ''}
      ${headline ? `<div class="ofb-desc">${x(headline)}</div>`  : ''}
      ${note     ? `<div class="ofb-note">${x(note)}</div>`      : ''}
    </div>`;
}

/* ── ANNOUNCEMENT ── */
function renderAnnouncement() {
  if (design === 'bold')  return renderAnnouncementBold();
  if (design === 'split') return renderAnnouncementSplit();
  const brand = v('brand') || 'Mindspace', title = v('headline'),
        body = v('body'), contact = v('contact');
  $poster.innerHTML = `
    <div class="an-brand">${x(brand)}</div>
    <div class="an-title" style="${hs()}">${title?x(title).replace(/\n/g,'<br>'):'<span style="opacity:.28">Your headline</span>'}</div>
    ${body    ? `<div class="an-body">${x(body)}</div>` : ''}
    ${contact ? `<div class="an-contact">${x(contact)}</div>` : ''}`;
}

function renderAnnouncementBold() {
  const brand = v('brand') || 'Mindspace', title = v('headline'),
        body = v('body'), contact = v('contact');
  $poster.innerHTML = `
    <span class="anb-brand">${x(brand)}</span>
    <div class="anb-title" style="${hs()}">${title?x(title).replace(/\n/g,'<br>'):'<span style="opacity:.25">Your headline</span>'}</div>
    ${body    ? `<div class="anb-body">${x(body)}</div>` : ''}
    ${contact ? `<div class="anb-contact">${x(contact)}</div>` : ''}`;
}

function renderAnnouncementSplit() {
  const brand = v('brand') || 'Mindspace', title = v('headline'),
        body = v('body'), contact = v('contact');
  $poster.innerHTML = `
    <div class="ans-header">
      <span class="ans-brand">${x(brand)}</span>
      <div class="ans-title" style="${hs()}">${title?x(title).replace(/\n/g,'<br>'):'<span style="opacity:.3">Your headline</span>'}</div>
    </div>
    <div class="ans-body-area">
      ${body    ? `<div class="ans-body">${x(body)}</div>` : ''}
      ${contact ? `<div class="ans-contact">${x(contact)}</div>` : ''}
    </div>`;
}

/* ── Download / Print ── */
$dlBtn.addEventListener('click', async () => {
  if (typeof html2canvas === 'undefined') { alert('Download library not loaded.'); return; }
  const orig = $dlBtn.innerHTML;
  $dlBtn.disabled = true; $dlBtn.textContent = 'Generating…';
  try {
    const canvas = await html2canvas($poster, { scale:3, useCORS:true, allowTaint:true, backgroundColor:null, logging:false });
    const slug = (v('headline')||v('name')||v('brand')||'poster').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);
    const a = document.createElement('a'); a.download = `mindspace-${slug}.png`; a.href = canvas.toDataURL('image/png'); a.click();
  } catch (err) { console.error(err); alert('PNG export failed — try Print / Save as PDF instead.'); }
  finally { $dlBtn.disabled = false; $dlBtn.innerHTML = orig; }
});
$printBtn.addEventListener('click', () => window.print());

/* ── Utils ── */
function id(s)     { return document.getElementById(s); }
function mk(t, c)  { const e = document.createElement(t); if (c) e.className = c; return e; }
function qsa(s, p) { return Array.from((p||document).querySelectorAll(s)); }

/* ── Intro animation ── */
(function runIntro() {
  const nav = document.querySelector('.nav');
  const h1  = document.querySelector('.pick-head h1');
  const sub = document.querySelector('.pick-head p');
  const cards = qsa('.pcard');
  nav.classList.add('anim-fade-hidden');
  h1.innerHTML = '';
  sub.classList.add('anim-hidden');
  cards.forEach(c => c.classList.add('anim-hidden'));
  setTimeout(() => { nav.classList.remove('anim-fade-hidden'); nav.classList.add('anim-fade-in'); }, 100);
  const fullText = 'What are you\nmaking today?';
  let i = 0;
  function tick() {
    if (i >= fullText.length) { h1.classList.add('typing-done'); afterTyping(); return; }
    const ch = fullText[i++];
    h1.innerHTML += ch === '\n' ? '<br>' : ch;
    setTimeout(tick, ch === '\n' ? 120 : 52);
  }
  setTimeout(tick, 500);
  function afterTyping() {
    setTimeout(() => {
      sub.classList.remove('anim-hidden'); sub.classList.add('anim-in');
      cards.forEach((c, idx) => setTimeout(() => { c.classList.remove('anim-hidden'); c.classList.add('anim-in'); }, 220 + idx * 130));
    }, 180);
  }
})();
