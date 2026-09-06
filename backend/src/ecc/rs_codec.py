"""
Reed-Solomon Error-Correcting Code (ECC) Module.

Protects payload data against byte corruptions (substitutions/errors)
during DNA synthesis, storage, and sequencing using Reed-Solomon coding over GF(2^8).
"""
from reedsolo import RSCodec, ReedSolomonError

# 10 parity bytes allows detecting and correcting up to 5 (parity // 2) corrupted bytes per block.
# (Hardcoded for now; will be moved to a configuration file in a later phase).
rs = RSCodec(10)


def encode_rs(data: bytes) -> bytes:
    """
    Encode raw bytes by appending Reed-Solomon parity bytes.

    Args:
        data: Raw payload bytes to protect.

    Returns:
        bytes: The original data with 10 parity bytes appended at the end.
    """
    encoded = rs.encode(bytearray(data))
    return bytes(encoded)


def decode_rs(data_array: bytes | bytearray) -> tuple[bytes, int]:
    """
    Decode and repair a Reed-Solomon codeword.

    Args:
        data_array: Encoded byte sequence (payload + parity), possibly corrupted.

    Returns:
        tuple[bytes, int]: A tuple containing:
            - The original decoded payload bytes (without parity bytes).
            - The number of corrupted bytes that were detected and repaired.

    Raises:
        ReedSolomonError: If corruption exceeds the error-correction capacity
                          (more than 5 corrupted bytes).
    """
    # rs.decode returns: (repaired_payload, repaired_full_message, errata_positions)
    decoded, _, errors = rs.decode(bytearray(data_array))
    return bytes(decoded), len(errors)

if __name__ == '__main__':
    string = 'ATCCGTAGCTAGCAGT'
    data = string.encode('utf-8')

    encoded = encode_rs(data)
    print(f"Encoded: {encoded}")

    corrupted = bytearray(encoded)
    corrupted[0] = ord('T')
    print(f"Corrupted: {bytes(corrupted)}")

    recovered, n_errors = decode_rs(corrupted)
    print(f"Recovered: {recovered.decode('utf-8')} ({n_errors} error fixed)")