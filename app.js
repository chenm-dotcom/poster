'use strict';

const GIPHY_KEY = 'dc6zaTOxFJmzC';

/* ── State ───────────────────────────────────────────────────────────────── */
const S = {
  step:      1,
  dir:       1,    /* 1 = forward, -1 = backward (for step animations) */
  ratio:     '9:16',
  allRatios: false,
  headline:  '',
  body:      '',
  date:      '',
  day:       '',
  location:  '',
  image:     null,
  imgSrc:    'giphy',
  doneRatio: null,
};

const TOTAL_STEPS = 5;

/* ── DOM ─────────────────────────────────────────────────────────────────── */
const $  = id => document.getElementById(id);
const screenWelcome = $('screenWelcome');
const screenBuild   = $('screenBuild');
const screenDone    = $('screenDone');
const imgDrawer     = $('imgDrawer');
const wizardBody    = $('wizardBody');
const btnBack       = $('btnBack');
const btnNext       = $('btnNext');
const btnSkip       = $('btnSkip');
const stepCounter   = $('stepCounter');
const poster        = $('poster');

/* ── Ratio config ────────────────────────────────────────────────────────── */
const RATIO_CLASS = { '9:16': 'r-916', '16:9': 'r-169', '1:1': 'r-11' };
const RATIO_LABEL = { '9:16': '9 × 16 — Story', '16:9': '16 × 9 — Screen', '1:1': '1 × 1 — Square' };
const RATIO_DIM   = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080] };

/* ── Step definitions ────────────────────────────────────────────────────── */
const STEPS = [
  {
    n: 1, skippable: false,
    render() {
      return `
        <p class="step-q">What's the<br>headline?</p>
        <p class="step-hint">Keep it short and punchy — 2 to 5 words hit hardest.</p>
        <textarea class="step-input" id="inputHeadline"
          placeholder="Workshop Tonight" rows="3" maxlength="80">${S.headline}</textarea>`;
    },
    mount() {
      const el = $('inputHeadline');
      el.focus(); el.setSelectionRange(el.value.length, el.value.length);
      el.addEventListener('input', () => { S.headline = el.value; updatePoster(); toggleNext(el.value.trim().length > 0); });
      toggleNext(S.headline.trim().length > 0);
    },
  },
  {
    n: 2, skippable: true,
    render() {
      return `
        <p class="step-q">Add a description?</p>
        <p class="step-hint">A short line below the headline — or skip it entirely.</p>
        <textarea class="step-input" id="inputBody"
          placeholder="Join us for an evening of talks, ideas, and good company."
          rows="4" maxlength="200">${S.body}</textarea>`;
    },
    mount() {
      const el = $('inputBody');
      el.focus();
      el.addEventListener('input', () => { S.body = el.value; updatePoster(); });
      toggleNext(true);
    },
  },
  {
    n: 3, skippable: true,
    render() {
      return `
        <p class="step-q">When &amp; where?</p>
        <p class="step-hint">All optional — add whichever details matter for this post.</p>
        <div class="meta-fields">
          <div class="meta-field">
            <span class="mf-label">Day</span>
            <input class="step-input" id="inputDay" placeholder="Tuesday" value="${S.day}">
          </div>
          <div class="meta-field">
            <span class="mf-label">Date</span>
            <input class="step-input" id="inputDate" placeholder="January 14, 2025" value="${S.date}">
          </div>
          <div class="meta-field">
            <span class="mf-label">Location</span>
            <input class="step-input" id="inputLocation" placeholder="Mindspace Tel Aviv" value="${S.location}">
          </div>
        </div>`;
    },
    mount() {
      toggleNext(true);
      ['inputDay','inputDate','inputLocation'].forEach(id => {
        const el = $(id);
        if (el) el.addEventListener('input', () => {
          S.day      = $('inputDay').value;
          S.date     = $('inputDate').value;
          S.location = $('inputLocation').value;
          updatePoster();
        });
      });
    },
  },
  {
    n: 4, skippable: true,
    render() {
      const thumb = S.image ? `<img class="ipb-thumb" src="${S.image.thumb}" alt="">` : '';
      const label = S.image ? '✓ Image selected — tap to change' : 'Add an image';
      return `
        <p class="step-q">Add an image?</p>
        <p class="step-hint">Search Giphy for a GIF, Unsplash for a photo, or upload your own.</p>
        <button class="img-pick-btn ${S.image ? 'has-img' : ''}" id="openImgDrawer">
          ${thumb}<span>${label}</span>
        </button>`;
    },
    mount() {
      toggleNext(true);
      $('openImgDrawer').addEventListener('click', openDrawer);
    },
  },
  {
    n: 5, skippable: false,
    render() { return ''; },
    mount()  { showDone(); },
  },
];

