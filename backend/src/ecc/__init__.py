"""
Error Correcting Code (ECC) Package
"""
from .rs_codec import encode_rs, decode_rs, ReedSolomonError

__all__ = ["encode_rs", "decode_rs", "ReedSolomonError"]
