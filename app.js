'use strict';

const GIPHY_KEY = 'dc6zaTOxFJmzC';

const SPARKS = [
  "This day seems like a perfect day to make a poster.",
  "Every great event deserves a great poster.",
  "Ready to make something people will stop and stare at?",
  "Your community is waiting to hear about this.",
  "Let's turn this event into something beautiful.",
  "Great posters get people through the door.",
  "Make it bold. Make it Mindspace.",
  "Something amazing is about to happen. Let's tell the world.",
  "The best events start with a killer poster.",
  "Time to design something your community will love.",
];

const MOBILE_MSGS = [
  "You're on a phone. This tool needs a real screen.",
  "Put the phone down. Open a laptop. Make a poster.",
  "Mobile? Seriously? Grab your laptop and come back.",
  "This needs a bigger canvas. Find a desktop, friend.",
];

const RATIO_DIM = {
  '9:16':  [1080, 1920],
  '16:9':  [1920, 1080],
  '1:1':   [1080, 1080],
};

/* ── State ──────────────────────────────────────────────────────────────── */
const S = {
  step: 0,        // 0=desc, 1=date, 2=location, 3=image
  template: 0,
  title: '',
  desc: '',
  date: '',
  location: '',
  image: null,
  imgSrc: 'unsplash',
  doneRatio: '9:16',
};

/* ── DOM shortcuts ──────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const screenWelcome = $('screenWelcome');
const screenBuild   = $('screenBuild');
const screenDone    = $('screenDone');
const poster        = $('poster');
const wzBody        = $('wzBody');
const wzNext        = $('wzNext');
const wzSkip        = $('wzSkip');
const drawer        = $('drawer');

/* ── Mobile block ───────────────────────────────────────────────────────── */
$('mbMsg').textContent = MOBILE_MSGS[Math.floor(Math.random() * MOBILE_MSGS.length)];

/* ── Spark sentence ─────────────────────────────────────────────────────── */
$('wlSpark').textContent = SPARKS[Math.floor(Date.now() / 86400000) % SPARKS.length];

/* ── Welcome input ──────────────────────────────────────────────────────── */
const wlInput = $('wlInput');
const wlGo    = $('wlGo');

wlInput.addEventListener('input', () => {
  wlGo.disabled = wlInput.value.trim().length === 0;
});
wlInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && wlInput.value.trim().length > 0) startBuild();
});
wlGo.addEventListener('click', startBuild);

/* ── Step definitions ────────────────────────────────────────────────────── */
const STEPS = [
  {
    label: 'Description',
    skippable: true,
    render() {
      return `
        <p class="step-q">Add a description?</p>
        <p class="step-hint">One punchy line below the title — or skip it.</p>
        <textarea class="step-input" id="inputDesc"
          placeholder="An evening of movement, mindfulness & good energy."
          rows="4" maxlength="200">${S.desc}</textarea>`;
    },
    mount() {
      const el = $('inputDesc');
      el.focus();
      el.addEventListener('input', () => { S.desc = el.value; renderPoster(); });
      enableNext(true);
    },
  },
  {
    label: 'Date',
    skippable: true,
    render() {
      return `
        <p class="step-q">When is it?</p>
        <p class="step-hint">Add the date and time — or skip for now.</p>
        <div class="meta-group">
          <div class="meta-row">
            <span class="meta-label">Date</span>
            <input class="step-input" id="inputDate" placeholder="Thursday, July 10" value="${S.date}">
          </div>
        </div>`;
    },
    mount() {
      const el = $('inputDate');
      el.focus();
      el.addEventListener('input', () => { S.date = el.value; renderPoster(); });
      enableNext(true);
    },
  },
  {
    label: 'Location',
    skippable: true,
    render() {
      return `
        <p class="step-q">Where is it?</p>
        <p class="step-hint">Name the space or city — keeps it clear for everyone.</p>
        <input class="step-input" id="inputLoc" placeholder="Mindspace Rooftop, Tel Aviv" value="${S.location}">`;
    },
    mount() {
      const el = $('inputLoc');
      el.focus();
      el.addEventListener('input', () => { S.location = el.value; renderPoster(); });
      enableNext(true);
    },
  },
  {
    label: 'Image',
    skippable: true,
    render() {
      const has = !!S.image;
      return `
        <p class="step-q">Add an image?</p>
        <p class="step-hint">A photo or GIF as the poster background — totally optional.</p>
        <button class="img-pick ${has ? 'picked' : ''}" id="openDrawer">
          ${has ? `<img class="img-pick-thumb" src="${S.image.thumb}" alt="">` : ''}
          <span>${has ? '✓ Image selected — tap to change' : 'Search photos or upload'}</span>
        </button>`;
    },
    mount() {
      enableNext(true);
      $('openDrawer').addEventListener('click', openDrawer);
    },
  },
];

