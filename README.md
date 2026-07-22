# Digital DNA Storage

A python-based simulation MVP of a DNA-based archival storage system. Translates digital files into synthetic DNA sequences, evaluates biological constraints, protects data using Reed-Solomon Error Correcting Codes (ECC), simulates physical storage channel noise, and decodes original files.

## Project Structure

```text
.
├── README.md
├── requirements.txt
├── Digital_DNA_Storage_Research_Report.md
├── Digital_DNA_Storage_Roadmap.md
├── Phase_1_2_Detailed_Roadmap.md
├── resources/
└── src/
    ├── __init__.py
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
