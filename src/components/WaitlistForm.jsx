import { useEffect, useId, useState } from 'react';
import art from 'virtual:art';
import { readOrigin } from '../originStore.js';

const COPY = {
  invalid: 'That address would not survive a raven, let alone a mail server.',
  rate: 'Easy. The Overflow only lands once a week.',
  down: 'The inkwell jammed. Give it a second and try again.',
  method: 'The inkwell jammed. Give it a second and try again.',
  ok: 'Filed. Do not wait by the circle. It does not know your name yet.',
};

export function WaitlistForm({ idPrefix = 'wait' }) {
  const fieldId = useId();
  const honeyId = useId();
  const [email, setEmail] = useState('');
  const [origin, setOrigin] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [fax, setFax] = useState('');

  useEffect(() => {
    const sync = () => setOrigin(readOrigin());
    sync();
    window.addEventListener('oversummoned-origin', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('oversummoned-origin', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const originTitle = origin ? art.characters[origin]?.title : '';

  async function onSubmit(event) {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setMessage('');
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          origin,
          referrer: document.referrer || '',
          fax_number: fax,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.ok) {
        setStatus('ok');
        setMessage(COPY.ok);
        return;
      }
      const key = payload.error && COPY[payload.error] ? payload.error : 'down';
      setStatus('error');
      setMessage(COPY[key]);
    } catch {
      setStatus('error');
      setMessage(COPY.down);
    }
  }

  if (status === 'ok') {
    return (
      <div className="filed" role="status">
        <span className="seal" aria-hidden="true">Filed</span>
        <p>{message}</p>
        {originTitle ? <p className="filed-as">Under: {originTitle}.</p> : null}
      </div>
    );
  }

  return (
    <form className="waitlist" onSubmit={onSubmit} noValidate>
      <label htmlFor={`${idPrefix}-${fieldId}`}>Where should the Hero Office send the bad news?</label>
      <div className="waitlist-row">
        <input
          id={`${idPrefix}-${fieldId}`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={320}
          required
          placeholder="you@whereveryouwere"
          value={email}
          aria-invalid={status === 'error'}
          aria-describedby={message ? `${idPrefix}-status` : undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === 'error') setStatus('idle');
          }}
        />
        <button className="btn btn-gold" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Filing…' : 'Put me on the list'}
        </button>
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor={`${idPrefix}-${honeyId}`}>Fax</label>
        <input
          id={`${idPrefix}-${honeyId}`}
          name="fax_number"
          tabIndex={-1}
          autoComplete="off"
          value={fax}
          onChange={(event) => setFax(event.target.value)}
        />
      </div>
      {originTitle ? <p className="filing">Filing under {originTitle}.</p> : null}
      {message ? (
        <p id={`${idPrefix}-status`} className="form-status" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