/* ── Build flow ─────────────────────────────────────────────────────────── */
function startBuild() {
  S.title = wlInput.value.trim();
  if (!S.title) return;

  screenWelcome.classList.add('sc-exit');
  setTimeout(() => {
    screenWelcome.classList.add('hidden');
    screenWelcome.classList.remove('sc-exit');
    screenBuild.classList.remove('hidden');
    screenBuild.classList.add('sc-enter');
    setTimeout(() => screenBuild.classList.remove('sc-enter'), 400);

    applyTemplate(S.template);
    renderPoster();
    S.step = 0;
    loadStep(0, 1);
    /* wait one frame so the panel has real dimensions before scaling */
    requestAnimationFrame(() => requestAnimationFrame(() => scalePoster()));
  }, 220);
}

function loadStep(idx, dir) {
  S.step = idx;
  /* progress bar */
  $('wzFill').style.width = ((idx + 1) / STEPS.length * 100) + '%';
  $('wzStepLabel').textContent = `Step ${idx + 1} of ${STEPS.length}`;
  /* skip visibility */
  wzSkip.classList.toggle('visible', !!STEPS[idx].skippable);
  enableNext(STEPS[idx].skippable);

  wzBody.classList.remove('wz-enter-fwd','wz-enter-bwd','wz-exit-fwd','wz-exit-bwd');
  wzBody.classList.add(dir > 0 ? 'wz-exit-fwd' : 'wz-exit-bwd');

  setTimeout(() => {
    wzBody.innerHTML = STEPS[idx].render();
    wzBody.classList.remove('wz-exit-fwd','wz-exit-bwd');
    void wzBody.offsetWidth;
    wzBody.classList.add(dir > 0 ? 'wz-enter-fwd' : 'wz-enter-bwd');
    STEPS[idx].mount();
    wzNext.textContent = idx < STEPS.length - 1 ? 'Continue' : 'See my poster →';
  }, 150);
}

function enableNext(on) { wzNext.disabled = !on; }

$('wzNext').addEventListener('click', () => {
  if (S.step < STEPS.length - 1) {
    loadStep(S.step + 1, 1);
  } else {
    goToDone();
  }
});
$('wzSkip').addEventListener('click', () => {
  if (S.step < STEPS.length - 1) {
    loadStep(S.step + 1, 1);
  } else {
    goToDone();
  }
});
$('wzBack').addEventListener('click', () => {
  if (S.step > 0) {
    loadStep(S.step - 1, -1);
  } else {
    /* back to welcome */
    screenBuild.classList.add('sc-exit');
    setTimeout(() => {
      screenBuild.classList.add('hidden');
      screenBuild.classList.remove('sc-exit');
      screenWelcome.classList.remove('hidden');
      screenWelcome.classList.add('sc-enter');
      setTimeout(() => screenWelcome.classList.remove('sc-enter'), 400);
    }, 220);
  }
});

