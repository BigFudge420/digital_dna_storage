"""
Goldman Rotating Ternary Codec Module (Goldman et al. 2013)

This module provides functions to encode binary data (bytes) into DNA sequence strings ('A', 'C', 'G', 'T')
and decode them back into binary data using Goldman's rotating ternary mapping scheme to avoid homopolymers.
"""

# DNA Nucleotide alphabet used for encoding
NUCLEOTIDES: list[str] = ["A", "C", "G", "T"]


def encode(data: bytes) -> str:
    """
    Encodes raw binary byte stream into a DNA sequence string using rotating ternary mapping.

    Args:
        data (bytes): Input byte stream to be encoded.

    Returns:
        str: Encoded DNA nucleotide sequence ('A', 'C', 'G', 'T').
    """
    # Track previous nucleotide to prevent identical consecutive bases (homopolymers)
    prev: str | None = None
    # Accumulate output DNA characters
    SEQUENCE: list[str] = []

    # Process input byte stream byte by byte
    for byte in data:
        # Convert each byte to a 6-character ternary string
        trits: str = convert_to_ternary(byte)

        # Map each trit (0, 1, 2) to a DNA nucleotide
        for trit in trits:
            if prev is None:
                # First base: map directly using standard NUCLEOTIDES list
                base: str = NUCLEOTIDES[int(trit)]
            else:
                # Subsequent bases: create candidate list excluding the previous nucleotide
                temp: list[str] = NUCLEOTIDES.copy()
                temp.remove(prev)

                # Select base from remaining candidates to guarantee no homopolymer repeats
                base = temp[int(trit)]

            SEQUENCE.append(base)
            # Update state with the newly appended base
            prev = base

    # Join accumulated nucleotide characters into a single DNA sequence string
    return "".join(SEQUENCE)


def decode(dna_sequence: str) -> bytes:
    """
    Decodes a Goldman-encoded DNA sequence string back into the original raw byte stream.

    Args:
        dna_sequence (str): DNA sequence consisting of nucleotides 'A', 'C', 'G', 'T'.

    Returns:
        bytes: Recovered raw byte stream.

    Raises:
        ValueError: If sequence length is not a multiple of 6 or starts with an invalid character.
    """
    # Each byte maps to 6 nucleotides (6 trits)
    if len(dna_sequence) % 6 != 0:
        raise ValueError("Seq. length must be a multiple of 6!")
    # Valid first trit mapped bases can only be A, C, or G (indices 0, 1, 2)
    if dna_sequence and dna_sequence[0] == 'T':
        raise ValueError("Seq. cannot start with a 'T'")
    
    # State tracking for previous nucleotide
    prev: str | None = None
    # Accumulate recovered trit characters ('0', '1', '2')
    TRITS: list[str] = []

    # Iterate through uppercase nucleotide characters
    for nucl in dna_sequence.upper():
        if prev == None:
            # Reconstruct first trit index from initial base
            trit: int = 2 if nucl == 'T' else NUCLEOTIDES.index(nucl)
        else: 
            # Reconstruct candidate list used during encoding
            temp: list[str] = NUCLEOTIDES.copy()
            temp.remove(prev)

            # Look up trit index from remaining candidates
            trit = temp.index(nucl)

        TRITS.append(str(trit))
        # Update state for next iteration
        prev = nucl
    
    # Convert accumulated trits back to original byte stream
    return convert_from_ternary("".join(TRITS))


def convert_to_ternary(byte: int) -> str:
    """
    Converts an 8-bit integer byte value (0-255) into a 6-digit base-3 (ternary) string.

    Args:
        byte (int): Integer byte value (0-255).

    Returns:
        str: 6-character string representing ternary digits ('0', '1', '2').
    """
    trits: list[str] = []

    # Successively extract base-3 remainders
    while byte:
        trits.append(str(byte % 3))
        byte //= 3

    # Reverse digits and pad with leading zeros to form a 6-trit string
    return "".join(reversed(trits)).zfill(6) or "0" 


def convert_from_ternary(trits: str) -> bytes:
    """
    Converts a sequence of ternary digits back into raw bytes (6 trits = 1 byte).

    Args:
        trits (str): Sequence of base-3 digit characters.

    Returns:
        bytes: Recovered raw byte stream.

    Raises:
        ValueError: If trit sequence length is not a multiple of 6.
    """
    # Verify exact 6-trit block structure
    if len(trits) % 6 != 0: 
        raise ValueError("Ternary length must be a multiple of 6") 

    decoded: bytearray = bytearray() 

    # Process trits in 6-character chunks corresponding to 1 byte each
    for i in range(0, len(trits), 6): 
        chunk: str = trits[i:i+6] 
        # Parse base-3 chunk string into byte integer
        decoded.append(int(chunk, 3)) 

    return bytes(decoded)


if __name__ == '__main__':
    message = 'Hello' 
    encoded = encode(message.encode('utf-8')) 
    decoded = decode(encoded) 
    print(message.encode('utf-8'))
    print(encoded) 
    print(decoded.decode('utf-8'))