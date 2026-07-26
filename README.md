# Digital DNA Storage

A Python simulation MVP of a DNA-based archival storage system. Translates digital files into synthetic DNA sequences, evaluates biological constraints, protects data using Reed-Solomon Error Correcting Codes (ECC), simulates physical storage channel noise, and decodes the original file — gated by an encode → noise → decode round-trip test in CI.

**Scope:** 2-week software MVP. Overview in `Digital_DNA_Storage_Roadmap.md`, day-by-day in `Phase_1_2_Detailed_Roadmap.md`, science in `Digital_DNA_Storage_Research_Report.md`, references in `resources/`.

## Project Structure

```text
.
├── README.md
├── requirements.txt
├── .gitignore
├── conftest.py
├── Digital_DNA_Storage_Research_Report.md
├── Digital_DNA_Storage_Roadmap.md
├── Phase_1_2_Detailed_Roadmap.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── resources/
│   └── reading-list.md
├── tests/
│   └── test_roundtrip.py
└── src/
    ├── __init__.py
    ├── pipeline.py            # integrator: file <-> DNA strands
    ├── framing.py             # chunk file into indexed strands + reassemble
    ├── codecs/
    │   ├── __init__.py
    │   ├── naive.py
    │   └── goldman.py
    ├── ecc/
    │   ├── __init__.py
    │   └── rs_codec.py
    ├── validators/
    │   ├── __init__.py
    │   └── sequence_rules.py
    ├── simulator/
    │   ├── __init__.py
    │   └── channel.py
    └── consensus/
        ├── __init__.py
        └── alignment.py
```

## Setup & Environment

Requires Python 3.10+.

```bash
pip install -r requirements.txt
```

## Running tests

```bash
pytest -v
```

The core gate is the **round-trip**: a file encoded to DNA, run through the simulated noise channel, and decoded back must match the original **byte-for-byte** (SHA-256). CI runs this on every push and pull request.