/* ── Template picker ────────────────────────────────────────────────────── */
document.querySelectorAll('.tpl-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tpl-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyTemplate(parseInt(btn.dataset.t));
  });
});

function applyTemplate(idx) {
  S.template = idx;
  poster.className = poster.className.replace(/\bt-\d\b/g, '').trim();
  poster.classList.add(`t-${idx}`);
  renderPoster();
}

/* ── Poster render ──────────────────────────────────────────────────────── */
function renderPoster() {
  $('pTitle').textContent = S.title;

  const descEl = $('pDesc');
  descEl.textContent = S.desc;
  descEl.style.display = S.desc.trim() ? '' : 'none';

  const metaParts = [S.date, S.location].filter(Boolean);
  const metaEl = $('pMeta');
  metaEl.innerHTML = metaParts.map((p, i) =>
    (i > 0 ? '<span class="p-meta-dot">·</span>' : '') + `<span>${p}</span>`
  ).join('');
  metaEl.style.display = metaParts.length ? '' : 'none';

  $('pTag').textContent = 'Mindspace';

  const bgEl = $('pBg');
  if (S.image) {
    bgEl.style.backgroundImage = `url('${S.image.url}')`;
  } else {
    bgEl.style.backgroundImage = '';
  }
}

function applyRatio(r) {
  poster.classList.remove('r-169', 'r-11');
  if (r === '16:9') poster.classList.add('r-169');
  if (r === '1:1')  poster.classList.add('r-11');
  scalePoster();
}

function scalePoster() {
  const wrap  = $('stageWrap');
  const stage = $('stage');
  if (!wrap || !stage) return;
  const pw = stage.clientWidth  - 80;
  const ph = stage.clientHeight - 100;  /* leave room for template strip */
  const r  = '9:16';   /* build preview always shows 9:16 */
  const [nw, nh] = RATIO_DIM[r];
  const scale = Math.min(pw / nw, ph / nh, 1);
  poster.style.transform = `scale(${scale})`;
  wrap.style.width  = (nw * scale) + 'px';
  wrap.style.height = (nh * scale) + 'px';
}

window.addEventListener('resize', () => {
  if (!screenBuild.classList.contains('hidden')) scalePoster();
  if (!screenDone.classList.contains('hidden'))  renderDonePoster(S.doneRatio);
});

/* ── Done screen ────────────────────────────────────────────────────────── */
function goToDone() {
  S.doneRatio = '9:16';
  screenBuild.classList.add('sc-exit');
  setTimeout(() => {
    screenBuild.classList.add('hidden');
    screenBuild.classList.remove('sc-exit');
    screenDone.classList.remove('hidden');
    screenDone.classList.add('sc-enter');
    setTimeout(() => screenDone.classList.remove('sc-enter'), 400);
    renderDonePoster('9:16');
    updateFmtBtns('9:16');
  }, 220);
}

function renderDonePoster(ratio) {
  const wrap = $('doneWrap');
  wrap.innerHTML = '';
  wrap.style.width = '';
  wrap.style.height = '';

  const clone = poster.cloneNode(true);
  clone.id = 'donePoster';
  clone.style.cssText = '';
  clone.classList.remove('r-169', 'r-11');
  if (ratio === '16:9') clone.classList.add('r-169');
  if (ratio === '1:1')  clone.classList.add('r-11');
  wrap.appendChild(clone);

  const measure = () => {
    const PAD = 96;
    const SIDE = 340;
    const pw = window.innerWidth  - SIDE - PAD;
    const ph = window.innerHeight - PAD;
    if (pw <= 0 || ph <= 0) { requestAnimationFrame(measure); return; }
    const [nw, nh] = RATIO_DIM[ratio];
    const scale = Math.min(pw / nw, ph / nh, 1);
    clone.style.transform = `scale(${scale})`;
    clone.style.transformOrigin = 'top left';
    wrap.style.width  = (nw * scale) + 'px';
    wrap.style.height = (nh * scale) + 'px';
  };
  requestAnimationFrame(() => requestAnimationFrame(measure));
}

