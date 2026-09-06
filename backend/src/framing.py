#framing : chops the bytes into a fixed lenth and indexes the strans and then reseables them 

import struct
# struct is a stdlib holds the proper raw bytes width 
INDEX_FMT   = ">H"                        
INDEX_SIZE  = struct.calcsize(INDEX_FMT)  
LENGTH_FMT  = ">I"                        
LENGTH_SIZE = struct.calcsize(LENGTH_FMT)

#fucntion to read the frames of bytes 

def frame(data: bytes, payload_len: int = 32) -> list[bytes]:
    body = struct.pack(LENGTH_FMT, len(data)) + data   # prepend original length
    strands = []
    for i in range(0, len(body), payload_len):
        chunk  = body[i:i + payload_len]
        chunk  = chunk.ljust(payload_len, b"\x00")     # pad final chunk to fixed length
        index  = i // payload_len
        header = struct.pack(INDEX_FMT, index)
        strands.append(header + chunk)
    return strands

#fucntion to decode the frames 

def deframe(strands: list[bytes]) -> bytes:
    if not strands:
        raise ValueError("no strands to reassemble")

    # parse each index once and keep it attached to its own strand
    pairs = [(struct.unpack(INDEX_FMT, s[:INDEX_SIZE])[0], s) for s in strands]
    pairs.sort(key=lambda p: p[0])

    # the index set must be exactly 0..n-1 : a gap and a duplicate both break this
    indices = [i for i, _ in pairs]
    if indices != list(range(len(pairs))):
        raise ValueError(
            f"strand indices are not 0..n-1: expected "
            f"{list(range(len(pairs)))}, got {indices}"
        )

    body = b"".join(s[INDEX_SIZE:] for _, s in pairs)   # drop headers, concat payloads

    if len(body) < LENGTH_SIZE:
        raise ValueError(f"body is {len(body)} bytes, too short to hold the length field")

    (length,) = struct.unpack(LENGTH_FMT, body[:LENGTH_SIZE])
    if LENGTH_SIZE + length > len(body):               # a slice would truncate silently
        raise ValueError(
            f"length field claims {length} bytes but only "
            f"{len(body) - LENGTH_SIZE} are present"
        )

    return body[LENGTH_SIZE:LENGTH_SIZE + length]      # skip length field, trim padding

