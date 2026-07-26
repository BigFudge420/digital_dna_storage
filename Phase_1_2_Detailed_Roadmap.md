# Detailed 14-Day Execution Roadmap

**Project:** Design and Simulation of a DNA-Based Data Archival System
**Scope:** 2-week software MVP. Libraries over hand-rolling (`reedsolo`, `numpy`); majority-vote consensus, not a production aligner; fountain codes + web dashboard = stretch.
**Owners:** **F** = friend (codec layer) · **I** = Isaac (simulator + pipeline).

```
   ┌──────────────────────────────────────────────────────────────┐
   │  WEEK 1 · Days 1–7   Core Round-Trip + CI                    │
   └───────────────────────────────┬──────────────────────────────┘
                                   ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  WEEK 2 · Days 8–14  Robustness, Consensus & Analysis        │
   └──────────────────────────────────────────────────────────────┘
```

---

# WEEK 1 — Core Round-Trip (Days 1–7)

**Objective:** a CLI that encodes a real file into valid DNA, simulates noise, and decodes it back error-free — gated by a round-trip CI test. The spine (framing + pipeline + naive + test + CI) needs nothing from the codec beyond `naive`, which is already done, so Week 1 cannot be blocked by the codec track.

## Day 1 — Repo hygiene + framing start *(I)*
- `.gitignore` (+ untrack committed `__pycache__`), empty `conftest.py`, branch `isaac-simulator`.
- Start `src/framing.py`: `chunk(data, payload_size) -> [(index, payload)]`.
- **Deliverable:** clean repo; `framing.chunk`/`unchunk` stubbed with a unit test.

## Day 2 — Codec + framing *(F + I)*
- **F:** `goldman.py` encode/decode (naive already done). Unit tests, 100% roundtrip.
- **I:** finish `framing.py` — `unchunk` reorders by index, strips padding.
- **Deliverable:** framing round-trips; codec module tested.

## Day 3 — Pipeline on naive + validator *(I + F)*
- **I:** `pipeline.py` `encode_file`/`decode_file` wired on **naive only** (no RS/noise yet), `codec=` param.
- **F:** `sequence_rules.py` — GC 40–60% + homopolymer ≤ 3, returns metrics.
- **Deliverable:** file → strands → file (no noise) round-trips.

## Day 4 — No-noise round-trip test + CI *(I)* — 🏁 MILESTONE
- `tests/test_roundtrip.py`: SHA-256 of input == output on a real file.
- `.github/workflows/ci.yml`: run `pytest` on push / PR.
- **Deliverable:** **green CI + naive round-trip.**

## Day 5 — Channel: substitution + loss *(I)*
- `channel.py` → `simulate_noise(seqs, sub_prob, ind_prob, num_reads=10, seed=None) -> list[list[str]]`.
- Substitution + whole-strand loss first; seeded.
- **Deliverable:** reproducible noisy reads, multiple copies per strand.

## Day 6 — Channel: indels + RS integrate *(I + F)*
- **I:** add insertion/deletion to the channel.
- **F:** `rs_codec.py` via `reedsolo`; `decode_rs` returns `(bytes, n_corrected)` or raises on uncorrectable.
- **Deliverable:** channel complete; RS available to the pipeline.

## Day 7 — Buffer / first noisy round-trip *(I)*
- Plug RS into the pipeline; run file → RS → naive → noise → decode end-to-end.
- **Deliverable:** noisy pipeline runs (recovery quality lands with consensus in Week 2).

---

# WEEK 2 — Robustness, Consensus & Analysis (Days 8–14)

## Day 8 — Consensus core *(I)*
- `consensus/alignment.py`: group reads by index, majority vote (substitution / loss).
- **Deliverable:** clean strand from a noisy read pool.

## Day 9 — Indels + noisy test passes *(I)* — 🏁 MILESTONE
- Align-before-vote for indels (**or descope indels** if time-boxed).
- `test_roundtrip_with_noise`: file survives the channel, SHA-256 match.
- **Deliverable:** **recovers under noise.**

## Day 10 — Benchmark suite *(I)*
- `benchmarks/run_suite.py`: recovery-vs-noise curve, naive vs Goldman, bits/nt. Add `matplotlib` to `requirements.txt`.
- **Deliverable:** the decision plot.

## Day 11 — Hardening *(both)*
- Edge cases, more tests, docstrings, README polish.

## Day 12 — Stretch: dashboard or polish *(optional)*
- Optional Streamlit: file upload + noise slider + accuracy chart. Descope-able.

## Day 13 — Write-up + resources *(both)*
- Results, plots, papers into `resources/`.

## Day 14 — Demo + release *(both)*
- Final demo, tag `v0.1`, repo cleanup.

---

## Updated Directory Tree

```text
digital_dna_storage/
├── .gitignore
├── conftest.py
├── README.md
├── requirements.txt
├── Digital_DNA_Storage_Research_Report.md
├── Digital_DNA_Storage_Roadmap.md
├── Phase_1_2_Detailed_Roadmap.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── resources/
│   └── reading-list.md
├── benchmarks/
│   └── run_suite.py          # I  (Day 10)
├── tests/
│   └── test_roundtrip.py     # I
└── src/
    ├── __init__.py
    ├── pipeline.py           # I  — integrator
    ├── framing.py            # I  — chunk / index
    ├── codecs/
    │   ├── naive.py          # F  (done)
    │   └── goldman.py        # F
    ├── ecc/
    │   └── rs_codec.py       # F
    ├── validators/
    │   └── sequence_rules.py # F
    ├── simulator/
    │   └── channel.py        # I
    └── consensus/
        └── alignment.py      # I
```
