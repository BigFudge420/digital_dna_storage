"""
Stochastic DNA Degradation & Mutation Simulator
"""
import random

class StorageChannel:
    def __init__(self, seed: int | None = None):
        self.rng = random.Random(seed)


    def simulate_noise(self, sequences: list[str],
                       sub_prob: float = 0.0,
                       ind_prob: float = 0.0,
                       drop_strand_prob: float = 0.0,
                       coverage: int = 1) -> list[str]:
        reads: list[str] = []
        for seq in sequences:
            for _ in range(coverage):
                reads.append(self._substitute(seq, sub_prob))   # ← wiring goes HERE
        return reads

    def _substitute(self, seq: str, sub_prob: float) -> str:
        out: list[str] = []
        for base in seq:
            if self.rng.random() < sub_prob:
                out.append(self.rng.choice([b for b in "ACGT" if b != base]))
            else:
                out.append(base)
        return "".join(out)