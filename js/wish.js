// The wishlist box: any <form class="wish"> on any page posts an email to the waitlist.
(function () {
  const URL = 'https://eresamyqxarlrdgudgrw.supabase.co/functions/v1/waitlist';
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
          msg.textContent = j.dupe ? 'You are already on the list. Smudge checked twice.' : 'You are on the list. Smudge will write when a seat opens.';
          msg.className = 'wish-msg ok'; f.elements.email.value = '';
          if (window.gtag) gtag('event', 'wishlist_join');
        } else { msg.textContent = j.msg || 'That did not go through. Try again in a minute.'; msg.className = 'wish-msg bad'; }
      } catch (err) { msg.textContent = 'That did not go through. Try again in a minute.'; msg.className = 'wish-msg bad'; }
      btn.disabled = false;
    });
  });
})();