/* ── Render current step ─────────────────────────────────────────────────── */
function renderStep() {
  const step = STEPS[S.step - 1];

  /* slide out old content */
  wizardBody.classList.remove('step-enter-fwd', 'step-enter-bwd');
  wizardBody.classList.add(S.dir > 0 ? 'step-exit-fwd' : 'step-exit-bwd');

  setTimeout(() => {
    wizardBody.innerHTML = step.render();
    wizardBody.classList.remove('step-exit-fwd', 'step-exit-bwd');
    void wizardBody.offsetWidth; /* force reflow */
    wizardBody.classList.add(S.dir > 0 ? 'step-enter-fwd' : 'step-enter-bwd');
    stepCounter.textContent = `${S.step} / ${TOTAL_STEPS}`;
    btnSkip.classList.toggle('hidden', !step.skippable);
    btnNext.disabled = true;
    step.mount();
  }, 160);
}

function toggleNext(on) { btnNext.disabled = !on; }

/* ── Poster update ───────────────────────────────────────────────────────── */
function applyRatio(r) {
  Object.values(RATIO_CLASS).forEach(c => poster.classList.remove(c));
  poster.classList.add(RATIO_CLASS[r]);
  scalePoster();
  $('stageLabel').textContent = RATIO_LABEL[r];
}

function updatePoster() {
  const ph = $('pHeadline');
  if (ph) ph.textContent = S.headline;

  const pb = $('pBody');
  if (pb) { pb.textContent = S.body; pb.style.display = S.body.trim() ? '' : 'none'; }

  const pr = $('pRule');
  const hasMeta = !!(S.day || S.date || S.location);
  if (pr) pr.style.display = hasMeta ? '' : 'none';

  const pm = $('pMeta');
  if (pm) {
    const parts = [S.day, S.date, S.location].filter(Boolean);
    pm.innerHTML = parts.map((p, i) =>
      (i > 0 ? '<span class="p-meta-dot">·</span>' : '') + `<span>${p}</span>`
    ).join('');
    pm.style.display = hasMeta ? '' : 'none';
  }

  const bg = $('pBg');
  if (bg) {
    if (S.image) {
      bg.style.backgroundImage = `url('${S.image.url}')`;
      poster.classList.add('has-img');
    } else {
      bg.style.backgroundImage = '';
      poster.classList.remove('has-img');
    }
  }
}

function scalePoster() {
  const wrap  = $('stageWrap');
  const panel = $('stagePanel');
  if (!wrap || !panel) return;
  /* use actual panel dims; fall back to window if not yet painted */
  const pw = (panel.clientWidth  || window.innerWidth  - 400) - 80;
  const ph = (panel.clientHeight || window.innerHeight)        - 80;
  const [nw, nh] = RATIO_DIM[S.ratio];
  const scale = Math.min(pw / nw, ph / nh, 1);
  poster.style.transform = `scale(${scale})`;
  wrap.style.width  = (nw * scale) + 'px';
  wrap.style.height = (nh * scale) + 'px';
}