function updateFmtBtns(active) {
  document.querySelectorAll('.ds-fmt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.r === active);
  });
}

document.querySelectorAll('.ds-fmt').forEach(btn => {
  btn.addEventListener('click', () => {
    S.doneRatio = btn.dataset.r;
    updateFmtBtns(btn.dataset.r);
    renderDonePoster(btn.dataset.r);
  });
});

$('dsEdit').addEventListener('click', () => {
  screenDone.classList.add('sc-exit');
  setTimeout(() => {
    screenDone.classList.add('hidden');
    screenDone.classList.remove('sc-exit');
    screenBuild.classList.remove('hidden');
    screenBuild.classList.add('sc-enter');
    setTimeout(() => screenBuild.classList.remove('sc-enter'), 400);
    S.doneRatio = '9:16';
    applyRatio('9:16');
    renderPoster();
    scalePoster();
    loadStep(0, -1);
  }, 220);
});

$('dsNew').addEventListener('click', () => {
  Object.assign(S, { step:0, title:'', desc:'', date:'', location:'', image:null, doneRatio:'9:16' });
  wlInput.value = '';
  wlGo.disabled = true;
  $('wlSpark').textContent = SPARKS[Math.floor(Math.random() * SPARKS.length)];

  screenDone.classList.add('sc-exit');
  setTimeout(() => {
    screenDone.classList.add('hidden');
    screenDone.classList.remove('sc-exit');
    screenWelcome.classList.remove('hidden');
    screenWelcome.classList.add('sc-enter');
    setTimeout(() => screenWelcome.classList.remove('sc-enter'), 400);
    wlInput.focus();
  }, 220);
});

/* ── Download ────────────────────────────────────────────────────────────── */
$('dsDl').addEventListener('click', async () => {
  const btn = $('dsDl');
  btn.textContent = 'Generating…';
  btn.disabled = true;

  const ratio = S.doneRatio;
  const [nw, nh] = RATIO_DIM[ratio];

  const off = poster.cloneNode(true);
  off.id = '';
  off.classList.remove('r-169', 'r-11');
  if (ratio === '16:9') off.classList.add('r-169');
  if (ratio === '1:1')  off.classList.add('r-11');
  off.style.cssText = `position:fixed;left:-9999px;top:0;width:${nw}px;height:${nh}px;transform:none;`;
  document.body.appendChild(off);

  await document.fonts.ready;

  try {
    const bgColor = getComputedStyle(poster).backgroundColor || '#0E0B08';
    const canvas = await html2canvas(off, {
      width: nw, height: nh, scale: 1,
      useCORS: true, allowTaint: false,
      backgroundColor: bgColor, logging: false,
    });
    const a = document.createElement('a');
    a.download = `mindspace-poster-${ratio.replace(':','-')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  } catch(e) {
    console.error(e);
    alert('Download failed — please try again.');
  } finally {
    document.body.removeChild(off);
    btn.innerHTML = `<svg viewBox="0 0 20 20" fill="none"><path d="M10 3v10M6 9l4 4 4-4M3 16h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Download PNG`;
    btn.disabled = false;
  }
});

/* ── Image drawer ────────────────────────────────────────────────────────── */
function openDrawer() {
  drawer.classList.remove('hidden');
  void drawer.offsetWidth;
  setDrawerTab(S.imgSrc);
}
function closeDrawer() {
  drawer.classList.add('drawer-close');
  setTimeout(() => {
    drawer.classList.add('hidden');
    drawer.classList.remove('drawer-close');
  }, 230);
}

