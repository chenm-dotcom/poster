'use strict';

const GIPHY_KEY = 'dc6zaTOxFJmzC'; /* Giphy public demo key */

/* ── State ───────────────────────────────────────────────────────────────── */
const S = {
  step:      1,
  ratio:     '9:16',
  allRatios: false,
  headline:  '',
  body:      '',
  date:      '',
  day:       '',
  location:  '',
  image:     null,   /* { url, thumb, type } */
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
        <p class="step-q step-animate">What's the<br>headline?</p>
        <p class="step-hint step-animate">Keep it short and punchy — 2 to 5 words hit hardest.</p>
        <textarea class="step-input step-animate" id="inputHeadline"
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
        <p class="step-q step-animate">Add a description?</p>
        <p class="step-hint step-animate">A short line below the headline — or skip it entirely.</p>
        <textarea class="step-input step-animate" id="inputBody"
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
        <p class="step-q step-animate">When &amp; where?</p>
        <p class="step-hint step-animate">All optional — add whichever details matter for this post.</p>
        <div class="meta-fields step-animate">
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
        <p class="step-q step-animate">Add an image?</p>
        <p class="step-hint step-animate">Search Giphy for a GIF, Unsplash for a photo, or upload your own.</p>
        <button class="img-pick-btn step-animate ${S.image ? 'has-img' : ''}" id="openImgDrawer">
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
  wizardBody.innerHTML = step.render();
  stepCounter.textContent = `${S.step} / ${TOTAL_STEPS}`;
  btnSkip.classList.toggle('hidden', !step.skippable);
  btnNext.disabled = true;
  step.mount();
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
  /* headline */
  const ph = $('pHeadline');
  if (ph) ph.textContent = S.headline;

  /* body */
  const pb = $('pBody');
  if (pb) { pb.textContent = S.body; pb.style.display = S.body.trim() ? '' : 'none'; }

  /* divider — show only when there's meta */
  const pr = $('pRule');
  const hasMeta = !!(S.day || S.date || S.location);
  if (pr) pr.style.display = hasMeta ? '' : 'none';

  /* meta */
  const pm = $('pMeta');
  if (pm) {
    const parts = [S.day, S.date, S.location].filter(Boolean);
    pm.innerHTML = parts.map((p, i) =>
      (i > 0 ? '<span class="p-meta-dot">·</span>' : '') + `<span>${p}</span>`
    ).join('');
    pm.style.display = hasMeta ? '' : 'none';
  }

  /* image */
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
  const wrap   = $('stageWrap');
  const panel  = $('stagePanel');
  if (!wrap || !panel) return;
  const pw = panel.clientWidth  - 80;
  const ph = panel.clientHeight - 80;
  const [nw, nh] = RATIO_DIM[S.ratio];
  const scale = Math.min(pw / nw, ph / nh, 1);
  poster.style.transform = `scale(${scale})`;
  wrap.style.width  = (nw * scale) + 'px';
  wrap.style.height = (nh * scale) + 'px';
}

/* ── Navigation ──────────────────────────────────────────────────────────── */
function goNext() {
  if (S.step < TOTAL_STEPS) { S.step++; renderStep(); }
}
function goBack() {
  if (S.step > 1) { S.step--; renderStep(); }
  else {
    screenBuild.classList.add('hidden');
    screenWelcome.classList.remove('hidden');
  }
}