/* ── Navigation ──────────────────────────────────────────────────────────── */
function goNext() {
  if (S.step < TOTAL_STEPS) { S.dir = 1; S.step++; renderStep(); }
}
function goBack() {
  if (S.step > 1) { S.dir = -1; S.step--; renderStep(); }
  else {
    transitionScreens(screenBuild, screenWelcome);
  }
}

/* ── Screen transitions ──────────────────────────────────────────────────── */
function transitionScreens(from, to, dir = 1) {
  from.classList.add(dir > 0 ? 'screen-exit-fwd' : 'screen-exit-bwd');
  setTimeout(() => {
    from.classList.add('hidden');
    from.classList.remove('screen-exit-fwd', 'screen-exit-bwd');
    to.classList.remove('hidden');
    void to.offsetWidth;
    to.classList.add(dir > 0 ? 'screen-enter-fwd' : 'screen-enter-bwd');
    setTimeout(() => to.classList.remove('screen-enter-fwd', 'screen-enter-bwd'), 500);
  }, 280);
}

/* ── Done screen ─────────────────────────────────────────────────────────── */
function showDone() {
  S.doneRatio = S.ratio;
  screenBuild.classList.add('screen-exit-fwd');
  setTimeout(() => {
    screenBuild.classList.add('hidden');
    screenBuild.classList.remove('screen-exit-fwd');
    screenDone.classList.remove('hidden');
    void screenDone.offsetWidth;
    screenDone.classList.add('screen-enter-done');
    setTimeout(() => screenDone.classList.remove('screen-enter-done'), 600);
    renderDonePoster(S.ratio);
  }, 280);

  const tabs = $('doneRatioTabs');
  if (S.allRatios) {
    tabs.classList.remove('hidden');
    tabs.querySelectorAll('.drt').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.r === S.ratio);
      btn.addEventListener('click', () => {
        S.doneRatio = btn.dataset.r;
        tabs.querySelectorAll('.drt').forEach(b => b.classList.toggle('active', b.dataset.r === S.doneRatio));
        renderDonePoster(S.doneRatio);
      });
    });
  } else {
    tabs.classList.add('hidden');
  }
}

function renderDonePoster(ratio) {
  const wrap = $('donePosterWrap');
  wrap.innerHTML = '';
  wrap.style.width = '';
  wrap.style.height = '';

  const clone = poster.cloneNode(true);
  clone.id = 'donePoster';
  clone.removeAttribute('style');
  Object.values(RATIO_CLASS).forEach(c => clone.classList.remove(c));
  clone.classList.add(RATIO_CLASS[ratio]);
  clone.classList.add('poster-reveal');
  wrap.appendChild(clone);

  /* Measure after two frames to ensure layout is settled */
  const measure = () => {
    /* Use window dimensions directly — reliable even before first paint */
    const SIDEBAR = 360;
    const PAD     = 80;
    const pw = window.innerWidth  - SIDEBAR - PAD;
    const ph = window.innerHeight - PAD;
    if (pw <= 0 || ph <= 0) { requestAnimationFrame(measure); return; }
    const [nw, nh] = RATIO_DIM[ratio];
    const scale = Math.min(pw / nw, ph / nh, 1);
    clone.style.transform       = `scale(${scale})`;
    clone.style.transformOrigin = 'top left';
    wrap.style.width  = (nw * scale) + 'px';
    wrap.style.height = (nh * scale) + 'px';
    setTimeout(() => clone.classList.remove('poster-reveal'), 50);
  };
  requestAnimationFrame(() => requestAnimationFrame(measure));
}

