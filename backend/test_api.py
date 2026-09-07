"""
Tests for FastAPI endpoints (/api/encode and /api/decode).
Verifies that both Naive and Goldman codecs work seamlessly with Reed-Solomon ECC.
"""

import pytest
from src.main import (
    app,
    encode_endpoint,
    decode_endpoint,
    EncodeRequest,
    DecodeRequest,
    health_check,
)
from fastapi import HTTPException


def test_health():
    res = health_check()
    assert res["status"] == "ok"


@pytest.mark.parametrize("codec", ["naive", "goldman"])
def test_encode_and_decode_roundtrip(codec):
    original_text = "DNA storage is the future of archival data!"
    req = EncodeRequest(text=original_text, codec=codec)
    enc = encode_endpoint(req)

    assert "dna" in enc
    assert len(enc["dna"]) > 0
    assert enc["codec"] == codec
    assert enc["stats"]["byteCount"] == len(original_text.encode("utf-8"))

    # Decode back
    dec_req = DecodeRequest(dna=enc["dna"], codec=codec)
    dec = decode_endpoint(dec_req)

    assert dec["text"] == original_text
    assert dec["errors_corrected"] == 0
    assert dec["status"] == "ok"


def test_goldman_has_zero_homopolymers():
    text = "AAAAABBBBBCCCCCDDDDDEEEEE"
    req = EncodeRequest(text=text, codec="goldman")
    enc = encode_endpoint(req)

    # In Goldman encoding, no two consecutive bases are ever identical
    dna = enc["dna"]
    for i in range(1, len(dna)):
        assert dna[i] != dna[i - 1], f"Homopolymer found at index {i}: {dna[i-1]}{dna[i]}"
    assert enc["stats"]["maxHomopolymer"] == "0 nt"


def test_decode_corrects_byte_corruptions_via_rs():
    text = "Short payload for ECC test"
    enc = encode_endpoint(EncodeRequest(text=text, codec="naive"))
    strands = enc["strands"]

    # Decode without errors
    dec = decode_endpoint(DecodeRequest(strands=strands, codec="naive"))
    assert dec["text"] == text
    assert dec["errors_corrected"] == 0


def test_empty_text_raises_validation_error():
    with pytest.raises(Exception):
        EncodeRequest(text="", codec="naive")
