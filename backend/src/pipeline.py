#wires ts together
#pulls the naive module so we use encode decode
import struct
from dataclasses import dataclass, field
from src.framing import frame, deframe, INDEX_FMT, INDEX_SIZE
from src.codecs import naive
from src.consensus.alignment import ConsensusAligner


@dataclass
class RoundTripResult:
    # strands and reads stay out of the repr — printing a result in a REPL would
    # otherwise dump every base of every molecule.
    strands: list[str] = field(repr=False)   # clean DNA, one per strand
    reads:   list[str] = field(repr=False)   # what came back off the channel
    output:  bytes | None                    # None when the decoder raised
    status:  str                             # "ok" | "corrupted" | "crashed"
    error:   Exception | None = None


def encode(data: bytes, payload_len: int = 32, codec=naive) -> list[str]:
    return [codec.encode(strand) for strand in frame(data, payload_len)]


def group_by_index(reads: list[str], codec) -> dict[int, list[str]]:
    """Bucket reads by the strand index carried in their frame header.

    frame() writes the 2-byte index into the payload before the codec sees it,
    so grouping needs no clustering and survives the uneven groups that dropout
    creates. Failure mode: a substitution inside the index misfiles one read —
    coverage outvotes it, and a spurious out-of-range index is caught downstream
    by deframe's contiguity guard.
    """
    groups: dict[int, list[str]] = {}
    for read in reads:
        # full-decode to read 2 header bytes is wasteful but O(len) — fine at PoC scale.
        index = struct.unpack(INDEX_FMT, codec.decode(read)[:INDEX_SIZE])[0]
        groups.setdefault(index, []).append(read)
    return groups


def decode(reads: list[str], codec=naive) -> bytes:
    # every coverage routes through consensus: coverage 1 is a one-read group and
    # align_and_reconstruct returns it unchanged, so there is no special case.
    aligner = ConsensusAligner()
    groups = group_by_index(reads, codec)

    # A substitution inside the 8-nt header misfiles a read into a spurious index,
    # forming a singleton bucket that would trip deframe's 0..n-1 guard and crash an
    # otherwise-recoverable decode. Real strands cluster at the coverage depth; header
    # noise sits at support ~1. Keep buckets with support >= half the deepest bucket.
    # Coverage 1 -> max_support 1 -> threshold 1 -> keeps all (no-op). deframe's
    # contiguity guard stays downstream, so wrongly dropping a real strand still
    # crashes loud — this can never turn a crash into silent corruption.
    if groups:
        threshold = (max(len(v) for v in groups.values()) + 1) // 2
        groups = {i: v for i, v in groups.items() if len(v) >= threshold}

    strands = [aligner.align_and_reconstruct(groups[i]) for i in sorted(groups)]
    return deframe([codec.decode(s) for s in strands])


def roundtrip(data: bytes, *, codec=naive, payload_len: int = 32,
              channel=None, **noise) -> RoundTripResult:
    """encode -> channel -> decode, with the outcome reported instead of raised.

    channel is any object with .simulate_noise(sequences, **kwargs).
    None means a perfect medium.
    """
    if channel is None and noise:
        raise ValueError(
            f"noise parameters {sorted(noise)} passed with no channel — "
            "they would be silently ignored"
        )

    strands = encode(data, payload_len, codec)
    reads = channel.simulate_noise(strands, **noise) if channel else list(strands)

    try:
        out = decode(reads, codec=codec)
    except Exception as e:
        return RoundTripResult(strands, reads, None, "crashed", e)

    return RoundTripResult(strands, reads, out, "ok" if out == data else "corrupted")
