r"""
Interactive demo of the DNA storage pipeline.

Encodes a message into DNA with both codecs, reports the biological stats,
damages it with the noise simulator, and measures how much noise each codec
survives. Everything it prints comes from the real modules.

Run it:
    cd backend
    python playground.py                        # uses the defaults below
    python playground.py test                   # or pass your own
    python playground.py "hello" 0.05           # message and noise rate

Or edit the constants below and re-run.
"""
import sys
from itertools import groupby

# The rules and headings below are box-drawing characters. On Windows stdout
# defaults to cp1252 whenever it is not a console (piped to a file, captured by
# CI), and printing them there raises UnicodeEncodeError before any output.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, ".")
from src.framing import frame, deframe
from src.pipeline import encode, decode, roundtrip
from src.codecs import naive, goldman
from src.simulator.channel import StorageChannel


# ─────────────────────────────────────────────────────────────
MESSAGE = b"Isaac was here"        # try your name, a sentence, anything
NOISE   = 0.02                     # per-base substitution probability
SEED    = 42                       # change it to get different damage
# ─────────────────────────────────────────────────────────────

# command-line arguments override the constants above
if len(sys.argv) > 1:
    MESSAGE = sys.argv[1].encode("utf-8")
if len(sys.argv) > 2:
    NOISE = float(sys.argv[2])


def gc_percent(dna):
    return 100 * sum(1 for b in dna if b in "GC") / len(dna)

def longest_run(dna):
    return max(sum(1 for _ in g) for _, g in groupby(dna))

def show(dna, width=60):
    return dna if len(dna) <= width else f"{dna[:width]}... (+{len(dna)-width} more)"

def rule(title):
    print(f"\n{'─' * 66}\n{title}\n{'─' * 66}")

def count_substitutions(clean, noisy):
    """Count positional base mismatches between the originals and the reads.

    Only defined when the reads line up 1:1 with the strands they came from —
    coverage=1 and substitution-only noise. Under coverage>1 or indels the
    lists no longer correspond and zip() would silently truncate to the
    shorter one, returning a plausible but meaningless number. Fail loudly.
    """
    if len(noisy) != len(clean):
        raise ValueError(
            f"{len(noisy)} reads from {len(clean)} strands — a positional diff "
            "is undefined here (coverage > 1). Compare per-copy instead."
        )
    for i, (orig, read) in enumerate(zip(clean, noisy)):
        if len(read) != len(orig):
            raise ValueError(
                f"strand {i}: read is {len(read)} nt, original is {len(orig)} nt "
                "— a positional diff is undefined here (indels). Use an alignment."
            )
    return sum(a != b for orig, read in zip(clean, noisy) for a, b in zip(orig, read))


def ask(prompt, default, cast=str):
    raw = input(f"{prompt} [{default}]: ").strip()
    return cast(raw) if raw else default

def test():
    src = ask("source — type 'text' or 'file'", "text")
    if src == "file":
        path = ask("file path", "../README.md")          ## relative to backend/, or absolute
        with open(path, "rb") as f:                      ## 'rb' = raw bytes, works for ANY file
            msg = f.read()
        print(f"  loaded {len(msg)} bytes from {path}")
    else:
        msg = ask("message", "Isaac was here").encode("utf-8")   ## payload we're sending

    seed = ask("seed", 42, int)                          ## change seed → noise lands elsewhere
    sub  = ask("sub_prob (per-base flip)", 0.02, float)
    cov  = ask("coverage (copies per strand)", 1, int)   ## more coverage = more redundancy
    drop = ask("drop_strand_prob (whole-strand loss)", 0.0, float)

    for name, codec in (("naive", naive), ("goldman", goldman)):
        r = roundtrip(msg, codec=codec, channel=StorageChannel(seed=seed),
                      sub_prob=sub, coverage=cov, drop_strand_prob=drop)
        print(f"\n{name}:  status={r.status}  ({len(r.reads)} reads from {len(r.strands)} strands)")
        if cov == 1 and drop == 0:                        # positional diff only valid here
            print(f"  {count_substitutions(r.strands, r.reads)} base(s) corrupted")
        if r.error:
            print(f"  -> crashed: {r.error}")
        elif len(r.output) > 80:                          # a file → don't dump the bytes
            print(f"  -> {len(r.output)} bytes | exact match: {r.output == msg}")
        else:
            print(f"  -> {r.output!r}")

if len(sys.argv) > 1 and sys.argv[1] == "test":
    test()
    sys.exit()


rule(f"1. YOUR MESSAGE  ->  {MESSAGE!r}   ({len(MESSAGE)} bytes)")
strands = frame(MESSAGE)
print(f"framing produced {len(strands)} strand(s) of {len(strands[0])} bytes each")
print(f"  strand 0 starts: index={strands[0][:2].hex()}  then the length prefix + your text")


rule("2. THE SAME BYTES AS DNA, BOTH CODECS")
for name, codec in (("naive", naive), ("goldman", goldman)):
    dna = encode(MESSAGE, codec=codec)
    joined = "".join(dna)
    print(f"\n{name}:")
    print(f"  {show(joined)}")
    framed_bytes = len(strands) * len(strands[0])   # padded strand bytes, not message bytes
    print(f"  total {len(joined)} nt  |  {len(joined)/framed_bytes:.1f} nt per encoded byte"
          f"  |  GC {gc_percent(joined):.1f}%  |  longest repeat run {longest_run(joined)}")
    print(f"  decodes back correctly: {decode(dna, codec=codec) == MESSAGE}")


rule(f"3. NOW ADD NOISE  (sub_prob={NOISE}, seed={SEED})")
for name, codec in (("naive", naive), ("goldman", goldman)):
    r = roundtrip(MESSAGE, codec=codec,
                  channel=StorageChannel(seed=SEED), sub_prob=NOISE)
    print(f"\n{name}:  {count_substitutions(r.strands, r.reads)} base(s) corrupted")
    print(f"  status={r.status}  ->  {r.error or r.output!r}")


rule("4. HOW MUCH NOISE CAN EACH CODEC TAKE?")
print("(50 seeds per rate; 'ok' = decoded back to the original exactly)\n")
print(f"{'rate':>7} | {'naive ok':>9} | {'goldman ok':>11} | {'goldman crashed':>15}")
print(f"{'-'*7}-+-{'-'*9}-+-{'-'*11}-+-{'-'*15}")
for rate in (0.0, 0.001, 0.005, 0.01, 0.02, 0.05, 0.10):
    row = {}
    for name, codec in (("naive", naive), ("goldman", goldman)):
        results = [roundtrip(MESSAGE, codec=codec,
                             channel=StorageChannel(seed=s), sub_prob=rate)
                   for s in range(50)]
        row[name] = (sum(r.status == "ok"      for r in results),
                     sum(r.status == "crashed" for r in results))
    print(f"{rate:>7.3f} | {row['naive'][0]*2:>8}% | {row['goldman'][0]*2:>10}% | {row['goldman'][1]*2:>14}%")


print("\nThis table is the shape of PoC acceptance criterion 3 — the decode-success")


rule("5. TRY IT YOURSELF — paste these into a REPL")
print("""  import sys; sys.path.insert(0, ".")
  from src.pipeline import encode, decode
  from src.codecs import naive, goldman
  from src.simulator.channel import StorageChannel

  encode(b"hi", codec=goldman)               # see the raw DNA
  ch = StorageChannel(seed=1)
  ch.simulate_noise(encode(b"hi"), sub_prob=0.5)
  ch.simulate_noise(encode(b"hi"), coverage=5, sub_prob=0.1)   # 5 damaged copies
""")
