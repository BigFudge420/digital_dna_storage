# Project Roadmap: DNA-Based Data Storage Capstone Demo

**Project Scope:** College Final Year Project (2 Semesters / ~8 Months)  
**Objective:** Build a working simulation MVP of a DNA-based key-value archival system to validate encoding, constraints, and error correction metrics, securing university permission for small-scale wet-lab synthesis and sequencing.

---

## Phase 1: Core Simulation Pipeline & CLI (Semester 1)

### **Phase 1.1: DNA Codec Foundation (Weeks 1–3)**
- **Objective:** Convert digital bits into DNA nucleotides and back.
- **Tasks:**
  - Implement naive 2-bit mapping (00 $\rightarrow$ A, 01 $\rightarrow$ C, 10 $\rightarrow$ G, 11 $\rightarrow$ T).
  - Implement Goldman ternary rotating encoder/decoder to ensure zero homopolymers ($L_{homo} = 1$).
- **Deliverable:** Working codec module with unit tests showing 100% roundtrip recovery for plain text.

### **Phase 1.2: Biological Constraint Checker (Weeks 4–6)**
- **Objective:** Screen sequences for physical synthesizability.
- **Tasks:**
  - Build checks for GC content percentage (target range: $40\% - 60\%$).
  - Build checks for homopolymer runs (flag repetitions $>3$ bases).
  - Design index/addressing format to support multi-strand payload chunking.
- **Deliverable:** Validation class returning diagnostic metrics for candidate DNA strands.

### **Phase 1.3: Reed-Solomon Error Correction (Weeks 7–9)**
- **Objective:** Mitigate base mutations during storage.
- **Tasks:**
  - Integrate a block-level Reed-Solomon (RS) outer error correction code.
  - Configure tunable parity overhead to test error-recovery capacity.
- **Deliverable:** ECC wrapper adding error resilience to the encoded byte stream.

### **Phase 1.4: Stochastic Degradation Simulator (Weeks 10–12)**
- **Objective:** Test pipeline robustness under noise in-silico.
- **Tasks:**
  - Implement a mutation channel model applying random base substitutions, insertions, deletions, and strand dropouts.
  - Perform validation tests of the full pipeline (File $\rightarrow$ RS ECC $\rightarrow$ Goldman Mapping $\rightarrow$ Simulated Noise $\rightarrow$ Decoding $\rightarrow$ Recovery).
- **Deliverable:** Consolidated command-line demo (`dna_storage_mvp.py`) showing data roundtrip metrics.

---

## Phase 2: Web Interface & Wet-Lab Proposal (Semester 2)

### **Phase 2.1: Simple Consensus & Read Alignment (Weeks 13–15)**
- **Objective:** Reconstruct original sequences from multiple noisy reads.
- **Tasks:**
  - Implement a majority-vote consensus algorithm based on k-mer alignment.
  - Group simulation reads by payload ID and filter out insertion/deletion noise.
- **Deliverable:** Reassembly engine converting raw reads into high-fidelity sequences.

### **Phase 2.2: Visualization Web Dashboard (Weeks 16–18)**
- **Objective:** Demonstrate the project to the university committee.
- **Tasks:**
  - Build a Flask/FastAPI backend with a simple HTML5/CSS3 frontend.
  - Display charts for GC distribution, homopolymer check logs, and recovery rates under adjustable noise levels.
- **Deliverable:** Interactive web application for project demonstration.

### **Phase 2.3: University Proposal & Wet-Lab Protocol (Weeks 19–21)**
- **Objective:** Secure permission and funding for wet-lab procedures.
- **Tasks:**
  - Document the MVP validation metrics showing low logical error rates.
  - Draft the wet-lab protocol: specify Twist Bioscience/IDT synthesis orders, PCR primer designs, and Illumina/Nanopore sequencing parameters.
- **Deliverable:** Written research proposal submitted to the academic committee.

### **Phase 2.4: Wet-Lab Execution & Project Defense (Weeks 22–24)**
- **Objective:** Synthesis, sequencing, and final defense.
- **Tasks:**
  - Synthesize a small text payload (e.g., 10 KB).
  - Perform sequencing and run the decoder to recover original data.
  - Write project report and defend the thesis.
- **Deliverable:** Error-free recovery of physical DNA storage payload and project presentation.
