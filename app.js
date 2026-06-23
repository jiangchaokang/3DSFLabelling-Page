/* 3DSFLabelling — interactions (zero dependencies). See DESIGN.md. */
(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* reading-progress bar */
  const prog = $('#progress'), de = document.documentElement;
  addEventListener('scroll', () => {
    prog.style.setProperty('--p', (de.scrollTop / (de.scrollHeight - de.clientHeight) * 100 || 0) + '%');
  }, { passive: true });

  /* count-up (eased, fires once on reveal) */
  const countUp = el => {
    const end = +el.dataset.to, dp = +el.dataset.dp || 0;
    if (reduce || end === 0) return el.textContent = end.toFixed(dp);
    const t0 = performance.now();
    (function f(n) {
      const k = Math.min((n - t0) / 1100, 1), e = 1 - (1 - k) ** 3;
      el.textContent = (end * e).toFixed(dp);
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  };

  /* single reveal animation + count-up trigger */
  const rv = new IntersectionObserver((es, o) => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(countUp);
    o.unobserve(e.target);
  }), { threshold: .14 });
  $$('[data-reveal]').forEach(el => rv.observe(el));

  /* zero-dependency lightbox (PDFs open in a new tab) */
  $$('[data-zoom]').forEach(img => img.onclick = () => {
    const full = img.dataset.full || img.src;
    if (/\.pdf$/i.test(full)) return window.open(full, '_blank');
    const o = document.createElement('div');
    o.className = 'lb';
    o.innerHTML = `<img src="${full}" alt=""><div class="lb-hint">Click anywhere or press Esc to close</div>`;
    o.onclick = () => o.remove();
    addEventListener('keydown', e => e.key === 'Escape' && o.remove(), { once: true });
    document.body.append(o);
  });

  /* dataset tabs */
  $$('.tab').forEach(t => t.onclick = () => {
    $$('.tab').forEach(x => x.classList.remove('on'));
    $$('.panel').forEach(x => x.classList.remove('on'));
    t.classList.add('on');
    $('#' + t.dataset.tab).classList.add('on');
  });

  /* scene-flow ↔ EPE3D segmented toggle (scoped per panel) */
  $$('.seg button').forEach(b => b.onclick = () => {
    const p = b.closest('.panel');
    $$('.seg button', p).forEach(x => x.classList.remove('on'));
    $$('.sub', p).forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    $('#' + b.dataset.sub).classList.add('on');
  });

  /* synchronized cameras: rotate one model-viewer, the pair follows */
  $$('.cmp3d').forEach(group => {
    const vs = $$('model-viewer', group); let lock = false;
    vs.forEach(src => src.addEventListener('camera-change', e => {
      if (lock || e.detail.source !== 'user-interaction') return;
      lock = true;
      const o = src.getCameraOrbit();
      vs.forEach(t => { if (t !== src) t.cameraOrbit = `${o.theta}rad ${o.phi}rad ${o.radius}m`; });
      lock = false;
    }));
  });

  /* videos play on view, pause off view */
  const vio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { const p = e.target.play(); p && p.catch(() => {}); }
    else e.target.pause();
  }), { threshold: .4 });
  $$('video[data-auto]').forEach(v => vio.observe(v));

  /* copy BibTeX */
  const cp = $('#copyBtn');
  cp && (cp.onclick = () => navigator.clipboard.writeText($('#bibtex-src').innerText).then(() => {
    const s = $('span', cp), o = s.textContent;
    s.textContent = 'Copied ✓';
    setTimeout(() => s.textContent = o, 1600);
  }));
})();
