# DNA Data Storage — Reading List (verified 2026-07-25)

Curated for the simulated PoC. Ordered as a reading path, not by date. Each entry says **what it teaches** and **which module it feeds**. Read the ★ ones; the rest are depth/stretch.

> Module map for the "feeds" tags: `naive` (baseline codec) · `goldman` (constraint-aware codec) · `sequence_rules` (validator) · `rs_codec` (Reed-Solomon) · `channel` (simulator) · `consensus` (read reconstruction).
> PDFs aren't committed (licensing) — links + DOIs are below; pull copies as needed.

---

## 0 · Start here — the overview
★ **Ceze, Nivala & Strauss (2019). "Molecular digital data storage using DNA."** *Nature Reviews Genetics* 20:456–466.
The single best entry point. Whole pipeline end-to-end (encode → synthesize → store → PCR → sequence → decode), the state of the art, and the open problems. Read this first and the rest slots into place.
- https://www.nature.com/articles/s41576-019-0125-3 · DOI 10.1038/s41576-019-0125-3
- Free copy via Microsoft Research: https://www.microsoft.com/en-us/research/publication/molecular-digital-data-storage-using-dna/

---

## 1 · Foundational encodings (`naive`, `goldman`)
★ **Church, Gao & Kosuri (2012). "Next-Generation Digital Information Storage in DNA."** *Science* 337:1628.
The first large demo (encoded a 659 KB book). Dead-simple 1 bit/base-ish mapping, **no error correction** — this is deliberately your *naive baseline*, the thing whose failures motivate everything after.
- DOI 10.1126/science.1226355

★ **Goldman, Bertone, Chen, Dessimoz, LeProust, Sipos & Birney (2013). "Towards practical, high-capacity, low-maintenance information storage in synthesized DNA."** *Nature* 494:77–80.
The **homopolymer-avoiding rotating encoding** + 4× overlapping fragments for redundancy. This is your `goldman` codec — the one that passes the biology gate where naive fails.
- DOI 10.1038/nature11875

---

## 2 · Error correction (`rs_codec`, `channel`)
★ **Grass, Heckel, Puddu, Paunescu & Stark (2015). "Robust Chemical Preservation of Digital Information on DNA in Silica with Error-Correcting Codes."** *Angew. Chem. Int. Ed.* 54(8):2552–2555.
The **Reed-Solomon** paper — RS parity across oligos to correct substitutions + recover dropped strands. Recovered data error-free after 70 °C/1 week (≈2000 yr in central Europe).
- DOI 10.1002/anie.201411378
- **Reference implementation (RS + fountain), read the code:** https://github.com/reinhardh/dna_data_storage

**Blawat et al. (2016). "Forward Error Correction for DNA Data Storage."** *Procedia Computer Science* 80:1011–1022. (Optional depth — a different FEC construction if you want to compare against RS.)

---

## 3 · The efficient architecture (stretch codec)
**Erlich & Zielinski (2017). "DNA Fountain enables a robust and efficient storage architecture."** *Science* 355(6328):950–954.
**Fountain (Luby-transform / rateless) codes** + a screening step for GC/homopolymer constraints — hit ~215 PB/g, near the Shannon limit, and survived multiple PCR rounds. This is the **impressive stretch**: fountain codes handle oligo dropout gracefully by design. Core PoC = RS + consensus; do this if you have a day spare and want the project to stand out.
- https://www.science.org/doi/10.1126/science.aaj2038 · DOI 10.1126/science.aaj2038 · PMID 28254941

---

## 4 · Systems / random access (the DevOps-adjacent framing)
**Bornholt, Lopez, Carmean, Ceze, Seelig & Strauss (2016). "A DNA-Based Archival Storage System."** *ASPLOS '16* (UW / Microsoft).
Reads DNA storage as a **systems** problem — random access via PCR primers, XOR-based redundancy, a storage-system architecture. Best paper for framing your project as infrastructure, not just biology.

**Organick et al. (2018). "Random access in large-scale DNA data storage."** *Nature Biotechnology* 36:242–248.
Random access demonstrated at 200 MB. Justifies the **indexing + primer address** design in `framing` (retrieve one file from a pool without decoding everything).
- DOI 10.1038/nbt.4079

---

## 5 · Simulation tooling — directly reusable for `channel`
★ **Schwarz, Welzel, Kabdullayeva, Becker, Freisleben & Heider (2020). "MESA: automated assessment of synthetic DNA fragments and simulation of DNA synthesis, storage, sequencing and PCR errors."** *Bioinformatics* 36(11):3322–3326.
A working DNA-storage **error simulator + constraint checker** (GC%, homopolymers, motifs, per-process error rates). Borrow its error model and default rates for `channel`, and use it as an external check on `sequence_rules`.
- https://academic.oup.com/bioinformatics/article/36/11/3322/5780281 · DOI 10.1093/bioinformatics/btaa140
- Live tool: https://mesa.mosla.de · Source: https://github.com/umr-ds/mesa_dna_sim

**"A Bird's-Eye View on DNA Storage Simulators" (2024).** arXiv:2404.04877.
Survey of existing simulators — steal the channel-design choices instead of inventing them.
- https://arxiv.org/pdf/2404.04877

---

## Reading path in one line
Ceze review → Church (baseline) → Goldman (constraint-aware codec) → Grass (RS) → MESA (error model) → *then optionally* Erlich (fountain) + Bornholt (systems framing) for the report.

## What you actually need before coding
Just the ★ five. The rest is report ammunition and stretch material.