/* ── Done screen ─────────────────────────────────────────────────────────── */
function showDone() {
  S.doneRatio = S.ratio;
  screenBuild.classList.add('hidden');
  screenDone.classList.remove('hidden');
  renderDonePoster(S.ratio);

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

  const clone = poster.cloneNode(true);
  clone.id = 'donePoster';
  clone.removeAttribute('style'); /* clear transform */
  Object.values(RATIO_CLASS).forEach(c => clone.classList.remove(c));
  clone.classList.add(RATIO_CLASS[ratio]);

  wrap.appendChild(clone);

  requestAnimationFrame(() => {
    const panel = wrap.parentElement;
    const pw = panel.clientWidth  - 80;
    const ph = panel.clientHeight - 80;
    const [nw, nh] = RATIO_DIM[ratio];
    const scale = Math.min(pw / nw, ph / nh, 1);
    clone.style.transform       = `scale(${scale})`;
    clone.style.transformOrigin = 'top left';
    wrap.style.width  = (nw * scale) + 'px';
    wrap.style.height = (nh * scale) + 'px';
  });
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
function openDrawer()  { imgDrawer.classList.remove('hidden'); setDrawerTab(S.imgSrc); }
function closeDrawer() { imgDrawer.classList.add('hidden'); }

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
  results.textContent = 'Searching…';

  try {
    let items = [];
    if (S.imgSrc === 'giphy') {
      const data = await (await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=18&rating=g`
      )).json();
      items = (data.data || []).map(g => ({
        thumb: g.images.fixed_width_small.url,
        full:  g.images.original.url,
        type: 'gif',
      }));
    } else {
      items = Array.from({ length: 12 }, (_, i) => ({
        thumb: `https://source.unsplash.com/200x200/?${encodeURIComponent(q)}&sig=${i}`,
        full:  `https://source.unsplash.com/1920x1920/?${encodeURIComponent(q)}&sig=${i}`,
        type: 'photo',
      }));
    }

    results.className = 'idr-results';
    if (!items.length) { results.textContent = 'No results found.'; return; }
    results.innerHTML = '';
    items.forEach(item => {
      const d = document.createElement('div');
      d.className = 'img-result';
      const img = document.createElement('img');
      img.src = item.thumb; img.loading = 'lazy'; img.alt = '';
      d.appendChild(img);
      d.addEventListener('click', () => selectImage(item));
      results.appendChild(d);
    });
  } catch(e) {
    results.className = 'idr-results';
    results.textContent = 'Search failed — check your connection.';
  }
}

function selectImage({ full, thumb, type }) {
  S.image = { url: full, thumb, type };
  updatePoster();
  closeDrawer();
  if (S.step === 4) renderStep();
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
  S.allRatios = $('allRatiosCheck').checked;

  screenWelcome.classList.add('hidden');
  screenBuild.classList.remove('hidden');

  applyRatio(ratio);
  updatePoster();
  renderStep();
}

function startOver() {
  Object.assign(S, { step:1, headline:'', body:'', date:'', day:'', location:'', image:null, doneRatio:null });
  screenDone.classList.add('hidden');
  screenBuild.classList.add('hidden');
  screenWelcome.classList.remove('hidden');
  $('allRatiosCheck').checked = false;
  document.querySelectorAll('.ratio-card').forEach(c => c.classList.remove('selected'));
}

/* ── Init ────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* Build the poster inner HTML with the rule element */
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

  /* Welcome — ratio selection */
  document.querySelectorAll('.ratio-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.ratio-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      startBuild(card.dataset.r);
    });
  });

  /* Wizard nav */
  btnNext.addEventListener('click', goNext);
  btnSkip.addEventListener('click', goNext);
  btnBack.addEventListener('click', goBack);

  /* Done */
  $('btnDownload').addEventListener('click', downloadPoster);
  $('btnEditDone').addEventListener('click', () => {
    screenDone.classList.add('hidden');
    screenBuild.classList.remove('hidden');
    S.step = 1; renderStep();
  });
  $('btnNew').addEventListener('click', startOver);

  /* Drawer */
  $('idrBackdrop').addEventListener('click', closeDrawer);
  $('idrClose').addEventListener('click', closeDrawer);
  document.querySelectorAll('.idr-tab').forEach(tab => {
    tab.addEventListener('click', () => setDrawerTab(tab.dataset.src));
  });
  $('idrSearchBtn').addEventListener('click', doSearch);
  $('idrSearchInput').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  $('fileInput').addEventListener('change', e => handleUpload(e.target.files[0]));

  /* Resize */
  window.addEventListener('resize', () => {
    if (!screenBuild.classList.contains('hidden')) scalePoster();
    if (!screenDone.classList.contains('hidden'))  renderDonePoster(S.doneRatio || S.ratio);
  });

  /* Esc closes drawer */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !imgDrawer.classList.contains('hidden')) closeDrawer();
  });
});
