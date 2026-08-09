r"""
Interactive demo of the DNA storage pipeline.

Encodes a message into DNA with both codecs, reports the biological stats,
damages it with the noise simulator, and measures how much noise each codec
survives. Everything it prints comes from the real modules.

Run it:
    cd backend
    python playground.py                        # uses the defaults below
    python playground.py "your message here"    # or pass your own
    python playground.py "hello" 0.05           # message and noise rate

Or edit the constants below and re-run.
"""
import sys
from itertools import groupby

sys.path.insert(0, ".")
from src.framing import frame, deframe
from src.pipeline import encode, decode
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
    clean = encode(MESSAGE, codec=codec)
    noisy = StorageChannel(seed=SEED).simulate_noise(clean, sub_prob=NOISE)
    hits = sum(a != b for x, y in zip(clean, noisy) for a, b in zip(x, y))
    print(f"\n{name}:  {hits} base(s) corrupted")
    try:
        out = decode(noisy, codec=codec)
        if out == MESSAGE:
            print(f"  survived intact -> {out!r}")
        else:
            print(f"  CORRUPTED       -> {out!r}")
    except Exception as e:
        print(f"  DECODER CRASHED -> {type(e).__name__}: {e}")


rule("4. HOW MUCH NOISE CAN EACH CODEC TAKE?")
print("(50 seeds per rate; 'ok' = decoded back to the original exactly)\n")
print(f"{'rate':>7} | {'naive ok':>9} | {'goldman ok':>11} | {'goldman crashed':>15}")
print(f"{'-'*7}-+-{'-'*9}-+-{'-'*11}-+-{'-'*15}")
for rate in (0.0, 0.001, 0.005, 0.01, 0.02, 0.05, 0.10):
    row = {}
    for name, codec in (("naive", naive), ("goldman", goldman)):
        ok = crash = 0
        for s in range(50):
            noisy = StorageChannel(seed=s).simulate_noise(encode(MESSAGE, codec=codec), sub_prob=rate)
            try:
                if decode(noisy, codec=codec) == MESSAGE:
                    ok += 1
            except Exception:
                crash += 1
        row[name] = (ok, crash)
    print(f"{rate:>7.3f} | {row['naive'][0]*2:>8}% | {row['goldman'][0]*2:>10}% | {row['goldman'][1]*2:>14}%")

print("\nThis table is the shape of PoC acceptance criterion 3 — the decode-success")
print("curve. Once ECC and consensus exist, these columns should climb back up.\n")


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
