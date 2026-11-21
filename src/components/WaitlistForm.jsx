import { useState } from 'react';
import { adults, form, join, spam } from '../copy.js';

const errors = {
  invalid: form.invalid,
  rate: form.rate,
  down: form.down,
};

export default function WaitlistForm({ id }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    if (status === 'saving') return;
    const data = new FormData(event.currentTarget);
    setStatus('saving');
    setMessage('');
    try {
      const response = await fetch('/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.get('email'),
          fax_number: data.get('fax_number') || '',
          referrer: window.location.href,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.ok) {
        setStatus('done');
        setMessage(form.success);
        return;
      }
      setStatus('error');
      setMessage(errors[body.error] || form.down);
    } catch {
      setStatus('error');
      setMessage(form.down);
    }
  }

  if (status === 'done') {
    return (
      <p className="form-note ok" role="status">
        {message}
      </p>
    );
  }

  return (
    <form className="waitlist" onSubmit={onSubmit} noValidate={false}>
      <div className="hp" aria-hidden="true">
        <label htmlFor={`${id}-fax`}>{form.fax}</label>
        <input id={`${id}-fax`} name="fax_number" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor={id}>{form.email}</label>
        <input
          id={id}
          name="email"
          type="email"
          required
          maxLength={320}
          autoComplete="email"
          inputMode="email"
          spellCheck="false"
          placeholder={form.placeholder}
        />
      </div>
      <button className="btn" type="submit" disabled={status === 'saving'}>
        {status === 'saving' ? form.sending : join}
      </button>
      <p className="form-note">{spam}</p>
      <p className="form-note">{adults}</p>
      {message && (
        <p className="form-note error" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
