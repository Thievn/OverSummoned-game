/**
 * Waitlist
 * --------
 * Front-end mock. There is no backend yet.
 *
 * submitWaitlist() is the only function to replace when Supabase
 * (or anything else) is ready. Keep its arguments and its return
 * shape. The form depends on both.
 *
 * Suggested table `waitlist`:
 *   id          uuid primary key default gen_random_uuid()
 *   email       text not null unique
 *   street_name text
 *   created_at  timestamptz not null default now()
 *
 * Suggested RLS: allow anonymous insert, or insert from an edge
 * function so the table is not world-readable.
 *
 * Replacement body, after the validation block below:
 *
 *   const { error } = await supabase.from("waitlist").insert({
 *     email: validated.email,
 *     street_name: validated.streetName || null,
 *   });
 *   if (error?.code === "23505") {
 *     return { ok: false, errors: { email: "That address is already on the list." } };
 *   }
 *   if (error) {
 *     return { ok: false, errors: { form: "The list didn't take it. Try again." } };
 *   }
 *   return {
 *     ok: true,
 *     entry: { email: validated.email, streetName: validated.streetName || null },
 *   };
 *
 * Do not collect more than an email and an optional street name.
 */

export const WAITLIST_STORAGE_KEY = "thievns-den.waitlist";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;
const STREET_RE = /^[A-Za-z][A-Za-z' -]{1,15}$/u;

export function validateWaitlist({ email, streetName } = {}) {
  const cleanEmail = String(email ?? "").trim().toLowerCase();
  const cleanStreet = String(streetName ?? "").trim().replace(/\s+/g, " ");
  const errors = {};

  if (!cleanEmail) {
    errors.email = "We need an address to write to.";
  } else if (cleanEmail.length > 120 || !EMAIL_RE.test(cleanEmail)) {
    errors.email = "That address doesn't look right.";
  }

  if (cleanStreet) {
    const lengthOk = cleanStreet.length >= 3 && cleanStreet.length <= 16;
    if (!lengthOk || !STREET_RE.test(cleanStreet)) {
      errors.streetName = "Use 3 to 16 letters. Spaces, hyphens, and apostrophes are fine.";
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    email: cleanEmail,
    streetName: cleanStreet,
  };
}

export function browserStorage() {
  return {
    read() {
      try {
        const raw = localStorage.getItem(WAITLIST_STORAGE_KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.entries)) return data.entries;
        return [];
      } catch {
        return [];
      }
    },
    write(entries) {
      localStorage.setItem(
        WAITLIST_STORAGE_KEY,
        JSON.stringify({ v: 1, entries }),
      );
    },
  };
}

function saveLocally(validated, storage) {
  const list = storage.read();
  if (list.some((entry) => entry && entry.email === validated.email)) {
    return {
      ok: false,
      errors: { email: "That address is already on the list." },
    };
  }

  const entry = {
    email: validated.email,
    streetName: validated.streetName || null,
    createdAt: new Date().toISOString(),
  };

  try {
    storage.write([...list, entry]);
  } catch {
    return {
      ok: false,
      errors: { form: "This browser blocked saving. Nothing was kept." },
    };
  }

  return { ok: true, entry };
}

/**
 * Validate a waitlist signup and store it.
 *
 * @param {{ email?: string, streetName?: string }} input
 * @param {{ storage?: { read: () => Array, write: (entries: Array) => void } }} [options]
 * @returns {Promise<{ ok: true, entry: { email: string, streetName: string | null } } | { ok: false, errors: Record<string, string> }>}
 */
export async function submitWaitlist(input = {}, options = {}) {
  const validated = validateWaitlist(input);
  if (!validated.ok) {
    return { ok: false, errors: validated.errors };
  }

  const storage = options.storage ?? browserStorage();

  // SUPABASE: replace the next line with the insert shown in the file header.
  return saveLocally(validated, storage);
}

export function loadWaitlist(storage = browserStorage()) {
  try {
    return storage.read();
  } catch {
    return [];
  }
}
