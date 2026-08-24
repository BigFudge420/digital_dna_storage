# Digital DNA Storage

A Python simulation of a DNA based archival storage system. It translates a digital file into synthetic DNA sequences, checks them against biological constraints, protects the data with Reed Solomon error correcting codes, simulates the noise of a physical storage channel, and decodes the file back. Correctness is defined by one gate: a file must survive the encode, noise, and decode round trip byte for byte.

Scope: a two week software MVP. The science is written up in `Digital_DNA_Storage_Research_Report.md`, the plan in `Digital_DNA_Storage_Roadmap.md` and `Phase_1_2_Detailed_Roadmap.md`, and the references in `backend/resources/`.

## How it works

1. **Framing** splits the file into fixed length strands, each tagged with an index so the original order can be rebuilt even if strands are shuffled or lost.
2. **Codec** maps bytes to the four DNA bases (A, C, G, T). The naive codec is the baseline; the Goldman codec avoids homopolymers at a 50% size cost.
3. **Validators** check each strand against sequence rules such as homopolymer runs and GC balance. *(planned)*
4. **Reed Solomon coding** adds redundancy so a noisy read can still be recovered. *(planned)*
5. **Simulator** models the storage channel: synthesis and sequencing errors, strand dropout, and multiple noisy reads per strand.
6. **Consensus** reconstructs each strand from its noisy reads before decoding.

Data crosses three domains, and each module works in exactly one of them: framing operates on **bytes**, the codecs on **DNA strings**, and the simulator and consensus on **reads** (the many noisy copies a sequencer returns per strand).

## Structure

The Python lives under `backend/`. A React dashboard is planned on the `dashboard` branch.

```text
.github/workflows/ci.yml   runs the test suite on every push
requirements.txt
backend/
  conftest.py              puts backend/ on sys.path for the tests
  test_dna.py              framing, codec/pipeline, consensus, and channel tests
  resources/               reading list and reference papers
  src/
    pipeline.py            integrator: file to DNA strands and back
    framing.py             chunk the file into indexed strands and reassemble
    codecs/
      naive.py             baseline 2 bits per base mapping
      goldman.py           rotating ternary codec, homopolymer free
    ecc/
      rs_codec.py          Reed Solomon error correcting code (stub)
    validators/
      sequence_rules.py    biological constraint checks (stub)
    simulator/
      channel.py           storage channel noise model
    consensus/
      alignment.py         rebuild strands from multiple noisy reads (column vote)
```

## Setup

Requires Python 3.10 or newer.

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
pip install pytest
```

`requirements.txt` also pins `reedsolo` and `numpy`. They are not needed yet, because the
currently tested path is pure standard library. Install them with
`pip install -r requirements.txt` once the ECC layer is in use.

## Running the tests

```bash
cd backend
pytest -q
```

The suite is **20 tests** in `test_dna.py`: framing round-trips and its `deframe` guards, both codecs (the lossless and shuffle-survival cases are parametrised over `naive` and `goldman`), consensus voting out substitution noise, per-strand dropout, and the channel's parameter guards. `ok` means the decoded bytes are byte-for-byte identical to the input.

Useful variations:

```bash
pytest -v                # show each test name, including the codec it ran against
pytest -k goldman -v     # only the Goldman cases
```

## Try it interactively

`backend/playground.py` runs the whole pipeline on a message of your choosing and prints what happens at every stage.

```bash
cd backend
python playground.py                        # defaults
python playground.py "your message here"    # your own text
python playground.py "hello" 0.05           # text plus a noise rate
```

It shows the framed strands, the same bytes rendered as DNA by both codecs with GC content and longest homopolymer run, what a given noise rate does to each, and a sweep measuring how much noise each codec survives. Every number comes from the real modules, so it doubles as a live check that the pipeline works.

## Choosing a codec

Both codec modules expose the same two functions, `encode(bytes) -> str` and `decode(str) -> bytes`, so the pipeline takes the module itself as an argument. There is no registry and no interface class.

```python
from src.pipeline import encode, decode
from src.codecs import goldman

dna  = encode(data, codec=goldman)
back = decode(dna, codec=goldman)
```

The default is `naive`. Pass `codec=` to **both** calls: encoding with one codec and decoding with the other either raises or, in the Goldman to naive direction, silently returns wrong bytes.

| | naive | Goldman |
|---|---|---|
| Bases per byte | 4 | 6 |
| Longest homopolymer run observed | 69 | 1 |
| Effect of one misread base | corrupts 2 bits in 1 byte, never raises | corrupts 2 trits, raises on roughly half of cases |

## Status

**Working today:** framing and its `deframe` guards, the pipeline integrator, both codecs, the storage channel (per-base substitution and per-strand dropout, seeded and reproducible; `ind_prob` refuses rather than silently doing nothing), and **consensus reconstruction** — reads are bucketed by their index header, minority buckets left by header-corrupting substitutions are dropped, and a per-column majority vote rebuilds each strand. A lossless file → DNA → file round trip survives shuffled strands and votes out substitution noise. CI runs the suite on every push.

**Measured (no error-correction):** decode success climbs with coverage — 60 seeds at `sub_prob=0.02` give coverage 3 → 2/60, 5 → 34/60, 9 → 53/60 — and nothing is ever silently wrong: a failure is always a detected `corrupted` or a loud `crashed`, never a false `ok`. Recovery is coverage-only for now, so every strand must survive independently and success falls off as the file's strand count grows.

**Not started:** Reed–Solomon coding (`ecc/rs_codec.py`) and the biological validator (`validators/sequence_rules.py`), both stubs. The Reed–Solomon **outer code** — parity across strands so a whole dropped strand can be rebuilt — is the next build; today a lost strand is detected but not recovered.
