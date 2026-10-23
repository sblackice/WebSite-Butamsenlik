// Butamsenlik interactions. Content is readable without this file.
(() => {
  // Sample number: replace with the shop's real WhatsApp number (country code, no +, e.g. 905xxxxxxxxx).
  const WHATSAPP_NUMBER = '';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const waLink = (text) =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

  /* ---------- product + general WhatsApp links ---------- */
  document.querySelectorAll('[data-ask]').forEach((a) => {
    const name = a.dataset.product || a.closest('.product')?.querySelector('h3')?.textContent || 'ürünleriniz';
    a.href = waLink(`Merhaba Butamsenlik, ${name} hakkında bilgi almak istiyorum.`);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- letter designer (the live thing + signature: your letter travels) ---------- */
  const form = document.getElementById('designer');
  const input = document.getElementById('initial');
  const summary = document.getElementById('summary');
  const order = document.getElementById('order');
  const closeLine = document.querySelector('[data-close-line]');
  const metalNames = { altin: 'altın', rose: 'rose', gumus: 'gümüş' };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  function update() {
    let letter = (input.value || '').trim().toLocaleUpperCase('tr-TR').slice(0, 1);
    if (!/^\p{L}$/u.test(letter)) letter = '';
    input.value = letter;
    const shown = letter || 'B';
    const metal = form.metal.value;
    const length = form.length.value;

    document.querySelectorAll('[data-initial]').forEach((el) => { el.textContent = shown; });
    root.dataset.metal = metal;

    const text = `${shown} harfli, ${metalNames[metal]} renk, ${length} cm kolye.`;
    summary.textContent = text;
    order.href = waLink(`Merhaba Butamsenlik, şu kolyeyi istiyorum: ${text}`);
    if (letter && closeLine) closeLine.textContent = `${letter} için hangisi?`;

    store.set('bts-letter', letter);
    store.set('bts-metal', metal);
  }

  if (form) {
    const savedLetter = store.get('bts-letter');
    const savedMetal = store.get('bts-metal');
    if (savedLetter) input.value = savedLetter;
    if (savedMetal && form.querySelector(`input[name="metal"][value="${savedMetal}"]`)) {
      form.querySelector(`input[name="metal"][value="${savedMetal}"]`).checked = true;
    }
    form.addEventListener('input', update);
    form.addEventListener('submit', (e) => e.preventDefault());
    input.addEventListener('focus', () => input.select());
    update();
  }

  /* ---------- reveal with stagger ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
      el.style.setProperty('--d', `${(siblings.indexOf(el) % 4) * 80}ms`);
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  if (reduce) return;

  /* ---------- scroll progress engine ---------- */
  const sections = [...document.querySelectorAll('[data-scroll]')];
  const track = document.querySelector('.pan-track');
  const chain = document.querySelector('.weave-chain');
  const weaveLines = [...document.querySelectorAll('.weave-line')];
  const kinWords = [...document.querySelectorAll('.kin-word')];
  const clamp = (v) => Math.min(1, Math.max(0, v));

  function measurePan() {
    if (!track) return;
    const distance = Math.max(0, track.scrollWidth - window.innerWidth);
    track.style.setProperty('--pan-distance', `${distance}px`);
  }

  function progress(el) {
    const r = el.getBoundingClientRect();
    if (el.classList.contains('hero')) return clamp(-r.top / r.height);
    const span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span) : clamp(1 - r.bottom / (window.innerHeight + r.height));
  }

  let ticking = false;
  function frame() {
    ticking = false;
    sections.forEach((el) => {
      const p = progress(el);
      el.style.setProperty('--p', p.toFixed(4));
      if (el.classList.contains('weave')) {
        if (chain) chain.style.strokeDashoffset = String(1 - clamp(0.12 + p * 1.6));
        weaveLines.forEach((l) => l.classList.toggle('is-on', p >= parseFloat(l.dataset.at)));
      }
      if (el.classList.contains('kinetic')) {
        kinWords.forEach((w) => w.classList.toggle('is-on', p >= parseFloat(w.dataset.from) + 0.02));
      }
    });
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };

  measurePan();
  frame();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measurePan(); onScroll(); });
  document.fonts?.ready.then(() => { measurePan(); frame(); });

  /* ---------- pointer tilt on the care ring ---------- */
  const tilt = document.querySelector('[data-tilt]');
  if (tilt && window.matchMedia('(hover: hover)').matches) {
    const target = tilt.querySelector('.tilt-target');
    tilt.addEventListener('pointermove', (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      target.style.transform = `rotateY(${x * 40}deg) rotateX(${-y * 40}deg) scale(1.05)`;
    });
    tilt.addEventListener('pointerleave', () => { target.style.transform = ''; });
  }
})();
