import random
import pytest
from src.codecs import naive, goldman
from src.pipeline import encode, decode, roundtrip
from src.simulator.channel import StorageChannel

PAYLOAD = b"Isaac -> DNA -> Isaac. " * 10
CODECS = [naive, goldman]
SHUFFLE_SEED = 20260817    # fixed so a failure can be replayed

@pytest.mark.parametrize("codec", CODECS, ids=["naive", "goldman"])
def test_roundtrip_is_lossless(codec):
    strands = encode(PAYLOAD, codec=codec)
    assert all(set(s) <= {"A", "C", "G", "T"} for s in strands)
    assert decode(strands, codec=codec) == PAYLOAD

@pytest.mark.parametrize("codec", CODECS, ids=["naive", "goldman"])
def test_roundtrip_survives_shuffle(codec):
    strands = encode(PAYLOAD, codec=codec)
    shuffled = list(strands)
    random.Random(SHUFFLE_SEED).shuffle(shuffled)
    assert shuffled != strands, "seed did not reorder — the test proves nothing"
    assert decode(shuffled, codec=codec) == PAYLOAD


# --- consensus (coverage > 1) ------------------------------------------------

def test_consensus_votes_out_body_substitutions():
    # 3 copies per strand, one base corrupted in ONE copy's body (header left clean
    # so grouping is unaffected). The per-column majority vote must restore it.
    strands = encode(PAYLOAD, codec=naive)
    reads: list[str] = []
    for s in strands:
        copies = [s, s, s]
        corrupt = list(copies[0])
        corrupt[10] = "A" if corrupt[10] != "A" else "C"   # nt 10 is body, not the 8-nt header
        copies[0] = "".join(corrupt)
        reads.extend(copies)
    assert decode(reads, codec=naive) == PAYLOAD


def test_coverage_one_is_a_consensus_no_op():
    # the unified path must not disturb the plain single-copy round trip
    strands = encode(PAYLOAD, codec=naive)
    assert decode(strands, codec=naive) == PAYLOAD


def test_consensus_recovers_from_header_substitutions():
    # end-to-end: at a real substitution rate a fraction of reads get a corrupted
    # header and misfile to a garbage index. The minority-bucket filter must drop
    # those singletons so the deep, clean buckets still reassemble the file.
    r = roundtrip(PAYLOAD, codec=naive, channel=StorageChannel(seed=0),
                  sub_prob=0.02, coverage=5)
    assert r.status == "ok", f"expected recovery, got {r.status}: {r.error}"


def test_indel_noise_is_refused_not_ignored():
    # ind_prob is declared but not implemented — it must raise, not silently no-op.
    with pytest.raises(NotImplementedError, match="ind_prob"):
        StorageChannel(seed=1).simulate_noise(["ACGT"], ind_prob=0.1)


# --- strand dropout (per-strand) ---------------------------------------------

def test_dropout_is_per_strand_not_per_read():
    # a whole strand's copies vanish together, so the read count stays a multiple
    # of coverage — per-read dropout would break that. Also reproducible on a seed.
    strands = encode(PAYLOAD, codec=naive)
    reads = StorageChannel(seed=3).simulate_noise(strands, drop_strand_prob=0.5, coverage=3)
    assert len(reads) % 3 == 0
    reads2 = StorageChannel(seed=3).simulate_noise(strands, drop_strand_prob=0.5, coverage=3)
    assert reads == reads2


def test_dropout_off_does_not_touch_the_rng_stream():
    # the `if drop_strand_prob` guard means drop=0.0 is byte-identical to not passing it,
    # so existing seeded substitution expectations are preserved.
    strands = encode(PAYLOAD, codec=naive)
    a = StorageChannel(seed=5).simulate_noise(strands, sub_prob=0.05)
    b = StorageChannel(seed=5).simulate_noise(strands, sub_prob=0.05, drop_strand_prob=0.0)
    assert a == b


def test_missing_strand_is_detected():
    # a dropped strand leaves a gap in the index set — deframe's D1 guard must fire
    # through the consensus decode path, not silently corrupt the file.
    strands = encode(PAYLOAD, codec=naive)
    assert len(strands) > 3
    missing = strands[:2] + strands[3:]                # strand index 2 gone
    with pytest.raises(ValueError, match="indices are not"):
        decode(missing, codec=naive)


def test_full_dropout_reports_crashed():
    r = roundtrip(PAYLOAD, codec=naive, channel=StorageChannel(seed=1), drop_strand_prob=1.0)
    assert r.status == "crashed"
    assert isinstance(r.error, ValueError)