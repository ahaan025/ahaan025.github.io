/* ════════════════════════════════════════════════
   site.js — shared behaviour for every page.
   1. Live BLR / PVD clocks
   2. Light / dark theme with a remembered choice
   3. Hover link previews in a mac-window card
   ════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Work out where the site root is, so this file works
     from /index.html and from /thoughts/a-post.html alike. */
  var me = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();
  var BASE = me && me.src ? me.src.replace(/site\.js(\?.*)?$/, '') : '';

  /* ── 1. CLOCKS ───────────────────────────────── */
  function initClocks() {
    var el = document.querySelector('.clocks');
    if (!el) return;

    var zones = [
      { label: 'BLR', tz: 'Asia/Kolkata'     },
      { label: 'PVD', tz: 'America/New_York' }
    ];

    var rows = zones.map(function (z) {
      var row = document.createElement('div');
      row.className = 'clock-row';
      row.innerHTML = '<span class="zone">' + z.label + '</span><span class="t"></span>';
      el.appendChild(row);
      return { z: z, node: row.querySelector('.t') };
    });

    function tick() {
      rows.forEach(function (r) {
        var t;
        try {
          t = new Intl.DateTimeFormat('en-US', {
            timeZone: r.z.tz, hour: 'numeric', minute: '2-digit',
            second: '2-digit', hour12: true
          }).format(new Date());
        } catch (e) {
          t = '';                       /* very old browser: just stay blank */
        }
        r.node.textContent = t;
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ── 2. THEME ────────────────────────────────── */
  function initTheme() {
    var root = document.documentElement;
    var btn  = document.querySelector('[data-theme-toggle]');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var prefersDark = window.matchMedia &&
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
      var current = root.getAttribute('data-theme') || (prefersDark ? 'dark' : 'light');
      var next    = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      btn.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title', next === 'dark' ? 'Light mode' : 'Dark mode');
    });
  }

  /* ── 3. HOVER PREVIEWS ───────────────────────── */
  /* Each entry: the address bar text, plus the words shown
     if assets/previews/<key>.jpg isn't there yet.          */
  /* Each entry: the address bar text, the words shown if no
     image resolves, and optionally `remote` — the site's own
     Open Graph image, used when no local screenshot exists.
     Drop assets/previews/<key>.jpg in and it wins over both. */
  var PREVIEWS = {
    github:   { url: 'github.com/ahaan025',          title: 'ahaan025',         sub: 'Repositories, commits, and things in progress.',
                remote: 'https://opengraph.githubassets.com/1/ahaan025' },
    linkedin: { url: 'linkedin.com/in/ahaan-mehta',  title: 'Ahaan Mehta',      sub: 'Brown University. Software engineering.' },
    substack: { url: 'substack.com/@ahaan025',       title: 'Notes',            sub: 'Short writing, published as it happens.',
                remote: 'https://substackcdn.com/image/fetch/$s_!37hi!,f_auto,q_auto:best,fl_progressive:steep/https%3A%2F%2Fsubstack.com%2Fapi%2Fv1%2Fprofile%2Fassets%2F389759764%2Flight%3FaspectRatio%3Dlink%26version%3D1' },
    resume:   { url: 'ahaan_mehta_resume.pdf',       title: 'R\u00e9sum\u00e9', sub: 'One page. Updated September 2026.' },
    dex:      { url: 'getdex.com',                   title: 'Dex',              sub: 'YC S19. A personal CRM for your relationships.',
                remote: 'https://getdex.com/dex_preview.png' },
    trex:     { url: 't-rexsat.com',                 title: 'T-REX',            sub: 'Time-resolved X-ray observation from low-Earth orbit.',
                remote: 'https://cdn.b12.io/client_media/PDpwHsnx/29348ff8-79ae-11f0-a6a5-0242ac110002-png-og_image.png' },
    r42:      { url: 'r42group.com',                 title: 'R42 Group',        sub: 'Venture fund investing in AI and longevity.',
                remote: 'https://static.wixstatic.com/media/045d1b_30f4ac4874804b42ade48c272c691925~mv2.png/v1/fit/w_2500,h_1330,al_c/045d1b_30f4ac4874804b42ade48c272c691925~mv2.png' },
    ccir:     { url: 'cambridge-research.org',       title: 'CCIR',             sub: 'Cambridge Centre for International Research.' },
    brown:    { url: 'brown.edu',                    title: 'Brown University', sub: 'Providence, Rhode Island. Class of 2028.',
                remote: 'https://www.brown.edu/sites/default/files/2026-01/20211110-ADV-campusphotos-035-1_0.jpg' },
    othello:  { url: 'othello-ai.netlify.app',       title: 'Othello AI',       sub: 'Minimax agent with recursive game-tree search.' },
    geodesic: { url: 'github.com/ahaan025/geodesic', title: 'Geodesic',         sub: 'Tracing light through curved spacetime, in Python.' },
    website:  { url: 'ahaan025.github.io',           title: 'This site',        sub: 'Static HTML and CSS. No framework, no build step.' }
  };


  function initPreviews() {
    /* Pointer-less devices get nothing — no card, no work. */
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var targets = document.querySelectorAll('[data-preview]');
    if (!targets.length) return;

    var card = document.createElement('div');
    card.className = 'preview-card';
    card.setAttribute('aria-hidden', 'true');
    document.body.appendChild(card);

    var showTimer = null, hideTimer = null, activeKey = null;

    function build(key) {
      var d = PREVIEWS[key];
      if (!d) return false;
      card.innerHTML =
        '<div class="pc-chrome">' +
          '<div class="pc-dots">' +
            '<span style="background:#ff5f57"></span>' +
            '<span style="background:#febc2e"></span>' +
            '<span style="background:#28c840"></span>' +
          '</div>' +
          '<div class="pc-url">' + d.url + '</div>' +
        '</div>' +
        '<div class="pc-body">' +
          '<div class="pc-fallback">' +
            '<div class="pc-title">' + d.title + '</div>' +
            '<div class="pc-sub">' + d.sub + '</div>' +
            '<div class="pc-host">' + d.url.split('/')[0] + '</div>' +
          '</div>' +
        '</div>';

      /* Try the local screenshot first, then the site's own OG
         image. Only swap once something has actually loaded, so a
         missing file never flashes a broken image. */
      var body = card.querySelector('.pc-body');
      var sources = [BASE + 'assets/previews/' + key + '.jpg'];
      if (d.remote) sources.push(d.remote);

      (function attempt(i) {
        if (i >= sources.length) return;
        var img = new Image();
        img.onload = function () {
          if (activeKey !== key) return;
          body.innerHTML = '';
          body.appendChild(img);
        };
        img.onerror = function () { attempt(i + 1); };
        img.alt = '';
        img.referrerPolicy = 'no-referrer';
        img.src = sources[i];
      })(0);

      return true;
    }

    function place(el) {
      var r = el.getBoundingClientRect();
      var w = 300, h = card.offsetHeight || 200, gap = 14;

      var left = r.left + r.width / 2 - w / 2;
      left = Math.max(12, Math.min(left, window.innerWidth - w - 12));

      var top = r.bottom + gap;
      if (top + h > window.innerHeight - 12) {
        top = r.top - h - gap;                 /* flip above when it won't fit */
        if (top < 12) top = Math.max(12, window.innerHeight - h - 12);
      }
      card.style.left = left + 'px';
      card.style.top  = top + 'px';
    }

    function show(el) {
      var key = el.getAttribute('data-preview');
      clearTimeout(hideTimer);
      showTimer = setTimeout(function () {
        activeKey = key;
        if (!build(key)) return;
        place(el);
        card.classList.add('is-visible');
        place(el);                             /* re-place once height is known */
      }, 140);
    }

    function hide() {
      clearTimeout(showTimer);
      hideTimer = setTimeout(function () {
        card.classList.remove('is-visible');
        activeKey = null;
      }, 80);
    }

    Array.prototype.forEach.call(targets, function (el) {
      el.addEventListener('mouseenter', function () { show(el); });
      el.addEventListener('mouseleave', hide);
      el.addEventListener('focus', function () { show(el); });
      el.addEventListener('blur', hide);
    });
    window.addEventListener('scroll', hide, { passive: true });
  }


  /* ── 4. WORLD MAP ─────────────────────────────
     Coastlines from assets/world.js, with the day/night
     terminator computed from the sun's position right now.
     No markers: it is a background, not a diagram. */
  /* Low-precision solar position (NOAA). Returns the declination
     and the longitude the sun is directly over, both in degrees. */
  function subsolar(date) {
    var rad = Math.PI / 180;
    var d = (date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;
    var g = (357.529 + 0.98560028 * d) * rad;
    var q = 280.459 + 0.98564736 * d;
    var L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad;
    var e = (23.439 - 0.00000036 * d) * rad;
    var dec = Math.asin(Math.sin(e) * Math.sin(L)) / rad;
    var ra  = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad;
    var gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    var lon = (((ra - gmst * 15) % 360) + 540) % 360 - 180;
    return { dec: dec, lon: lon };
  }

  /* The terminator is every point 90 degrees from the subsolar
     point. Per meridian that is one latitude, so the night side
     is that curve closed off against whichever pole is dark. */
  function terminator(sun) {
    var rad = Math.PI / 180, pts = [], lam, phi;
    for (var i = 0; i <= 360; i++) {
      lam = -180 + i;
      phi = Math.atan2(-Math.cos((lam - sun.lon) * rad), Math.tan(sun.dec * rad)) / rad;
      pts.push([(lam + 180).toFixed(2), (90 - phi).toFixed(2)]);
    }
    var line = 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    var darkY = sun.dec > 0 ? 180 : 0;      /* y of the unlit pole */
    return { line: line, night: line + ' L360,' + darkY + ' L0,' + darkY + ' Z' };
  }

  function initWorldMap() {
    if (!window.WORLD_LAND) return;        /* data file missing: no map */

    var layer = document.createElement('div');
    layer.className = 'worldmap';
    layer.setAttribute('aria-hidden', 'true');


    layer.innerHTML =
      '<svg viewBox="0 8 360 136" preserveAspectRatio="xMidYMid slice">' +
        '<path class="wm-land" d="' + window.WORLD_LAND + '"/>' +
        '<path class="wm-night" d=""/>' +
        '<path class="wm-term"  d=""/>' +
      '</svg>';
    document.body.insertBefore(layer, document.body.firstChild);

    var night = layer.querySelector('.wm-night');
    var term  = layer.querySelector('.wm-term');

    function paint() {
      var t = terminator(subsolar(new Date()));
      night.setAttribute('d', t.night);
      term.setAttribute('d', t.line);
    }
    paint();
    setInterval(paint, 120000);
  }

  /* The coastline data is big and only the map needs it, so it
     loads on its own rather than blocking the page. */
  function loadWorld(done) {
    var el = document.createElement('script');
    el.src = BASE + 'assets/world.js';
    el.async = true;
    el.onload = done;
    el.onerror = function () {};           /* no map, no harm */
    document.head.appendChild(el);
  }

  function init() {
    initClocks();
    loadWorld(initWorldMap);
    initTheme();
    initPreviews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
