const WEB3FORMS_KEY  = '9a8a645f-b13e-47ab-9634-33d1125aee8d';
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform';

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── PRODUCT MODAL ──
const overlay    = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const colors = {
  rose:   'linear-gradient(135deg,#f5e0d8,#d4a8a0)',
  sage:   'linear-gradient(135deg,#d8e8d0,#9caf88)',
  blush:  'linear-gradient(135deg,#faeae0,#d4a890)',
  mauve:  'linear-gradient(135deg,#e8d8ec,#a888b8)',
  blue:   'linear-gradient(135deg,#d8e4f0,#8898c0)',
  butter: 'linear-gradient(135deg,#faf0d0,#d4b868)',
  ivory:  'linear-gradient(135deg,#faf4e8,#d8c8a0)',
  pearl:  'linear-gradient(135deg,#f4f0ec,#d0c8c0)',
  garnet: 'linear-gradient(135deg,#f0d4d4,#c06868)',
};

function openModal(card) {
  const name   = card.dataset.name;
  const price  = card.dataset.price;
  const sub    = card.dataset.sub;
  const desc   = card.dataset.desc;
  const color  = card.dataset.color;
  const status = card.dataset.status;
  const stock  = card.dataset.stock;

  const mp = document.getElementById('modal-photo');
  if (mp) { mp.src = card.dataset.img || ''; mp.alt = name; }
  document.getElementById('modal-img').style.background = colors[color] || '#e8c4b8';
  document.getElementById('modal-name').textContent = name;
  document.getElementById('modal-sub').textContent  = sub;

  let fullDesc = desc;
  if (status === 'available' && stock) fullDesc += ` · ${stock} in stock`;
  document.getElementById('modal-desc').textContent  = fullDesc;
  document.getElementById('modal-price').textContent = price;

  const badges = document.getElementById('modal-badges');
  badges.innerHTML = '';
  if (status === 'sold') {
    badges.innerHTML = '<span class="modal-badge gone">sold out — never remade</span>';
  } else if (card.querySelector('.last-badge')) {
    badges.innerHTML = '<span class="modal-badge last">last one!</span>';
  } else {
    badges.innerHTML = '<span class="modal-badge avail">available</span>';
  }

  const btn = document.getElementById('modal-action');
  if (status === 'sold') {
    btn.textContent = 'sold out 🤍';
    btn.className   = 'modal-action sold-out';
    btn.onclick     = null;
  } else {
    btn.textContent = 'pre-order';
    btn.className   = 'modal-action available';
    btn.onclick = () => {
      window.open(GOOGLE_FORM_URL, '_blank');
      closeModal();
      showToast('opening order form...');
    };
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    openModal(btn.closest('.product-card'));
  });
});
document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('click', () => openModal(card));
});
modalClose.addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ── FILTER + SHOW MORE ENGINE ──
let showMoreExpanded = false;

function getActiveStatus() {
  return document.querySelector('.nav-filter.active')?.dataset.status || 'available';
}
function getActiveCat() {
  return document.querySelector('.tab.active')?.dataset.cat || 'all';
}

function applyFilters() {
  const activeStatus = getActiveStatus();
  const activeCat    = getActiveCat();
  showMoreExpanded   = false;

  // Per-category visible count (for show-more logic)
  const catCounts = {};

  document.querySelectorAll('.product-card').forEach(card => {
    const statusMatch  = activeStatus === 'all' || card.dataset.status === activeStatus;
    const catMatch     = activeCat === 'all' || card.dataset.cat === activeCat;
    const isComing     = card.dataset.coming === 'true';

    // Hide coming-soon cards when filter is "available"
    const comingHide   = isComing && activeStatus === 'available';

    const visible = statusMatch && catMatch && !comingHide;

    if (visible) {
      const cat = card.dataset.cat;
      if (!catCounts[cat]) catCounts[cat] = 0;
      catCounts[cat]++;
      // Show first 2 per category, hide rest
      if (catCounts[cat] > 2) {
        card.classList.add('hidden-card');
      } else {
        card.classList.remove('hidden-card');
        card.style.display = '';
      }
    } else {
      card.classList.remove('hidden-card');
      card.style.display = 'none';
    }
  });

  // Show/hide the show-more button
  const hasMore = document.querySelectorAll('.product-card.hidden-card').length > 0;
  const wrap = document.getElementById('show-more-wrap');
  if (wrap) wrap.style.display = hasMore ? 'block' : 'none';
  const btn = document.getElementById('show-more-btn');
  if (btn) btn.textContent = 'see all pieces ↓';

  checkEmpty();
}

document.querySelectorAll('.nav-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  });
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    applyFilters();
  });
});

function checkEmpty() {
  const any = [...document.querySelectorAll('.product-card')]
    .some(c => c.style.display !== 'none' && !c.classList.contains('hidden-card'));
  document.getElementById('empty-note').style.display = any ? 'none'  : 'block';
  document.getElementById('sold-note').style.display  = any ? 'block' : 'none';
}

// ── SHOW MORE BUTTON ──
(function initShowMore() {
  // Initial state: show 2 per cat for available filter
  applyFilters();

  const btn = document.getElementById('show-more-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    showMoreExpanded = !showMoreExpanded;

    if (showMoreExpanded) {
      // Reveal all hidden cards (that are currently display:none due to hidden-card)
      document.querySelectorAll('.product-card.hidden-card').forEach(card => {
        card.classList.remove('hidden-card');
        card.style.display = '';
      });
      btn.textContent = 'show less ↑';
      const wrap = document.getElementById('show-more-wrap');
      if (wrap) wrap.style.display = 'block';
    } else {
      applyFilters();
      document.getElementById('shop-section').scrollIntoView({ behavior: 'smooth' });
    }
  });
})();

// ── CUSTOMS BTN ──
document.getElementById('customs-btn').addEventListener('click', () => {
  window.open(GOOGLE_FORM_URL, '_blank');
  showToast('opening order form...');
});

// ── FEEDBACK FORM (Web3Forms) ──
document.getElementById('c-photo')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  const label = document.getElementById('c-file-text');
  if (file && label) label.textContent = file.name;
});

document.getElementById('contact-submit').addEventListener('click', async () => {
  const name  = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const msg   = document.getElementById('c-msg').value.trim();

  if (!name || !email || !msg) { showToast('please fill in all fields 🤍'); return; }

  const btn = document.getElementById('contact-submit');
  btn.textContent = 'sending...';
  btn.disabled    = true;

  const formData = new FormData();
  formData.append('access_key', WEB3FORMS_KEY);
  formData.append('subject',    'Interlaced by Jill — Feedback');
  formData.append('name',       name);
  formData.append('email',      email);
  formData.append('message',    msg);

  const photo = document.getElementById('c-photo')?.files[0];
  if (photo) formData.append('attachment', photo);

  try {
    const res  = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      showToast('thank you for your feedback 🤍');
      document.getElementById('c-name').value  = '';
      document.getElementById('c-email').value = '';
      document.getElementById('c-msg').value   = '';
      const photoInput = document.getElementById('c-photo');
      if (photoInput) photoInput.value = '';
      const fileText = document.getElementById('c-file-text');
      if (fileText) fileText.textContent = 'share a picture with us';
      btn.textContent = 'sent 🤍';
    } else {
      showToast('something went wrong — try again');
      btn.textContent = 'send feedback';
    }
  } catch {
    showToast('no connection — try again');
    btn.textContent = 'send feedback';
  }
  setTimeout(() => { btn.textContent = 'send feedback'; btn.disabled = false; }, 3000);
});
