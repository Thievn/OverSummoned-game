// The wishlist box: any <form class="wish"> on any page posts an email to the waitlist.
(function () {
  const URL = 'https://eresamyqxarlrdgudgrw.supabase.co/functions/v1/waitlist';
  const NEW = ['Smudge wrote your name down, stamped it, and stamped it again in case the first one was cursed.',
    'Your name is in the ledger. Nobody was summoned by accident this time. Probably.',
    'Stamped and filed. Smudge only dropped the ledger once.'];
  // the form turns into a stamped receipt, so nobody wonders whether it went through
  function done(f, email, dupe, mailed) {
    const d = document.createElement('div'); d.className = 'wish-done'; d.setAttribute('role', 'status');
    const b = document.createElement('b'); b.className = 'wish-stamp'; b.textContent = dupe ? 'Already filed' : 'Filed';
    const h = document.createElement('strong'); h.textContent = dupe ? 'You were already on the list.' : 'You are on the list.';
    const p = document.createElement('p'); p.textContent = dupe ? 'Smudge checked twice. Keen, though. He respects that.' : NEW[Math.floor(Math.random() * NEW.length)];
    const q = document.createElement('p'); q.className = 'wish-sub';
    q.textContent = dupe || !mailed ? 'Your seat email will come to ' + email + ' when one opens.' : 'A note from Smudge is on its way to ' + email + '. If it is not there in a minute, check spam.';
    d.append(b, h, p, q); f.replaceWith(d);
    try { if (window.OSSound) { OSSound.unlock(); OSSound.play('stamp'); } } catch (e) {}
  }
  document.querySelectorAll('form.wish').forEach(f => {
    const msg = f.querySelector('.wish-msg'), btn = f.querySelector('button');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const email = (f.elements.email.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'That does not look like an email address.'; msg.className = 'wish-msg bad'; return; }
      btn.disabled = true; msg.textContent = 'Writing your name down…'; msg.className = 'wish-msg';
      try {
        const r = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, company: f.elements.company.value }) });
        const j = await r.json().catch(() => ({}));
        if (j.ok) {
          done(f, email, !!j.dupe, j.mailed !== false);
          if (window.gtag) gtag('event', 'wishlist_join');
          return;
        } else { msg.textContent = j.msg || 'That did not go through. Try again in a minute.'; msg.className = 'wish-msg bad'; }
      } catch (err) { msg.textContent = 'That did not go through. Try again in a minute.'; msg.className = 'wish-msg bad'; }
      btn.disabled = false;
    });
  });
})();
