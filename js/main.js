/* ============================================================
   main.js — Anthony Smith Security Portfolio  (v3)
   Handles: theme persistence, sticky nav, mobile menu,
            terminal typewriter, scroll fade-in, scroll progress,
            back-to-top, resume-link rewrite, reduced-motion,
            JSON-LD, skip link, current-page nav, copy buttons,
            external-link hardening.
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

  // ── Correct LinkedIn URL (placeholder → real profile) ──────
  (function fixLinkedIn() {
    const REAL = 'https://www.linkedin.com/in/anthony-smith-6a453a89';
    document.querySelectorAll('a[href*="linkedin.com/in/anthony-smith"]').forEach(a => {
      if (/anthony-smith-6a453a89/.test(a.getAttribute('href') || '')) return; // already correct
      a.setAttribute('href', REAL);
      // Update any visible URL text (footer link or contact card), including nested nodes
      const tw = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = tw.nextNode())) {
        if (/linkedin\.com\/in\/anthony-smith(?!-6a453a89)/i.test(node.textContent)) {
          node.textContent = node.textContent.replace(/linkedin\.com\/in\/anthony-smith[A-Za-z0-9-]*/i, 'linkedin.com/in/anthony-smith-6a453a89');
        }
      }
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

  /* ==================== v3 weekly additions (2026-06-12) ==================== */

  // -- SEO: JSON-LD Person structured data ---------------------
  // Facts mirror what is already published on the site; nothing new.
  (function injectStructuredData() {
    if (document.querySelector('script[type="application/ld+json"]')) return;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Anthony Smith',
      jobTitle: 'Security Engineer',
      url: 'https://asmith-sec.github.io/',
      email: 'mailto:alspsu@gmail.com',
      address: { '@type': 'PostalAddress', addressRegion: 'NJ', addressCountry: 'US' },
      areaServed: ['Philadelphia, PA', 'New Jersey'],
      sameAs: [
        'https://www.linkedin.com/in/anthony-smith-6a453a89',
        'https://github.com/asmith-sec'
      ],
      knowsAbout: ['Vulnerability Assessment', 'Packet Analysis', 'Python', 'RMF', 'Nessus', 'Wireshark']
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  })();

  // -- v26 (2026-11-13) A11y: one <main> landmark per page --------
  // The home page had no <main>, and on inner pages the page header (h1, intro,
  // breadcrumb, filter bar) sat outside it, so "jump to main" in a screen reader
  // skipped the title. Wrap everything between the top nav and the footer in a
  // single <main>; a pre-existing <main> becomes a plain <div> with the same
  // classes so layout is unchanged. Runs before the skip link so it targets it.
  (function mainLandmark() {
    const topNav = document.getElementById('main-nav');
    const footer = document.querySelector('body > footer');
    if (!topNav || !footer || topNav.parentNode !== document.body) return;
    const nodes = [];
    for (let n = topNav.nextSibling; n && n !== footer; n = n.nextSibling) nodes.push(n);
    const els = nodes.filter(function (n) {
      return n.nodeType === 1 && n.tagName !== 'SCRIPT' && n.tagName !== 'STYLE';
    });
    if (!els.length) return;
    const existing = document.querySelector('main');
    if (existing && els.length === 1 && els[0] === existing) return;   // already correct
    if (existing && existing.parentNode !== document.body) return;    // unexpected shape
    const main = document.createElement('main');
    main.id = 'main-content';
    if (existing) {
      const div = document.createElement('div');
      Array.prototype.forEach.call(existing.attributes, function (a) {
        if (a.name !== 'id') div.setAttribute(a.name, a.value);
      });
      if (existing.id && existing.id !== 'main-content') div.id = existing.id;
      while (existing.firstChild) div.appendChild(existing.firstChild);
      existing.parentNode.replaceChild(div, existing);
      const i = nodes.indexOf(existing);
      if (i !== -1) nodes[i] = div;
    }
    document.body.insertBefore(main, nodes[0]);
    nodes.forEach(function (n) { main.appendChild(n); });
  })();

  // -- v26: trim the blank first/last line of Scripts-page snippets ---
  // They now render with white-space: pre (enhancements.css), so the newline
  // right after <div> and before </div> would show as empty lines.
  (function tidySnippets() {
    document.querySelectorAll('.script-card__snippet').forEach(function (el) {
      const first = el.firstChild, last = el.lastChild;
      if (first && first.nodeType === 3) first.nodeValue = first.nodeValue.replace(/^\s*\n/, '');
      if (last && last.nodeType === 3) last.nodeValue = last.nodeValue.replace(/\s+$/, '');
    });
  })();

  // -- A11y: skip-to-content link ------------------------------
  (function skipLink() {
    const target = document.querySelector('main') ||
                   document.querySelector('.hero') ||
                   document.querySelector('section');
    if (!target) return;
    if (!target.id) target.id = 'main-content';
    target.setAttribute('tabindex', '-1');
    const a = document.createElement('a');
    a.className = 'skip-link';
    a.href = '#' + target.id;
    a.textContent = 'Skip to content';
    a.addEventListener('click', () => target.focus({ preventScroll: false }));
    document.body.insertBefore(a, document.body.firstChild);
  })();

  // -- A11y/UX: mark the current page in the nav ---------------
  // Activates the existing [aria-current="page"] underline style.
  (function markCurrentNav() {
    const here = (location.pathname.split('/').pop() || 'index.html');
    document.querySelectorAll('.nav__links a, #nav-mobile a').forEach(a => {
      const href = (a.getAttribute('href') || '').split('#')[0];
      const page = href.split('/').pop() || 'index.html';
      if (page === here) a.setAttribute('aria-current', 'page');
    });
  })();

  // -- UX: copy-to-clipboard buttons on code samples -----------
  (function copyButtons() {
    if (!navigator.clipboard) return;
    document.querySelectorAll('pre').forEach(pre => {
      if (pre.closest('#terminal-body')) return;        // skip animated demo
      const text = (pre.textContent || '').trim();
      if (!text) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = 'copy';
      btn.setAttribute('aria-label', 'Copy code to clipboard');
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'copied!';
          btn.classList.add('is-copied');
          setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('is-copied'); }, 1600);
        }).catch(() => { btn.textContent = 'press Ctrl+C'; });
      });
      if (getComputedStyle(pre).position === 'static') pre.style.position = 'relative';
      pre.appendChild(btn);
    });
  })();

  // -- Security polish: harden external links ------------------
  (function hardenExternalLinks() {
    document.querySelectorAll('a[href^="http"]').forEach(a => {
      let url;
      try { url = new URL(a.href); } catch (e) { return; }
      if (url.hostname === location.hostname) return;
      const rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      if (!rel.includes('noopener')) rel.push('noopener');
      if (!rel.includes('noreferrer')) rel.push('noreferrer');
      a.setAttribute('rel', rel.join(' '));
      if (!a.getAttribute('target')) a.setAttribute('target', '_blank');
    });
  })();

  /* ==================== v5 weekly additions (2026-06-19) ==================== */

  // -- SEO + mobile polish: canonical link + theme-color meta --
  (function dynamicMeta() {
    // Canonical URL (no query/hash) helps search engines dedupe pages.
    if (!document.querySelector('link[rel="canonical"]')) {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = location.origin + location.pathname;
      document.head.appendChild(link);
    }

    // theme-color keeps the mobile browser chrome in sync with the active theme.
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    const syncThemeColor = () => {
      try {
        const bg = getComputedStyle(document.body).backgroundColor;
        if (bg) meta.setAttribute('content', bg);
      } catch (e) { /* no-op */ }
    };
    syncThemeColor();
    // Re-sync after a theme toggle (run on next tick so styles have applied).
    document.querySelectorAll('[data-theme-toggle]').forEach(btn =>
      btn.addEventListener('click', () => setTimeout(syncThemeColor, 0))
    );
  })();

  // -- Keep the footer copyright year current (future-proofing) --
  (function currentYear() {
    const el = document.querySelector('.footer__copy');
    if (!el) return;
    const year = String(new Date().getFullYear());
    // Only the leading "© YYYY" token is touched; the email span is preserved.
    el.innerHTML = el.innerHTML.replace(/©\s*\d{4}/, '© ' + year);
  })();

  /* ==================== v7 weekly additions (2026-07-03) ==================== */

  // -- UX/A11y: terminal command palette (Cmd/Ctrl+K or "/") ---
  // Progressive enhancement. Entries are read from the existing DOM
  // (nav links, resume/profile links, footer email) so nothing is
  // hard-coded or fabricated and paths stay correct on every page.
  (function commandPalette() {
    if (!document.body) return;

    let overlay, input, list, items = [], filtered = [], activeIdx = 0, lastFocused = null, built = false;

    function findEmail() {
      const mailto = document.querySelector('a[href^="mailto:"]');
      if (mailto) return (mailto.getAttribute('href') || '').replace(/^mailto:/i, '').split('?')[0].trim();
      const m = (document.body.textContent || '').match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
      return m ? m[0] : null;
    }

    function collectCommands() {
      const cmds = [];
      // Navigation — reuse the page's own nav so relative paths are correct.
      document.querySelectorAll('.nav__links a').forEach(a => {
        const label = (a.textContent || '').trim();
        const href = a.getAttribute('href');
        if (label && href) cmds.push({ label: label, kind: 'go', href: href });
      });
      // Resume — reuse an existing link (already rewritten to the PDF earlier).
      const resume = document.querySelector('a[href$="Resume.pdf"], a[href$=".pdf"]');
      if (resume) cmds.push({ label: 'Open resume (PDF)', kind: 'file', href: resume.getAttribute('href'), external: true });
      // External profiles.
      const gh = document.querySelector('a[href*="github.com/"]');
      if (gh) cmds.push({ label: 'GitHub profile', kind: 'link', href: gh.getAttribute('href'), external: true });
      const li = document.querySelector('a[href*="linkedin.com/in/"]');
      if (li) cmds.push({ label: 'LinkedIn profile', kind: 'link', href: li.getAttribute('href'), external: true });
      // Copy email — whatever address the page already displays (confirmed via toast).
      const email = findEmail();
      if (email) cmds.push({ label: 'Copy email — ' + email, kind: 'action', run: function () {
        copyText(email).then(function () { showToast('Email copied — ' + email); })
                       .catch(function () { showToast('Press Ctrl+C to copy'); });
      } });
      // Copy a shareable link to the current page.
      cmds.push({ label: 'Copy link to this page', kind: 'action', run: function () {
        const url = location.origin + location.pathname;
        copyText(url).then(function () { showToast('Link copied'); })
                     .catch(function () { showToast('Press Ctrl+C to copy'); });
      } });
      // Print / Save as PDF — uses the site's existing print stylesheet.
      cmds.push({ label: 'Print / Save as PDF', kind: 'action', run: function () {
        if (typeof window.print === 'function') window.print();
      } });
      // Keyboard shortcuts — opens the "?" help overlay defined in the v11 block.
      cmds.push({ label: 'Keyboard shortcuts', kind: 'action', run: function () {
        try { document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true, cancelable: true })); }
        catch (e) { /* very old browser: overlay unavailable, no-op */ }
      } });
      // Toggle theme — drive the existing button so persistence still applies.
      if (document.querySelector('[data-theme-toggle]')) {
        cmds.push({ label: 'Toggle light / dark theme', kind: 'action', run: function () {
          const b = document.querySelector('[data-theme-toggle]'); if (b) b.click();
        } });
      }
      // Copy phone — companion to "Copy email" above, only when the page shows a
      // tel: link (Contact page). Uses the number already published on the page.
      const tel = document.querySelector('a[href^="tel:"]');
      if (tel) {
        const num = (tel.getAttribute('href') || '').replace(/^tel:/i, '').trim();
        if (num) cmds.push({ label: 'Copy phone — ' + num, kind: 'action', run: function () {
          copyText(num).then(function () { showToast('Phone copied — ' + num); })
                       .catch(function () { showToast('Press Ctrl+C to copy'); });
        } });
      }
      // In-page jump targets — make Ctrl+K search your actual work, not just the
      // page list. Card titles on Projects (v9), Scripts (v14) and Certifications
      // (v15) each carry a stable id by the time the palette opens, so surface them
      // as scroll-to entries: "pcap analyzer" or "Security+" jumps straight there.
      const jumpSeen = {};
      [
        ['#projects-grid .card[id]', '.card__title, h2, h3', 'project'],
        ['.script-card[id]',         '.script-card__name',    'script'],
        ['.cert-card[id]',           '.cert-card__name',      'credential']
      ].forEach(function (spec) {
        document.querySelectorAll(spec[0]).forEach(function (card) {
          if (!card.id || jumpSeen[card.id]) return;
          const t = card.querySelector(spec[1]);
          const label = t ? (t.textContent || '').replace(/\s+/g, ' ').trim() : '';
          if (!label) return;
          jumpSeen[card.id] = true;
          const id = card.id;
          cmds.push({ label: 'Jump to ' + label, kind: 'jump', run: function () {
            const el = document.getElementById(id);
            if (!el) return;
            if (window.history && history.replaceState) history.replaceState(null, '', '#' + id);
            el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
            if (typeof el.focus === 'function') { el.setAttribute('tabindex', '-1'); try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
          } });
        });
      });
      // (v16) Section headings — the .section-header__title elements are given
      // stable ids by the sectionDeepLinks block (below), so surface each as a
      // "Jump to <section>" entry as well. Scoped to headings that actually got
      // an id, so a page with no section headers contributes none, and jumpSeen
      // (declared above) keeps these from colliding with the card entries.
      document.querySelectorAll('.section-header__title[id]').forEach(function (h) {
        if (jumpSeen[h.id]) return;
        const label = (h.textContent || '').replace(/\s+/g, ' ').trim();
        if (!label) return;
        jumpSeen[h.id] = true;
        const id = h.id;
        cmds.push({ label: 'Jump to ' + label, kind: 'jump', run: function () {
          const el = document.getElementById(id);
          if (!el) return;
          if (window.history && history.replaceState) history.replaceState(null, '', '#' + id);
          el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
          if (typeof el.focus === 'function') { el.setAttribute('tabindex', '-1'); try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
        } });
      });
      return cmds;
    }

    function build() {
      overlay = document.createElement('div');
      overlay.className = 'cmdk-overlay';
      overlay.setAttribute('hidden', '');
      overlay.innerHTML =
        '<div class="cmdk" role="dialog" aria-modal="true" aria-label="Command menu">' +
          '<div class="cmdk__prompt"><input class="cmdk__input" type="text" role="combobox" ' +
            'aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list" ' +
            'placeholder="Jump to a page or action…" autocomplete="off" spellcheck="false" ' +
            'aria-label="Command menu search"></div>' +
          '<ul class="cmdk__list" id="cmdk-list" role="listbox"></ul>' +
          '<div class="cmdk__foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>' +
            '<span><kbd>↵</kbd> select</span><span><kbd>esc</kbd> close</span></div>' +
        '</div>';
      document.body.appendChild(overlay);
      input = overlay.querySelector('.cmdk__input');
      list = overlay.querySelector('.cmdk__list');
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      input.addEventListener('input', () => render(input.value));
      input.addEventListener('keydown', onKey);
      built = true;
    }

    function render(query) {
      const q = (query || '').trim().toLowerCase();
      filtered = q ? items.filter(c => c.label.toLowerCase().indexOf(q) !== -1) : items.slice();
      activeIdx = 0;
      list.innerHTML = '';
      if (!filtered.length) {
        const li = document.createElement('li');
        li.className = 'cmdk__empty';
        li.textContent = 'No matches.';
        list.appendChild(li);
        input.removeAttribute('aria-activedescendant');
        return;
      }
      filtered.forEach((c, i) => {
        const li = document.createElement('li');
        li.className = 'cmdk__item';
        li.setAttribute('role', 'option');
        li.id = 'cmdk-opt-' + i;
        li.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        li.innerHTML = '<span class="cmdk__label"></span><span class="cmdk__kind"></span>';
        li.querySelector('.cmdk__label').textContent = c.label;
        li.querySelector('.cmdk__kind').textContent = c.kind === 'go' ? 'page' : c.kind;
        li.addEventListener('click', () => activate(c));
        li.addEventListener('mousemove', () => setActive(i));
        list.appendChild(li);
      });
      input.setAttribute('aria-activedescendant', 'cmdk-opt-0');
    }

    function setActive(i) {
      const nodes = list.querySelectorAll('.cmdk__item');
      if (!nodes.length) return;
      activeIdx = (i + nodes.length) % nodes.length;
      nodes.forEach((n, idx) => n.setAttribute('aria-selected', idx === activeIdx ? 'true' : 'false'));
      const el = nodes[activeIdx];
      input.setAttribute('aria-activedescendant', el.id);
      el.scrollIntoView({ block: 'nearest' });
    }

    function onKey(e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (filtered[activeIdx]) activate(filtered[activeIdx]); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { e.preventDefault(); } // simple focus trap (input is the only tab stop)
    }

    function activate(c) {
      if (!c) return;
      if (c.kind === 'copy') {
        if (navigator.clipboard) navigator.clipboard.writeText(c.value).catch(function () {});
        close();
        return;
      }
      if (c.run) { close(); c.run(); return; }
      if (c.href) {
        if (c.external) { window.open(c.href, '_blank', 'noopener'); close(); }
        else { close(); window.location.href = c.href; }
        return;
      }
      close();
    }

    function open() {
      if (!built) build();
      items = collectCommands();
      lastFocused = document.activeElement;
      overlay.removeAttribute('hidden');
      void overlay.offsetWidth; // reflow so the open transition runs
      overlay.classList.add('is-open');
      input.value = '';
      render('');
      input.focus();
    }

    function close() {
      if (!overlay || overlay.hasAttribute('hidden')) return;
      overlay.classList.remove('is-open');
      const done = () => { if (overlay && !overlay.classList.contains('is-open')) overlay.setAttribute('hidden', ''); overlay.removeEventListener('transitionend', done); };
      overlay.addEventListener('transitionend', done);
      setTimeout(done, 240); // fallback (e.g. reduced motion: no transitionend)
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    function isTyping(el) {
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    }

    document.addEventListener('keydown', function (e) {
      const combo = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
      const slash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(document.activeElement);
      if (combo || slash) {
        e.preventDefault();
        if (overlay && !overlay.hasAttribute('hidden')) close(); else open();
      }
    });
  })();

  // -- Polish: count-up the numeric credential stats on scroll-in ---
  // Only animates values that start with a digit ("10+", "05"); text
  // values like "Secret" / "RMF" are left exactly as authored.
  (function countUpStats() {
    const nums = document.querySelectorAll('.cred-card .num');
    if (!nums.length) return;
    if (prefersReduced || !('IntersectionObserver' in window)) return; // leave real numbers untouched

    function animate(el) {
      const raw = (el.textContent || '').trim();
      const m = raw.match(/^(\d+)(.*)$/);
      if (!m) return;
      const target = parseInt(m[1], 10);
      const pad = m[1].length;      // preserve leading zeros ("05")
      const suffix = m[2] || '';
      el.setAttribute('data-countup', '');
      if (target === 0) return;     // nothing to animate; final value already shown
      const dur = 900, startT = performance.now();
      el.textContent = ''.padStart(pad, '0') + suffix;
      const tick = (now) => {
        const p = Math.min(1, (now - startT) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        if (p < 1) {
          el.textContent = String(Math.round(eased * target)).padStart(pad, '0') + suffix;
          requestAnimationFrame(tick);
        } else {
          el.textContent = m[1] + suffix; // exact authored value
        }
      };
      requestAnimationFrame(tick);
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { animate(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(el => obs.observe(el));
  })();


  /* ==================== v8 weekly additions (2026-07-10) ==================== */

  // -- Branding: SVG favicon (injected) ---
  // The site ships no favicon, so tabs/bookmarks show a blank page glyph.
  // Recreates the nav's circuit-shield mark as an inline SVG data URI and
  // re-tints it from the live CSS variables whenever the theme is toggled,
  // so the tab icon always matches the current palette. Skips itself if a
  // real icon file is ever added to the <head> later.
  (function svgFavicon() {
    if (document.querySelector('link[rel~="icon"]')) return; // respect a real favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    document.head.appendChild(link);

    function cssVar(name, fallback) {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    }

    function draw() {
      const teal = cssVar('--color-primary', '#2dd4bf');
      const bg = cssVar('--color-bg', '#0a0f1a');
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
        '<rect width="32" height="32" rx="7" fill="' + bg + '"/>' +
        '<path d="M16 4L6 8.5v7.5c0 5.523 4.25 9.996 10 10.995 5.75-.999 10-5.472 10-10.995V8.5L16 4z" fill="none" stroke="' + teal + '" stroke-width="2"/>' +
        '<circle cx="16" cy="16" r="2.5" fill="' + teal + '"/>' +
        '<path d="M16 10v3.5M16 18.5V22M10 16h3.5M18.5 16H22" stroke="' + teal + '" stroke-width="2" stroke-linecap="round"/>' +
        '</svg>';
      link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
    }

    draw();
    // Re-tint after a theme toggle (small delay lets the new variables apply).
    document.querySelectorAll('[data-theme-toggle]').forEach(btn =>
      btn.addEventListener('click', () => setTimeout(draw, 60)));
  })();

  // -- UX: nav hint chip for the command palette ---
  // Last week's Cmd/Ctrl+K palette is invisible unless you know the
  // shortcut. This adds a small "Ctrl K" / "⌘ K" chip to the desktop nav
  // that opens it on click. Keyboard-only affordance: it is skipped
  // entirely on touch-first devices and hidden at mobile widths via CSS.
  (function paletteHint() {
    if (!window.matchMedia) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const actions = document.querySelector('.nav__actions');
    if (!actions) return;
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cmdk-hint';
    btn.setAttribute('aria-label', 'Open command menu (' + (isMac ? 'Command' : 'Control') + ' + K)');
    btn.title = 'Command menu (' + (isMac ? '⌘' : 'Ctrl') + '+K)';
    btn.innerHTML = '<kbd>' + (isMac ? '⌘' : 'Ctrl') + '</kbd><kbd>K</kbd>';
    btn.addEventListener('click', function () {
      try {
        // Reuse the palette's own shortcut handler — no duplicated logic.
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }));
      } catch (e) { /* very old browser: no palette either, chip is harmless */ }
    });
    actions.insertBefore(btn, actions.firstChild);
  })();

  // -- Performance: native lazy-loading for below-the-fold images ---
  // Images already in the first viewport are left untouched (so nothing
  // above the fold is delayed); everything further down gets
  // loading="lazy", and all images get decoding="async". Authored
  // loading/decoding attributes are always respected.
  (function lazyImages() {
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
      if (img.hasAttribute('loading')) return; // respect authored choice
      const r = img.getBoundingClientRect();
      if (r.top > window.innerHeight * 1.25) img.setAttribute('loading', 'lazy');
    });
  })();


  /* ==================== v9 weekly additions (2026-07-17) ==================== */

  // -- Shared toast + clipboard helpers (reused by the copy actions below) --
  // A small, non-blocking confirmation toast, announced to assistive tech via
  // role="status" / aria-live="polite". Auto-dismisses; the reduced-motion
  // rule in enhancements.css neutralises its transition automatically.
  let toastEl = null, toastTimer = null;
  function showToast(msg) {
    if (!document.body) return;
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    void toastEl.offsetWidth;               // reflow so repeat calls re-animate
    toastEl.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      if (toastEl) toastEl.classList.remove('is-visible');
    }, 2000);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) { reject(e); }
    });
  }

  // -- Live OS theme sync (only until the visitor picks a theme) ---
  // The theme is resolved once on load. If the visitor has NOT explicitly
  // toggled (nothing stored), follow the operating system when it flips between
  // light and dark in real time. An explicit choice always wins and still
  // persists — this listener bails the instant a stored preference exists.
  (function osThemeSync() {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = function (e) {
      if (getStored()) return;              // respect an explicit choice
      const next = e.matches ? 'dark' : 'light';
      html.setAttribute('data-theme', next);
      document.querySelectorAll('[data-theme-toggle]').forEach(function (b) { applyThemeIcon(b, next); });
      // Keep the mobile browser-chrome colour in sync too (matches v5 behaviour).
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) setTimeout(function () {
        try {
          const bg = getComputedStyle(document.body).backgroundColor;
          if (bg) meta.setAttribute('content', bg);
        } catch (e2) { /* no-op */ }
      }, 0);
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange); // older Safari/Firefox
  })();

  // -- Footer email → click-to-copy ---
  // The footer prints the contact address as plain text, so it can't be grabbed
  // without hand-selecting it. This turns it into an accessible button that
  // copies the address and confirms via the toast. The address itself is
  // unchanged — nothing new is published.
  (function footerEmailCopy() {
    const el = document.querySelector('.footer__copy .text-primary');
    if (!el) return;
    const email = (el.textContent || '').trim();
    if (!/@/.test(email)) return;           // only enhance an actual address
    if (el.closest('a')) return;            // already an actionable link
    el.classList.add('copy-email');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('title', 'Copy email address');
    el.setAttribute('aria-label', 'Copy email address ' + email);
    const doCopy = function () {
      copyText(email)
        .then(function () { showToast('Email copied — ' + email); })
        .catch(function () { showToast('Press Ctrl+C to copy'); });
    };
    el.addEventListener('click', doCopy);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doCopy(); }
    });
  })();

  // -- Projects page: per-case-study "copy link" buttons ---
  // Scoped to the Projects listing (#projects-grid) only, so no other page is
  // touched. Each case-study card gets a stable id (slugged from its title when
  // the author didn't set one) and a small hover button that copies a deep link
  // to that card — handy for sending a recruiter one specific writeup. Cards
  // that already have an id keep it.
  (function caseStudyLinks() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    const used = {};
    function slugify(s) {
      const base = (s || 'case-study').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'case-study';
      let id = base, n = 2;
      while (document.getElementById(id) || used[id]) { id = base + '-' + n; n++; }
      used[id] = true;
      return id;
    }
    grid.querySelectorAll('.card').forEach(function (card) {
      if (card.id) { used[card.id] = true; }
      else {
        const t = card.querySelector('.card__title, h2, h3');
        card.id = slugify(t ? t.textContent : '');
      }
      if (card.querySelector('.card-link-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card-link-btn';
      btn.title = 'Copy link to this case study';
      btn.setAttribute('aria-label', 'Copy link to this case study');
      btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
      btn.addEventListener('click', function () {
        const url = location.origin + location.pathname + '#' + card.id;
        copyText(url)
          .then(function () { showToast('Link copied'); })
          .catch(function () { showToast('Press Ctrl+C to copy'); });
        if (history && history.replaceState) history.replaceState(null, '', '#' + card.id);
      });
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      card.appendChild(btn);
    });
  })();


  /* ==================== v10 weekly additions (2026-07-24) ==================== */

  // -- Anchor offset: keep deep-linked targets clear of the sticky nav ---------
  // v9 added shareable "#case-study" deep links, and the Projects page also
  // carries a sticky filter bar directly beneath the sticky nav. Following such
  // a link (or the skip link) used to scroll the target UNDERNEATH those fixed
  // bars. This measures the real height of the nav — plus the Projects filter
  // bar when it is present — and exposes it as the CSS variable --anchor-offset,
  // which enhancements.css consumes via scroll-margin-top. It only affects
  // hash/anchor scrolling, so normal scrolling is untouched.
  (function anchorOffset() {
    const root = document.documentElement;
    function stickyBarHeight() {
      // The Projects filter bar is an unclassed sticky wrapper around this group.
      let el = document.querySelector('[aria-label="Filter projects"]');
      while (el && el !== document.body) {
        try { if (getComputedStyle(el).position === 'sticky') return el.offsetHeight; }
        catch (e) { return 0; }
        el = el.parentElement;
      }
      return 0;
    }
    function measure() {
      const navEl = document.getElementById('main-nav');
      const total = (navEl ? navEl.offsetHeight : 0) + stickyBarHeight();
      if (total > 0) root.style.setProperty('--anchor-offset', total + 'px');
    }
    measure();
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure);
  })();


  /* ==================== v11 weekly additions (2026-08-02) ==================== */

  // -- SEO / social: per-page Open Graph + Twitter + description ----------------
  // v6 added branded social cards, but only to the HOME page's static <head>.
  // The inner pages (Projects, Scripts, Certifications, Contact) share links on
  // LinkedIn/Slack/etc. with no preview. This fills in any MISSING tags on the
  // current page — every tag is guarded, so the home page's authored tags are
  // never duplicated or overwritten. The description is reused from an authored
  // meta[name="description"] when present, otherwise derived from the page's own
  // visible intro text (nothing is fabricated), and the image reuses the OG card
  // already shipped in v6. Absolute URLs so they resolve from any page depth.
  (function socialMeta() {
    const head = document.head;
    if (!head) return;
    const SITE = 'https://asmith-sec.github.io';
    const canonical = location.origin + location.pathname;
    const ogImg = SITE + '/assets/og-card.png';

    function ensureName(name, content) {
      if (!content) return;
      if (document.querySelector('meta[name="' + name + '"]')) return;
      const m = document.createElement('meta');
      m.setAttribute('name', name);
      m.setAttribute('content', content);
      head.appendChild(m);
    }
    function ensureProp(prop, content) {
      if (!content) return;
      if (document.querySelector('meta[property="' + prop + '"]')) return;
      const m = document.createElement('meta');
      m.setAttribute('property', prop);
      m.setAttribute('content', content);
      head.appendChild(m);
    }

    const title = (document.title || 'Anthony Smith — Security').trim();

    // Description: authored meta first, else the first substantial on-page copy.
    let desc = '';
    const authored = document.querySelector('meta[name="description"]');
    if (authored) desc = (authored.getAttribute('content') || '').trim();
    if (!desc) {
      const src = document.querySelector(
        '.hero__subtitle, .badge-role, .section-header__desc, .hero p, main p, .section p'
      );
      if (src) desc = (src.textContent || '').replace(/\s+/g, ' ').trim();
    }
    if (desc.length > 200) desc = desc.slice(0, 197).replace(/\s+\S*$/, '') + '…';

    ensureName('description', desc);
    ensureProp('og:type', 'website');
    ensureProp('og:site_name', 'Anthony Smith — Security Portfolio');
    ensureProp('og:title', title);
    ensureProp('og:description', desc);
    ensureProp('og:url', canonical);
    ensureProp('og:image', ogImg);
    ensureName('twitter:card', 'summary_large_image');
    ensureName('twitter:title', title);
    ensureName('twitter:description', desc);
    ensureName('twitter:image', ogImg);
  })();

  // -- A11y/UX: "opens in new tab" affordance on external content links --------
  // v3 hardened off-site links (rel=noopener noreferrer, target=_blank) but gave
  // no visible cue. WCAG best practice is to warn when a link opens a new tab.
  // This appends a small arrow glyph plus visually-hidden "(opens in new tab)"
  // text to genuine off-site links that carry visible label text. Chrome links
  // (nav, mobile nav, command palette, credential badge sidebar, footer social
  // icons) are skipped so the design stays clean; icon-only links are skipped so
  // nothing collides with an existing glyph. Runs after the v3 hardener.
  (function externalLinkCue() {
    const ICON =
      '<svg class="ext-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false"><path d="M7 17L17 7M9 7h8v8"/></svg>';
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      let url;
      try { url = new URL(a.href); } catch (e) { return; }
      if (url.hostname === location.hostname) return;        // internal links: no cue
      if (a.getAttribute('data-ext-cue')) return;            // already processed
      if (a.closest('.nav, #nav-mobile, .cmdk, .help, .badge-side, .footer__social, .footer__links')) return;
      const txt = (a.textContent || '').replace(/\s+/g, '').trim();
      if (!txt) return;                                      // icon/image-only link
      if (a.querySelector('svg, img') && txt.length < 2) return;
      a.setAttribute('data-ext-cue', '1');
      a.insertAdjacentHTML('beforeend', ICON);
      const sr = document.createElement('span');
      sr.className = 'visually-hidden';
      sr.textContent = ' (opens in new tab)';
      a.appendChild(sr);
    });
  })();

  // -- UX/A11y: keyboard shortcuts help overlay ("?") --------------------------
  // The site is keyboard-first (Cmd/Ctrl+K palette, "/" search, arrow nav) but
  // those shortcuts were undiscoverable. Pressing "?" (Shift+/) — the web's de
  // facto "help" key — opens an accessible dialog listing every shortcut. It is
  // also reachable from the command palette ("Keyboard shortcuts"). Focus moves
  // into the dialog and is trapped; Esc, the close button, or a backdrop click
  // dismiss it. "?" is a distinct key from "/", so it never fights the palette.
  (function shortcutsHelp() {
    if (!document.body) return;
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
    const mod = isMac ? '⌘' : 'Ctrl';
    let overlay = null, lastFocused = null, built = false;

    const rows = [
      { keys: [mod, 'K'], desc: 'Open the command menu' },
      { keys: ['/'],      desc: 'Open the command menu (search)' },
      { keys: ['?'],      desc: 'Show this shortcuts help' },
      { keys: ['Esc'],    desc: 'Close an open menu or dialog' },
      { keys: ['↑', '↓'], desc: 'Move through command results' },
      { keys: ['↵'], desc: 'Run the highlighted command' },
      { keys: ['[', ']'], desc: 'Jump to the previous/next section (pages with a section rail)' },
      { keys: ['Tab'],    desc: 'Move focus (Skip to content is the first stop)' },
    ];

    function build() {
      overlay = document.createElement('div');
      overlay.className = 'help-overlay';
      overlay.setAttribute('hidden', '');
      let body = '';
      rows.forEach(function (r) {
        const keys = r.keys.map(function (k) { return '<kbd></kbd>'; }).join('');
        body += '<div class="help__row"><div class="help__keys">' + keys +
                '</div><div class="help__desc"></div></div>';
      });
      overlay.innerHTML =
        '<div class="help" role="dialog" aria-modal="true" aria-labelledby="help-title">' +
          '<div class="help__head"><span id="help-title">Keyboard shortcuts</span>' +
            '<button type="button" class="help__close" aria-label="Close shortcuts help">esc</button></div>' +
          '<div class="help__rows">' + body + '</div>' +
          '<div class="help__foot"></div>' +
        '</div>';
      document.body.appendChild(overlay);

      // Fill key/description text nodes safely (no HTML interpolation of content).
      const rowEls = overlay.querySelectorAll('.help__row');
      rows.forEach(function (r, i) {
        const row = rowEls[i];
        if (!row) return;
        const kbds = row.querySelectorAll('.help__keys kbd');
        r.keys.forEach(function (k, j) { if (kbds[j]) kbds[j].textContent = k; });
        const d = row.querySelector('.help__desc');
        if (d) d.textContent = r.desc;
      });
      overlay.querySelector('.help__foot').textContent =
        'Most of these are also in the command menu (' + mod + ' K).';

      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      overlay.querySelector('.help__close').addEventListener('click', close);
      overlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'Tab') { e.preventDefault(); } // single tab stop = focus trap
      });
      built = true;
    }

    function open() {
      if (!built) build();
      lastFocused = document.activeElement;
      overlay.removeAttribute('hidden');
      void overlay.offsetWidth;              // reflow so the open transition runs
      overlay.classList.add('is-open');
      const c = overlay.querySelector('.help__close');
      if (c) c.focus();
    }

    function close() {
      if (!overlay || overlay.hasAttribute('hidden')) return;
      overlay.classList.remove('is-open');
      const done = function () {
        if (overlay && !overlay.classList.contains('is-open')) overlay.setAttribute('hidden', '');
        overlay.removeEventListener('transitionend', done);
      };
      overlay.addEventListener('transitionend', done);
      setTimeout(done, 240);                 // fallback (reduced motion: no transitionend)
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    function isTyping(el) {
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(document.activeElement)) {
        e.preventDefault();
        if (overlay && !overlay.hasAttribute('hidden')) close(); else open();
      }
    });
  })();


  /* ==================== v12 weekly additions (2026-08-07) ==================== */

  // -- Projects: shareable filters + live result count + real hiding ---
  // The Projects page ships its own inline filter script (it toggles a
  // `.hidden` class on each card). That logic is left completely untouched;
  // this layer only ADDS around it:
  //   1. `?filter=vuln` deep links — the URL now reflects the active filter and
  //      restores it when the link is opened. A v9 `#case-study` deep link wins,
  //      so a shared card link is never filtered out from under the visitor.
  //   2. Accessible state — the button row becomes a labelled group and each
  //      button reports `aria-pressed`, so screen readers announce the choice.
  //   3. A polite live region ("Showing 3 of 8 projects — Remediation.") plus a
  //      defensive empty state, so the result of a filter is actually announced.
  (function projectFilterUX() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    const btns  = Array.prototype.slice.call(document.querySelectorAll('.filter-btn'));
    const items = Array.prototype.slice.call(grid.querySelectorAll('.project-item'));
    if (!btns.length || !items.length) return;

    const bar = btns[0].parentNode;
    if (bar && !bar.getAttribute('role')) {
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', 'Filter projects by category');
    }
    btns.forEach(function (b) {
      if (!b.getAttribute('type')) b.setAttribute('type', 'button');
      b.setAttribute('aria-pressed', b.classList.contains('active') ? 'true' : 'false');
    });

    // Live result count — sits above the grid, outside the sticky filter bar.
    const status = document.createElement('p');
    status.className = 'filter-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    grid.parentNode.insertBefore(status, grid);

    // Empty state (defensive: every current category has at least one card).
    const empty = document.createElement('p');
    empty.className = 'filter-empty';
    empty.hidden = true;
    empty.textContent = 'No projects in this category yet.';
    grid.parentNode.insertBefore(empty, grid.nextSibling);

    function buttonFor(cat) {
      for (let i = 0; i < btns.length; i++) {
        if (btns[i].getAttribute('data-filter') === cat) return btns[i];
      }
      return null;
    }

    function countFor(cat) {
      if (cat === 'all') return items.length;
      let n = 0;
      items.forEach(function (it) { if (it.getAttribute('data-category') === cat) n++; });
      return n;
    }

    function reflect(cat) {
      const total = items.length;
      const shown = countFor(cat);
      const b = buttonFor(cat);
      status.textContent = (cat === 'all')
        ? 'Showing all ' + total + ' projects.'
        : 'Showing ' + shown + ' of ' + total + ' projects — ' +
          (b ? b.textContent.trim() : cat) + '.';
      empty.hidden = shown !== 0;
      btns.forEach(function (x) {
        x.setAttribute('aria-pressed', x.getAttribute('data-filter') === cat ? 'true' : 'false');
      });
    }

    function syncUrl(cat) {
      if (!window.history || !history.replaceState) return;
      try {
        const url = new URL(location.href);
        if (cat && cat !== 'all') url.searchParams.set('filter', cat);
        else url.searchParams.delete('filter');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      } catch (e) { /* older browser — filtering still works, URL just won't sync */ }
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        const cat = b.getAttribute('data-filter') || 'all';
        reflect(cat);
        syncUrl(cat);
      });
    });

    // Restore ?filter=… on load, by clicking the page's own button so the
    // existing inline logic stays the single source of truth for hiding cards.
    function init() {
      let requested = null;
      try { requested = new URL(location.href).searchParams.get('filter'); } catch (e) { requested = null; }

      let deepLinked = false;
      if (location.hash && location.hash.length > 1) {
        try {
          const t = document.querySelector(location.hash);
          if (t && t.classList.contains('project-item')) deepLinked = true;
        } catch (e) { /* not a valid selector — ignore */ }
      }

      let cat = 'all';
      const target = (requested && !deepLinked) ? buttonFor(requested) : null;
      if (target) {
        cat = requested;
        if (!target.classList.contains('active')) target.click();
      }
      reflect(cat);
    }

    // main.js runs mid-parse, before the page's inline filter script binds its
    // listeners — so defer until the document is ready, then one tick more.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
    } else {
      setTimeout(init, 0);
    }
  })();

  // -- Contact: downloadable vCard (.vcf) contact card ------------------
  // Built entirely from details ALREADY published on the page — the JSON-LD
  // Person block (v3), the mailto:/tel: links, and the LinkedIn URL (already
  // corrected by the v1 fixLinkedIn pass). Nothing is invented; any field that
  // isn't found on the page is simply omitted from the card.
  (function contactVcard() {
    if (!/contact\.html?$/i.test(location.pathname)) return;
    if (typeof Blob === 'undefined' || !window.URL || !URL.createObjectURL) return;

    // Anchor the new button next to the resume download. NOTE: the v1
    // rewriteResumeLinks pass above runs first and REMOVES the `download`
    // attribute (it points the link at the PDF and opens it in a tab), so we
    // match on the resume filename first and only fall back to [download].
    // Skip links inside the site nav/header/footer so the button lands in the
    // page body (next to "Download Resume"), not in the top nav bar.
    const inChrome = function (el) {
      return !!(el.closest && el.closest('nav, header, footer, .nav, .footer'));
    };
    const resumeBtn = Array.prototype.filter.call(
      document.querySelectorAll('a[href*="Anthony-Smith-Resume"], a[download]'),
      function (el) { return !inChrome(el); }
    )[0];
    if (!resumeBtn || !resumeBtn.parentNode) return;

    function ldPerson() {
      const nodes = document.querySelectorAll('script[type="application/ld+json"]');
      for (let i = 0; i < nodes.length; i++) {
        try {
          const d = JSON.parse(nodes[i].textContent);
          if (d && d['@type'] === 'Person') return d;
        } catch (e) { /* not the block we want */ }
      }
      return null;
    }

    const person   = ldPerson() || {};
    const fullName = String(person.name || 'Anthony Smith').trim();
    const title    = String(person.jobTitle || '').trim();
    const siteUrl  = String(person.url || (location.origin + '/'));
    const addr     = person.address || {};
    const locality = String(addr.addressLocality || '').trim();
    const region   = String(addr.addressRegion || '').trim();

    const mailA = document.querySelector('a[href^="mailto:"]');
    const email = mailA
      ? mailA.getAttribute('href').replace(/^mailto:/i, '').split('?')[0].trim()
      : '';
    const telA = document.querySelector('a[href^="tel:"]');
    const tel  = telA ? telA.getAttribute('href').replace(/^tel:/i, '').trim() : '';
    const liA  = document.querySelector('a[href*="linkedin.com/in/"]');
    const linked = liA ? liA.href : '';

    if (!email && !tel) return;   // nothing worth putting on a card

    // vCard text escaping (RFC 2426 §2.4.2) for free-text values only.
    function esc(v) {
      return String(v)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
    }

    function buildVcf() {
      const parts = fullName.split(/\s+/);
      const last  = parts.length > 1 ? parts[parts.length - 1] : '';
      const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : fullName;

      const L = ['BEGIN:VCARD', 'VERSION:3.0'];
      L.push('N:' + esc(last) + ';' + esc(first) + ';;;');
      L.push('FN:' + esc(fullName));
      if (title)    L.push('TITLE:' + esc(title));
      if (email)    L.push('EMAIL;TYPE=INTERNET,PREF:' + email);
      if (tel)      L.push('TEL;TYPE=CELL,VOICE:' + tel);
      if (locality || region) L.push('ADR;TYPE=HOME:;;;' + esc(locality) + ';' + esc(region) + ';;');
      if (siteUrl)  L.push('URL:' + siteUrl);
      if (linked)   L.push('X-SOCIALPROFILE;TYPE=linkedin:' + linked);
      L.push('REV:' + new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));
      L.push('END:VCARD');
      return L.join('\r\n') + '\r\n';
    }

    function download() {
      let url = '';
      try {
        const blob = new Blob([buildVcf()], { type: 'text/vcard;charset=utf-8' });
        url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fullName.replace(/\s+/g, '-') + '.vcf';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (typeof showToast === 'function') showToast('Contact card downloaded');
      } catch (e) {
        if (typeof showToast === 'function') showToast('Could not create the contact card');
      } finally {
        if (url) setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      }
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--outline vcard-btn';
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.5" aria-hidden="true">' +
      '<rect x="2" y="4" width="20" height="16" rx="2"/>' +
      '<circle cx="9" cy="11" r="2.5"/>' +
      '<path d="M5.5 17c.6-1.8 2-2.6 3.5-2.6s2.9.8 3.5 2.6"/>' +
      '<line x1="16" y1="10" x2="19.5" y2="10"/>' +
      '<line x1="16" y1="14" x2="19.5" y2="14"/></svg>';
    btn.appendChild(document.createTextNode('Save Contact Card (.vcf)'));
    btn.setAttribute('aria-label', 'Download Anthony Smith contact card as a .vcf file');
    btn.addEventListener('click', download);
    resumeBtn.parentNode.insertBefore(btn, resumeBtn.nextSibling);
  })();

  // -- A11y: real progressbar semantics on the certification bars -------
  // The cert cards draw progress with plain <div>s and an inline width, which
  // is invisible to assistive tech. This promotes each bar to a proper
  // role="progressbar" using the percentage ALREADY in the markup, labels it
  // with the credential's own name, and hides the now-duplicated visible "%"
  // text from screen readers. Zero visual change; no values are invented.
  (function certProgressA11y() {
    const bars = document.querySelectorAll('.cert-card__progress-bar');
    if (!bars.length) return;

    let seq = 0;
    function slugId(text) {
      const s = String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      seq++;
      return 'cert-' + (s ? s.slice(0, 40) : 'item') + '-' + seq;
    }

    Array.prototype.forEach.call(bars, function (bar) {
      if (bar.getAttribute('role')) return;             // idempotent

      const card   = bar.closest ? bar.closest('.cert-card') : null;
      const nameEl = card ? card.querySelector('.cert-card__name') : null;
      const pctEl  = card ? card.querySelector('.cert-card__pct') : null;

      // Prefer the inline fill width, but fall back to the card's own visible
      // "%" text. The page's inline script briefly animates each fill from
      // width:0 — the fallback keeps this correct no matter which runs first.
      const fill = bar.querySelector('.cert-card__progress-fill');
      const raw  = fill && fill.style ? fill.style.width : '';
      const m    = /([\d.]+)\s*%/.exec(raw || '') ||
                   (pctEl ? /([\d.]+)\s*%/.exec(pctEl.textContent || '') : null);
      if (!m) return;                                    // no percentage to report
      const pct = Math.max(0, Math.min(100, Math.round(parseFloat(m[1]))));

      const label = pctEl && pctEl.textContent.trim() ? pctEl.textContent.trim() : pct + '%';

      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-valuenow', String(pct));
      bar.setAttribute('aria-valuetext', label);

      if (nameEl) {
        if (!nameEl.id) nameEl.id = slugId(nameEl.textContent);
        bar.setAttribute('aria-labelledby', nameEl.id);
      } else {
        bar.setAttribute('aria-label', 'Completion progress');
      }

      // The bar now announces the percentage — don't read it twice.
      if (pctEl) pctEl.setAttribute('aria-hidden', 'true');
    });
  })();

  /* ==================== v13 weekly additions (2026-08-14) ==================== */

  // -- Breadcrumb trail + BreadcrumbList structured data ----------------
  // The four inner pages drop you in with no visible sense of place, and
  // Google has no breadcrumb data to show under the result. This injects a
  // small, monospace "Home / <Page>" trail at the top of each inner page's
  // header and a matching schema.org BreadcrumbList.
  //
  // Nothing is invented: the page label is the page's OWN <h1> text, and the
  // Home URL is read from the nav's existing Home link so the relative path
  // is always correct no matter how deep the page sits.
  (function breadcrumbTrail() {
    // Home has no parent; 404 has no stable position in the hierarchy.
    if (!/\/pages\//.test(location.pathname)) return;

    const h1 = document.querySelector('h1');
    if (!h1 || !h1.closest) return;

    const container = h1.closest('.container');
    if (!container || container.querySelector('.breadcrumb')) return;   // idempotent

    const title = (h1.textContent || '').replace(/\s+/g, ' ').trim();
    if (!title) return;

    const navHome = document.querySelector('.nav__links a[href*="index.html"]');
    const homeHref = navHome ? navHome.getAttribute('href') : '../index.html';

    const nav = document.createElement('nav');
    nav.className = 'breadcrumb';
    nav.setAttribute('aria-label', 'Breadcrumb');

    const ol = document.createElement('ol');
    ol.className = 'breadcrumb__list';
    ol.setAttribute('role', 'list');

    const liHome = document.createElement('li');
    liHome.className = 'breadcrumb__item';
    const aHome = document.createElement('a');
    aHome.className = 'breadcrumb__link';
    aHome.href = homeHref;
    aHome.textContent = 'Home';
    liHome.appendChild(aHome);

    // Explicit separator element rather than CSS pseudo-content: some screen
    // readers announce ::before text, and this one is hidden from them.
    const sep = document.createElement('span');
    sep.className = 'breadcrumb__sep';
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = '/';
    liHome.appendChild(sep);

    const liHere = document.createElement('li');
    liHere.className = 'breadcrumb__item';
    const here = document.createElement('span');
    here.className = 'breadcrumb__current';
    here.setAttribute('aria-current', 'page');
    here.textContent = title;
    liHere.appendChild(here);

    ol.appendChild(liHome);
    ol.appendChild(liHere);
    nav.appendChild(ol);
    container.insertBefore(nav, container.firstChild);

    // -- Structured data (skipped on file:// and if one already exists) --
    if (!/^https?:$/.test(location.protocol)) return;
    const existing = document.querySelectorAll('script[type="application/ld+json"]');
    for (let i = 0; i < existing.length; i++) {
      if (/BreadcrumbList/.test(existing[i].textContent || '')) return;
    }

    let homeUrl;
    try { homeUrl = new URL(homeHref, location.href).href; } catch (e) { return; }

    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
        { '@type': 'ListItem', position: 2, name: title, item: location.origin + location.pathname }
      ]
    };

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify(data);
    document.head.appendChild(ld);
  })();

  // -- Scripts page: live filter by name, file, tag, or capability ------
  // The Projects page has had category filtering since launch; the Scripts
  // page had no way to narrow five long cards at all. This adds a search box
  // that matches against text ALREADY on each card (title, filename, tags,
  // capability chips, description), with a `?q=` deep link so a filtered view
  // is shareable and a polite live region so the result count is announced.
  (function scriptFilter() {
    if (!/scripts\.html?$/i.test(location.pathname)) return;

    const cards = Array.prototype.slice.call(document.querySelectorAll('.script-card'));
    if (cards.length < 3) return;

    const list = cards[0].parentNode;
    if (!list || !list.parentNode) return;

    // Build the haystack once, from the card's own visible text.
    const entries = cards.map(function (el) {
      const parts = [];
      const sel = '.script-card__name, .script-card__file, .tag, .skill-item, .script-card__desc';
      Array.prototype.forEach.call(el.querySelectorAll(sel), function (n) {
        parts.push(n.textContent || '');
      });
      const nameEl = el.querySelector('.script-card__name');
      return {
        el: el,
        name: nameEl ? (nameEl.textContent || '').trim() : 'script',
        hay: parts.join(' ').replace(/\s+/g, ' ').toLowerCase()
      };
    });

    const wrap = document.createElement('div');
    wrap.className = 'script-filter';

    const label = document.createElement('label');
    label.className = 'script-filter__label';
    label.setAttribute('for', 'script-filter-input');
    label.textContent = 'Filter scripts';

    const field = document.createElement('div');
    field.className = 'script-filter__field';
    field.innerHTML =
      '<svg class="script-filter__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>';

    const input = document.createElement('input');
    input.type = 'search';
    input.id = 'script-filter-input';
    input.className = 'script-filter__input';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    input.placeholder = 'e.g. pcap, threading, CSV export';

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'script-filter__clear';
    clear.setAttribute('aria-label', 'Clear the script filter');
    clear.hidden = true;
    clear.innerHTML =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/>' +
      '<line x1="6" y1="6" x2="18" y2="18"/></svg>';

    field.appendChild(input);
    field.appendChild(clear);

    const status = document.createElement('p');
    status.className = 'script-filter__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    wrap.appendChild(label);
    wrap.appendChild(field);
    wrap.appendChild(status);
    list.parentNode.insertBefore(wrap, list);

    const empty = document.createElement('p');
    empty.className = 'script-filter__empty';
    empty.hidden = true;
    list.parentNode.insertBefore(empty, list.nextSibling);

    let urlTimer = null;
    function syncUrl(q) {
      if (!window.history || !history.replaceState) return;
      if (urlTimer) clearTimeout(urlTimer);
      urlTimer = setTimeout(function () {
        try {
          const url = new URL(location.href);
          if (q) url.searchParams.set('q', q);
          else url.searchParams.delete('q');
          history.replaceState(null, '', url.pathname + url.search + url.hash);
        } catch (e) { /* older browser — filtering still works */ }
      }, 300);
    }

    function apply(q, updateUrl) {
      const query = String(q || '').trim().toLowerCase();
      const terms = query ? query.split(/\s+/) : [];
      let shown = 0;

      entries.forEach(function (e) {
        const hit = terms.every(function (t) { return e.hay.indexOf(t) !== -1; });
        e.el.hidden = !hit;
        if (hit) {
          shown++;
          // These cards fade in on scroll; one that never entered the viewport
          // would otherwise reappear at opacity 0.
          if (e.el.classList.contains('fade-in')) e.el.classList.add('visible');
        }
      });

      status.textContent = terms.length
        ? 'Showing ' + shown + ' of ' + entries.length + ' scripts.'
        : 'Showing all ' + entries.length + ' scripts.';

      empty.textContent = 'No scripts match “' + query + '”. Try a tool name, a file name, or a capability.';
      empty.hidden = shown !== 0;
      clear.hidden = !query;

      if (updateUrl !== false) syncUrl(query);
    }

    input.addEventListener('input', function () { apply(input.value, true); });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && input.value) {
        e.stopPropagation();               // don't also close the command palette
        input.value = '';
        apply('', true);
      }
    });

    clear.addEventListener('click', function () {
      input.value = '';
      apply('', true);
      input.focus();
    });

    let initial = '';
    try { initial = new URL(location.href).searchParams.get('q') || ''; } catch (e) { initial = ''; }
    if (initial) input.value = initial;
    apply(initial, false);
  })();

  // -- A11y: real heading semantics for card titles ---------------------
  // The Scripts and Certifications pages render every card title as a plain
  // <div>, so both pages expose exactly ONE heading (the <h1>) to a screen
  // reader — heading-by-heading navigation, the primary way many users skim a
  // page, lands nowhere. Promoting them via role/aria-level restores the
  // outline with zero visual change and no HTML edits. Levels match the
  // existing structure: script cards sit directly under the page <h1> (level
  // 2); cert cards sit under the "Active Certifications" / "Active Study
  // Tracks" / "On the Roadmap" <h2>s (level 3).
  (function cardHeadingSemantics() {
    [['.script-card__name', '2'], ['.cert-card__name', '3']].forEach(function (pair) {
      Array.prototype.forEach.call(document.querySelectorAll(pair[0]), function (el) {
        if (el.getAttribute('role')) return;              // idempotent
        if (/^H[1-6]$/.test(el.tagName)) return;          // already a real heading
        el.setAttribute('role', 'heading');
        el.setAttribute('aria-level', pair[1]);
      });
    });
  })();


  /* ==================== v14 weekly additions (2026-08-21) ==================== */

  // -- Scripts page: per-script deep links + "copy link" buttons ---------------
  // The Projects page has had shareable "#case-study" deep links since v9; the
  // Scripts page had none, so there was no way to send someone one specific tool.
  // This gives every script card a stable id (slugged from its OWN title) and a
  // small hover "copy link" button beside the title — the same chain glyph used
  // on the Projects cards. Clicking copies a deep link to that script and updates
  // the URL hash; opening such a link scrolls the script into view (respecting
  // the v13 ?q= filter and reduced-motion). Idempotent; nothing invented.
  (function scriptDeepLinks() {
    if (!/scripts\.html?$/i.test(location.pathname)) return;

    const cards = Array.prototype.slice.call(document.querySelectorAll('.script-card'));
    if (!cards.length) return;

    const used = {};
    function slugify(s) {
      const base = (s || 'script').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'script';
      let id = base, n = 2;
      while (document.getElementById(id) || used[id]) { id = base + '-' + n; n++; }
      used[id] = true;
      return id;
    }

    cards.forEach(function (card) {
      if (card.id) { used[card.id] = true; }
      else {
        const t = card.querySelector('.script-card__name');
        card.id = slugify(t ? t.textContent : '');
      }
      const nameEl = card.querySelector('.script-card__name');
      if (!nameEl || nameEl.querySelector('.script-card__share')) return;   // idempotent

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'script-card__share';
      btn.title = 'Copy link to this script';
      btn.setAttribute('aria-label', 'Copy link to ' + (nameEl.textContent || 'this script').trim());
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
      btn.addEventListener('click', function () {
        const url = location.origin + location.pathname + '#' + card.id;
        copyText(url)
          .then(function () { if (typeof showToast === 'function') showToast('Link copied — ' + nameEl.textContent.trim()); })
          .catch(function () { if (typeof showToast === 'function') showToast('Press Ctrl+C to copy'); });
        if (window.history && history.replaceState) history.replaceState(null, '', '#' + card.id);
        btn.classList.add('is-copied');
        setTimeout(function () { btn.classList.remove('is-copied'); }, 1400);
      });
      nameEl.appendChild(btn);
    });

    // The ids are assigned here in JS, so the browser's native on-load jump to a
    // "#script" hash fired before the target existed. Re-run it once — unless the
    // v13 ?q= filter has hidden that particular card.
    if (location.hash && location.hash.length > 1) {
      let target = null;
      try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
      catch (e) { target = document.getElementById(location.hash.slice(1)); }
      if (target && target.classList.contains('script-card') && !target.hidden) {
        window.addEventListener('load', function () {
          setTimeout(function () {
            target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
          }, 60);
        });
      }
    }
  })();

  // -- SEO / social: richer social-card metadata -------------------------------
  // v11 added per-page Open Graph + Twitter tags, but no image alt text, image
  // dimensions, or locale. Alt text makes the shared card accessible; declared
  // dimensions let LinkedIn/Slack/iMessage reserve space and render the large
  // card without a re-flow. Every tag is guarded, so nothing authored (or added
  // by v11) is duplicated, and width/height are asserted ONLY when the referenced
  // image is the known 1200x630 og-card.png.
  (function socialMetaExtras() {
    const head = document.head;
    if (!head) return;

    function hasProp(p) { return !!document.querySelector('meta[property="' + p + '"]'); }
    function hasName(n) { return !!document.querySelector('meta[name="' + n + '"]'); }
    function addProp(p, c) {
      if (!c || hasProp(p)) return;
      const m = document.createElement('meta');
      m.setAttribute('property', p); m.setAttribute('content', c); head.appendChild(m);
    }
    function addName(n, c) {
      if (!c || hasName(n)) return;
      const m = document.createElement('meta');
      m.setAttribute('name', n); m.setAttribute('content', c); head.appendChild(m);
    }

    const ALT = 'Anthony Smith — Security Engineer · security portfolio preview card';
    addProp('og:locale', 'en_US');
    addProp('og:image:alt', ALT);
    addName('twitter:image:alt', ALT);

    const ogImg = document.querySelector('meta[property="og:image"]');
    const src = ogImg ? (ogImg.getAttribute('content') || '') : '';
    if (/og-card\.png(?:[?#]|$)/i.test(src)) {
      addProp('og:image:width', '1200');
      addProp('og:image:height', '630');
      addProp('og:image:type', 'image/png');
    }
  })();

  // -- SEO: enrich the Person structured data with education + credentials -----
  // v3 shipped a schema.org Person block; this augments THAT block (never a new
  // one) with alumniOf and hasCredential, using only facts already published in
  // the page's About section — the Penn State degree and the Security+/Network+/
  // CSIS certifications. Guarded field-by-field, so re-running changes nothing.
  (function personLdEnrich() {
    const nodes = document.querySelectorAll('script[type="application/ld+json"]');
    let node = null, data = null;
    for (let i = 0; i < nodes.length; i++) {
      try {
        const d = JSON.parse(nodes[i].textContent);
        if (d && d['@type'] === 'Person') { node = nodes[i]; data = d; break; }
      } catch (e) { /* not the block we want */ }
    }
    if (!node || !data) return;

    let changed = false;
    if (!data.alumniOf) {
      data.alumniOf = {
        '@type': 'CollegeOrUniversity',
        name: 'Pennsylvania State University',
        alternateName: 'Penn State Abington'
      };
      changed = true;
    }
    if (!data.hasCredential) {
      const cred = function (name) {
        return { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: name };
      };
      data.hasCredential = [
        cred('CompTIA Security+'),
        cred('CompTIA Network+'),
        cred('Secure Infrastructure Specialist (CSIS)')
      ];
      changed = true;
    }
    if (changed) {
      try { node.textContent = JSON.stringify(data); } catch (e) { /* leave original intact */ }
    }
  })();

  /* ==================== v15 weekly additions (2026-08-28) ==================== */

  // -- Certifications page: per-cert deep links + "copy link" buttons ----------
  // Projects (v9) and Scripts (v14) already have shareable "#" deep links with a
  // copy button; the Certifications page was the last card page without one. Each
  // .cert-card now gets a stable id slugged from its OWN name, plus the same chain
  // glyph "copy link" button beside the title. Opening a shared link scrolls the
  // credential into view (respecting reduced-motion). Idempotent; nothing invented.
  (function certDeepLinks() {
    if (!/certifications\.html?$/i.test(location.pathname)) return;

    const cards = Array.prototype.slice.call(document.querySelectorAll('.cert-card'));
    if (!cards.length) return;

    const used = {};
    function slugify(s) {
      const base = (s || 'cert').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'cert';
      let id = base, n = 2;
      while (document.getElementById(id) || used[id]) { id = base + '-' + n; n++; }
      used[id] = true;
      return id;
    }

    cards.forEach(function (card) {
      if (card.id) { used[card.id] = true; }
      else {
        const t = card.querySelector('.cert-card__name');
        card.id = slugify(t ? t.textContent : '');
      }
      const nameEl = card.querySelector('.cert-card__name');
      if (!nameEl || nameEl.querySelector('.cert-card__share')) return;   // idempotent

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cert-card__share';
      btn.title = 'Copy link to this credential';
      btn.setAttribute('aria-label', 'Copy link to ' + (nameEl.textContent || 'this credential').trim());
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
      btn.addEventListener('click', function () {
        const url = location.origin + location.pathname + '#' + card.id;
        copyText(url)
          .then(function () { if (typeof showToast === 'function') showToast('Link copied — ' + nameEl.textContent.trim()); })
          .catch(function () { if (typeof showToast === 'function') showToast('Press Ctrl+C to copy'); });
        if (window.history && history.replaceState) history.replaceState(null, '', '#' + card.id);
        btn.classList.add('is-copied');
        setTimeout(function () { btn.classList.remove('is-copied'); }, 1400);
      });
      nameEl.appendChild(btn);
    });

    // The ids are assigned here in JS, so the browser's native on-load jump to a
    // "#cert" hash fired before the target existed. Re-run it once on load.
    if (location.hash && location.hash.length > 1) {
      let target = null;
      try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
      catch (e) { target = document.getElementById(location.hash.slice(1)); }
      if (target && target.classList.contains('cert-card')) {
        window.addEventListener('load', function () {
          setTimeout(function () {
            target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
          }, 60);
        });
      }
    }
  })();

  // -- Section-header deep links + "copy link" buttons (v16) --------------------
  // Projects (v9), Scripts (v14) and Certifications (v15) all have shareable "#"
  // deep links on their CARDS. Section HEADERS (the .section-header__title
  // elements on the home page and the Certifications page — "Toolkit", "Featured
  // Projects", "Active Certifications", etc.) had none, so you couldn't link a
  // recruiter straight to a section. Each such heading now gets a stable id
  // slugged from its OWN text plus the same chain-glyph "copy link" button used
  // elsewhere. Scoped to .section-header__title, so card titles and the Contact
  // page's inline headings are untouched. Idempotent; nothing invented.
  (function sectionDeepLinks() {
    const heads = Array.prototype.slice.call(document.querySelectorAll('.section-header__title'));
    if (!heads.length) return;

    const used = {};
    function slugify(s) {
      const base = (s || 'section').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'section';
      let id = base, n = 2;
      while (document.getElementById(id) || used[id]) { id = base + '-' + n; n++; }
      used[id] = true;
      return id;
    }

    heads.forEach(function (h) {
      if (h.id) { used[h.id] = true; }
      else { h.id = slugify(h.textContent); }
      if (h.querySelector('.section-header__share')) return;                // idempotent

      const label = (h.textContent || 'this section').replace(/\s+/g, ' ').trim();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'section-header__share';
      btn.title = 'Copy link to this section';
      btn.setAttribute('aria-label', 'Copy link to ' + label);
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
      btn.addEventListener('click', function () {
        const url = location.origin + location.pathname + '#' + h.id;
        copyText(url)
          .then(function () { if (typeof showToast === 'function') showToast('Link copied — ' + label); })
          .catch(function () { if (typeof showToast === 'function') showToast('Press Ctrl+C to copy'); });
        if (window.history && history.replaceState) history.replaceState(null, '', '#' + h.id);
        btn.classList.add('is-copied');
        setTimeout(function () { btn.classList.remove('is-copied'); }, 1400);
      });
      h.appendChild(btn);
    });

    // ids are assigned here in JS, so the browser's native on-load jump to a
    // section hash fired before the target existed. Re-run it once on load.
    if (location.hash && location.hash.length > 1) {
      let target = null;
      try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
      catch (e) { target = document.getElementById(location.hash.slice(1)); }
      if (target && target.classList.contains('section-header__title')) {
        window.addEventListener('load', function () {
          setTimeout(function () {
            target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
          }, 60);
        });
      }
    }
  })();

  // -- Auto-updating footer copyright year (v16) -------------------------------
  // Every page prints "© 2026 …" as static text, which silently goes stale the
  // moment the calendar turns over. This rewrites ONLY the year token in the
  // leading text node of each .footer__copy to the current year, leaving the
  // rest of the line — and the click-to-copy email span/button added earlier —
  // completely intact regardless of script order. No-op when already current.
  (function footerYear() {
    const y = String(new Date().getFullYear());
    const yearRe = /((?:©|©)\s*)20\d{2}/;
    document.querySelectorAll('.footer__copy').forEach(function (el) {
      const nodes = Array.prototype.slice.call(el.childNodes);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.nodeType === 3 && yearRe.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(yearRe, '$1' + y);
          break;
        }
      }
    });
  })();

  /* ==================== v17 weekly additions (2026-09-11) ==================== */

  // -- Certifications page: at-a-glance credential summary ---------------------
  // The certs page lists credentials across three sections; a recruiter skimming
  // it has no single-line read on depth. This inserts a small monospace summary
  // under the page intro, with counts computed ENTIRELY from each card's own
  // status pill (".cert-card__status") — nothing is invented. Idempotent, and a
  // no-op on every other page.
  (function certSummary() {
    if (!/certifications\.html?$/i.test(location.pathname)) return;
    const cards = Array.prototype.slice.call(document.querySelectorAll('.cert-card'));
    if (cards.length < 3) return;

    const h1 = document.querySelector('h1');
    if (!h1) return;
    const anchor = h1.nextElementSibling;                 // the intro description <p>
    if (!anchor || !anchor.parentNode) return;
    if (anchor.parentNode.querySelector('.cert-summary')) return;   // idempotent

    let earned = 0, progress = 0, planned = 0;
    cards.forEach(function (c) {
      const s = c.querySelector('.cert-card__status');
      const cls = s ? s.className : '';
      const txt = s ? (s.textContent || '').toLowerCase() : '';
      if (/--earned/.test(cls) || /earned/.test(txt)) earned++;
      else if (/--planned/.test(cls) || /planned/.test(txt)) planned++;
      else if (/--progress/.test(cls) || /progress|studying/.test(txt)) progress++;
    });

    const rows = [];
    if (earned)   rows.push([earned, 'Earned']);
    if (progress) rows.push([progress, 'In Progress']);
    if (planned)  rows.push([planned, 'Planned']);
    if (!rows.length) return;

    const total = earned + progress + planned;
    const wrap = document.createElement('p');
    wrap.className = 'cert-summary';
    wrap.setAttribute('role', 'group');   // v26: aria-label is not allowed on a bare <p>
    // The visible chips are aria-hidden and this one label reads cleanly instead,
    // so a screen reader hears "5 earned, 3 in progress, 3 planned, 11 total"
    // rather than the digits and words split apart.
    wrap.setAttribute('aria-label',
      'Credential summary: ' +
      rows.map(function (r) { return r[0] + ' ' + r[1].toLowerCase(); }).join(', ') +
      ', ' + total + ' total.');

    rows.forEach(function (r, i) {
      if (i) {
        const sep = document.createElement('span');
        sep.className = 'cert-summary__sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '·';
        wrap.appendChild(sep);
      }
      const item = document.createElement('span');
      item.className = 'cert-summary__item';
      item.setAttribute('aria-hidden', 'true');
      const b = document.createElement('b');
      b.className = 'cert-summary__count';
      b.textContent = String(r[0]);
      item.appendChild(b);
      item.appendChild(document.createTextNode(' ' + r[1]));
      wrap.appendChild(item);
    });

    anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
  })();

  // -- Certifications page: live filter (parked idea from v15/v16) -------------
  // Mirrors the v13 Scripts filter, scoped to certifications.html. Matches against
  // each card's OWN visible text (name, org, status, percentage, description) and
  // adds a "?q=" deep link, a polite live count, and an empty state. Improvement
  // over the Scripts filter: a section header whose whole group is filtered out is
  // hidden too, so you never see an orphaned "On the Roadmap" heading with nothing
  // under it. A v15 "#credential" deep link wins, so a shared card link is never
  // filtered out from under the visitor. The timeline below the grids is left
  // untouched. Idempotent; nothing invented.
  (function certFilter() {
    if (!/certifications\.html?$/i.test(location.pathname)) return;

    const cards = Array.prototype.slice.call(document.querySelectorAll('.cert-card'));
    if (cards.length < 5) return;

    const grids = Array.prototype.slice.call(document.querySelectorAll('.cert-grid'));
    if (!grids.length || !grids[0].parentNode) return;
    if (document.querySelector('.cert-filter')) return;   // idempotent

    // Pair each grid with its preceding .section-header so an empty group hides.
    const groups = grids.map(function (g) {
      let h = g.previousElementSibling;
      while (h && !(h.classList && h.classList.contains('section-header'))) h = h.previousElementSibling;
      return { grid: g, header: h };
    });

    const entries = cards.map(function (el) {
      const parts = [];
      const sel = '.cert-card__name, .cert-card__org, .cert-card__status, .cert-card__pct, p';
      Array.prototype.forEach.call(el.querySelectorAll(sel), function (n) { parts.push(n.textContent || ''); });
      const nameEl = el.querySelector('.cert-card__name');
      return {
        el: el,
        name: nameEl ? (nameEl.textContent || '').trim() : 'credential',
        hay: parts.join(' ').replace(/\s+/g, ' ').toLowerCase()
      };
    });

    const wrap = document.createElement('div');
    wrap.className = 'cert-filter';

    const label = document.createElement('label');
    label.className = 'cert-filter__label';
    label.setAttribute('for', 'cert-filter-input');
    label.textContent = 'Filter certifications';

    const field = document.createElement('div');
    field.className = 'cert-filter__field';
    field.innerHTML =
      '<svg class="cert-filter__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>';

    const input = document.createElement('input');
    input.type = 'search';
    input.id = 'cert-filter-input';
    input.className = 'cert-filter__input';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    input.placeholder = 'e.g. CompTIA, in progress, SOC, cloud';

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'cert-filter__clear';
    clear.setAttribute('aria-label', 'Clear the certification filter');
    clear.hidden = true;
    clear.innerHTML =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/>' +
      '<line x1="6" y1="6" x2="18" y2="18"/></svg>';

    field.appendChild(input);
    field.appendChild(clear);

    const status = document.createElement('p');
    status.className = 'cert-filter__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    wrap.appendChild(label);
    wrap.appendChild(field);
    wrap.appendChild(status);

    // Insert the filter above the first section header (top of the list area).
    const firstHeader = groups[0].header || grids[0];
    firstHeader.parentNode.insertBefore(wrap, firstHeader);

    // Empty state after the last grid (before the timeline / divider).
    const lastGrid = grids[grids.length - 1];
    const empty = document.createElement('p');
    empty.className = 'cert-filter__empty';
    empty.hidden = true;
    lastGrid.parentNode.insertBefore(empty, lastGrid.nextSibling);

    let urlTimer = null;
    function syncUrl(q) {
      if (!window.history || !history.replaceState) return;
      if (urlTimer) clearTimeout(urlTimer);
      urlTimer = setTimeout(function () {
        try {
          const url = new URL(location.href);
          if (q) url.searchParams.set('q', q);
          else url.searchParams.delete('q');
          history.replaceState(null, '', url.pathname + url.search + url.hash);
        } catch (e) { /* older browser — filtering still works */ }
      }, 300);
    }

    function apply(q, updateUrl) {
      const query = String(q || '').trim().toLowerCase();
      const terms = query ? query.split(/\s+/) : [];
      let shown = 0;

      entries.forEach(function (e) {
        const hit = terms.every(function (t) { return e.hay.indexOf(t) !== -1; });
        e.el.hidden = !hit;
        if (hit) {
          shown++;
          // These cards fade in on scroll; one that never entered the viewport
          // would otherwise reappear at opacity 0 when the filter reveals it.
          if (e.el.classList.contains('fade-in')) e.el.classList.add('visible');
        }
      });

      // Hide a group (grid + its section header) when all its cards are filtered
      // out, so no empty heading is left stranded.
      groups.forEach(function (grp) {
        const any = Array.prototype.some.call(
          grp.grid.querySelectorAll('.cert-card'), function (c) { return !c.hidden; });
        grp.grid.hidden = !any;
        if (grp.header) grp.header.hidden = !any;
      });

      status.textContent = terms.length
        ? 'Showing ' + shown + ' of ' + entries.length + ' certifications.'
        : 'Showing all ' + entries.length + ' certifications.';

      empty.textContent = 'No certifications match “' + query + '”. Try a provider, a status, or a topic.';
      empty.hidden = shown !== 0;
      clear.hidden = !query;

      if (updateUrl !== false) syncUrl(query);
    }

    input.addEventListener('input', function () { apply(input.value, true); });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && input.value) {
        e.stopPropagation();               // don't also close the command palette
        input.value = '';
        apply('', true);
      }
    });

    clear.addEventListener('click', function () {
      input.value = '';
      apply('', true);
      input.focus();
    });

    // A v15 "#credential" deep link must win over a stored ?q= that would hide it.
    let deepLinked = false;
    if (location.hash && location.hash.length > 1) {
      let t = null;
      try { t = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
      catch (e) { t = document.getElementById(location.hash.slice(1)); }
      if (t && t.classList.contains('cert-card')) deepLinked = true;
    }

    let initial = '';
    try { initial = new URL(location.href).searchParams.get('q') || ''; } catch (e) { initial = ''; }
    if (deepLinked) initial = '';
    if (initial) input.value = initial;
    apply(initial, false);
  })();

  // -- Certifications page: list semantics for the credential grids ------------
  // Each .cert-grid is a plain <div>, so a screen reader announces the cards as
  // loose text with no sense of grouping or count. Promoting each grid to
  // role="list" (labelled by its section heading) and each card to role="listitem"
  // restores "Active Certifications, list, 5 items" navigation with ZERO visual
  // change — and because filtered-out cards are removed from the a11y tree, the
  // announced count stays correct as the v17 filter narrows the list. The section
  // headings already carry stable ids from the v16 pass; this assigns one only as
  // a fallback. Idempotent.
  (function certListSemantics() {
    if (!/certifications\.html?$/i.test(location.pathname)) return;
    let seq = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.cert-grid'), function (grid) {
      if (grid.getAttribute('role')) return;               // idempotent
      grid.setAttribute('role', 'list');

      let h = grid.previousElementSibling;
      while (h && !(h.classList && h.classList.contains('section-header'))) h = h.previousElementSibling;
      const title = h ? h.querySelector('.section-header__title') : null;
      if (title) {
        if (!title.id) title.id = 'cert-group-' + (++seq);
        grid.setAttribute('aria-labelledby', title.id);
      } else {
        grid.setAttribute('aria-label', 'Certifications');
      }

      Array.prototype.forEach.call(grid.querySelectorAll('.cert-card'), function (c) {
        if (!c.getAttribute('role')) c.setAttribute('role', 'listitem');
      });
    });
  })();

  /* ==================== v18 weekly additions (2026-09-18) ==================== */

  // -- On-page section navigation: a small scroll-spy rail (parked v15/v16/v17) --
  // The long, multi-section pages (home + certifications) have carried stable
  // section ids since v16, but there was no at-a-glance way to see where you are on
  // the page or jump between sections. This injects a compact vertical rail of dots
  // on the right edge — one per .section-header__title[id] — that highlights the
  // section you're currently reading and scrolls to a section when a dot is chosen.
  // Built ONLY when a page has 3+ such sections (so short pages get nothing);
  // desktop-only (hidden under 1280px and on touch-first devices via CSS);
  // keyboard-reachable (real anchor links inside a labelled <nav>); and print- /
  // reduced-motion- / forced-colors-aware. A dot whose section is hidden by the v17
  // certifications filter hides itself. Idempotent; nothing invented — the labels
  // are the headings' own text.
  (function sectionNav() {
    if (document.querySelector('.section-nav')) return;                 // idempotent

    const heads = Array.prototype.slice.call(
      document.querySelectorAll('.section-header__title[id]'));
    if (heads.length < 3) return;              // only long, multi-section pages qualify

    // Build a clean label even when the heading contains a <br> (which carries no
    // whitespace) and after v16 appended a (text-less) .section-header__share button.
    function labelFor(h) {
      let s = '';
      Array.prototype.forEach.call(h.childNodes, function (n) {
        if (n.nodeType === 1 && /^BR$/i.test(n.tagName)) s += ' ';
        else if (n.nodeType === 3) s += n.nodeValue;
      });
      return s.replace(/\s+/g, ' ').trim();
    }

    const nav = document.createElement('nav');
    nav.className = 'section-nav';
    nav.setAttribute('aria-label', 'On this page');
    const ul = document.createElement('ul');
    ul.className = 'section-nav__list';
    ul.setAttribute('role', 'list');
    nav.appendChild(ul);

    const dots = heads.map(function (h) {
      const label = labelFor(h) || 'Section';
      const li = document.createElement('li');
      li.className = 'section-nav__item';
      const a = document.createElement('a');
      a.className = 'section-nav__dot';
      a.href = '#' + h.id;
      a.setAttribute('aria-label', label);
      const tip = document.createElement('span');
      tip.className = 'section-nav__label';
      tip.setAttribute('aria-hidden', 'true');
      tip.textContent = label;
      a.appendChild(tip);
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.history && history.replaceState) history.replaceState(null, '', '#' + h.id);
        h.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
        if (typeof h.focus === 'function') {
          h.setAttribute('tabindex', '-1');
          try { h.focus({ preventScroll: true }); } catch (err) { h.focus(); }
        }
      });
      li.appendChild(a);
      ul.appendChild(li);
      return { head: h, link: a, item: li };
    });

    document.body.appendChild(nav);

    // Scroll-spy: the section whose top has passed a line ~28% down the viewport is
    // "current"; dots for sections that aren't currently rendered (e.g. filtered out
    // on the certs page) hide themselves so the rail stays truthful.
    let ticking = false;
    function sync() {
      ticking = false;
      const line = 0.28 * window.innerHeight;
      let activeIdx = -1;
      dots.forEach(function (d, i) {
        const rendered = d.head.offsetParent !== null && !d.head.hidden;
        d.item.hidden = !rendered;
        if (!rendered) return;
        if (d.head.getBoundingClientRect().top - line <= 0) activeIdx = i;
      });
      if (activeIdx === -1) {
        for (let i = 0; i < dots.length; i++) {
          if (!dots[i].item.hidden) { activeIdx = i; break; }
        }
      }
      dots.forEach(function (d, i) {
        const on = i === activeIdx && !d.item.hidden;
        d.link.classList.toggle('is-active', on);
        if (on) d.link.setAttribute('aria-current', 'true');
        else d.link.removeAttribute('aria-current');
      });
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(sync);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('load', sync);
    sync();
  })();

  // -- Print-only identity letterhead on the inner pages ------------------------
  // The v5 print stylesheet hides the site nav, so a printed inner page (Projects,
  // Scripts, Certifications, Contact) opens with just the page title and no sense of
  // WHOSE portfolio it is. This injects a compact, print-only letterhead at the very
  // top of the page — name, role, email and site URL, plus the phone when the page
  // publishes a tel: link — so any single page a recruiter prints or saves as PDF is
  // self-identifying. It is display:none on screen (a pure print artifact), reads
  // every value from data ALREADY on the page (the v3 Person JSON-LD and the
  // mailto:/tel: links), and invents nothing. Skipped on the home page, whose hero
  // already shows the name. Idempotent.
  (function printLetterhead() {
    if (!/\/pages\//.test(location.pathname)) return;                 // inner pages only
    if (!document.body) return;
    if (document.querySelector('.print-letterhead')) return;          // idempotent

    function ldPerson() {
      const nodes = document.querySelectorAll('script[type="application/ld+json"]');
      for (let i = 0; i < nodes.length; i++) {
        try {
          const d = JSON.parse(nodes[i].textContent);
          if (d && d['@type'] === 'Person') return d;
        } catch (e) { /* not the block we want */ }
      }
      return null;
    }

    const p    = ldPerson() || {};
    const name = String(p.name || 'Anthony Smith').trim();
    const role = String(p.jobTitle || '').trim();
    const site = String(p.url || (location.origin + '/'))
      .replace(/^https?:\/\//, '').replace(/\/+$/, '');

    const mailA = document.querySelector('a[href^="mailto:"]');
    const email = mailA
      ? mailA.getAttribute('href').replace(/^mailto:/i, '').split('?')[0].trim()
      : String(p.email || '').replace(/^mailto:/i, '').trim();
    const telA  = document.querySelector('a[href^="tel:"]');
    const phone = telA
      ? ((telA.textContent || '').trim() || telA.getAttribute('href').replace(/^tel:/i, '').trim())
      : '';

    const bits = [];
    if (email) bits.push(email);
    if (phone) bits.push(phone);
    if (site)  bits.push(site);

    const head = document.createElement('div');
    head.className = 'print-letterhead';
    head.setAttribute('aria-hidden', 'true');       // duplicate info; a print-only artifact
    const nameEl = document.createElement('span');
    nameEl.className = 'print-letterhead__name';
    nameEl.textContent = role ? (name + ' — ' + role) : name;
    head.appendChild(nameEl);
    if (bits.length) {
      const meta = document.createElement('span');
      meta.className = 'print-letterhead__meta';
      meta.textContent = bits.join('  ·  ');
      head.appendChild(meta);
    }
    document.body.insertBefore(head, document.body.firstChild);
  })();

  // -- SEO: enrich the Person structured data with image + employer -------------
  // v3 shipped the Person block and v14 added alumniOf + hasCredential; this adds
  // two more accurate, already-published facts so search engines can render a richer
  // entity: `image` (the profile photo the page already displays) and `worksFor`
  // (the current employer named in the home page's About section and the
  // certifications timeline). It re-reads the SAME block from the DOM, so the v14
  // fields are preserved, and it is guarded field-by-field, so re-running changes
  // nothing. Nothing is invented.
  (function personLdMore() {
    const nodes = document.querySelectorAll('script[type="application/ld+json"]');
    let node = null, data = null;
    for (let i = 0; i < nodes.length; i++) {
      try {
        const d = JSON.parse(nodes[i].textContent);
        if (d && d['@type'] === 'Person') { node = nodes[i]; data = d; break; }
      } catch (e) { /* not the block we want */ }
    }
    if (!node || !data) return;

    let changed = false;
    if (!data.image) {
      const site = String(data.url || (location.origin + '/')).replace(/\/+$/, '');
      data.image = site + '/assets/profile.jpg';
      changed = true;
    }
    if (!data.worksFor) {
      data.worksFor = { '@type': 'Organization', name: 'EHS Technologies' };
      changed = true;
    }
    if (changed) {
      try { node.textContent = JSON.stringify(data); } catch (e) { /* leave original intact */ }
    }
  })();

  /* ==================== v19 weekly additions (2026-09-25) ==================== */

  // -- Certifications page: status quick-filter chips (parked idea, v17/v18) ---
  // The v17 filter box already matches typed text like "earned" or "in progress"
  // against each card's own status text, so the three most useful searches were
  // always a single word away — but a visitor has to know to type them. This adds
  // three small toggle chips (Earned / In Progress / Planned) that just set the
  // EXISTING filter box's value and fire its own "input" event, so all of the
  // matching, "?q=" sync, empty-state and group-hiding logic stays in ONE place
  // (v17's certFilter) — nothing here duplicates or reimplements it. Counts are
  // read straight from each card's own status pill, the same way v17's summary
  // line does. A chip re-syncs to "off" if the box is edited by hand (or a "?q="
  // deep link loads one of the three terms), so the row never shows a stale
  // active state. Idempotent; a no-op wherever the v17 filter itself didn't build
  // (fewer than 5 credentials) or when there's only one status to show.
  (function certQuickFilters() {
    if (!/certifications\.html?$/i.test(location.pathname)) return;
    const input = document.getElementById('cert-filter-input');
    const filterWrap = document.querySelector('.cert-filter');
    if (!input || !filterWrap || !filterWrap.parentNode) return;
    if (document.querySelector('.cert-quick-filters')) return;    // idempotent

    const cards = Array.prototype.slice.call(document.querySelectorAll('.cert-card'));
    let earned = 0, progress = 0, planned = 0;
    cards.forEach(function (c) {
      const s = c.querySelector('.cert-card__status');
      const cls = s ? s.className : '';
      const txt = s ? (s.textContent || '').toLowerCase() : '';
      if (/--earned/.test(cls) || /earned/.test(txt)) earned++;
      else if (/--planned/.test(cls) || /planned/.test(txt)) planned++;
      else if (/--progress/.test(cls) || /progress|studying/.test(txt)) progress++;
    });

    const defs = [];
    if (earned)   defs.push({ term: 'earned',      label: 'Earned',      count: earned });
    if (progress) defs.push({ term: 'in progress', label: 'In Progress', count: progress });
    if (planned)  defs.push({ term: 'planned',     label: 'Planned',     count: planned });
    if (defs.length < 2) return;     // not worth a row when everything's one status

    const wrap = document.createElement('div');
    wrap.className = 'cert-quick-filters';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Quick-filter certifications by status');

    const chips = defs.map(function (d) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cert-quick-filters__chip';
      btn.setAttribute('aria-pressed', 'false');
      btn.dataset.term = d.term;
      const label = document.createElement('span');
      label.className = 'cert-quick-filters__label';
      label.textContent = d.label;
      const count = document.createElement('span');
      count.className = 'cert-quick-filters__count';
      count.textContent = String(d.count);
      btn.appendChild(label);
      btn.appendChild(count);
      wrap.appendChild(btn);
      return btn;
    });

    filterWrap.parentNode.insertBefore(wrap, filterWrap.nextSibling);

    function fireInput() {
      let evt;
      try { evt = new Event('input', { bubbles: true }); }
      catch (e) { evt = document.createEvent('Event'); evt.initEvent('input', true, true); }
      input.dispatchEvent(evt);
    }

    function setActive(term) {
      chips.forEach(function (c) {
        const on = !!term && c.dataset.term === term;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        const already = chip.classList.contains('is-active');
        input.value = already ? '' : chip.dataset.term;
        setActive(already ? null : chip.dataset.term);
        input.focus();
        fireInput();
      });
    });

    // Keep the row honest if the box is edited by hand or a "?q=" deep link loads.
    input.addEventListener('input', function () {
      const v = input.value.trim().toLowerCase();
      const hit = defs.some(function (d) { return d.term === v; });
      setActive(hit ? v : null);
    });
    if (input.value) setActive(input.value.trim().toLowerCase());
  })();

  // -- Section rail: previous/next section keyboard shortcuts ([ / ]) ----------
  // Parked in the v18 changelog. On a page where the v18 scroll-spy rail built
  // (3+ section-header ids), "[" and "]" step to the previous/next visible dot by
  // calling .click() on that SAME anchor the rail already builds — reusing its
  // existing smooth-scroll, hash-update, and focus-move exactly as-is, nothing
  // reimplemented. Skipped while the visitor is typing or holding a modifier key,
  // and only ever attached on pages where the rail itself already built (a no-op
  // everywhere else). Idempotent.
  (function sectionNavKeys() {
    const nav = document.querySelector('.section-nav');
    if (!nav) return;
    const links = Array.prototype.slice.call(nav.querySelectorAll('.section-nav__dot'));
    if (links.length < 2) return;
    if (nav.dataset.keysBound) return;         // idempotent
    nav.dataset.keysBound = '1';

    function isTyping(el) {
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    }

    function step(dir) {
      const items = links.map(function (a) { return a.parentElement; });
      const visible = [];
      links.forEach(function (a, i) { if (!items[i] || !items[i].hidden) visible.push(i); });
      if (!visible.length) return;
      let idx = -1;
      links.forEach(function (a, i) { if (a.classList.contains('is-active')) idx = i; });
      let pos = visible.indexOf(idx);
      pos = pos === -1 ? (dir > 0 ? 0 : visible.length - 1) : Math.max(0, Math.min(visible.length - 1, pos + dir));
      links[visible[pos]].click();
    }

    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(document.activeElement)) return;
      if (e.key === ']') { e.preventDefault(); step(1); }
      else if (e.key === '[') { e.preventDefault(); step(-1); }
    });
  })();

  // -- Performance: prefetch internal pages on link hover/focus -----------------
  // A visitor hovering (or keyboard-focusing) a nav or hero link is very likely
  // about to click it. This adds a one-time <link rel="prefetch"> for that page so
  // it's already warm in cache when they do — no HTML changes, and browsers that
  // don't support rel="prefetch" just ignore the tag. Skipped entirely on a
  // metered or slow connection (Save-Data, or a 2G effective type), and only ever
  // fires for a plain same-origin page link — download/new-tab/mailto/tel links
  // and the current page itself are left alone. Idempotent per URL.
  (function navPrefetch() {
    const conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;

    const done = new Set();
    function prefetch(href) {
      if (done.has(href)) return;
      done.add(href);
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }

    function candidate(a) {
      if (!a || !a.href) return null;
      if (a.origin !== location.origin) return null;
      if (a.hasAttribute('download') || a.target === '_blank') return null;
      if (/^(mailto:|tel:)/i.test(a.getAttribute('href') || '')) return null;
      if (a.href === location.href) return null;
      return a.href;
    }

    function onIntent(e) {
      const href = candidate(e.currentTarget);
      if (href) prefetch(href);
    }

    ['.nav__links a', '.nav__mobile a', '.hero__cta a'].forEach(function (sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (a) {
        a.addEventListener('mouseenter', onIntent, { passive: true });
        a.addEventListener('focus', onIntent, { passive: true });
        a.addEventListener('touchstart', onIntent, { passive: true });
      });
    });
  })();

  // ── v20: target flash + offline notice ─────────────────────
  // (1) When a visitor lands on / jumps to a #hash target (deep links, the
  // section rail, the ? shortcuts), briefly outline that element so the eye finds
  // it. Skipped under reduced-motion. (2) Announce going offline/back online via
  // the existing toast. Both idempotent; nothing invented.
  (function targetFlash() {
    if (window.__targetFlash) return;
    window.__targetFlash = true;
    function flash() {
      if (prefersReduced || !location.hash || location.hash.length < 2) return;
      let el = null;
      try { el = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { return; }
      if (!el) return;
      el.classList.remove('target-flash');
      void el.offsetWidth;
      el.classList.add('target-flash');
      setTimeout(function () { el.classList.remove('target-flash'); }, 1800);
    }
    window.addEventListener('hashchange', flash);
    window.addEventListener('load', function () { setTimeout(flash, 300); });
  })();

  (function offlineNotice() {
    window.addEventListener('offline', function () { showToast('You are offline — some links may not load'); });
    window.addEventListener('online', function () { showToast('Back online'); });
  })();

  /* ==================== v21 weekly additions (2026-10-09) ==================== */
  // Tab title nudge: while the tab is hidden the title reads "Still here? ..."
  // and restores the original on return. Idempotent; nothing invented.
  (function awayTitle() {
    if (window.__awayTitle) return;
    window.__awayTitle = true;
    let original = document.title;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        original = document.title;
        document.title = '> still here? \u2014 Anthony Smith';
      } else {
        document.title = original;
      }
    });
  })();

})();
