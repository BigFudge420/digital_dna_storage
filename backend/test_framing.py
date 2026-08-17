#framing tests : bytes in, bytes out — no codec involved

import struct
import pytest
from src.framing import frame, deframe, INDEX_SIZE, LENGTH_FMT, LENGTH_SIZE

DATA = b"Isaac -> DNA -> Isaac. " * 10      # 230 bytes : not a multiple of payload_len


def test_roundtrip_is_lossless():
    assert deframe(frame(DATA)) == DATA     # also proves the tail padding is trimmed


def test_order_does_not_matter():
    strands = frame(DATA)
    assert deframe(list(reversed(strands))) == DATA


# --- the three defects from the 2026-08-14 audit ---

def test_missing_strand_raises():
    strands = frame(DATA)
    del strands[2]
    with pytest.raises(ValueError, match=r"indices are not"):
        deframe(strands)


def test_duplicate_strand_raises():
    strands = frame(DATA)
    with pytest.raises(ValueError, match=r"indices are not"):
        deframe(strands + [strands[0]])


def test_forged_length_field_raises():
    strands = frame(DATA)
    # the length field is the first 4 bytes of strand 0's payload, after its index
    head = strands[0][:INDEX_SIZE]
    tail = strands[0][INDEX_SIZE + LENGTH_SIZE:]
    strands[0] = head + struct.pack(LENGTH_FMT, 9999) + tail
    with pytest.raises(ValueError, match=r"length field claims"):
        deframe(strands)


def test_empty_input_raises():
    with pytest.raises(ValueError, match=r"no strands"):
        deframe([])


# --- what the guard must NOT do ---

def test_understated_length_is_not_caught():
    """A length field claiming FEWER bytes than exist passes silently.

    Not a bug in deframe — the frame carries nothing to detect it with.
    Catching this needs a hash over the original bytes (definition-of-done 1).
    """
    strands = frame(DATA)
    head = strands[0][:INDEX_SIZE]
    tail = strands[0][INDEX_SIZE + LENGTH_SIZE:]
    strands[0] = head + struct.pack(LENGTH_FMT, 10) + tail
    assert deframe(strands) == DATA[:10]
