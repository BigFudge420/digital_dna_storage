# Digital DNA Storage: Capstone Project Execution Roadmap (Phase 1 & 2)

**Academic Level:** Undergraduate College Capstone / Final Year Project (2 Semesters, ~8 Months)  
**Project Title:** Design and Simulation of a DNA-Based Key-Value Data Archival System  
**Focus:** Implementation of DNA encoding algorithms, error correction, stochastic mutation simulation, and a diagnostic web dashboard.

---

## Capstone Project Overview
This roadmap is tailored for a final year undergraduate engineering or biotechnology team. The goal is to build an end-to-end software simulation of digital DNA storage. Instead of utilizing complex production-grade deep learning or high-complexity custom convolution codes, this curriculum employs robust standard libraries (such as `scipy`, `numpy`, and pure Python arithmetic) combined with lightweight consensus algorithms.

```
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                     SEMESTER 1: PHASE 1 (Months 1–4)                    │
   │        Core Codec Pipeline, Bio-Filters & Error Channel Simulator       │
   └────────────────────────────────────┬────────────────────────────────────┘
                                        │
                                        ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                     SEMESTER 2: PHASE 2 (Months 5–8)                    │
   │       Read Consensus Decoding, Benchmarking Suite & Web Dashboard       │
   └─────────────────────────────────────────────────────────────────────────┘
```

---

# SEMESTER 1 — PHASE 1: Core Simulation & Coding Pipeline (Months 1–4)

### **Objective**
Establish the fundamental coding pipeline. By the end of Semester 1, the team will have a working Command-Line Interface (CLI) that takes arbitrary digital files, encodes them into synthetically valid DNA sequences, simulates degradation/sequencing noise, and decodes the files back error-free using Reed-Solomon protection.

---

## Month 1: Project Setup & Baseline DNA Mappers
- **Goals:**
  - Define file structure, version control (Git), and select Python 3.10+ as the core language.
  - Implement a binary-to-base converter mapping 2 bits per base (`00` $\rightarrow$ A, `01` $\rightarrow$ C, `10` $\rightarrow$ G, `11` $\rightarrow$ T).
  - Implement the **Goldman et al. (2013)** rotating ternary mapping matrix (prevents homopolymers by choosing base options relative to the previous base: $L_{homo} = 1$).
- **Methodology & Citations:**
  - Follow the rotating base conversion principles described in *Goldman et al. (2013, Nature)*.
- **Deliverables:**
  - Modules: `src/codecs/naive.py` and `src/codecs/goldman.py` (`encode` and `decode` functions).
  - Unit tests verifying exact roundtrip recovery for small text files.

---

## Month 2: Biological Constraint Validator
- **Goals:**
  - Implement a validator to evaluate whether generated DNA sequences satisfy physical synthesis requirements:
    - **GC-Content Checker:** Target range $40\% - 60\%$.
    - **Homopolymer Run Length Check:** Prevent sequences containing repeat runs $>3$ consecutive identical bases.
  - Design a payload index/addressing format (framing) so that multiple strands can be reassembled in the correct order.
- **Methodology & Citations:**
  - Model sequence criteria based on commercial array synthesis constraints from *Twist Bioscience* and *Integrated DNA Technologies (IDT)*.
- **Deliverables:**
  - Module: `src/validators/sequence_rules.py` containing a `SequenceValidator` class returning pass/fail flags and diagnostic metrics (GC %, max homopolymer length).

---

## Month 3: Error Correcting Code (ECC) Layer
- **Goals:**
  - Integrate an algebraic error-correcting code to protect against base mutations.
  - Use Python's standard libraries or a lightweight Galois Field package to implement a block-level **Reed-Solomon (RS)** encoder and decoder.
- **Methodology & Citations:**
  - Reference *Grass et al. (ETH Zurich, 2015, Angew. Chem.)* for using RS codes over finite fields to correct base substitution errors and strand losses.
- **Deliverables:**
  - Module: `src/ecc/rs_codec.py` integrating Reed-Solomon parity generation.
  - Demonstration script showing recovery of data with up to $10\%$ corrupted bytes.

