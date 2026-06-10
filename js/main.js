/* ============================================================
   main.js — Anthony Smith Security Portfolio  (v2)
   Handles: theme persistence, sticky nav, mobile menu,
            terminal typewriter, scroll fade-in, scroll progress,
            back-to-top, resume-link rewrite, reduced-motion.
   ============================================================ */

(function () {
  'use strict';

  const html = document.documentElement;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Inject enhancement stylesheet (no HTML edits needed) ────
  (function injectEnhancementCSS() {
    const base = document.querySelector('link[href$="style.css"]');
    if (!base) return;
    const href = base.getAttribute('href').replace('style.css', 'enhancements.css');
    if (document.querySelector('link[href="' + href + '"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    base.parentNode.insertBefore(link, base.nextSibling);
  })();

  // ── Theme toggle (PERSISTENT) ───────────────────────────────
  const THEME_KEY = 'portfolio-theme';

  function getStored() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function store(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* private mode */ }
  }

  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = getStored() || (systemPrefersLight ? 'light' : 'dark');
  html.setAttribute('data-theme', initial);

  function applyThemeIcon(btn, theme) {
    if (!btn) return;
    if (theme === 'dark') {
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      btn.setAttribute('aria-label', 'Switch to light mode');
    } else {
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
      btn.setAttribute('aria-label', 'Switch to dark mode');
    }
  }

  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    applyThemeIcon(btn, initial);
    btn.addEventListener('click', () => {
      const next = (html.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      store(next);
      document.querySelectorAll('[data-theme-toggle]').forEach(b => applyThemeIcon(b, next));
    });
  });

  // ── Rewrite resume links: .docx → polished PDF ──────────────
  (function rewriteResumeLinks() {
    document.querySelectorAll('a[href*="Anthony-Smith-CV_Q3.docx"], a[href$=".docx"]').forEach(a => {
      a.setAttribute('href', a.getAttribute('href').replace(/[^\/]+\.docx/, 'Anthony-Smith-Resume.pdf'));
      a.removeAttribute('download'); // open PDF in-browser; users can still save
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
      // Tidy any visible ".docx" label
      a.childNodes.forEach(n => {
        if (n.nodeType === 3 && /\.docx/i.test(n.textContent)) {
          n.textContent = n.textContent.replace(/\(\.docx\)/i, '(PDF)').replace(/\.docx/i, '');
        }
      });
    });
  })();

  // ── Scroll progress bar (injected) ──────────────────────────
  (function scrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  })();

  // ── Back-to-top button (injected) ───────────────────────────
  (function backToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(btn);
    const toggle = () => btn.classList.toggle('is-visible', window.scrollY > 600);
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
    toggle();
  })();

  // ── Sticky nav scroll shadow ────────────────────────────────
  const nav = document.getElementById('main-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Mobile hamburger (with close-on-interaction) ────────────
  const hamburger = document.getElementById('nav-hamburger');
  const mobileNav = document.getElementById('nav-mobile');
  if (hamburger && mobileNav) {
    const closeMenu = () => {
      mobileNav.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.classList.remove('is-active');
    };
    hamburger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.classList.toggle('is-active', open);
    });
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 768) closeMenu(); });
  }

  // ── Scroll fade-in (IntersectionObserver) ──────────────────
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length > 0) {
    if (prefersReduced) {
      fadeEls.forEach(el => el.classList.add('visible'));
    } else {
      const showIfVisible = (el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('visible');
          return true;
        }
        return false;
      };
      const fadeObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
      fadeEls.forEach(el => { if (!showIfVisible(el)) fadeObs.observe(el); });
    }
  }

  // ── Terminal typewriter (home page only) ───────────────────
  const termBody = document.getElementById('terminal-body');
  if (termBody) {
    const lines = [
      { type: 'prompt', text: '$ python port_scanner.py --target 192.168.1.0/24 --ports 22,80,443' },
      { type: 'output', text: '[*] Scanning 254 hosts, 3 ports — 762 checks' },
      { type: 'success', text: '  [OPEN] 192.168.1.1:22   (SSH)' },
      { type: 'success', text: '  [OPEN] 192.168.1.1:80   (HTTP)' },
      { type: 'success', text: '  [OPEN] 192.168.1.10:443 (HTTPS)' },
      { type: 'warn',    text: '  [OPEN] 192.168.1.50:22  (SSH — check credentials)' },
      { type: 'output',  text: '  Scan complete — 4 open port(s) found' },
      { type: 'blank',   text: '' },
      { type: 'prompt',  text: '$ python log_threat_hunter.py --log /var/log/auth.log' },
      { type: 'error',   text: '  [!] 185.220.101.47 — 247 failed SSH attempts' },
      { type: 'error',   text: '  [!] Possible lateral movement detected — line 8821' },
      { type: 'output',  text: '  JSON findings saved to: findings.json' },
      { type: 'blank',   text: '' },
      { type: 'prompt',  text: '$ _' },
    ];

    const colorMap = {
      prompt:  'var(--color-primary)',
      output:  'var(--color-text-muted)',
      success: 'var(--color-low)',
      warn:    'var(--color-high)',
      error:   'var(--color-critical)',
      blank:   'transparent',
    };

    function addLine(line) {
      const div = document.createElement('div');
      div.style.color = colorMap[line.type] || 'var(--color-text-muted)';
      div.style.fontFamily = 'var(--font-mono)';
      div.style.fontSize = 'var(--text-xs)';
      div.style.lineHeight = '1.8';
      div.style.minHeight = line.type === 'blank' ? '0.8em' : 'auto';
      termBody.appendChild(div);
      return div;
    }

    if (prefersReduced) {
      // Render the full transcript instantly — no animation
      lines.forEach(line => { addLine(line).textContent = line.text; });
    } else {
      let lineIndex = 0, charIndex = 0, currentEl = null;
      function typeNext() {
        if (lineIndex >= lines.length) return;
        const line = lines[lineIndex];
        if (!currentEl) { currentEl = addLine(line); charIndex = 0; }
        if (charIndex < line.text.length) {
          currentEl.textContent = line.text.slice(0, charIndex + 1);
          charIndex++;
          if (lineIndex === lines.length - 1 && charIndex === line.text.length) {
            const cursor = document.createElement('span');
            cursor.className = 'terminal__cursor';
            currentEl.appendChild(cursor);
            return;
          }
          setTimeout(typeNext, line.type === 'prompt' ? 28 : 12);
        } else {
          lineIndex++; currentEl = null;
          const delay = line.type === 'blank' ? 80 : line.type === 'prompt' ? 300 : 60;
          setTimeout(typeNext, delay);
        }
        termBody.scrollTop = termBody.scrollHeight;
      }
      setTimeout(typeNext, 800);
    }
  }

})();
