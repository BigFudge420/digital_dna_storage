# Digital DNA Storage: Capstone Project Research Report

**A Practical Guide for Final Year Biotechnology & CS Capstone Teams**

---

## Abstract

This research report provides a practical, first-principles foundation for implementing a software simulation MVP of digital DNA data storage. The goal is to demonstrate digital data encryption into DNA with minimal error rates, serving as a technical proposal to secure university permission and funding for wet-lab synthesis. We cover biophysical constraints, encoding algorithms, error correction using Reed-Solomon codes, stochastic channel simulation, read consensus, and the experimental protocol for wet-lab integration.

---

## 1. Biophysical Sequences Constraints & Encodings

Synthetic DNA molecules are constrained by chemical and enzymatic limits during synthesis (writing) and sequencing (reading). A successful software encoder must strictly enforce three rules to ensure synthesizability:

1. **GC-Content Balance:** The percentage of Guanine ($G$) and Cytosine ($C$) bases must be maintained between $40\%$ and $60\%$:
   $$\text{GC \%} = \frac{N_G + N_C}{N_A + N_C + N_G + N_T} \times 100$$
   Deviations from this range lead to uneven melting temperatures ($T_m$), causing secondary structures or failures in PCR amplification.
2. **Homopolymer Runs:** Repeating runs of the same base (e.g., `AAAA` or `GGGG`) must be prevented. Polymerase enzymes are prone to "slipping" on repetitive sequences, causing insertion and deletion (indel) errors.
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
- **Implementation:** Galois Field $\mathbb{GF}(2^8)$ arithmetic is implemented using primitive polynomial $p(x) = x^8 + x^4 + x^3 + x^2 + 1$ (0x11D). Multiplications are performed using precomputed Log and Anti-Log tables for performance.

---

## 3. Stochastic Channel Simulation & Consensus

To validate the encoder and decoder before ordering physical synthesis, the software simulates degradation and sequencing noise:

```
Original Data ──> RS Encoded ──> Goldman DNA ──> [Stochastic Mutation Channel] ──> Decoded DNA ──> RS Decoded ──> Recovered Data
```

1. **Substitution Noise ($P_{sub}$):** Simulates errors where one base is replaced by another (predominant in Illumina sequencing).
2. **Insertion/Deletion Noise ($P_{ins}, P_{del}$):** Simulates frame-shift mutations (predominant in Oxford Nanopore sequencing).
3. **Consensus Reconstruction:** Grouping multiple noisy reads of the same DNA strand and performing **Majority-Vote Consensus** to filter out insertion/deletion errors.

---

## 4. Wet-Lab Integration Protocol

Once the MVP simulation demonstrates successful data recovery under simulated noise, the following protocol is prepared for the university wet-lab run:

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

## 5. College Project Milestones & Verification

| Milestone | Target Semester | Deliverable | Verification Metric |
| :--- | :--- | :--- | :--- |
| **M1: Codec Engine** | Semester 1 | Goldman & RS Code modules | 100% data recovery on error-free files |
| **M2: Simulator** | Semester 1 | Stochastic Mutation Channel script | Bit Error Rate (BER) vs Parity Overhead plots |
| **M3: Interface** | Semester 2 | HTML5/Flask web dashboard | Visual demonstration of file upload and decoding |
| **M4: Proposal** | Semester 2 | Written Wet-lab protocol & permission paper | Submission of formal proposal to college committee |
| **M5: Wet-Lab** | Semester 2 | Decoded physical sequencing file | Recovered digital file matches original hash |
