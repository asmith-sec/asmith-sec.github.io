/* ============================================================
   main.js — Anthony Smith Security Portfolio
   Handles: dark/light toggle, sticky nav, mobile menu,
            terminal typewriter, scroll fade-in animations
   ============================================================ */

(function () {
  'use strict';

  // ── Theme toggle ───────────────────────────────────────────
  const html = document.documentElement;
  const THEME_KEY = 'portfolio-theme'; // kept for reference, not used

  // Theme stored in memory only (works in iframes and static hosts)
  let currentTheme = 'dark'; // default dark

  function getSavedTheme() { return null; } // no-op for static deploy
  function saveTheme(t) { currentTheme = t; }

  const initial = 'dark';
  html.setAttribute('data-theme', initial);

  function applyThemeIcon(btn, theme) {
    if (!btn) return;
    if (theme === 'dark') {
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      btn.setAttribute('aria-label', 'Switch to light mode');
    } else {
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
      btn.setAttribute('aria-label', 'Switch to dark mode');
    }
  }

  // Apply to all toggle buttons on the page
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    applyThemeIcon(btn, initial);
    btn.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      saveTheme(next);
      document.querySelectorAll('[data-theme-toggle]').forEach(b => applyThemeIcon(b, next));
    });
  });

  // ── Sticky nav scroll shadow ────────────────────────────────
  const nav = document.getElementById('main-nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Mobile hamburger ────────────────────────────────────────
  const hamburger = document.getElementById('nav-hamburger');
  const mobileNav = document.getElementById('nav-mobile');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', open);
    });
  }

  // ── Scroll fade-in (IntersectionObserver) ──────────────────
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length > 0) {
    // Immediately show elements already in the viewport on load
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

    fadeEls.forEach(el => {
      if (!showIfVisible(el)) fadeObs.observe(el);
    });
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

    let lineIndex = 0;
    let charIndex = 0;
    let currentEl = null;

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

    function typeNext() {
      if (lineIndex >= lines.length) return;

      const line = lines[lineIndex];

      if (!currentEl) {
        currentEl = addLine(line);
        charIndex = 0;
      }

      if (charIndex < line.text.length) {
        currentEl.textContent = line.text.slice(0, charIndex + 1);
        charIndex++;
        // Last line with cursor blink
        if (lineIndex === lines.length - 1 && charIndex === line.text.length) {
          const cursor = document.createElement('span');
          cursor.className = 'terminal__cursor';
          currentEl.appendChild(cursor);
          return; // stop, let cursor blink
        }
        setTimeout(typeNext, line.type === 'prompt' ? 28 : 12);
      } else {
        // Line complete — move to next
        lineIndex++;
        currentEl = null;
        const delay = line.type === 'blank' ? 80 : line.type === 'prompt' ? 300 : 60;
        setTimeout(typeNext, delay);
      }

      // Scroll terminal to bottom
      termBody.scrollTop = termBody.scrollHeight;
    }

    // Start after a short delay for polish
    setTimeout(typeNext, 800);
  }

})();
