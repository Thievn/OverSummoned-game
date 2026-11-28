"""A rough stand-in for Godot's parser, for when there is no Godot to hand.

It catches the two mistakes that stop a script loading and are easy to make without the editor:

  1. `var x := something` where Godot cannot work out the type of the something. A loop variable
     with no type on it, a dictionary lookup, or a call on an untyped object all land here, and
     Godot refuses the line outright.
  2. a function named after one of Godot's own virtual methods, which it reads as a bad override.

  python3 rules/gdcheck.py desktop-pet2/*.gd
"""
import re, sys

# Godot's own methods that are easy to clash with by accident. Overriding one on purpose is fine,
# so each is only a problem when the signature is not the one Godot expects.
VIRTUAL = {
    "_set": r"\(\s*\w+\s*:\s*(StringName|String|Variant)\s*,\s*\w+\s*(:\s*Variant\s*)?\)\s*->\s*bool",
    "_get": r"\(\s*\w+\s*:\s*(StringName|String|Variant)\s*\)\s*->\s*Variant",
    "_to_string": r"\(\s*\)\s*->\s*String",
}

BUILTIN = set("""float int str bool abs absf absi sign signf snapped maxf minf maxi mini clamp clampf
clampi sin cos tan asin acos atan atan2 sqrt pow exp log ceil ceilf floor floorf round roundf fmod fposmod snappedf snappedi lerp
lerpf inverse_lerp remap randf randf_range randi randi_range randfn typeof len range hash is_equal_approx
is_zero_approx wrapf wrapi posmod fposmod deg_to_rad rad_to_deg smoothstep ease""".split())

MAKES = set("""Vector2 Vector2i Vector3 Vector3i Rect2 Rect2i Color Transform2D Transform3D Quaternion
Basis Plane AABB Callable Signal StringName NodePath RID PackedByteArray PackedInt32Array PackedInt64Array
PackedFloat32Array PackedFloat64Array PackedStringArray PackedVector2Array PackedVector3Array
PackedColorArray Array Dictionary""".split())

# engine classes and singletons: anything reached through one of these has a type
ENGINE = re.compile(r"^[A-Z][A-Za-z0-9_]*\s*[.(]")


