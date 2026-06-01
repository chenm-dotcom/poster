'use strict';

const UNSPLASH_KEY = '';
const TENOR_KEY    = 'LIVDSRZULELA'; /* Tenor public demo key */

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
  { key:'League Script',      label:'League Script', style:'normal', weight:'400' },
  { key:'Oi',                 label:'Oi',            style:'normal', weight:'400' },
  { key:'Anton SC',           label:'Anton SC',      style:'normal', weight:'400' },
  { key:'Cedarville Cursive', label:'Cedarville',    style:'normal', weight:'400' },
  { key:'Special Elite',      label:'Special Elite', style:'normal', weight:'400' },
  { key:'Erica One',          label:'Erica One',     style:'normal', weight:'400' },
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
      { id:'headline', label:'Headline (use *word* for accent colour)', type:'text',     ph:'Be your best. *Naturally*',                xl:true },
      { id:'body',     label:'Body text',                               type:'textarea', ph:'Members enjoy 15% OFF with code MIND15\nand free drinks during Mindspace hours'  },
      { id:'note',     label:'Fine print (optional)',                   type:'text',     ph:'Valid for June 2026 only'                           },
      { id:'photo',    label:'Photo (top zone)',                        type:'image'                                                             },
      { id:'qr',       label:'QR code',                                 type:'image'                                                             },
      { id:'partnerlogo', label:'Partner logo (optional)',              type:'image'                                                             },
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
    { key:'editorial',  label:'Editorial'   },
    { key:'bold',       label:'Photo Fill'  },
    { key:'illustrated',label:'Illustrated' },
  ],
  spotlight:    [
    { key:'editorial', label:'Editorial'  },
    { key:'cover',     label:'Full Cover' },
    { key:'minimal',   label:'Minimal'    },
  ],
  offer:        [
    { key:'benefit',   label:'Benefit'    },
    { key:'editorial', label:'Photo'      },
    { key:'bold',      label:'Bold'       },
    { key:'split',     label:'Split'      },
  ],
  announcement: [
    { key:'editorial', label:'Editorial'  },
    { key:'bold',      label:'Massive'    },
    { key:'split',     label:'Two-Tone'   },
  ],
};

/* ── State ── */
let tpl = null, bgColor = null, imgs = {}, adventure = false, posterPattern = null,
    advFont = ADV_FONTS[0], design = 'editorial';

/* ── DOM refs ── */
const $pick       = id('screen-pick');
const $build      = id('screen-build');
const $poster     = id('poster');
const $fields     = id('formFields');
const $title      = id('formTitle');
const $colorRow   = id('colorRow');
const $dlBtn      = id('btnDownload');
const $printBtn   = id('btnPrint');
const $backBtn    = id('btnBack');
const $navLogo    = id('navLogo'); /* may be null if nav removed */
const $advFontSec = id('advFontSection');
const $fontPicker = id('fontPicker');
const $designRow  = id('designPickerRow');
const $stage      = id('previewStage');

