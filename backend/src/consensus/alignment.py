"""
Consensus Reassembly Engine Module
"""
from collections import Counter

class ConsensusAligner:
    def align_and_reconstruct(self, reads: list[str]) -> str:
        if not reads:
            raise ValueError("no reads to reconstruct from") ## no reads 

        lengths = {len(r) for r in reads}
        if len(lengths) != 1:
            raise ValueError(
                f"reads have lengths {sorted(lengths)} — voting needs equal "
                "lengths; unequal reads mean indels and need a real alignment" ##collapses lengths to distinct numbers if 3 times 132 means {3}
            )

        consensus = []
        for column in zip(*reads):
            base, _ = Counter(column).most_common(1)[0]
            consensus.append(base)

        return "".join(consensus)