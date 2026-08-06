import random
import pytest
from src.codecs import naive, goldman
from src.pipeline import encode, decode

PAYLOAD = b"Isaac -> DNA -> Isaac. " * 10
CODECS = [naive, goldman]

@pytest.mark.parametrize("codec", CODECS, ids=["naive", "goldman"])
def test_roundtrip_is_lossless(codec):
    strands = encode(PAYLOAD, codec=codec)
    assert all(set(s) <= {"A", "C", "G", "T"} for s in strands)
    assert decode(strands, codec=codec) == PAYLOAD

@pytest.mark.parametrize("codec", CODECS, ids=["naive", "goldman"])
def test_roundtrip_survives_shuffle(codec):
    strands = encode(PAYLOAD, codec=codec)
    random.shuffle(strands)
    assert decode(strands, codec=codec) == PAYLOAD