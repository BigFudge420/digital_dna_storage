# Digital DNA Storage: Capstone Project Research Report

**A Practical Guide for Final Year Biotechnology & CS Capstone Teams**

> **Build scope:** software simulation MVP, **2-week sprint**. The wet-lab protocol (§4) is the *future* work this MVP is meant to justify — it is not part of the sprint. Annotated references live in `resources/reading-list.md`.

---

## Abstract

This research report provides a practical, first-principles foundation for implementing a software simulation MVP of digital DNA data storage. The goal is to demonstrate digital data encoding into DNA with minimal error rates, serving as a technical proposal to secure university permission and funding for wet-lab synthesis. We cover biophysical constraints, encoding algorithms, error correction using Reed-Solomon codes, stochastic channel simulation, read consensus, and the experimental protocol for wet-lab integration.

---

## 1. Biophysical Sequence Constraints & Encodings

Synthetic DNA molecules are constrained by chemical and enzymatic limits during synthesis (writing) and sequencing (reading). A successful software encoder must strictly enforce three rules to ensure synthesizability:

1. **GC-Content Balance:** The percentage of Guanine ($G$) and Cytosine ($C$) bases must be maintained between $40\%$ and $60\%$:
   $$\text{GC \%} = \frac{N_G + N_C}{N_A + N_C + N_G + N_T} \times 100$$
   Deviations from this range lead to uneven melting temperatures ($T_m$), causing secondary structures or failures in PCR amplification.
2. **Homopolymer Runs:** Repeating runs of the same base (e.g., `AAAA` or `GGGG`) must be prevented. Polymerase enzymes are prone to "slipping" on repetitive sequences, causing insertion and deletion (indel) errors.
   > **Which layer enforces this:** the Goldman codec guarantees no repeats *by construction* ($L_{homo} = 1$). The `≤ 3` run check in the validator (`sequence_rules`) is the safety net for the **naive** codec and for framing/primer regions the codec doesn't cover — so the validator is not redundant.
3. **Goldman Ternary Rotating Code:**
   To prevent homopolymers entirely ($L_{homo} = 1$), this system uses the rotating ternary Huffman mapping detailed by *Goldman et al. (2013, Nature)*. A binary stream is converted to base-3 digits, and each digit is mapped to a base different from the preceding base:

| Previous Base | Ternary 0 | Ternary 1 | Ternary 2 |
| :--- | :--- | :--- | :--- |
| **A** | C | G | T |
| **C** | G | T | A |
| **G** | T | A | C |
| **T** | A | C | G |

---

## 2. Reed-Solomon Error Correction Code (ECC)

Biological channels accumulate substitution and insertion-deletion-substitution (IDS) errors. To guarantee error-free file reconstruction, we implement an outer **Reed-Solomon (RS)** error-correcting code.

- **Codeword Structure:** An $RS(n, k)$ code takes $k$ data bytes and appends $2t = n - k$ parity bytes.
- **Correction Capacity:** The decoder can detect and correct up to $t = (n - k)/2$ corrupted bytes in a block.
- **Field:** Galois Field $\mathbb{GF}(2^8)$, primitive polynomial $p(x) = x^8 + x^4 + x^3 + x^2 + 1$ (0x11D).
  > **In code:** we use the **`reedsolo` library** (same $\mathbb{GF}(2^8)$ math and 0x11D field) rather than hand-rolling Galois-field arithmetic and log/anti-log tables. For a 2-week build, correctness over reinvention — the field theory above is explained for the report, not re-implemented. `decode_rs` must surface uncorrectable blocks (return a corrected-count or raise), never silently return garbage.

---

## 3. Stochastic Channel Simulation & Consensus

To validate the encoder and decoder before ordering physical synthesis, the software simulates degradation and sequencing noise:

```
Original Data ──> RS Encoded ──> Goldman DNA ──> [Stochastic Mutation Channel] ──> Noisy Reads ──> Consensus ──> Decoded DNA ──> RS Decoded ──> Recovered Data
```

