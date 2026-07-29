#wires ts together 
#pulls the naive module so we use encode decode
from src.framing import frame, deframe
from src.codecs import naive


def encode(data: bytes, payload_len: int = 32) -> list[str]:
    return [naive.encode(strand) for strand in frame(data, payload_len)]


def decode(strands: list[str]) -> bytes:
    return deframe([naive.decode(strand) for strand in strands])