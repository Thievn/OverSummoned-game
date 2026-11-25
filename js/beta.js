// Sign-in page: a beta code puts your email on the list, then you make your account as usual.
(function () {
  const f = document.getElementById('f-code'); if (!f) return;
  const $ = id => document.getElementById(id), err = $('bc-err');
  f.addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = ''; err.classList.remove('ok');
    const email = $('bc-email').value.trim(), code = $('bc-code').value.trim(), b = f.querySelector('button');
    if (!email || !code) { err.textContent = 'Both, please: the email and the code.'; return; }
    b.disabled = true;
    try {
      const r = await fetch('https://eresamyqxarlrdgudgrw.supabase.co/functions/v1/beta', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: 'redeem', email, code, company: $('bc-co').value }) });
      const j = await r.json().catch(() => ({}));
      if (j.ok) {
        err.classList.add('ok'); err.textContent = 'You are on the list. Now create your account with that email.';
        const up = document.querySelector('.seg button[data-t="up"]'); if (up) up.click();
        const ue = $('up-email'); if (ue) { ue.value = email; ue.dispatchEvent(new Event('input', { bubbles: true })); }
      } else err.textContent = j.msg || 'That did not work. Try again in a minute.';
    } catch (x) { err.textContent = 'That did not work. Try again in a minute.'; }
    b.disabled = false;
  });
})();