/* ── Download ────────────────────────────────────────────────────────────── */
async function downloadPoster() {
  const btn = $('btnDownload');
  btn.textContent = 'Generating…';
  btn.disabled = true;

  const ratio = S.doneRatio || S.ratio;
  const [nw, nh] = RATIO_DIM[ratio];

  const off = poster.cloneNode(true);
  off.id = '';
  Object.values(RATIO_CLASS).forEach(c => off.classList.remove(c));
  off.classList.add(RATIO_CLASS[ratio]);
  off.style.cssText = `position:fixed;left:-9999px;top:0;width:${nw}px;height:${nh}px;transform:none;`;
  document.body.appendChild(off);

  await document.fonts.ready;

  try {
    const canvas = await html2canvas(off, {
      width: nw, height: nh, scale: 1,
      useCORS: true, allowTaint: false,
      backgroundColor: '#1A0F08', logging: false,
    });
    const a = document.createElement('a');
    a.download = `mindspace-${ratio.replace(':','-')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  } catch(e) {
    console.error(e);
    alert('Download failed — please try again.');
  } finally {
    document.body.removeChild(off);
    btn.innerHTML = `<svg viewBox="0 0 20 20" fill="none"><path d="M10 3v10M6 9l4 4 4-4M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Download PNG`;
    btn.disabled = false;
  }
}

/* ── Image drawer ────────────────────────────────────────────────────────── */
function openDrawer()  {
  imgDrawer.classList.remove('hidden');
  void imgDrawer.offsetWidth;
  imgDrawer.classList.add('drawer-open');
  setDrawerTab(S.imgSrc);
}
function closeDrawer() {
  imgDrawer.classList.remove('drawer-open');
  imgDrawer.classList.add('drawer-close');
  setTimeout(() => {
    imgDrawer.classList.add('hidden');
    imgDrawer.classList.remove('drawer-close');
  }, 260);
}

function setDrawerTab(src) {
  S.imgSrc = src;
  document.querySelectorAll('.idr-tab').forEach(t => t.classList.toggle('active', t.dataset.src === src));
  $('idrSearchRow').classList.toggle('hidden', src === 'upload');
  $('idrUploadRow').classList.toggle('hidden', src !== 'upload');
  $('idrResults').innerHTML = '';
  if (src !== 'upload') $('idrSearchInput').focus();
}

async function doSearch() {
  const q = $('idrSearchInput').value.trim();
  if (!q) return;
  const results = $('idrResults');
  results.className = 'idr-results loading';
  results.innerHTML = '<span>Searching…</span>';

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
      if (!items.length) throw new Error('No GIFs found — try a different term.');
    } else {
      /* Curated Unsplash photos — reliable CDN, no API key, CORS-friendly */
      const PHOTOS = [
        '1540575467063-178a50c2df87','1492684223066-81342ee5ff30','1531058020387-3be344556be6',
        '1511578314322-379afb476865','1470229722913-7c0e2dbbafd3','1514525253161-7a46d19cd819',
        '1519741497674-611571de1d87','1524368535928-5b5e00ddc76b','1499951360447-b19be8fe80f5',
        '1516450360452-9312f5e86fc7','1486325212027-8081e485255e','1497366216548-37526070297c',
        '1497366412874-3415097a27e7','1575429198097-0414ec08e8cd','1582063289852-62450b9ab12e',
        '1496337589254-7e19d01cec44','1598300042247-d088f8ab3a91','1506905925346-21bda4d32df4',
        '1477959858617-67f85cf4f1df','1478720568477-152d9b92543a',
      ];
      /* Shuffle deterministically based on query so different searches feel different */
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

    results.className = 'idr-results';
    results.innerHTML = '';
    items.forEach(item => {
      const d   = document.createElement('div');
      d.className = 'img-result';
      const img = document.createElement('img');
      img.src = item.thumb; img.loading = 'lazy'; img.alt = '';
      img.onerror = () => d.classList.add('img-error');
      d.appendChild(img);
      d.addEventListener('click', () => selectImage(item));
      results.appendChild(d);
    });
  } catch(e) {
    results.className = 'idr-results';
    results.innerHTML = `<span class="idr-msg">${e.message || 'Search failed — check your connection.'}</span>`;
  }
}

function selectImage({ full, thumb, type }) {
  S.image = { url: full, thumb, type };
  updatePoster();
  closeDrawer();
  if (S.step === 4) {
    /* Re-render the step to show the thumbnail in the button */
    setTimeout(() => {
      wizardBody.innerHTML = STEPS[3].render();
      STEPS[3].mount();
    }, 270);
  }
}

