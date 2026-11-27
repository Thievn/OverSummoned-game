// The beta sign-up box: any <form class="wish"> on any page posts an email, and the address is let straight in.
(function () {
  const URL = 'https://eresamyqxarlrdgudgrw.supabase.co/functions/v1/waitlist';
  const NEW = ['Smudge stamped your name into the ledger and the door swung open. He looks as surprised as you.',
    'The ledger has accepted you. It did not summon anything by accident this time. Probably.',
    'Stamped, filed, and let in. Smudge only dropped the ledger once.'];
  // the form turns into a stamped ticket with the way in on it, so nobody wonders whether it went through
  function done(f, email, dupe, mailed) {
    const d = document.createElement('div'); d.className = 'wish-done'; d.setAttribute('role', 'status');
    const b = document.createElement('b'); b.className = 'wish-stamp'; b.textContent = dupe ? 'Still in' : 'You\'re in';
    const h = document.createElement('strong'); h.textContent = dupe ? 'You already have a key.' : 'Welcome to the beta.';
    const p = document.createElement('p'); p.textContent = dupe ? 'Smudge checked twice. The door is open for you. Come on in.' : NEW[Math.floor(Math.random() * NEW.length)];
    const go = document.createElement('a'); go.className = 'btn'; go.href = '/login'; go.textContent = 'Make your account';
    const q = document.createElement('p'); q.className = 'wish-sub';
    q.textContent = 'Use ' + email + ' to sign up. ' + (mailed && !dupe ? 'Your key is in your inbox too. If it is not there in a minute, check spam.' : 'That address is the one on the list, so it opens the door.');
    d.append(b, h, p, go, q); f.replaceWith(d);
    try { if (window.OSSound) { OSSound.unlock(); OSSound.play('stamp'); } } catch (e) {}
  }
  document.querySelectorAll('form.wish').forEach(f => {
    const msg = f.querySelector('.wish-msg'), btn = f.querySelector('button');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const email = (f.elements.email.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'That does not look like an email address.'; msg.className = 'wish-msg bad'; return; }
      btn.disabled = true; msg.textContent = 'Unlocking the door…'; msg.className = 'wish-msg';
      try {
        const r = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, company: f.elements.company.value }) });
        const j = await r.json().catch(() => ({}));
        if (j.ok) {
          done(f, email, !!j.dupe, j.mailed !== false);
          if (window.gtag) gtag('event', 'beta_signup');
          return;
        } else { msg.textContent = j.msg || 'That did not go through. Try again in a minute.'; msg.className = 'wish-msg bad'; }
      } catch (err) { msg.textContent = 'That did not go through. Try again in a minute.'; msg.className = 'wish-msg bad'; }
      btn.disabled = false;
    });
  });
})();