1. **Substitution Noise ($P_{sub}$):** Simulates errors where one base is replaced by another (predominant in Illumina sequencing).
2. **Insertion/Deletion Noise ($P_{ins}, P_{del}$):** Simulates frame-shift mutations (predominant in Oxford Nanopore sequencing).
3. **Consensus Reconstruction:** The channel emits **multiple noisy reads per strand** (sequencing coverage) so consensus has copies to vote across. Grouping reads by strand index and taking a **majority vote** per position filters substitution noise. Indels shift positions, so reads must be **aligned before voting**.

> **Decode order matters:** `reads → consensus (restore per-strand length) → de-map to bytes → RS decode`. RS assumes byte alignment, so it must run *after* consensus repairs indel shifts — not before.
>
> **Sprint scope:** core channel = substitution + whole-strand loss (erasure). Indels + alignment-based consensus are a **stretch goal**.

---

## 4. Wet-Lab Integration Protocol

*(Future work — the outcome this MVP is written to justify, not part of the 2-week sprint.)* Once the MVP simulation demonstrates successful data recovery under simulated noise, the following protocol is prepared for the university wet-lab run:

1. **Oligo Pool Ordering:**
   - Format sequence payloads as FASTA files.
   - Order single-stranded oligonucleotides from synthesis vendors (e.g., Twist Bioscience or Integrated DNA Technologies).
   - Ensure forward and reverse PCR primer sequences (typically 20 nucleotides each) are appended to both ends of the payload strand for amplification and sequencing adapters.
2. **PCR Amplification:**
   - Extract the synthesized oligo pool.
   - Run PCR using design primers to amplify target files, demonstrating random-access retrieval.
3. **High-Throughput Sequencing:**
   - Sequence using Illumina MiSeq or Oxford Nanopore MinION.
   - Export raw sequencing reads as FASTQ files.
   - Run the python decoder on the read pool to reconstruct the original digital file.

---

## 5. Project Milestones & Verification (2-Week Sprint)

Owners: **F** = friend (codec layer) · **I** = Isaac (simulator + pipeline).

| Milestone | Target | Owner | Deliverable | Verification Metric |
| :--- | :--- | :--- | :--- | :--- |
| **M1: Codec** | Day 2 | F | naive (done) + Goldman encode/decode | 100% roundtrip on error-free files |
| **M2: Framing + Pipeline** | Day 3–4 | I | `framing` (chunk/index) + `pipeline` integrator on naive | real file round-trips, SHA-256 match, **green CI** |
| **M3: Validator** | Day 3 | F | GC + homopolymer checker | every oligo GC 40–60%, run ≤ 3 |
| **M4: RS ECC** | Day 4 (build) / Day 7 (integrate) | F → I | `reedsolo` wrapper in the pipeline | recovers file with corrupted bytes |
| **M5: Channel** | Day 5–6 | I | sub / indel / loss, multi-read, seeded | reproducible noise, N reads per strand |
| **M6: Consensus** | Day 8–9 | I | group-align-vote | recovers under noise (RS + consensus) |
| **M7: Benchmark** | Day 10 | I | recovery-vs-noise curve, naive vs Goldman | the decision plot |
| **M8: Report + Demo** | Day 13–14 | both | write-up + tagged release | recovered file matches original hash |

**Acceptance (definition of done) — three checks:**
1. Lossless round-trip on a real file, **SHA-256 match**.
2. Every oligo passes **GC 40–60% + homopolymer ≤ 3** (shown naive-vs-Goldman).
3. A **decode-success-vs-error-rate** sweep curve (no-ECC / RS / RS + consensus).

Web dashboard and fountain codes are **stretch**, not sprint scope.

---

## 6. References

Full annotated reading list: `resources/reading-list.md`. The core five:

- Ceze, Nivala & Strauss (2019), *Nat. Rev. Genet.* — pipeline overview.
- Church, Gao & Kosuri (2012), *Science* — naive baseline.
- Goldman et al. (2013), *Nature* — rotating homopolymer-free codec.
- Grass et al. (2015), *Angew. Chem.* — Reed-Solomon over oligos.
- Schwarz et al. (2020), *Bioinformatics* — MESA error model for the channel.