/* ── Adventure mode animal burst ── */
function burstAnimals() {
  const ANIMALS = ['🦊','🐸','🦋','🐙','🦄','🐼','🦁','🐯','🐨','🦖','🦜','🐬','🦩','🐺','🦝','🦦','🐧','🦚','🦕','🐻','🦈','🦓','🐆','🦏','🦒','🐘','🦤','🦥'];
  const N = 38;
  const vw = window.innerWidth / 2;
  const vh = window.innerHeight / 2;
  for (let i = 0; i < N; i++) {
    const el = document.createElement('div');
    el.className = 'adv-animal';
    el.textContent = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const angle = (i / N) * 360 + Math.random() * 20;
    const dist  = 200 + Math.random() * Math.max(vw, vh) * 1.1;
    const size  = 1.8 + Math.random() * 3.5;
    const delay = Math.random() * 350;
    el.style.cssText = `
      --ax:${Math.cos(angle*Math.PI/180)*dist}px;
      --ay:${Math.sin(angle*Math.PI/180)*dist}px;
      --arot:${-45+Math.random()*90}deg;
      font-size:${size}rem;
      animation-delay:${delay}ms;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), delay + 1100);
  }
}

/* ── Build-screen adventure toggle ── */
qsa('.mt-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    qsa('.mt-opt').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    adventure = btn.dataset.mode === 'adventure';
    if (adventure) burstAnimals();
    $advFontSec.classList.toggle('hidden', !adventure);
    buildPalette(adventure ? ADV_PALETTES[tpl] : PALETTES[tpl]);
    render();
  });
});

/* ── Panel click → launch animation ── */
qsa('.panel').forEach(c => c.addEventListener('click', () => launchCard(c, c.dataset.tpl)));

[$backBtn, $navLogo].filter(Boolean).forEach(el => el.addEventListener('click', () => {
  $build.classList.add('hidden');
  $pick.classList.remove('hidden');
  document.querySelector('.app').classList.remove('in-build');
  tpl = null; imgs = {}; adventure = false; design = 'editorial'; posterPattern = null;
  qsa('.mt-opt').forEach(b => b.classList.toggle('on', b.dataset.mode === 'regular'));
}));

/* ════════════════════════════════════════════════════════════════════════════
   LAUNCH ANIMATION
   ════════════════════════════════════════════════════════════════════════════ */
function launchCard(card, key) {
  const rect = card.getBoundingClientRect();
  const ox = (rect.left + rect.width / 2) + 'px';
  const oy = (rect.top  + rect.height / 2) + 'px';
  const bg = getComputedStyle(card).getPropertyValue('--bg').trim() || '#D2B1F0';

  card.classList.add('popping');
  qsa('.panel').forEach((c, i) => {
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
    qsa('.panel').forEach(c => c.classList.remove('popping', 'flying'));
  }, 520);
}

/* ════════════════════════════════════════════════════════════════════════════
   OPEN
   ════════════════════════════════════════════════════════════════════════════ */
function open(key) {
  tpl = key; imgs = {}; adventure = false; design = 'editorial'; posterPattern = null;
  qsa('.mt-opt').forEach(b => b.classList.toggle('on', b.dataset.mode === 'regular'));
  $advFontSec.classList.add('hidden');
  const def = TEMPLATES[key];
  $title.textContent = def.title;
  buildForm(def.fields);
  buildFontPicker();
  buildPalette(PALETTES[key]);
  buildDesignPicker(key);
  $pick.classList.add('hidden');
  $build.classList.remove('hidden');
  document.querySelector('.app').classList.add('in-build');
  const wrap = $build.querySelector('.build-wrap');
  if (wrap) { wrap.classList.remove('animate-in'); void wrap.offsetWidth; wrap.classList.add('animate-in'); }
  render();
}

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN PICKER
   ════════════════════════════════════════════════════════════════════════════ */
function buildDesignPicker(key) {
  const opts = DESIGNS[key] || [];
  const cards = opts.map((d, i) => `
    <button type="button" class="design-card${i===0?' on':''}" data-design="${d.key}">
      <div class="dc-thumb">${makeDesignThumb(key, d.key)}</div>
      <div class="dc-label">${d.label}</div>
    </button>`).join('');
  $designRow.innerHTML = `
    <p class="field-label" style="margin-bottom:0">Design style</p>
    <div class="design-grid">${cards}</div>`;
  qsa('.design-card', $designRow).forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.design-card', $designRow).forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      design = btn.dataset.design;
      render();
    });
  });
}

function makeDesignThumb(tpl, key) {
  const c  = bgColor || '#D2B1F0';
  const dk = a => `rgba(3,36,22,${a})`;
  const lt = a => `rgba(253,252,247,${a})`;
  const row = (h, w, col) =>
    `<div style="height:${h}px;width:${w}%;background:${col};border-radius:2px;flex-shrink:0"></div>`;

  const wrap = (bg, content) =>
    `<div style="height:100%;background:${bg};display:flex;flex-direction:column;overflow:hidden">${content}</div>`;

  switch (`${tpl}-${key}`) {

    case 'event-editorial':
    case 'spotlight-editorial':
    case 'offer-editorial':
    case 'announcement-editorial':
      return wrap(tpl==='offer'?'#17382A':c, `
        <div style="padding:9px 8px;display:flex;flex-direction:column;gap:5px">
          ${row(3,40,tpl==='offer'?lt(.3):dk(.22))}
          ${row(9,88,tpl==='offer'?lt(.8):dk(.72))}
          ${row(9,66,tpl==='offer'?lt(.8):dk(.72))}
        </div>
        <div style="flex:1;background:${tpl==='offer'?dk(.25):dk(.1)};margin-top:auto"></div>`);

    case 'event-bold':
    case 'spotlight-cover':
      return `<div style="height:100%;background:#1a1a1a;display:flex;flex-direction:column;justify-content:flex-end;padding:8px;position:relative">
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.9),transparent 60%)"></div>
        <div style="position:relative;z-index:1;display:flex;flex-direction:column;gap:4px">
          ${row(3,38,lt(.45))} ${row(11,92,lt(.9))} ${row(11,70,lt(.9))}
        </div>
      </div>`;

    case 'event-illustrated':
      return wrap(c, `
        <div style="padding:7px 8px 0;display:flex;flex-direction:column;gap:3px">
          ${row(2.5,34,dk(.18))}
          ${row(10,90,dk(.8))} ${row(10,72,dk(.8))}
        </div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:1.6rem;line-height:1;padding:2px 0">🎉</div>
        <div style="padding:0 8px 7px;border-top:1px solid ${dk(.1)};display:flex;justify-content:space-between;align-items:center;padding-top:5px">
          ${row(3,28,dk(.55))} ${row(3,20,dk(.3))} ${row(3,22,dk(.3))}
        </div>`);

    case 'spotlight-minimal':
      return wrap(c, `
        <div style="padding:12px 10px;display:flex;flex-direction:column;justify-content:center;height:100%;gap:5px">
          ${row(3,36,dk(.25))} ${row(12,92,dk(.8))} ${row(12,72,dk(.8))}
          <div style="height:1.5px;width:22%;background:${dk(.2)};border-radius:2px;margin-top:3px"></div>
          ${row(3,80,dk(.18))} ${row(3,62,dk(.18))}
        </div>`);

    case 'offer-bold':
    case 'announcement-bold':
      return wrap(c, `
        <div style="padding:8px 8px;display:flex;flex-direction:column;justify-content:flex-end;height:100%;gap:4px">
          ${row(3,34,lt(.35))}
          <div style="flex:1"></div>
          ${row(18,72,lt(.9))} ${row(9,88,lt(.6))} ${row(3,66,lt(.3))}
        </div>`);

    case 'offer-split':
    case 'announcement-split':
      return `<div style="height:100%;display:flex;flex-direction:column">
        <div style="height:56%;background:${c};display:flex;flex-direction:column;justify-content:flex-end;padding:5px 7px;gap:3px">
          ${row(9,88,'rgba(255,255,255,.82)')} ${row(9,68,'rgba(255,255,255,.82)')}
        </div>
        <div style="flex:1;background:#032416;padding:5px 7px;display:flex;flex-direction:column;justify-content:flex-end;gap:3px">
          ${row(3,58,'rgba(255,255,255,.35)')} ${row(3,42,'rgba(255,255,255,.35)')}
        </div>
      </div>`;

    default:
      return wrap(c, '');
  }
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

  /* ── Source selector ── */
  const sel = mk('select', 'img-source-select');
  sel.innerHTML = `
    <option value="upload">📁  Upload photo</option>
    <option value="gif">🎞  Search GIFs</option>
    <option value="unsplash">🖼  Search Unsplash</option>
    <option value="pattern">🎨  Icon pattern</option>`;
  wrapper.appendChild(sel);

  /* ── Panels ── */
  const panels = {};
  ['upload','gif','unsplash','pattern'].forEach((key, i) => {
    const p = mk('div', 'img-source-panel' + (i === 0 ? ' on' : ''));
    p.dataset.panel = key;
    panels[key] = p;
    wrapper.appendChild(p);
  });

  sel.addEventListener('change', () => {
    const key = sel.value;
    Object.values(panels).forEach(p => p.classList.toggle('on', p.dataset.panel === key));
  });

  /* ── Upload panel ── */
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
    r.onload = ev => { imgs[fieldId] = ev.target.result; posterPattern = null; setZoneThumb(zone, ev.target.result, fileInp); render(); };
    r.readAsDataURL(file);
  });
  zone.appendChild(fileInp);
  panels['upload'].appendChild(zone);

  /* ── GIF panel ── */
  panels['gif'].innerHTML = `
    <div class="unsplash-input-row">
      <input type="text" class="unsplash-input giphy-input" placeholder="e.g. celebration, party" id="gi-${fieldId}">
      <button type="button" class="unsplash-btn giphy-btn" data-field="${fieldId}">Search</button>
    </div>
    <div class="unsplash-results giphy-results" id="gir-${fieldId}"></div>`;
  const giInput = panels['gif'].querySelector('.giphy-input');
  const giBtn   = panels['gif'].querySelector('.giphy-btn');
  const giRes   = panels['gif'].querySelector('.giphy-results');
  const doGiphy = () => searchGiphy(giInput.value, fieldId, giRes, zone, fileInp);
  giBtn.addEventListener('click', doGiphy);
  giInput.addEventListener('keydown', e => { if (e.key === 'Enter') doGiphy(); });

  /* ── Unsplash panel ── */
  panels['unsplash'].innerHTML = `
    <div class="unsplash-input-row">
      <input type="text" class="unsplash-input" placeholder="e.g. coworking space" id="us-${fieldId}">
      <button type="button" class="unsplash-btn" data-field="${fieldId}">Search</button>
    </div>
    <div class="unsplash-results" id="usr-${fieldId}"></div>`;
  const usInput = panels['unsplash'].querySelector('.unsplash-input');
  const usBtn   = panels['unsplash'].querySelector('.unsplash-btn');
  const usRes   = panels['unsplash'].querySelector('.unsplash-results');
  const doSearch = () => searchUnsplash(usInput.value, fieldId, usRes, zone, fileInp);
  usBtn.addEventListener('click', doSearch);
  usInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  /* ── Pattern panel ── */
  const grid = mk('div', 'pattern-grid');
  Object.entries(PATTERN_SHAPES).forEach(([key, shape]) => {
    const btn = mk('button', 'pattern-opt');
    btn.type = 'button';
    if (posterPattern === key) btn.classList.add('on');
    btn.innerHTML = `<span class="pattern-opt-icon">${shape.e}</span><span class="pattern-opt-name">${shape.n}</span>`;
    btn.addEventListener('click', () => {
      posterPattern = key;
      imgs[fieldId] = '';
      qsa('.pattern-opt', grid).forEach(b => b.classList.toggle('on', b === btn));
      render();
    });
    grid.appendChild(btn);
  });
  const noneBtn = mk('button', 'pattern-none');
  noneBtn.type = 'button'; noneBtn.textContent = '✕ None / Clear pattern';
  noneBtn.addEventListener('click', () => {
    posterPattern = null;
    qsa('.pattern-opt', grid).forEach(b => b.classList.remove('on'));
    render();
  });
  grid.appendChild(noneBtn);
  panels['pattern'].appendChild(grid);

  return wrapper;
}

async function searchGiphy(query, fieldId, resultEl, zone, fileInp) {
  if (!query.trim()) return;
  resultEl.innerHTML = '<span class="us-loading">Searching GIFs…</span>';
  try {
    const res  = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=6&contentfilter=low&media_filter=minimal`);
    const data = await res.json();
    const gifs = (data.results || []).map(g => ({
      thumb: g.media[0].tinygif.url,
      full:  g.media[0].gif.url,
    }));
    if (!gifs.length) { resultEl.innerHTML = '<span class="us-loading">No GIFs found — try different words.</span>'; return; }
    resultEl.innerHTML = '';
    gifs.forEach(g => {
      const img = mk('img', 'us-thumb giphy-thumb');
      img.src = g.thumb;
      img.addEventListener('click', async () => {
        resultEl.querySelectorAll('.us-thumb').forEach(t => t.classList.remove('us-selected'));
        img.classList.add('us-selected');
        try {
          const blob = await fetch(g.full).then(r => r.blob());
          const reader = new FileReader();
          reader.onload = ev => { imgs[fieldId] = ev.target.result; setZoneThumb(zone, ev.target.result, fileInp); render(); };
          reader.readAsDataURL(blob);
        } catch { imgs[fieldId] = g.full; setZoneThumb(zone, g.full, fileInp); render(); }
      });
      resultEl.appendChild(img);
    });
  } catch (err) { console.error(err); resultEl.innerHTML = '<span class="us-loading">Search failed.</span>'; }
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
      resultEl.innerHTML = '<span class="us-loading">Photo search requires an Unsplash API key — use the upload button above instead.</span>';
      return;
    }
    if (!photos.length) { resultEl.innerHTML = '<span class="us-loading">No results.</span>'; return; }
    resultEl.innerHTML = '';
    photos.forEach(p => {
      const img = mk('img', 'us-thumb');
      img.crossOrigin = 'anonymous';
      img.src = p.thumb; img.title = `Photo by ${p.credit}`;
      img.addEventListener('click', async () => {
        resultEl.querySelectorAll('.us-thumb').forEach(t => t.classList.remove('us-selected'));
        img.classList.add('us-selected');
        try {
          const blob = await fetch(p.full, { mode: 'cors' }).then(r => r.blob());
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

const PATTERN_SHAPES = {
  heart:     { e:'❤️', n:'Heart',     d:'M50 30C50 19 37 7 22 13C8 19 6 35 18 48L50 80L82 48C94 35 92 19 78 13C63 7 50 19 50 30Z' },
  star:      { e:'⭐', n:'Star',      d:'M50 5L62 35H96L70 56L80 92L50 70L20 92L30 56L4 35H38Z' },
  sparkle:   { e:'✨', n:'Sparkle',   d:'M50 5L55 45H95L56 56L50 95L44 56H5L45 45Z' },
  tree:      { e:'🎄', n:'Tree',      d:'M50 5L70 38H58L76 65H60L80 92H20L40 65H24L42 38H30Z' },
  snowflake: { e:'❄️', n:'Snow',      d:'M47 5H53V22L66 9L70 14L55 28V47H74L88 32L92 37L76 52H95V58H76L92 73L88 78L74 62H55V81L70 96L66 100L53 86V95H47V86L34 100L30 96L45 81V62H26L12 78L8 73L24 58H5V52H24L8 37L12 32L26 47H45V28L30 14L34 9L47 22Z' },
  flower:    { e:'🌸', n:'Flower',    d:'M50 5C56 18 68 20 78 13C74 26 82 36 95 36C86 44 86 56 95 62C82 62 74 72 78 85C68 78 56 80 50 93C44 80 32 78 22 85C26 72 18 62 5 62C14 56 14 44 5 36C18 36 26 26 22 13C32 20 44 18 50 5Z' },
  leaf:      { e:'🍃', n:'Leaf',      d:'M50 5C82 18 96 48 88 72C82 90 68 96 50 96C68 72 64 38 50 5ZM50 5C18 18 4 48 12 72C18 90 32 96 50 96C32 72 36 38 50 5Z' },
  moon:      { e:'🌙', n:'Moon',      d:'M62 8C40 8 22 26 22 50C22 74 40 92 62 92C46 84 35 68 35 50C35 32 46 16 62 8Z' },
  diamond:   { e:'💎', n:'Diamond',   d:'M50 5L92 42L68 92H32L8 42Z' },
  crown:     { e:'👑', n:'Crown',     d:'M5 88V36L28 65L50 14L72 65L95 36V88Z' },
  bolt:      { e:'⚡', n:'Lightning', d:'M62 5L24 55H52L38 95L76 42H48Z' },
  cloud:     { e:'☁️', n:'Cloud',     d:'M24 78C10 78 6 64 14 56C10 48 14 38 26 38C26 28 35 20 47 22C52 14 64 10 74 18C86 12 97 24 94 38C102 40 100 56 92 60C96 68 90 78 80 78Z' },
  wave:      { e:'🌊', n:'Wave',      d:'M5 62C15 38 30 18 46 32C60 44 64 60 80 50C90 43 93 28 96 20V82H5Z' },
  balloon:   { e:'🎈', n:'Balloon',   d:'M50 5C72 5 88 22 88 46C88 68 72 82 50 84L54 95H46L50 84C28 82 12 68 12 46C12 22 28 5 50 5Z' },
  butterfly: { e:'🦋', n:'Butterfly', d:'M50 22C50 22 30 5 10 10C0 15 0 34 14 42C28 50 44 46 50 52C56 46 72 50 86 42C100 34 100 15 90 10C70 5 50 22 50 22ZM50 52C50 52 34 62 24 76C16 88 26 97 38 94C48 92 51 78 50 64C49 78 52 92 62 94C74 97 84 88 76 76C66 62 50 52 50 52Z' },
  paw:       { e:'🐾', n:'Paw',       d:'M50 40C60 40 68 52 68 64C68 76 60 84 50 84C40 84 32 76 32 64C32 52 40 40 50 40ZM23 16C29 16 34 22 34 30C34 38 29 44 23 44C17 44 12 38 12 30C12 22 17 16 23 16ZM77 16C83 16 88 22 88 30C88 38 83 44 77 44C71 44 66 38 66 30C66 22 71 16 77 16ZM12 46C18 40 27 42 30 50C33 58 28 66 22 68C16 70 8 66 8 59C8 52 7 51 12 46ZM88 46C93 51 92 52 92 59C92 66 84 70 78 68C72 66 67 58 70 50C73 42 82 40 88 46Z' },
  music:     { e:'🎵', n:'Music',     d:'M36 72C36 82 28 90 18 90C8 90 0 82 0 72C0 62 8 54 18 54C24 54 28 57 36 54V22L76 12V44C84 41 88 44 94 44C104 44 98 56 92 59C86 62 78 57 76 50V80C76 90 68 98 58 98C48 98 40 90 40 80C40 70 48 62 58 62C64 62 68 65 76 62Z' },
  clover:    { e:'🍀', n:'Clover',    d:'M50 50C50 36 36 22 22 22C8 22 8 36 22 42C8 42 8 56 22 56C36 56 36 70 22 70C8 70 8 84 22 78C36 72 50 86 50 86C50 86 64 72 78 78C92 84 92 70 78 70C64 70 64 56 78 56C92 56 92 42 78 42C64 36 64 22 50 22C50 22 50 36 50 50Z' },
  flame:     { e:'🔥', n:'Flame',     d:'M50 5C50 5 76 28 72 52C70 62 62 68 58 76C64 66 55 55 50 60C45 55 36 66 42 76C38 68 30 62 28 52C24 28 50 5 50 5Z' },
  rainbow:   { e:'🌈', n:'Rainbow',   d:'M5 78C5 40 25 8 50 8C75 8 95 40 95 78H78C78 48 66 24 50 24C34 24 22 48 22 78Z' },
  coffee:    { e:'☕', n:'Coffee',    d:'M12 30H72L62 88H22ZM72 45H84C93 45 93 65 84 65H72Z' },
  confetti:  { e:'🎉', n:'Party',     d:'M16 24L24 14L32 24L24 34ZM52 8L58 2L64 8L58 14ZM78 26L85 18L92 26L85 34ZM8 60L14 52L20 60L14 68ZM68 64L76 56L84 64L76 72ZM34 82L42 74L50 82L42 90ZM82 80L88 72L94 80L88 88Z' },
  ornament:  { e:'🎁', n:'Ornament',  d:'M42 4H58V18C74 18 90 33 90 52C90 73 72 90 50 90C28 90 10 73 10 52C10 33 26 18 42 18Z' },
  sun:       { e:'☀️', n:'Sun',       d:'M50 18A32 32 0 1 1 49.9 18ZM50 2V14M50 86V98M98 50H86M14 50H2M83 17L75 25M25 75L17 83M83 83L75 75M25 25L17 17' },
  blob:      { e:'🫧', n:'Blob',      d:'M72 12C88 20 98 40 94 58C90 76 74 90 56 94C38 98 18 90 10 74C2 58 8 36 20 22C32 8 56 4 72 12Z' },
};

function generatePatternSVG(key, baseColor) {
  const shape = PATTERN_SHAPES[key];
  if (!shape || !baseColor) return '';
  const r = parseInt(baseColor.slice(1,3),16);
  const g = parseInt(baseColor.slice(3,5),16);
  const b = parseInt(baseColor.slice(5,7),16);
  const lum = (r*299 + g*587 + b*114) / 255000;
  const isDark = lum < 0.45;
  const amt1 = isDark ? 65 : -35;
  const amt2 = isDark ? 40 : -20;
  const clamp = (v,lo=0,hi=255) => Math.min(hi,Math.max(lo,v));
  const c1 = 'rgba(' + clamp(r+amt1) + ',' + clamp(g+amt1) + ',' + clamp(b+amt1) + ',' + (isDark?0.52:0.22) + ')';
  const c2 = 'rgba(' + clamp(r+amt2) + ',' + clamp(g+amt2) + ',' + clamp(b+amt2) + ',' + (isDark?0.38:0.14) + ')';
  let seed = key.split('').reduce((a,c,i) => a + c.charCodeAt(0)*(i+1), 0);
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed>>>0)/4294967296; };
  const shapes = [];
  for (let i=0;i<4;i++) {
    const cx = -40 + rand()*440;
    const cy = -60 + rand()*760;
    const sz = 140 + rand()*140;
    const rot = rand()*360;
    const sc = (sz/100).toFixed(3);
    shapes.push('<g transform="translate(' + cx.toFixed(0) + ',' + cy.toFixed(0) + ') rotate(' + rot.toFixed(0) + ') scale(' + sc + ') translate(-50,-50)"><path d="' + shape.d + '" fill="' + c1 + '"/></g>');
  }
  for (let i=0;i<3;i++) {
    const cx = -20 + rand()*400;
    const cy = -40 + rand()*720;
    const sz = 90 + rand()*100;
    const rot = rand()*360;
    const sc = (sz/100).toFixed(3);
    shapes.push('<g transform="translate(' + cx.toFixed(0) + ',' + cy.toFixed(0) + ') rotate(' + rot.toFixed(0) + ') scale(' + sc + ') translate(-50,-50)"><path d="' + shape.d + '" fill="' + c2 + '"/></g>');
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" width="360" height="640" style="position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none" class="pattern-bg">' + shapes.join('') + '</svg>';
}

function applyPatternBg() {
  const old = $poster.querySelector('.pattern-bg');
  if (old) old.remove();
  if (!posterPattern) return;
  const svgStr = generatePatternSVG(posterPattern, bgColor);
  if (!svgStr) return;
  const parser = new DOMParser();
  const svgEl = parser.parseFromString(svgStr,'image/svg+xml').documentElement;
  $poster.insertBefore(svgEl, $poster.firstChild);
}

/* ════════════════════════════════════════════════════════════════════════════
   RENDER
   ════════════════════════════════════════════════════════════════════════════ */
function render() {
  $poster.className = `poster t-${tpl} d-${design}`;
  $poster.style.setProperty('--pb', bgColor);
  if ($stage && bgColor && bgColor.length === 7) {
    const r = parseInt(bgColor.slice(1,3),16), g = parseInt(bgColor.slice(3,5),16), b = parseInt(bgColor.slice(5,7),16);
    $stage.style.background = `rgb(${Math.round(r*.18+230*.82)},${Math.round(g*.18+234*.82)},${Math.round(b*.18+230*.82)})`;
  }
  const font    = adventure ? advFont.key    : 'PP Right Serif';
  const fstyle  = adventure ? advFont.style  : 'normal';
  const fweight = adventure ? advFont.weight : '400';
  $poster.style.setProperty('--hf', `'${font}', Georgia, serif`);
  $poster.style.setProperty('--hs', fstyle);
  $poster.style.setProperty('--hw', fweight);
  ({ event:renderEvent, spotlight:renderSpotlight, offer:renderOffer, announcement:renderAnnouncement })[tpl]();
  $poster.classList.remove('poster-focus-in');
  void $poster.offsetWidth;
  $poster.classList.add('poster-focus-in');
  updateDlBtn();
  applyPatternBg();
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
  if (design === 'bold')        return renderEventBold();
  if (design === 'illustrated') return renderEventIllustrated();
  /* editorial — Swiss/International Typographic Style */
  const brand    = v('brand') || 'MINDSPACE HOUR';
  const headline = v('headline');
  const tagline  = v('tagline');
  const date     = v('date');
  const time     = v('time');
  const loc      = v('location');
  const photo    = imgs['photo'] || '';
  const titleStyle = adventure ? hs() : 'font-family:"ABC Diatype","DM Sans",sans-serif;font-weight:500;font-style:normal;';
  $poster.innerHTML = `
    <div class="ev-swiss">
      <div class="ev-sw-title" style="${titleStyle}">${headline || '<span style="opacity:.18">Event name</span>'}</div>
      <div class="ev-sw-rule"></div>
      ${tagline ? `<div class="ev-sw-tagline">${x(tagline)}</div><div class="ev-sw-rule"></div>` : ''}
      <div class="ev-sw-meta">
        <div class="ev-sw-col"><span class="ev-sw-meta-label">Date</span><span class="ev-sw-meta-val">${x(date) || '—'}</span></div>
        <div class="ev-sw-col"><span class="ev-sw-meta-label">Time</span><span class="ev-sw-meta-val">${x(time) || '—'}</span></div>
        <div class="ev-sw-col"><span class="ev-sw-meta-label">Where</span><span class="ev-sw-meta-val ev-sw-loc">${x(loc) || '—'}</span></div>
      </div>
      <div class="ev-sw-rule"></div>
      <div class="ev-sw-photo">
        ${photo ? `<img src="${photo}" alt="" crossorigin="anonymous">` : '<div class="ev-sw-empty">Add photo or GIF ↑</div>'}
      </div>
    </div>`;
}

function renderEventBold() {
  const brand    = v('brand') || 'MINDSPACE';
  const headline = v('headline');
  const tagline  = v('tagline');
  const date     = v('date');
  const time     = v('time');
  const loc      = v('location');
  const photo    = imgs['photo'] || '';
  const titleStyle = adventure ? hs() : 'font-family:"ABC Diatype","DM Sans",sans-serif;font-weight:500;font-style:normal;';
  $poster.innerHTML = `
    <div class="evb-bg">${photo ? `<img src="${photo}" alt="" crossorigin="anonymous">` : '<div class="evb-bg-empty"></div>'}</div>
    <div class="evb-overlay"></div>
    <div class="evb-body">
      <div class="evb-top">
        ${tagline ? `<span class="evb-tagline">${x(tagline)}</span>` : ''}
      </div>
      <div class="evb-bottom">
        <div class="evb-meta-row">
          ${date ? `<div class="evb-meta-col"><span class="evb-meta-label">Date</span><span class="evb-meta-val">${x(date)}</span></div>` : ''}
          ${time ? `<div class="evb-meta-col"><span class="evb-meta-label">Time</span><span class="evb-meta-val">${x(time)}</span></div>` : ''}
          ${loc  ? `<div class="evb-meta-col"><span class="evb-meta-label">Where</span><span class="evb-meta-val">${x(loc)}</span></div>`  : ''}
        </div>
        <div class="evb-title" style="${titleStyle}">${headline || '<span style="opacity:.25">Event name</span>'}</div>
      </div>
    </div>`;
}


function renderEventIllustrated() {
  const brand    = v('brand') || 'MINDSPACE HOUR';
  const headline = v('headline');
  const tagline  = v('tagline');
  const date     = v('date');
  const time     = v('time');
  const loc      = v('location');
  const photo    = imgs['photo'] || '';

  $poster.innerHTML = `
    <div class="evi-wrap">
      <header class="evi-head">
        ${tagline ? `<span class="evi-tagline">${x(tagline)}</span>` : ''}
      </header>

      <div class="evi-title" style="${hs()}">${headline||'<span style="opacity:.18">Event name</span>'}</div>

      <div class="evi-illus">
        ${photo
          ? `<img src="${photo}" alt="" crossorigin="anonymous" class="evi-photo">`
          : `<div class="evi-placeholder"><span>🎉</span><span style="font-size:.65rem;opacity:.45;margin-top:8px;font-family:'DM Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;font-weight:700">Add a photo or GIF above ↑</span></div>`}
      </div>

      <footer class="evi-foot">
        <div class="evi-info-block">
          <span class="evi-info-label">Date</span>
          <span class="evi-info-val">${x(date)||'—'}</span>
        </div>
        <div class="evi-divider"></div>
        <div class="evi-info-block">
          <span class="evi-info-label">Time</span>
          <span class="evi-info-val">${x(time)||'—'}</span>
        </div>
        <div class="evi-divider"></div>
        <div class="evi-info-block evi-info-block--loc">
          <span class="evi-info-label">Where</span>
          <span class="evi-info-val">${x(loc)||'—'}</span>
        </div>
      </footer>
    </div>`;
}

/* ── SPOTLIGHT ── */
function renderSpotlight() {
  if (design === 'cover')   return renderSpotlightCover();
  if (design === 'minimal') return renderSpotlightMinimal();
  const name = v('name'),
        bio = v('bio'), link = v('link'), photo = imgs['photo'] || '';
  $poster.innerHTML = `
    <div class="sp-name" style="${hs()}">${name||'<span style="opacity:.22">Member name</span>'}</div>
    <div class="sp-photo">
      ${photo?`<img src="${photo}" alt="" crossorigin="anonymous">`:'<div class="sp-photo-empty">Add portrait ↑</div>'}
    </div>
    <div class="sp-rule"></div>
    ${bio  ? `<div class="sp-bio">${bioToHtml(bio)}</div>` : ''}
    ${link ? `<div class="sp-link">${x(link)}</div>` : ''}`;
}

function renderSpotlightCover() {
  const name = v('name'),
        bio = v('bio'), photo = imgs['photo'] || '';
  $poster.innerHTML = `
    <div class="spc-photo">${photo?`<img src="${photo}" alt="" crossorigin="anonymous">`:''}</div>
    <div class="spc-overlay"></div>
    <div class="spc-body">
      <div class="spc-name" style="${hs()}">${name||'<span style="opacity:.3">Member name</span>'}</div>
      ${bio ? `<div class="spc-bio">${x(bio)}</div>` : ''}
    </div>`;
}

function renderSpotlightMinimal() {
  const name = v('name'),
        bio = v('bio'), link = v('link');
  $poster.innerHTML = `
    <div class="spm-name" style="${hs()}">${name||'<span style="opacity:.22">Member name</span>'}</div>
    <div class="spm-rule"></div>
    ${bio  ? `<div class="spm-bio">${bioToHtml(bio)}</div>` : ''}
    ${link ? `<div class="spm-link">${x(link)}</div>` : ''}`;
}

/* ── OFFER ── */
/* Parse *accent* markup → styled span */
function twoTone(text, accentCss) {
  return x(text).replace(/\*(.*?)\*/g, `<em class="tt-accent" style="${accentCss}">$1</em>`);
}

function renderOfferBenefit() {
  const headline    = v('headline');
  const body        = v('body');
  const note        = v('note');
  const photo       = imgs['photo']       || '';
  const qr          = imgs['qr']          || '';
  const partnerLogo = imgs['partnerlogo'] || '';

  /* Decide accent colour based on bg lightness */
  const isDark = bgColor && ['#17','#03','#0c','#1c','#28','#24'].some(p => bgColor.toLowerCase().startsWith(p));
  const accentCss = isDark
    ? 'color:#6BCA79;font-style:italic;'
    : 'color:#17382A;font-style:italic;';
  const titleStyle = adventure ? hs() : '';

  $poster.innerHTML = `
    <div class="ofb2-wrap">
      <div class="ofb2-label">MINDSPACE BENEFIT</div>

      <div class="ofb2-photo">
        ${photo
          ? `<img src="${photo}" alt="" crossorigin="anonymous">`
          : '<div class="ofb2-photo-empty">Add photo ↑</div>'}
      </div>

      <div class="ofb2-mid">
        ${qr
          ? `<div class="ofb2-qr"><img src="${qr}" alt="QR code" crossorigin="anonymous"></div>`
          : '<div class="ofb2-qr ofb2-qr-empty">Upload QR</div>'}
      </div>

      <div class="ofb2-body">
        ${headline ? `<div class="ofb2-headline" style="${titleStyle}">${twoTone(headline, accentCss)}</div>` : '<div class="ofb2-headline" style="opacity:.2;${titleStyle}">Your headline</div>'}
        ${body     ? `<div class="ofb2-desc">${x(body).replace(/\n/g,'<br>')}</div>` : ''}
        ${note     ? `<div class="ofb2-note">${x(note)}</div>` : ''}
      </div>

      <div class="ofb2-footer">
        <span class="ofb2-wordmark">Mindspace</span>
        ${partnerLogo
          ? `<img src="${partnerLogo}" alt="" crossorigin="anonymous" class="ofb2-partner">`
          : ''}
      </div>
    </div>`;
}

function renderOffer() {
  if (design === 'benefit') return renderOfferBenefit();
  if (design === 'bold')    return renderOfferBold();
  if (design === 'split')   return renderOfferSplit();
  const headline = v('headline'), note = v('note'), photo = imgs['photo'] || '';
  $poster.innerHTML = `
    ${photo ? `<div class="of-bg"><img src="${photo}" alt="" crossorigin="anonymous"></div>` : ''}
    <div class="of-overlay"></div>
    <div class="of-body">
      ${headline ? `<div class="of-desc">${x(headline)}</div>` : ''}
      ${note     ? `<div class="of-note">${x(note)}</div>`     : ''}
    </div>`;
}

function renderOfferBold() {
  const headline = v('headline'), note = v('note');
  $poster.innerHTML = `
    <div class="ofb-body">
      ${headline ? `<div class="ofb-desc">${x(headline)}</div>` : ''}
      ${note     ? `<div class="ofb-note">${x(note)}</div>`     : ''}
    </div>`;
}

function renderOfferSplit() {
  const headline = v('headline'), note = v('note');
  $poster.innerHTML = `
    <div class="ofs-top"></div>
    <div class="ofs-bottom">
      ${headline ? `<div class="ofs-desc">${x(headline)}</div>` : ''}
      ${note     ? `<div class="ofs-note">${x(note)}</div>`     : ''}
    </div>`;
}

/* ── ANNOUNCEMENT ── */
function renderAnnouncement() {
  if (design === 'bold')  return renderAnnouncementBold();
  if (design === 'split') return renderAnnouncementSplit();
  const title = v('headline'),
        body = v('body'), contact = v('contact');
  $poster.innerHTML = `
    <div class="an-title" style="${hs()}">${title?x(title).replace(/\n/g,'<br>'):'<span style="opacity:.28">Your headline</span>'}</div>
    ${body    ? `<div class="an-body">${x(body)}</div>` : ''}
    ${contact ? `<div class="an-contact">${x(contact)}</div>` : ''}`;
}

function renderAnnouncementBold() {
  const title = v('headline'),
        body = v('body'), contact = v('contact');
  $poster.innerHTML = `
    <div class="anb-title" style="${hs()}">${title?x(title).replace(/\n/g,'<br>'):'<span style="opacity:.25">Your headline</span>'}</div>
    ${body    ? `<div class="anb-body">${x(body)}</div>` : ''}
    ${contact ? `<div class="anb-contact">${x(contact)}</div>` : ''}`;
}

function renderAnnouncementSplit() {
  const title = v('headline'),
        body = v('body'), contact = v('contact');
  $poster.innerHTML = `
    <div class="ans-header">
      <div class="ans-title" style="${hs()}">${title?x(title).replace(/\n/g,'<br>'):'<span style="opacity:.3">Your headline</span>'}</div>
    </div>
    <div class="ans-body-area">
      ${body    ? `<div class="ans-body">${x(body)}</div>` : ''}
      ${contact ? `<div class="ans-contact">${x(contact)}</div>` : ''}
    </div>`;
}

/* ── Download / Print ── */
function posterSlug() {
  return (v('headline')||v('name')||v('brand')||'poster')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);
}

function isGifSrc(src) {
  return src && (src.startsWith('data:image/gif') || /\.gif(\?|$)/i.test(src));
}

function updateDlBtn() {
  const gifSrc = imgs['photo'] || '';
  if (isGifSrc(gifSrc)) {
    $dlBtn.innerHTML = `<svg viewBox="0 0 18 18" fill="none"><path d="M9 2v10M5 8l4 4 4-4M2 14h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Download GIF`;
  } else {
    $dlBtn.innerHTML = `<svg viewBox="0 0 18 18" fill="none"><path d="M9 2v10M5 8l4 4 4-4M2 14h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Download PNG`;
  }
}

$dlBtn.addEventListener('click', async () => {
  const gifSrc = imgs['photo'] || '';
  if (isGifSrc(gifSrc)) {
    await downloadAnimatedGif(gifSrc);
  } else {
    await downloadPng();
  }
});

async function downloadPng() {
  if (typeof html2canvas === 'undefined') { alert('Download library not loaded.'); return; }
  const orig = $dlBtn.innerHTML;
  $dlBtn.disabled = true; $dlBtn.textContent = 'Generating…';
  try {
    const canvas = await html2canvas($poster, { scale:3, useCORS:true, allowTaint:true, backgroundColor:null, logging:false });
    const a = document.createElement('a'); a.download = `mindspace-${posterSlug()}.png`; a.href = canvas.toDataURL('image/png'); a.click();
  } catch (err) { console.error(err); alert('PNG export failed — try Print / Save as PDF instead.'); }
  finally { $dlBtn.disabled = false; $dlBtn.innerHTML = orig; }
}

async function downloadAnimatedGif(gifSrc) {
  if (typeof parseGIF === 'undefined' || typeof GIF === 'undefined') {
    alert('GIF export library not loaded yet — please wait a moment and try again.');
    return;
  }
  const orig = $dlBtn.innerHTML;
  $dlBtn.disabled = true; $dlBtn.textContent = 'Building GIF…';
  try {
    /* 1 — fetch raw GIF bytes */
    let arrayBuf;
    if (gifSrc.startsWith('data:')) {
      const b64 = gifSrc.split(',')[1];
      const bin = atob(b64);
      arrayBuf = new ArrayBuffer(bin.length);
      const view = new Uint8Array(arrayBuf);
      for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
    } else {
      arrayBuf = await fetch(gifSrc).then(r => r.arrayBuffer());
    }

    /* 2 — decode frames */
    const parsed = parseGIF(arrayBuf);
    const frames = decompressFrames(parsed, true);
    if (!frames.length) throw new Error('No frames decoded');

    const gifNatW = parsed.lsd.width;
    const gifNatH = parsed.lsd.height;

    /* 3 — poster dimensions (CSS px) */
    const posterRect = $poster.getBoundingClientRect();
    const W = Math.round(posterRect.width);
    const H = Math.round(posterRect.height);

    /* 4 — find the photo element's position within the poster */
    const photoEl = $poster.querySelector('img[crossorigin="anonymous"]');
    const photoZone = photoEl ? photoEl.parentElement : null;
    let px = 0, py = 0, pw = W, ph = H;
    if (photoZone) {
      const zr = photoZone.getBoundingClientRect();
      const pr = posterRect;
      px = zr.left - pr.left; py = zr.top - pr.top;
      pw = zr.width;          ph = zr.height;
    }

    /* 5 — render poster overlay (photo hidden, transparent bg) */
    const origBg = $poster.style.background;
    $poster.style.background = 'transparent';
    if (photoEl) photoEl.style.visibility = 'hidden';
    const overlayCanvas = await html2canvas($poster, {
      scale: 1, useCORS: true, allowTaint: true, backgroundColor: null, logging: false,
    });
    $poster.style.background = origBg;
    if (photoEl) photoEl.style.visibility = '';

    /* 6 — fetch gif.js worker as blob to avoid cross-origin issues */
    const workerBlob = await fetch('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js').then(r => r.blob());
    const workerURL  = URL.createObjectURL(workerBlob);

    /* 7 — encode output GIF */
    const encoder = new GIF({ workers: 2, quality: 8, width: W, height: H, workerScript: workerURL });

    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = H;
    const ctx = tmp.getContext('2d');

    /* poster background fill colour */
    const bgFill = bgColor || getComputedStyle($poster).backgroundColor || '#ffffff';

    for (const frame of frames) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = bgFill;
      ctx.fillRect(0, 0, W, H);

      /* draw this GIF frame into photo zone (cover fit) */
      const fd = document.createElement('canvas');
      fd.width = gifNatW; fd.height = gifNatH;
      const fctx = fd.getContext('2d');
      const idata = fctx.createImageData(gifNatW, gifNatH);
      idata.data.set(frame.patch);
      fctx.putImageData(idata, 0, 0);

      const scale = Math.max(pw / gifNatW, ph / gifNatH);
      const dw = gifNatW * scale, dh = gifNatH * scale;
      const dx = px + (pw - dw) / 2, dy = py + (ph - dh) / 2;
      ctx.drawImage(fd, dx, dy, dw, dh);

      /* draw overlay (text, rules, gradient) on top */
      ctx.drawImage(overlayCanvas, 0, 0, W, H);

      encoder.addFrame(ctx, { copy: true, delay: frame.delay || 80 });
    }

    encoder.on('finished', blob => {
      URL.revokeObjectURL(workerURL);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `mindspace-${posterSlug()}.gif`;
      a.click();
      $dlBtn.disabled = false; $dlBtn.innerHTML = orig;
    });
    encoder.render();

  } catch (err) {
    console.error(err);
    alert('GIF export failed. Try downloading as PNG instead.');
    $dlBtn.disabled = false; $dlBtn.innerHTML = orig;
  }
}

$printBtn.addEventListener('click', () => window.print());

/* ── Utils ── */
function id(s)     { return document.getElementById(s); }
function mk(t, c)  { const e = document.createElement(t); if (c) e.className = c; return e; }
function qsa(s, p) { return Array.from((p||document).querySelectorAll(s)); }

/* ── Mobile wall meme randomiser ── */
(function randomiseMobileWall() {
  const MEMES = [
    { img:'meme-1.gif', h2:'A poster?<br>On <em>this</em>??',         p:'Come on. Grab your laptop.<br>We\'ll be here.' },
    { img:'meme-2.jpg', h2:'We see you.',                              p:'Desktop-only tool. Laptop. Now.<br>We promise it\'s worth it.' },
    { img:'meme-3.jpg', h2:'You want to design<br>on your phone??',   p:'This tool needs a real screen.<br>Go grab your laptop.' },
    { img:'meme-4.jpg', h2:'Not today.<br>Not like this.',             p:'Bigger screen. Better posters.<br>See you on a laptop.' },
  ];
  const m = MEMES[Math.floor(Math.random() * MEMES.length)];
  const wall = id('mobileWall');
  if (!wall) return;
  const imgEl = wall.querySelector('.mw-meme');
  const h2El  = wall.querySelector('.mw-inner h2');
  const pEl   = wall.querySelector('.mw-inner p');
  if (imgEl) imgEl.src = m.img;
  if (h2El)  h2El.innerHTML = m.h2;
  if (pEl)   pEl.innerHTML  = m.p;
})();

/* ── Intro animation ── */
(function runIntro() {
  const h1     = document.querySelector('.pick-hero-h1');
  const sub    = document.querySelector('.pick-hero-sub');
  const panels = qsa('.panel');
  h1.innerHTML = '';
  sub.classList.add('anim-hidden');
  panels.forEach(c => c.classList.add('anim-hidden'));
  const fullText = 'What are you\nmaking today?';
  let i = 0;
  function tick() {
    if (i >= fullText.length) { h1.classList.add('typing-done'); afterTyping(); return; }
    const ch = fullText[i++];
    h1.innerHTML += ch === '\n' ? '<br>' : ch;
    setTimeout(tick, ch === '\n' ? 80 : 48);
  }
  setTimeout(tick, 400);
  function afterTyping() {
    panels.forEach((c, idx) => setTimeout(() => { c.classList.remove('anim-hidden'); c.classList.add('anim-in'); }, idx * 80));
    setTimeout(() => { sub.classList.remove('anim-hidden'); sub.classList.add('anim-in'); }, panels.length * 80 + 100);
  }
})();
