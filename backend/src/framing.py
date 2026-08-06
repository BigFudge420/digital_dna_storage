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
    strands = sorted(strands, key=lambda s: struct.unpack(INDEX_FMT, s[:INDEX_SIZE])[0])
    body = b"".join(s[INDEX_SIZE:] for s in strands)   # drop headers, concat payloads
    (length,) = struct.unpack(LENGTH_FMT, body[:LENGTH_SIZE])
    return body[LENGTH_SIZE:LENGTH_SIZE + length]      # skip length field, trim padding