class Script:
    def __init__(self, path):
        self.lines = [self._decomment(l) for l in open(path, encoding="utf-8").read().split("\n")]
        self.path = path
        self.rets = {}
        for ln in self.lines:
            m = re.match(r"\s*func\s+([A-Za-z0-9_]+)\s*\(.*?\)\s*->\s*(\w+)", ln)
            if m and m.group(2) != "void":
                self.rets[m.group(1)] = True

    @staticmethod
    def _decomment(line):
        out, q = [], None
        for ch in line:
            if q:
                q = None if ch == q else q
            elif ch in "\"'":
                q = ch
            elif ch == "#":
                break
            out.append(ch)
        return "".join(out).rstrip()

    def typed(self, e, known):
        """Would Godot be able to put a type on this expression?"""
        e = e.strip()
        while e.startswith("(") and e.endswith(")") and self._balanced(e[1:-1]):
            e = e[1:-1].strip()
        if not e:
            return False
        m = re.match(r"(.+?)\s+if\s+.+?\s+else\s+(.+)$", e)            # a ? b : c
        if m and self._balanced(m.group(1)):
            return self.typed(m.group(1), known) and self.typed(m.group(2), known)
        m = re.search(r"\s+as\s+[A-Z][A-Za-z0-9_]*\s*$", e)            # a cast always has a type
        if m:
            return True
        for op in [" or ", " and ", "==", "!=", ">=", "<=", ">", "<", "+", "-", "*", "/", "%"]:
            parts = self._split(e, op)
            if parts:
                return all(self.typed(p, known) for p in parts if p.strip())
        if e.startswith("not "):
            return True
        if e.startswith("-") or e.startswith("+"):
            return self.typed(e[1:], known)
        if re.match(r"""^(-?\d|"|'|\[|\{|true\b|false\b|func\s*\()""", e):
            return True
        m = re.match(r"([A-Za-z0-9_]+)\s*\(", e)
        if m and (m.group(1) in BUILTIN or m.group(1) in MAKES or m.group(1) in self.rets
                  or m.group(1) in ("preload", "load")):
            return True
        if ENGINE.match(e):                                            # Vector2.ZERO, Time.xxx(), Node.new()
            return True
        if e in ("self", "PI", "TAU", "INF", "NAN"):
            return True
        root = re.match(r"([A-Za-z0-9_]+)", e)
        if root:
            base = root.group(1)
            rest = e[len(base):]
            if base in known and known[base]:
                # reaching into something typed keeps a type, unless the thing reached for is a
                # dictionary lookup. What sits inside the brackets of a call does not count.
                reach = rest.split("(")[0]
                return "[" not in reach and not reach.rstrip() == ".get"
        return False

    @staticmethod
    def _balanced(s):
        d = 0
        for ch in s:
            d += ch in "([{"
            d -= ch in ")]}"
            if d < 0:
                return False
        return d == 0

    @staticmethod
    def _split(e, op):
        """Splits on an operator that is not inside brackets or a string."""
        out, depth, i, last, q = [], 0, 0, 0, None
        while i < len(e):
            ch = e[i]
            if q:
                q = None if ch == q else q
            elif ch in "\"'":
                q = ch
            elif ch in "([{":
                depth += 1
            elif ch in ")]}":
                depth -= 1
            elif depth == 0 and e.startswith(op, i):
                if op == "-" and (i == 0 or e[i - 1] in "(,*/+-= "):
                    i += 1
                    continue
                out.append(e[last:i])
                last = i + len(op)
                i = last
                continue
            i += 1
        if out:
            out.append(e[last:])
        return out

    def run(self):
        known, loops, bad = {}, set(), []
        for ln in self.lines:                                          # members first
            m = re.match(r"var\s+([A-Za-z0-9_]+)\s*:\s*\w", ln)
            if m:
                known[m.group(1)] = True
            m = re.match(r"var\s+([A-Za-z0-9_]+)\s*:=\s*(.+)$", ln)
            if m:
                known[m.group(1)] = self.typed(m.group(2), known)
            m = re.match(r"const\s+([A-Za-z0-9_]+)", ln)
            if m:
                known[m.group(1)] = True
        for i, ln in enumerate(self.lines, 1):
            m = re.match(r"\s*func\s+(_[A-Za-z0-9_]+)\s*(\(.*)$", ln)
            if m and m.group(1) in VIRTUAL and not re.match(VIRTUAL[m.group(1)], m.group(2)):
                bad.append((i, "%s() is one of Godot's own methods and this is not its signature; rename it"
                            % m.group(1)))
            m = re.match(r"\s*func\s+[A-Za-z0-9_]+\s*\((.*)\)", ln)
            if m:                                                      # parameters with a type on them
                for part in m.group(1).split(","):
                    p = re.match(r"\s*([A-Za-z0-9_]+)\s*(:\s*\w+|:=)", part)
                    if p:
                        known[p.group(1)] = True
                    else:
                        p = re.match(r"\s*([A-Za-z0-9_]+)\s*$", part)
                        if p:
                            known[p.group(1)] = False
            m = re.match(r"\s*for\s+([A-Za-z0-9_]+)(\s*:\s*\w+)?\s+in\b(.*)$", ln)
            if m:
                if m.group(2):
                    known[m.group(1)] = True
                else:
                    rng = m.group(3)
                    whole = bool(re.search(r"\brange\s*\(|\bin\s+\d+\s*:|\bin\s+[a-z_]+\.size\(\)", ln))
                    known[m.group(1)] = whole
                    if not whole:
                        loops.add(m.group(1))
            m = re.match(r"\s*var\s+([A-Za-z0-9_]+)\s*:\s*\w+\s*=", ln)
            if m:
                known[m.group(1)] = True
            m = re.match(r"\s*var\s+([A-Za-z0-9_]+)\s*:=\s*(.+?)\s*$", ln)
            if not m:
                continue
            name, rhs = m.group(1), m.group(2)
            ok = self.typed(rhs, known)
            known[name] = ok
            if not ok:
                why = "Godot cannot work out the type"
                for v in sorted(loops):
                    if re.search(r"\b%s\b" % v, rhs):
                        why = "the loop variable '%s' has no type on it" % v
                        break
                else:
                    if ".get(" in rhs or re.search(r"\w\[", rhs):
                        why = "a dictionary or array lookup gives back an untyped value"
                bad.append((i, "var %s := %s   -> %s" % (name, rhs[:60], why)))
        return bad


if __name__ == "__main__":
    total = 0
    for p in sys.argv[1:]:
        for ln, msg in Script(p).run():
            print("%s:%d  %s" % (p, ln, msg))
            total += 1
    print("%d thing%s to look at" % (total, "" if total == 1 else "s"))
    sys.exit(1 if total else 0)