function setDrawerTab(src) {
  S.imgSrc = src;
  document.querySelectorAll('.dr-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.src === src));
  $('drSearchRow').classList.toggle('hidden', src === 'upload');
  $('drUpload').classList.toggle('hidden', src !== 'upload');
  $('drResults').innerHTML = '';
  if (src !== 'upload') $('drSearch').focus();
}

async function doSearch() {
  const q = $('drSearch').value.trim();
  if (!q) return;
  const results = $('drResults');
  results.className = 'dr-results loading';
  results.innerHTML = 'Searching…';

  try {
    let items = [];

    if (S.imgSrc === 'giphy') {
      const res  = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=18&rating=g`,
        { mode: 'cors' }
      );
      if (!res.ok) throw new Error(`Giphy error ${res.status}`);
      const data = await res.json();
      items = (data.data || []).map(g => ({
        thumb: g.images.fixed_width_small.url,
        full:  g.images.original.url,
        type:  'gif',
      }));
      if (!items.length) throw new Error('No GIFs found — try a different keyword.');
    } else {
      const PHOTOS = [
        '1540575467063-178a50c2df87','1492684223066-81342ee5ff30','1531058020387-3be344556be6',
        '1511578314322-379afb476865','1470229722913-7c0e2dbbafd3','1514525253161-7a46d19cd819',
        '1519741497674-611571de1d87','1524368535928-5b5e00ddc76b','1499951360447-b19be8fe80f5',
        '1516450360452-9312f5e86fc7','1486325212027-8081e485255e','1497366216548-37526070297c',
        '1497366412874-3415097a27e7','1575429198097-0414ec08e8cd','1582063289852-62450b9ab12e',
        '1496337589254-7e19d01cec44','1598300042247-d088f8ab3a91','1506905925346-21bda4d32df4',
        '1477959858617-67f85cf4f1df','1478720568477-152d9b92543a',
      ];
      const seed = q.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const shuffled = [...PHOTOS].sort((a, b) => {
        const ha = (seed * 1103515245 + a.charCodeAt(0)) & 0x7fffffff;
        const hb = (seed * 1103515245 + b.charCodeAt(0)) & 0x7fffffff;
        return ha - hb;
      });
      items = shuffled.slice(0, 12).map(id => ({
        thumb: `https://images.unsplash.com/photo-${id}?w=200&h=200&fit=crop&auto=format&q=70`,
        full:  `https://images.unsplash.com/photo-${id}?w=1920&h=1920&fit=crop&auto=format&q=85`,
        type:  'photo',
      }));
    }

    results.className = 'dr-results';
    results.innerHTML = '';
    items.forEach(item => {
      const d   = document.createElement('div');
      d.className = 'dr-img';
      const img = document.createElement('img');
      img.src = item.thumb; img.loading = 'lazy'; img.alt = '';
      d.appendChild(img);
      d.addEventListener('click', () => selectImage(item));
      results.appendChild(d);
    });
  } catch(e) {
    results.className = 'dr-results';
    results.innerHTML = `<span class="dr-msg">${e.message || 'Search failed — check your connection.'}</span>`;
  }
}

function selectImage({ full, thumb, type }) {
  S.image = { url: full, thumb, type };
  renderPoster();
  closeDrawer();
  if (S.step === 3) {
    setTimeout(() => {
      wzBody.innerHTML = STEPS[3].render();
      STEPS[3].mount();
    }, 250);
  }
}

function handleUpload(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => selectImage({ full: e.target.result, thumb: e.target.result, type: 'upload' });
  reader.readAsDataURL(file);
}

$('drBackdrop').addEventListener('click', closeDrawer);
$('drClose').addEventListener('click', closeDrawer);
document.querySelectorAll('.dr-tab').forEach(tab =>
  tab.addEventListener('click', () => setDrawerTab(tab.dataset.src))
);
$('drGo').addEventListener('click', doSearch);
$('drSearch').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
$('fileInput').addEventListener('change', e => handleUpload(e.target.files[0]));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !drawer.classList.contains('hidden')) closeDrawer();
});

/* ── Init ───────────────────────────────────────────────────────────────── */
applyRatio('9:16');
applyTemplate(0);
renderPoster();
scalePoster();
wlInput.focus();
