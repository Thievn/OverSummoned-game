import assert from "node:assert/strict";
import { submitWaitlist, validateWaitlist } from "../src/waitlist.js";

function memory(initial = []) {
  let entries = initial.map((entry) => ({ ...entry }));
  return {
    read: () => entries.map((entry) => ({ ...entry })),
    write(next) {
      entries = next.map((entry) => ({ ...entry }));
    },
  };
}

const good = { email: "vic@nightmail.com", streetName: "Hollow Vic" };

assert.equal(validateWaitlist(good).ok, true);
assert.equal(validateWaitlist({ email: "  Vic@Nightmail.com " }).email, "vic@nightmail.com");
assert.equal(validateWaitlist({ email: "" }).ok, false);
assert.equal(validateWaitlist({ email: "nope" }).ok, false);
assert.equal(validateWaitlist({ email: "a@b.c" }).ok, false);
assert.equal(validateWaitlist({ email: "vic@nightmail.com", streetName: "Jo" }).ok, false);
assert.equal(validateWaitlist({ email: "vic@nightmail.com", streetName: "123" }).ok, false);
assert.equal(validateWaitlist({ email: "vic@nightmail.com", streetName: "O'Neil" }).ok, true);
assert.equal(validateWaitlist({ email: "vic@nightmail.com", streetName: "" }).ok, true);

const store = memory();
const first = await submitWaitlist(good, { storage: store });
assert.equal(first.ok, true);
assert.equal(first.entry.streetName, "Hollow Vic");
assert.equal(store.read().length, 1);

const dup = await submitWaitlist({ email: "VIC@nightmail.com" }, { storage: store });
assert.equal(dup.ok, false);
assert.match(dup.errors.email, /already/i);
assert.equal(store.read().length, 1);

const bad = await submitWaitlist({ email: "nope", streetName: "!!" }, { storage: store });
assert.equal(bad.ok, false);
assert.ok(bad.errors.email);
assert.ok(bad.errors.streetName);

console.log("waitlist tests passed");
