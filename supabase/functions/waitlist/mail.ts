// Every email OverSummoned sends. One look, four letters: instant access, wishlist welcome (retired), beta invite, note to the owner.
// This file is copied as-is into each function that sends mail (waitlist, beta). Change both together.
export const MAIL_FROM = Deno.env.get('BETA_MAIL_FROM') || 'Smudge at OverSummoned <hello@oversummoned.com>';
export const NOTIFY_TO = Deno.env.get('BETA_NOTIFY_TO') || 'hello@oversummoned.com';
const SITE = 'https://oversummoned.com';
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

type Letter = { subject: string; text: string; html: string };
type Parts = { pre: string; title: string; lines: string[]; button?: [string, string]; note?: [string, string]; small?: string };

const P = (l: string) => `<p style="margin:0 0 14px;font:400 16px/1.6 Georgia,'Times New Roman',serif;color:#4a3520">${l}</p>`;
function frame(p: Parts) {
  const button = p.button ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px"><tr><td bgcolor="#f2b935" style="border-radius:12px;border-bottom:4px solid #b9861a">
<a href="${p.button[1]}" style="display:inline-block;padding:14px 28px;font:700 17px Arial,Helvetica,sans-serif;color:#17224a;text-decoration:none">${p.button[0]}</a></td></tr></table>` : '';
  const note = p.note ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 16px"><tr><td bgcolor="#e4d2a8" style="border-left:5px solid #f2b935;border-radius:8px;padding:14px 16px">
<div style="font:700 12px Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#8a5a12;margin:0 0 4px">${p.note[0]}</div>
<div style="font:400 15px/1.55 Georgia,'Times New Roman',serif;color:#4a3520">${p.note[1]}</div></td></tr></table>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${p.title}</title></head>
<body style="margin:0;padding:0;background:#0e1530">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#0e1530">${p.pre}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0e1530"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px">
<tr><td align="center" bgcolor="#101936" style="border-radius:18px 18px 0 0;padding:18px 0 0">
<a href="${SITE}" style="font:700 13px Arial,Helvetica,sans-serif;letter-spacing:4px;color:#f2b935;text-decoration:none">OVERSUMMONED</a></td></tr>
<tr><td bgcolor="#101936" style="font-size:0;line-height:0"><a href="${SITE}"><img src="${SITE}/assets/mail/header.png" width="560" alt="Smudge the otter, stamping the ledger" style="display:block;width:100%;max-width:560px;height:auto;border:0"></a></td></tr>
<tr><td bgcolor="#f3e6c8" style="border-top:4px solid #f2b935;border-radius:0 0 18px 18px;padding:28px 30px 22px">
<h1 style="margin:0 0 16px;font:700 28px/1.2 Georgia,'Times New Roman',serif;color:#17224a">${p.title}</h1>
${p.lines.map(P).join('')}${button}${note}
${p.small ? `<p style="margin:14px 0 0;font:400 13px/1.5 Arial,Helvetica,sans-serif;color:#8a7a5c">${p.small}</p>` : ''}
<p style="margin:22px 0 0;font:italic 400 16px Georgia,'Times New Roman',serif;color:#4a3520">Smudge<br><span style="font:400 13px Arial,Helvetica,sans-serif;color:#8a7a5c">Apprentice, the Archive. Paws slightly inky.</span></p>
</td></tr>
<tr><td align="center" style="padding:18px 10px 0;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#9aa6c4">
OverSummoned · <a href="${SITE}" style="color:#3fe0c5">oversummoned.com</a> · <a href="https://x.com/OverSummonedHQ" style="color:#3fe0c5">@OverSummonedHQ</a></td></tr>
</table></td></tr></table></body></html>`;
}

export function wishlistMail(): Letter {
  return {
    subject: "You're on the list. Smudge wrote it down twice.",
    text: "You're on the list.\n\nSmudge wrote your name in the ledger, stamped it, and stamped it again to be safe. The ledger has a habit of summoning the wrong people, so he is being careful with you.\n\nOverSummoned is in closed beta. When a seat opens for you, one more email comes to this address with your way in. That is the only thing we will email you about.\n\nWhile you wait, meet the arrivals: https://oversummoned.com/heroes/\n\nWasn't you? Ignore this and nothing else will arrive.\n\nSmudge\nhttps://oversummoned.com",
    html: frame({
      pre: 'One more email when your seat opens. That is the whole deal.', title: "You're on the list.",
      lines: [
        'Smudge wrote your name in the ledger, stamped it, and stamped it again to be safe. The ledger has a habit of summoning the wrong people, so he is being careful with you.',
        'OverSummoned is in closed beta. When a seat opens for you, <b>one more email</b> comes to this address with your way in. That is the only thing we will email you about.'],
      note: ['While you wait', `Meet the people the ledger has dragged out of history so far. <a href="${SITE}/heroes/" style="color:#17224a;font-weight:bold">See the arrivals</a>`],
      small: "Wasn't you? Ignore this and nothing else will arrive.",
    }),
  };
}

