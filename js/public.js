(function () {
  var SB = 'https://eresamyqxarlrdgudgrw.supabase.co';
  var KEY = 'sb_publishable_VZn5RjVsoRhLhYW87TJY3Q_CrgicMQF';
  var LINES = [
    "Nice try. The ledger hasn't written your name yet.",
    "The book flipped past your page and kept going.",
    "Aldermere likes the look of you. It just has not inked your name.",
    "Your name is still in the bottle. The page turned without it."
  ];

  function bindWaitlist(form, msg, btn) {
    if (!form || !msg || !btn) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = form.querySelector('input[type=email]').value.trim();
      msg.textContent = '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) {
        msg.style.color = 'var(--pink)';
        msg.textContent = "That's not an email. Try again.";
        return;
      }
      btn.disabled = true;
      var company = form.querySelector('[name=company]');
      fetch(SB + '/functions/v1/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: em, company: company ? company.value : '' })
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (j) {
          if (j && j.ok) {
            msg.style.color = 'var(--lime)';
            msg.textContent = j.dupe ? "You're already on the list." : "You're on the list.";
            if (!j.dupe) { try { gtag('event', 'waitlist_join'); } catch (err) {} }
            form.reset();
          } else {
            msg.style.color = 'var(--pink)';
            msg.textContent = 'That did not go through. Try again in a minute.';
          }
        })
        .catch(function () {
          msg.style.color = 'var(--pink)';
          msg.textContent = 'That did not go through. Try again in a minute.';
        })
        .then(function () { btn.disabled = false; });
    });
  }

  bindWaitlist(document.getElementById('wl'), document.getElementById('wlmsg'), document.getElementById('wlbtn'));
  bindWaitlist(document.getElementById('wl2'), document.getElementById('wlmsg2'), document.getElementById('wlbtn2'));

  var dlg = document.getElementById('login');
  if (!dlg) return;
  var lm = document.getElementById('lmsg');
  var client = null;
  try {
    client = window.supabase.createClient(SB, KEY, { auth: { persistSession: true, detectSessionInUrl: true } });
  } catch (e) {}

  function say(t, ok) {
    if (!lm) return;
    lm.textContent = t || '';
    lm.style.color = ok ? 'var(--lime)' : 'var(--pink)';
  }
  function line() { return LINES[Math.floor(Math.random() * LINES.length)]; }
  function reject() {
    say(line());
    if (client) client.auth.signOut();
  }
  function show(tab) {
    var up = tab === 'up';
    document.getElementById('pane-in').hidden = up;
    document.getElementById('pane-up').hidden = !up;
    document.querySelectorAll('.auth-tabs button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-tab') === (up ? 'up' : 'in'));
    });
    document.getElementById('auth-title').textContent = up ? 'Create an account' : 'Sign in';
    say('');
  }
  function open(tab) {
    show(tab || 'in');
    if (dlg.showModal) dlg.showModal();
  }

  document.getElementById('openlogin').onclick = function () { open('in'); };
  document.getElementById('lclose').onclick = function () { dlg.close(); };
  document.querySelectorAll('[data-tab]').forEach(function (b) {
    b.addEventListener('click', function () { show(b.getAttribute('data-tab')); });
  });

  function admit() {
    if (!client) return;
    return client.from('den_allow').select('email').maybeSingle().then(function (q) {
      if (q.data) location.replace('/play');
      else if (!q.error) reject();
      else say('The city is busy. Try again in a moment.');
    });
  }

  document.getElementById('signin').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!client) return say('The city is warming up. Try again in a second.');
    var email = document.getElementById('in-email').value.trim();
    var password = document.getElementById('in-pass').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !password) {
      say('Add your email and password.');
      return;
    }
    client.auth.signInWithPassword({ email: email, password: password }).then(function (r) {
      if (r.error) {
        say(/invalid|credentials|password/i.test(r.error.message || '') ? 'That email and password did not match.' : 'That sign-in did not open. Try again.');
        return;
      }
      return admit();
    });
  });

  function google() {
    if (!client) return say('The city is warming up. Try again in a second.');
    client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + location.pathname }
    }).then(function (r) {
      if (r.error) say('Google did not open. Try again.');
    });
  }
  document.getElementById('g-in').onclick = google;
  document.getElementById('g-up').onclick = google;

  var nameNote = document.getElementById('name-note');
  var nameTimer = 0;
  var nameTaken = false;
  function setName(text, kind) {
    nameNote.textContent = text || '';
    nameNote.className = 'field-note' + (kind ? ' ' + kind : '');
  }
  document.getElementById('up-name').addEventListener('input', function (e) {
    var name = e.target.value.trim();
    nameTaken = false;
    clearTimeout(nameTimer);
    if (name.length < 3 || name.length > 20) {
      setName(name ? 'Use 3 to 20 characters.' : '', name ? 'bad' : '');
      return;
    }
    setName('Checking the book...', '');
    nameTimer = setTimeout(function () {
      if (!client) { setName('', ''); return; }
      client.rpc('os_username_taken', { p_name: name }).then(function (r) {
        if (document.getElementById('up-name').value.trim() !== name) return;
        if (r.error) { setName('', ''); return; }
        nameTaken = !!r.data;
        setName(nameTaken ? 'Someone already carries that name.' : 'That name is open.', nameTaken ? 'bad' : 'ok');
      }).catch(function () { setName('', ''); });
    }, 280);
  });

  var rules = {
    len: function (p) { return p.length >= 8; },
    upper: function (p) { return /[A-Z]/.test(p); },
    lower: function (p) { return /[a-z]/.test(p); },
    num: function (p) { return /\d/.test(p); },
    sym: function (p) { return /[^A-Za-z0-9]/.test(p); }
  };
  function paintRules() {
    var p = document.getElementById('up-pass').value;
    Object.keys(rules).forEach(function (k) {
      document.querySelector('[data-rule="' + k + '"]').classList.toggle('lit', rules[k](p));
    });
    paintMatch();
  }
  function paintMatch() {
    var a = document.getElementById('up-pass').value;
    var b = document.getElementById('up-pass2').value;
    document.getElementById('match').classList.toggle('on', b.length > 0 && a === b);
  }
  document.getElementById('up-pass').addEventListener('input', paintRules);
  document.getElementById('up-pass2').addEventListener('input', paintMatch);

  document.getElementById('create-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('up-name').value.trim();
    var email = document.getElementById('up-email').value.trim();
    var password = document.getElementById('up-pass').value;
    var again = document.getElementById('up-pass2').value;
    if (name.length < 3 || name.length > 20) return say('Use a name of 3 to 20 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return say("That's not an email. Try again.");
    if (!Object.keys(rules).every(function (k) { return rules[k](password); })) return say('The password still has a rule to meet.');
    if (password !== again) return say('Those passwords do not match.');
    if (nameTaken) return say('Someone already carries that name.');
    reject();
  });

  function hashError() {
    var raw = (location.hash || '').replace(/^#/, '') + '&' + (location.search || '').replace(/^\?/, '');
    var p = new URLSearchParams(raw);
    return p.get('error_description') || p.get('error') || '';
  }

  function check() {
    if (!client) return;
    var err = hashError();
    if (err) {
      open('in');
      if (/sign|not allowed|database|hook|deny|user/i.test(err)) reject();
      else say('Google did not open. Try again.');
      return;
    }
    return client.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) return;
      return admit();
    });
  }

  var q = new URLSearchParams(location.search);
  if (q.get('login') === 'up' || q.get('login') === '1' || q.has('denied')) {
    setTimeout(function () {
      open(q.get('login') === 'up' ? 'up' : 'in');
      if (q.has('denied')) reject();
    }, 200);
  }
  check();
})();
