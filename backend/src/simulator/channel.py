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
        # indels change read length, which the consensus aligner can't vote over
        # (it needs equal-length reads). Refuse loudly rather than silently ignore
        # ind_prob — same stance as roundtrip's noise-parameter guard.
        if ind_prob:
            raise NotImplementedError(
                "ind_prob (indels) not implemented — would produce unequal-length "
                "reads the column vote can't align; wire real alignment first"
            )
        reads: list[str] = []
        for seq in sequences:
            # per-strand dropout: the whole strand (all its copies) is lost at once —
            # the catastrophic case consensus cannot fix and the outer code is for.
            # guard the draw on drop_strand_prob so the RNG stream is unchanged when off.
            if drop_strand_prob and self.rng.random() < drop_strand_prob:
                continue
            for _ in range(coverage):
                reads.append(self._substitute(seq, sub_prob))
        return reads

    def _substitute(self, seq: str, sub_prob: float) -> str:
        out: list[str] = []
        for base in seq:
            if self.rng.random() < sub_prob:
                out.append(self.rng.choice([b for b in "ACGT" if b != base]))
            else:
                out.append(base)
        return "".join(out)