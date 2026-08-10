#wires ts together
#pulls the naive module so we use encode decode
from dataclasses import dataclass, field
from src.framing import frame, deframe
from src.codecs import naive


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


def decode(strands: list[str], codec=naive) -> bytes:
    return deframe([codec.decode(strand) for strand in strands])


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
    if noise.get("coverage", 1) != 1:
        raise NotImplementedError(
            "coverage > 1 needs consensus/alignment.py — deframe concatenates "
            "every read it is given, so duplicate copies corrupt reassembly"
        )

    strands = encode(data, payload_len, codec)
    reads = channel.simulate_noise(strands, **noise) if channel else list(strands)

    try:
        out = decode(reads, codec=codec)
    except Exception as e:
        return RoundTripResult(strands, reads, None, "crashed", e)

    return RoundTripResult(strands, reads, out, "ok" if out == data else "corrupted")