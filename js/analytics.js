// Public-page analytics for OverSummoned. Event delegation so new card,
// lightbox and gear markup still counts. Never send emails or names.
(function () {
  'use strict';

  function track(name, params) {
    try {
      if (typeof gtag !== 'function') return;
      var safe = {};
      if (params && typeof params === 'object') {
        Object.keys(params).forEach(function (key) {
          if (/email|name|user|pass|phone/i.test(key)) return;
          var val = params[key];
          if (val == null || val === '') return;
          if (typeof val === 'string') {
            if (val.indexOf('@') !== -1 || val.length > 80) return;
          }
          safe[key] = val;
        });
      }
      gtag('event', name, safe);
    } catch (err) {}
  }

  function closest(el, sel) {
    try {
      if (!el || el.nodeType !== 1) el = el && el.parentElement;
      if (!el || !el.closest) return null;
      return el.closest(sel);
    } catch (err) {
      return null;
    }
  }

  var lastName = '';
  var lastKey = '';
  var lastAt = 0;
  function once(name, key) {
    var now = Date.now();
    if (name === lastName && key === lastKey && now - lastAt < 400) return false;
    lastName = name;
    lastKey = key;
    lastAt = now;
    return true;
  }

  function hrefOf(el) {
    try {
      if (!el) return '';
      var raw = el.getAttribute('href') || '';
      return raw;
    } catch (err) {
      return '';
    }
  }

  function storyHref(href) {
    if (!href) return false;
    try {
      if (href.charAt(0) === '#') return false;
      var url = new URL(href, location.href);
      var path = (url.pathname || '').replace(/\/$/, '') || '/';
      return path === '/story' || path === '/story.html';
    } catch (err) {
      return false;
    }
  }

  document.addEventListener('click', function (e) {
    try {
      var t = e.target;
      if (!t) return;

      var login = closest(t, '#openlogin, [data-open-login], [data-act="login"]');
      if (login && once('login_click', 'login')) {
        track('login_click');
        return;
      }

      var google = closest(t, '#g-in, #g-up, .g-auth, [data-provider="google"], [data-act="google"]');
      if (google && once('google_sign_in', 'google')) {
        track('google_sign_in');
        return;
      }

      var story = closest(t, 'a[href]');
      if (story && storyHref(hrefOf(story)) && once('story_open', hrefOf(story))) {
        track('story_open');
        return;
      }

      var gear = closest(t, [
        '[data-gear]',
        '[data-act="gear"]',
        '[data-gear-toggle]',
        '.gear-toggle',
        '.gear-btn',
        '.gear-icon',
        '.gear-switch',
        'button.gear',
        '[aria-controls*="gear" i]',
        '[aria-label*="gear" i]'
      ].join(','));
      if (gear && once('gear_toggle', 'gear')) {
        track('gear_toggle');
        return;
      }

      var inOpenLightbox = closest(t, '.lightbox.is-open, .lightbox.open, dialog.lightbox[open], #lightbox.is-open, #lightbox.open, .lb-overlay, .lightbox-overlay');
      var lightboxClose = closest(t, '.lightbox-close, [data-lightbox-close], [data-close="lightbox"], .lb-close, .lb-x');
      var shot = closest(t, [
        '[data-lightbox]',
        '[data-open-lightbox]',
        '[data-shot]',
        '.lightbox-trigger',
        '.shot-open',
        '.screenshot-open',
        '.shot-plus',
        '.plus-shot',
        'button.plus',
        'a.plus',
        'figure.frame',
        'figure.shot',
        'figure.screenshot',
        '.screenshot',
        '.shot-thumb'
      ].join(','));
      if (shot && !lightboxClose && !inOpenLightbox && once('screenshot_open', 'shot')) {
        track('screenshot_open');
        return;
      }

      var flipCtl = closest(t, '[data-act="flip"], [data-flip], [data-card-flip], .card-flip, .flip-btn, .flip-toggle, .flip-card, button.flip');
      var card = closest(t, '.card, .cardback, .mini-card, .hero-card, .card-3d, .card-wrap, .card-stage');
      if ((flipCtl || card) && once('card_flip', 'card')) {
        track('card_flip');
        return;
      }

      var summon = closest(t, '[data-act="summon"], [data-summon], button.summon');
      if (summon && once('summon', 'summon')) {
        track('summon');
        return;
      }

      var link = closest(t, 'a[href]');
      if (link) {
        var href = hrefOf(link);
        if (href && /^(https?:)?\/\//i.test(href)) {
          try {
            var url = new URL(href, location.href);
            if (url.hostname && url.hostname !== location.hostname && once('click', url.hostname + url.pathname)) {
              track('click', {
                event_category: 'outbound',
                link_domain: url.hostname,
                link_url: url.origin + url.pathname
              });
            }
          } catch (err) {}
        }
      }
    } catch (err) {}
  });

  document.addEventListener('submit', function (e) {
    try {
      var form = e.target;
      if (!form || form.nodeType !== 1) return;
      var id = form.id || '';
      var isWaitlist = id === 'wl' || id === 'wl2' || id === 'waitlist' ||
        (form.classList && form.classList.contains('wl')) ||
        closest(form, 'form.wl');
      if (isWaitlist && once('waitlist_submit', id || 'wl')) {
        track('waitlist_submit', { form_id: id || 'wl' });
      }
    } catch (err) {}
  });
})();