---

## Month 4: Stochastic DNA Mutation Simulator (Semester 1 Milestone)
- **Goals:**
  - Construct a noise simulator modeling the biological storage channel:
    - Substitution probability ($P_{sub}$).
    - Deletion probability ($P_{del}$) and Insertion probability ($P_{ins}$).
    - Complete strand loss (erasure rate).
  - Test the entire pipeline: **File $\rightarrow$ RS ECC $\rightarrow$ Goldman Encoding $\rightarrow$ Mutation Noise $\rightarrow$ Decoding $\rightarrow$ Recovery**.
- **Methodology & Citations:**
  - Model error rates based on sequencing profile distributions in the Microsoft/UW ASPLOS 2016 paper (*Bornholt et al.*).
- **Deliverables:**
  - Module: `src/simulator/channel.py`.
  - **Semester 1 Final Presentation:** A working CLI pipeline that encodes, simulates noise, decodes, and measures data recovery success rates.

---

# SEMESTER 2 — PHASE 2: Visualization, Consensus & Analysis (Months 5–8)

### **Objective**
Enhance the simulation pipeline by adding sequencing read alignment, establishing a comparative benchmarking engine, and building an interactive web dashboard for project demonstration.

---

## Month 5: Read Consensus Reconstruction
- **Goals:**
  - Implement a consensus decoder. Since sequencing yields multiple noisy reads of the same strand, implement a consensus algorithm to rebuild the original sequence:
    - Group reads by index/address ID.
    - Implement a **Majority-Vote Consensus** algorithm (align reads using pairwise Levenshtein distance and select the most frequent base at each position to filter insertion/deletion noise).
- **Methodology & Citations:**
  - Reference consensus assembly strategies detailed in Oxford Nanopore read reconstruction pipelines (*Vaser et al., 2017*).
- **Deliverables:**
  - Module: `src/consensus/voter.py` returning high-fidelity consensus sequences from a pool of noisy reads.

---

## Month 6: Web Dashboard Development
- **Goals:**
  - Build an interactive graphical user interface (GUI) to showcase the project:
    - **Backend:** Flask or FastAPI app serving as an API.
    - **Frontend:** HTML5/CSS3 dashboard (or a Streamlit/React application).
    - **Features:** File upload, selector for encoding algorithms (Naive vs. Goldman), slider to adjust simulated error rates, and visual charts showing GC distribution, mutation locations, and decoding accuracy.
- **Deliverables:**
  - Sub-directory: `src/dashboard/` containing app routing and visual widgets.

---

## Month 7: Benchmarking & Evaluation Suite
- **Goals:**
  - Run systematic comparative benchmarks:
    - Compare Naive 2-bit mapping against Goldman rotating codes.
    - Measure Net Logical Density ($\text{bits per nucleotide}$).
    - Record execution runtimes for encoding and decoding stages.
    - Plot decoding recovery rate against increasing simulation noise ($0\%$ to $15\%$ base error rates).
- **Deliverables:**
  - Script: `benchmarks/run_suite.py` producing diagnostic plots (using `matplotlib` or `seaborn`).

---

## Month 8: Project Thesis, Poster, and Final Defense
- **Goals:**
  - Compile the final capstone project thesis report.
  - Design a project poster highlighting the architecture, simulation results, and dashboard UI.
  - Final project demonstration and defense before the academic committee.
- **Deliverables:**
  - Completed Capstone Project Thesis document (PDF).
  - Open-Source GitHub repository containing clean, documented code and instructions to launch the dashboard.

---

## Capstone Project Directory Tree

```text
dna_storage_capstone/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── codecs/
│   │   ├── naive.py
│   │   └── goldman.py
│   ├── ecc/
│   │   └── rs_codec.py
│   ├── validators/
│   │   └── sequence_rules.py
│   ├── simulator/
│   │   └── channel.py
│   ├── consensus/
│   │   └── voter.py
│   └── dashboard/
│       ├── app.py
│       └── templates/
│           └── index.html
├── benchmarks/
│   └── run_suite.py
└── tests/
    └── test_pipeline.py
```
