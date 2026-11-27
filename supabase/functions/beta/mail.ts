// Every email OverSummoned sends, all written by Smudge: the beta invite, patch notes, a note to the owner.
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
<tr><td bgcolor="#101936" style="font-size:0;line-height:0"><a href="${SITE}"><img src="${SITE}/assets/mail/header.png" width="560" alt="Smudge the otter at his desk" style="display:block;width:100%;max-width:560px;height:auto;border:0"></a></td></tr>
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

// The beta invite: sent the moment someone signs up on the landing page. Smudge writes it, in the first person.
export function accessMail(to: string): Letter {
  return {
    subject: 'Your OverSummoned beta invite',
    text: "You're in.\n\nSmudge here. I'm the apprentice who keeps summoning the wrong heroes, and I have just put your name on the beta list. In ink, so it is staying.\n\nMake your account here, with this email address (" + to + "): https://oversummoned.com/login\nIt is the address I wrote down, so it is the one that gets you in.\n\nYou are one of the first players, which means you keep the Founding Clerk title for good. I do not hand those out twice.\n\nFair warning: this is a closed beta, so things will break. Some of it will be my fault. When something goes wrong, or you have an idea, press \"Ideas or feedback?\" at the top of the game. Every note is read and written down, so nothing gets lost and we can get back to you.\n\nSee you inside.\n\nSmudge\nhttps://oversummoned.com\n\nWasn't you? Ignore this and nothing happens.",
    html: frame({
      pre: 'Smudge put your name on the list. Your way in is inside.', title: "You're in.",
      lines: [
        "Smudge here. I'm the apprentice who keeps summoning the wrong heroes, and I have just put your name on the beta list. In ink, so it is staying.",
        'Make your account with this email address (<b>' + esc(to) + '</b>). It is the one I wrote down, so it is the one that gets you in.',
        'You are one of the first players, which means you keep the <b>Founding Clerk</b> title for good. I do not hand those out twice.'],
      button: ['Make my account', SITE + '/login'],
      note: ['Fair warning', 'This is a closed beta, so things will break. Some of it will be my fault. When something goes wrong, or you have an idea, press <b>Ideas or feedback?</b> at the top of the game. Every note is read and written down, so nothing gets lost and we can get back to you.'],
      small: "Wasn't you? Ignore this and nothing happens.",
    }),
  };
}

// The same invite, sent by hand from the owner's office.
export function inviteMail(to: string): Letter { return accessMail(to); }

// Patch notes, for players who ticked "email me updates" in their account. Never sent to anyone else.
export function notesMail(n: { v: string; title?: string; added?: string[]; fixed?: string[]; known?: string[] }): Letter {
  const sec = (h: string, a?: string[]) => (a && a.length ? [h, ...a.map((x) => '  - ' + x), ''] : []);
  const hs = (h: string, a?: string[]) => (a && a.length ? `<b>${h}</b><br>` + a.map((x) => '&bull; ' + esc(x)).join('<br>') : '');
  const body = [hs('New', n.added), hs('Fixed', n.fixed), hs('Still on my list', n.known)].filter(Boolean);
  return {
    subject: 'OverSummoned beta ' + n.v + ': what changed',
    text: ['Beta ' + n.v + (n.title ? ': ' + n.title : ''), '', 'Smudge here, with the short version of what changed.', '', ...sec('New', n.added), ...sec('Fixed', n.fixed), ...sec('Still on my list', n.known),
      'Play: https://oversummoned.com/play', '', 'Smudge', '', 'You get these because you ticked "Email me updates" in your account. Untick it there any time: https://oversummoned.com/play#account'].join('\n'),
    html: frame({
      pre: 'The short version of what changed.', title: 'Beta ' + esc(n.v) + (n.title ? ': ' + esc(n.title) : ''),
      lines: ['Smudge here, with the short version of what changed.', ...body],
      button: ['Play', SITE + '/play'],
      small: `You get these because you ticked <b>Email me updates</b> in your account. <a href="${SITE}/play#account" style="color:#8a7a5c">Untick it there</a> any time.`,
    }),
  };
}

export function ownerMail(email: string): Letter {
  return {
    subject: 'New beta player: ' + email,
    text: email + ' signed up for the beta and Smudge sent the invite.\n\nSee them in https://oversummoned.com/admin (Beta tab).',
    html: frame({ pre: 'A new name on the list.', title: 'New beta player', lines: ['<b>' + esc(email) + '</b> signed up for the beta. Smudge sent the invite.'], button: ['Open the Beta tab', SITE + '/admin'] }),
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
