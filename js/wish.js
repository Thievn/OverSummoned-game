// The beta sign-up box: any <form class="wish"> on any page posts an email, and Smudge's invite goes straight out.
(function () {
  const URL = 'https://eresamyqxarlrdgudgrw.supabase.co/functions/v1/waitlist';
  const NEW = ['Smudge just sent your invite. He ran the whole way to the post box.',
    'Your invite is on its way. Smudge says hello, and sorry in advance.',
    'Smudge wrote your name down, stamped it, and only got a little ink on himself.'];
  // the form turns into a stamped ticket with the way in on it, so nobody wonders whether it went through
  function done(f, email, dupe, mailed) {
    const d = document.createElement('div'); d.className = 'wish-done'; d.setAttribute('role', 'status');
    const b = document.createElement('b'); b.className = 'wish-stamp'; b.textContent = dupe ? 'Already in' : 'Invited';
    const h = document.createElement('strong'); h.textContent = dupe ? 'You are already on Smudge\'s list.' : 'You are in the beta.';
    const p = document.createElement('p'); p.textContent = dupe ? 'No need to sign up twice. Smudge remembers you. Go and make your account.' : NEW[Math.floor(Math.random() * NEW.length)];
    const go = document.createElement('a'); go.className = 'btn'; go.href = '/login'; go.textContent = 'Make your account';
    const q = document.createElement('p'); q.className = 'wish-sub';
    q.textContent = 'Sign up with ' + email + '. ' + (mailed && !dupe ? 'It is the address Smudge has on his list. No email in a minute? Check spam.' : 'It is the address Smudge has on his list.');
    d.append(b, h, p, go, q); f.replaceWith(d);
    try { if (window.OSSound) { OSSound.unlock(); OSSound.play('stamp'); } } catch (e) {}
  }
  document.querySelectorAll('form.wish').forEach(f => {
    const msg = f.querySelector('.wish-msg'), btn = f.querySelector('button'), where = f.dataset.where || location.pathname;
    const track = (name, extra) => { try { if (window.gtag) gtag('event', name, Object.assign({ method: 'beta_form', where }, extra || {})); } catch (e) {} };
    btn.addEventListener('click', () => track('invite_click'));
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const email = (f.elements.email.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'That does not look like an email address.'; msg.className = 'wish-msg bad'; return; }
      btn.disabled = true; msg.textContent = 'Sending your invite…'; msg.className = 'wish-msg';
      try {
        const r = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, company: f.elements.company.value }) });
        const j = await r.json().catch(() => ({}));
        if (j.ok) {
          done(f, email, !!j.dupe, j.mailed !== false);
          track('sign_up', { dupe: !!j.dupe });
          try { if (window.gtag) gtag('event', 'beta_signup'); } catch (e) {}
          return;
        } else { msg.textContent = j.msg || 'That did not go through. Try again in a minute.'; msg.className = 'wish-msg bad'; }
      } catch (err) { msg.textContent = 'That did not go through. Try again in a minute.'; msg.className = 'wish-msg bad'; }
      btn.disabled = false;
    });
  });
})();
