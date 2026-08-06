"""
Naive 2-Bit Codec Module for DNA Digital Data Storage.

This module provides standard 2-bit binary mapping between digital byte streams 
and DNA nucleotide sequences (A, C, G, T):
    00 -> A (Adenine)
    01 -> C (Cytosine)
    10 -> G (Guanine)
    11 -> T (Thymine)

Each byte (8 bits) translates directly to 4 DNA nucleotides.
"""

# Mapping 2-bit integer values (0b00 - 0b11) to corresponding DNA nucleotides
NUCLEOTIDE_MAP: dict[int, str] = {
    0b00: "A",
    0b01: "C",
    0b10: "G",
    0b11: "T"
}

# Inverse mapping from DNA nucleotides (A, C, G, T) to 2-bit integer values
REVERSE_NUCLEOTIDE_MAP: dict[str, int] = {
    "A": 0b00,
    "C": 0b01,
    "G": 0b10,
    "T": 0b11
}


def encode(data: bytes) -> str:
    """
    Encodes raw binary data into a DNA nucleotide string using naive 2-bit mapping.

    Args:
        data (bytes): Input byte stream to be encoded.

    Returns:
        str: Encoded DNA nucleotide sequence containing 'A', 'C', 'G', and 'T'.
    """
    # Accumulator list for encoded nucleotide characters
    SEQUENCE: list[str] = []

    # Iterate through each byte in the input byte stream
    for byte in data:
        # Extract 2-bit pairs from most significant (bits 7-6) to least significant (bits 1-0)
        SEQUENCE.append(NUCLEOTIDE_MAP[(byte >> 6) & 0b11])  # Bits 7-6
        SEQUENCE.append(NUCLEOTIDE_MAP[(byte >> 4) & 0b11])  # Bits 5-4
        SEQUENCE.append(NUCLEOTIDE_MAP[(byte >> 2) & 0b11])  # Bits 3-2
        SEQUENCE.append(NUCLEOTIDE_MAP[byte & 0b11])         # Bits 1-0

    # Join the accumulated nucleotide characters into a single string
    return "".join(SEQUENCE)


def decode(dna_sequence: str) -> bytes:
    """
    Decodes a DNA nucleotide string back into the original raw byte stream.

    Args:
        dna_sequence (str): DNA sequence consisting of 'A', 'C', 'G', 'T' (case-insensitive).

    Returns:
        bytes: Recovered raw byte stream.

    Raises:
        ValueError: If the input DNA sequence length is not a multiple of 4.
        KeyError: If an invalid character outside {A, C, G, T} is encountered.
    """
    # 4 nucleotides are required to reconstruct 1 byte (8 bits)
    if len(dna_sequence) % 4 != 0:
        raise ValueError("DNA Sequence length should be a multiple of 4!")

    # Byte array to store the reconstructed raw bytes
    byte_array: bytearray = bytearray()

    # Process nucleotides in groups of 4 (representing 1 byte each)
    i: int
    for i in range(0, len(dna_sequence), 4):
        # Look up 2-bit integer values for each group of 4 nucleotides
        b1: int = REVERSE_NUCLEOTIDE_MAP[dna_sequence[i].upper()]
        b2: int = REVERSE_NUCLEOTIDE_MAP[dna_sequence[i+1].upper()]
        b3: int = REVERSE_NUCLEOTIDE_MAP[dna_sequence[i+2].upper()]
        b4: int = REVERSE_NUCLEOTIDE_MAP[dna_sequence[i+3].upper()]

        # Reconstruct the original 8-bit byte value by bitwise shifting and OR operations
        byte_val: int = (b1 << 6) | (b2 << 4) | (b3 << 2) | b4
        byte_array.append(byte_val)

    # Convert bytearray back to immutable bytes object
    return bytes(byte_array)