function handleUpload(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => selectImage({ full: e.target.result, thumb: e.target.result, type: 'upload' });
  reader.readAsDataURL(file);
}

/* ── Start / reset ───────────────────────────────────────────────────────── */
function startBuild(ratio) {
  S.ratio     = ratio;
  S.step      = 1;
  S.dir       = 1;
  S.allRatios = $('allRatiosCheck').checked;

  transitionScreens(screenWelcome, screenBuild, 1);
  setTimeout(() => {
    applyRatio(ratio);
    updatePoster();
    /* first step — inject without animation */
    const step = STEPS[0];
    wizardBody.innerHTML = step.render();
    wizardBody.classList.remove('step-enter-fwd','step-enter-bwd','step-exit-fwd','step-exit-bwd');
    stepCounter.textContent = `1 / ${TOTAL_STEPS}`;
    btnSkip.classList.add('hidden');
    btnNext.disabled = true;
    step.mount();
  }, 300);
}

function startOver() {
  Object.assign(S, { step:1, dir:1, headline:'', body:'', date:'', day:'', location:'', image:null, doneRatio:null });

  screenDone.classList.add('screen-exit-fwd');
  setTimeout(() => {
    screenDone.classList.add('hidden');
    screenDone.classList.remove('screen-exit-fwd');
    screenWelcome.classList.remove('hidden');
    void screenWelcome.offsetWidth;
    screenWelcome.classList.add('screen-enter-bwd');
    setTimeout(() => screenWelcome.classList.remove('screen-enter-bwd'), 500);
  }, 280);

  $('allRatiosCheck').checked = false;
  document.querySelectorAll('.ratio-card').forEach(c => c.classList.remove('selected'));
}

/* ── Init ────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  poster.innerHTML = `
    <div class="p-bg" id="pBg"></div>
    <div class="p-ov" id="pOv"></div>
    <div class="p-logo">Mindspace</div>
    <div class="p-lower">
      <div class="p-headline" id="pHeadline"></div>
      <div class="p-body"     id="pBody" style="display:none"></div>
      <div class="p-rule"     id="pRule" style="display:none"></div>
      <div class="p-meta"     id="pMeta" style="display:none"></div>
    </div>`;

  document.querySelectorAll('.ratio-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.ratio-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      startBuild(card.dataset.r);
    });
  });

  btnNext.addEventListener('click', goNext);
  btnSkip.addEventListener('click', goNext);
  btnBack.addEventListener('click', goBack);

  $('btnDownload').addEventListener('click', downloadPoster);
  $('btnEditDone').addEventListener('click', () => {
    screenDone.classList.add('screen-exit-bwd');
    setTimeout(() => {
      screenDone.classList.add('hidden');
      screenDone.classList.remove('screen-exit-bwd');
      screenBuild.classList.remove('hidden');
      void screenBuild.offsetWidth;
      screenBuild.classList.add('screen-enter-bwd');
      setTimeout(() => screenBuild.classList.remove('screen-enter-bwd'), 500);
      S.dir = -1; S.step = 1; renderStep();
    }, 280);
  });
  $('btnNew').addEventListener('click', startOver);

  $('idrBackdrop').addEventListener('click', closeDrawer);
  $('idrClose').addEventListener('click', closeDrawer);
  document.querySelectorAll('.idr-tab').forEach(tab => {
    tab.addEventListener('click', () => setDrawerTab(tab.dataset.src));
  });
  $('idrSearchBtn').addEventListener('click', doSearch);
  $('idrSearchInput').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  $('fileInput').addEventListener('change', e => handleUpload(e.target.files[0]));

  window.addEventListener('resize', () => {
    if (!screenBuild.classList.contains('hidden')) scalePoster();
    if (!screenDone.classList.contains('hidden'))  renderDonePoster(S.doneRatio || S.ratio);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !imgDrawer.classList.contains('hidden')) closeDrawer();
  });
});
