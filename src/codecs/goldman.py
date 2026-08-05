"""
Goldman Rotating Ternary Codec Module (Goldman et al. 2013)
"""

NUCLEOTIDES = ["A", "C", "G", "T"]

def encode(data: bytes) -> str:
    prev = None
    SEQUENCE = []

    for byte in data:
        trits = convert_to_ternary(byte)

        for trit in trits:
            if prev is None:
                SEQUENCE.append(NUCLEOTIDES[int(trit)])
            else:
                temp = NUCLEOTIDES.copy()
                temp.remove(prev)

                SEQUENCE.append(temp[int(trit)])
            
            prev = NUCLEOTIDES[int(trit)]

def decode(dna_sequence: str) -> bytes:
    #initialize variables
    #loop through bases
        #index and append, seet prev
    #convert from ternary and return
    pass

def convert_to_ternary(byte: int) -> str:
    trits = []

    while byte:
        trits.append(str(byte % 3))
        byte //= 3

    return "".join(reversed(trits)).zfill(6) or "0" 


def convert_from_ternary(trits: str) -> bytes:
    pass

if __name__ == '__main__':
    print(convert_to_ternary(6))