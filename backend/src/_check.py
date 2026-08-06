#checking if the piplines run the deframe and the frame 

import random
from src.pipeline import encode, decode

d = b"Isaac -> DNA -> Isaac. " * 10
dna = encode(d)

assert all(set(s) <= {"A", "C", "G", "T"} for s in dna)   # every strand is valid DNA
assert decode(dna) == d                                    # lossless round-trip
random.shuffle(dna)
assert decode(dna) == d                                    
print("pipeline round-trip OK")