// Instant beta access (27 Nov 2026): the landing-page sign-up lets the address straight in, and this is the key.
export function accessMail(to: string): Letter {
  return {
    subject: "You're in. Smudge already unlocked the door.",
    text: "You're in.\n\nNo queue, no waiting list, no velvet rope. Smudge stamped your name into the ledger and the door swung open. He is as surprised as you are.\n\nMake your account here with this email address (" + to + "): https://oversummoned.com/login\nThat address is the one on the list, so use it and the door opens. Any other one and it stays shut.\n\nThen summon your first hero. Fair warning: the ledger has opinions about who turns up.\n\nThis is an early beta. Things will break, the occasional hero will arrive in the wrong century, and you will be one of the first people to find out how. The \"Ideas or feedback?\" button at the top of the game goes straight to the person who makes it.\n\nFounding Clerk: everyone who joins during the beta keeps the title for good.\n\nSmudge\nhttps://oversummoned.com",
    html: frame({
      pre: 'No queue. Your way in is the big gold button.', title: "You're in.",
      lines: [
        'No queue, no waiting list, no velvet rope. Smudge stamped your name into the ledger and the door swung open. He is as surprised as you are.',
        'Make your account with this email address (<b>' + esc(to) + '</b>). It is the one on the list, so it opens the door. Then summon your first hero. Fair warning: the ledger has opinions about who turns up.'],
      button: ['Open the ledger', SITE + '/login'],
      note: ['Early beta, early bugs', 'Things will break, and you will be one of the first to find out how. The <b>Ideas or feedback?</b> button at the top of the game goes straight to the person who makes it. Everyone who joins now keeps the Founding Clerk title for good.'],
      small: "Wasn't you? Ignore this. Nothing happens unless someone makes an account with this address.",
    }),
  };
}

export function inviteMail(to: string): Letter {
  return {
    subject: 'Your seat in OverSummoned is open',
    text: "Your seat is open.\n\nSmudge found your name in the ledger and, against the odds, summoned the right person.\n\nMake your account at https://oversummoned.com/login using this email address (" + to + "). It is the one on the list, so a different address will not get in.\n\nYou are one of the first people in, so things will break. The \"Ideas or feedback?\" button at the top of the game goes straight to the person who makes it.\n\nFounding Clerk: everyone who joins during the beta keeps the title for good.\n\nSmudge\nhttps://oversummoned.com",
    html: frame({
      pre: 'Smudge summoned the right person for once. Come in.', title: 'Your seat is open.',
      lines: [
        'Smudge found your name in the ledger and, against the odds, summoned the right person.',
        'Make your account with this email address (<b>' + esc(to) + '</b>). It is the one on the list, so a different address will not get in.'],
      button: ['Claim your seat', SITE + '/login'],
      note: ['Founding Clerk', 'Everyone who joins during the beta keeps the title for good.'],
      small: 'You are one of the first people in, so things will break. The <b>Ideas or feedback?</b> button at the top of the game goes straight to the person who makes it.',
    }),
  };
}

export function ownerMail(email: string): Letter {
  return {
    subject: 'New beta player: ' + email,
    text: email + ' signed up for instant beta access and was let straight in.\n\nSee them in https://oversummoned.com/admin (Beta tab).',
    html: frame({ pre: 'A new name in the ledger.', title: 'New beta player', lines: ['<b>' + esc(email) + '</b> signed up for instant beta access and was let straight in. They have their key by email.'], button: ['Open the Beta tab', SITE + '/admin'] }),
  };
}

// A missing key or a failed send never breaks the request: it is reported, not thrown.
export async function sendMail(to: string, l: Letter): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) { console.error('mail not sent: RESEND_API_KEY is not set'); return false; }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [to], reply_to: 'hello@oversummoned.com', subject: l.subject, text: l.text, html: l.html }),
    });
    if (!r.ok) { console.error('mail not sent:', r.status, (await r.text()).slice(0, 300)); return false; }
    return true;
  } catch (e) { console.error('mail not sent:', String(e)); return false; }
}
