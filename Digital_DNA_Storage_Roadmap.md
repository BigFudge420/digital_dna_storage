# Project Roadmap: DNA-Based Data Storage — 2-Week MVP Sprint

**Scope:** Software-only simulation MVP, **2 weeks**. Validates encoding, biological constraints, and error correction in-silico — the evidence base for a later university wet-lab proposal.
**Team:** friend = codec layer (naive / Goldman + RS + validator) · Isaac = simulator + pipeline (channel, consensus, framing, integrator, tests, CI).

```
   ┌─────────────────────────────────────────────────────────────┐
   │   WEEK 1 — Core Round-Trip + CI   (make it run)             │
   └───────────────────────────────┬─────────────────────────────┘
                                   ▼
   ┌─────────────────────────────────────────────────────────────┐
   │   WEEK 2 — Robustness, Consensus & Analysis  (make it survive)│
   └─────────────────────────────────────────────────────────────┘
```

---

## Week 1 — Core Simulation Pipeline (make it run)

**Goal:** a CLI that takes a real file, encodes it → (noise) → decodes it back byte-for-byte, gated by CI. This spine (framing + pipeline + naive + test + CI) needs nothing from the codec beyond `naive`, which already works — so Week 1 is **unblocked**.

- **1.1 Codec foundation** — *F* — naive (done) + Goldman ternary rotating encoder/decoder ($L_{homo}=1$). 100% roundtrip on text.
- **1.2 Framing + pipeline integrator** — *I* — chunk the file into indexed strands, wire the full path on naive, `codec=` swappable. SHA-256 round-trip test green in CI.
- **1.3 Biological constraint validator** — *F* — GC 40–60% + homopolymer ≤ 3, returns diagnostic metrics.
- **1.4 Reed-Solomon ECC** — *F* (build) → *I* (integrate) — `reedsolo` library, tunable parity.
- **1.5 Stochastic channel** — *I* — substitution + strand-loss (core) then indels (stretch); multiple reads per strand; seeded for reproducibility.

**Milestone:** green CI + naive round-trip on a real file.

---

## Week 2 — Robustness, Consensus & Analysis (make it survive)

- **2.1 Read consensus** — *I* — group reads by index, align, majority-vote to reconstruct clean strands from noisy pools.
- **2.2 Benchmark suite** — *I* — decode-recovery-vs-noise curve, naive vs Goldman, logical density (bits/nt).
- **2.3 Hardening + write-up** — *both* — edge cases, tests, results, drop papers into `resources/`.
- **2.4 Final demo + release** — *both* — hash-match demo, tag `v0.1`.

**Milestone:** a file survives simulated noise and returns hash-identical; benchmark curve produced.

---

## Out of sprint scope (stretch / future)

- **Web dashboard** (Flask/Streamlit GUI) — stretch, Day 12 if time.
- **Fountain codes** (Erlich 2017) — stretch codec beyond RS + consensus.
- **Wet-lab run** — kept as a written protocol in the Research Report (§4); it's the follow-on this MVP justifies.

---

Detailed day-by-day: **`Phase_1_2_Detailed_Roadmap.md`**.
