# Digital DNA Storage

A Python simulation of a DNA based archival storage system. It translates a digital file into synthetic DNA sequences, checks them against biological constraints, protects the data with Reed Solomon error correcting codes, simulates the noise of a physical storage channel, and decodes the file back. Correctness is defined by one gate: a file must survive the encode, noise, and decode round trip byte for byte.

Scope: a two week software MVP. The science is written up in `Digital_DNA_Storage_Research_Report.md`, the plan in `Digital_DNA_Storage_Roadmap.md` and `Phase_1_2_Detailed_Roadmap.md`, and the references in `resources/`.

## How it works

1. **Framing** splits the file into fixed length strands, each tagged with an index so the original order can be rebuilt even if strands are shuffled or lost.
2. **Codec** maps bytes to the four DNA bases (A, C, G, T). The naive codec is the baseline; the Goldman codec is the constraint aware target.
3. **Validators** check each strand against sequence rules such as homopolymer runs and GC balance.
4. **Reed Solomon coding** adds redundancy so a noisy read can still be recovered.
5. **Simulator** models the storage channel: synthesis and sequencing errors, strand dropout, and multiple noisy reads per strand.
6. **Consensus** reconstructs each strand from its noisy reads before decoding.

## Structure

```text
src/
  pipeline.py            integrator: file to DNA strands and back
  framing.py             chunk the file into indexed strands and reassemble
  codecs/
    naive.py             baseline byte to base mapping
    goldman.py           constraint aware codec (target)
  ecc/
    rs_codec.py          Reed Solomon error correcting code
  validators/
    sequence_rules.py    biological constraint checks
  simulator/
    channel.py           storage channel noise model
  consensus/
    alignment.py         rebuild strands from multiple noisy reads
_check.py                round trip self check
resources/               reading list and reference papers
Digital_DNA_Storage_Research_Report.md
Digital_DNA_Storage_Roadmap.md
Phase_1_2_Detailed_Roadmap.md
```

## Setup

Requires Python 3.10 or newer.

```bash
pip install -r requirements.txt
```

## Running the round trip check

```bash
python _check.py
```

It encodes a sample payload to DNA, confirms every strand is valid DNA, shuffles the strands, and verifies the decode returns the original bytes. On success it prints `pipeline round-trip OK`.

## Status

The file to DNA to file round trip runs today on the naive codec. The constraint aware Goldman codec, Reed Solomon coding, validators, channel simulation, and consensus are being built out across the two week plan.
