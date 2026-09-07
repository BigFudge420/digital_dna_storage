"""
FastAPI Application for Digital DNA Storage Simulation.

Provides REST endpoints for:
- Encoding text payloads into DNA oligos using Naive (2-bit) or Goldman (rotating ternary) codecs,
  protected by Reed-Solomon (RS) error-correcting codes.
- Decoding DNA sequences back into original text, with RS error correction.
"""

from typing import Literal
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.codecs import naive, goldman
from src.ecc import encode_rs, decode_rs, ReedSolomonError
from src.framing import INDEX_SIZE
from src.pipeline import encode as pipeline_encode, decode as pipeline_decode

app = FastAPI(
    title="Digital DNA Storage API",
    description="Encode digital payloads into synthetic DNA and decode them back with Reed-Solomon ECC.",
    version="1.0.0",
)

# Enable CORS for dashboard development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EncodeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Payload text to synthesize into DNA")
    codec: Literal["naive", "goldman"] = Field(
        "naive", description="DNA mapping algorithm: 'naive' (2-bit) or 'goldman' (rotating ternary)"
    )
    payload_len: int = Field(
        32, ge=8, le=256, description="Payload byte chunk size per DNA strand"
    )


class DecodeRequest(BaseModel):
    dna: str | None = Field(None, description="Concatenated DNA sequence string")
    strands: list[str] | None = Field(None, description="List of individual DNA strands")
    codec: Literal["naive", "goldman"] = Field(
        "naive", description="DNA mapping algorithm used during encoding"
    )
    payload_len: int = Field(
        32, ge=8, le=256, description="Payload byte chunk size used during framing"
    )


def compute_dna_stats(raw_bytes: bytes, strands: list[str]) -> dict:
    """Compute biophysical and information density metrics for the encoded sequence."""
    full_dna = "".join(strands)
    nt_count = len(full_dna)
    byte_count = len(raw_bytes)

    count_a = full_dna.count("A")
    count_c = full_dna.count("C")
    count_g = full_dna.count("G")
    count_t = full_dna.count("T")

    gc_count = count_g + count_c
    gc_pct = (gc_count / nt_count * 100) if nt_count else 0.0
    density = (byte_count * 8 / nt_count) if nt_count else 0.0
    nt_per_byte = (nt_count / byte_count) if byte_count else 0.0

    # Calculate longest homopolymer repeat run
    max_homopolymer = 1
    current_run = 1
    for i in range(1, len(full_dna)):
        if full_dna[i] == full_dna[i - 1]:
            current_run += 1
            if current_run > max_homopolymer:
                max_homopolymer = current_run
        else:
            current_run = 1

    return {
        "length": f"{nt_count} nt",
        "ntCount": nt_count,
        "byteCount": byte_count,
        "density": f"{density:.2f} bits/nt",
        "ntPerByte": f"{nt_per_byte:.2f} nt/byte",
        "gcContent": f"{gc_pct:.1f}%",
        "maxHomopolymer": f"{max_homopolymer} nt",
        "strandsCount": len(strands),
        "baseDistribution": [
            {
                "base": "A",
                "count": count_a,
                "pct": f"{(count_a / nt_count * 100):.1f}%" if nt_count else "0%",
                "color": "#A6E22E",
                "class": "nt-A",
            },
            {
                "base": "C",
                "count": count_c,
                "pct": f"{(count_c / nt_count * 100):.1f}%" if nt_count else "0%",
                "color": "#66D9EF",
                "class": "nt-C",
            },
            {
                "base": "G",
                "count": count_g,
                "pct": f"{(count_g / nt_count * 100):.1f}%" if nt_count else "0%",
                "color": "#E6DB74",
                "class": "nt-G",
            },
            {
                "base": "T",
                "count": count_t,
                "pct": f"{(count_t / nt_count * 100):.1f}%" if nt_count else "0%",
                "color": "#AE81FF",
                "class": "nt-T",
            },
        ],
    }


@app.get("/")
def root():
    """Root endpoint for browser checks and discovery."""
    return {
        "status": "online",
        "service": "Digital DNA Storage API",
        "version": "1.0.0",
        "documentation": "/docs",
        "endpoints": {
            "health": "/api/health",
            "encode": "/api/encode",
            "decode": "/api/decode",
        },
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "Digital DNA Storage API", "version": "1.0.0"}


@app.post("/api/encode")
def encode_endpoint(req: EncodeRequest):
    """
    Encode text payload to DNA.
    Pipeline: Raw Text -> UTF-8 Bytes -> Reed-Solomon ECC -> Framing -> DNA Codec (Naive / Goldman).
    """
    try:
        raw_bytes = req.text.encode("utf-8")

        # Step 1: Reed-Solomon Error Correction Outer Code (adds 10 parity bytes)
        rs_protected_bytes = encode_rs(raw_bytes)

        # Step 2: Choose DNA codec
        codec_module = goldman if req.codec == "goldman" else naive

        # Step 3: Frame and encode into DNA strands
        strands = pipeline_encode(
            rs_protected_bytes, payload_len=req.payload_len, codec=codec_module
        )
        full_dna = "".join(strands)

        # Step 4: Calculate sequence stats
        stats = compute_dna_stats(raw_bytes, strands)

        return {
            "dna": full_dna,
            "strands": strands,
            "codec": req.codec,
            "stats": stats,
            "inputLength": len(req.text),
            "inputBytes": len(raw_bytes),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Encoding failed: {str(e)}",
        )


@app.post("/api/decode")
def decode_endpoint(req: DecodeRequest):
    """
    Decode a user-provided DNA sequence back to original text with Reed-Solomon error correction.
    Supports both framed pipeline strands and direct raw nucleotide sequences.
    """
    codec_module = goldman if req.codec == "goldman" else naive

    # 1. Gather DNA string or strands
    dna_input = req.dna
    if req.strands:
        dna_input = "".join(req.strands)
    elif not dna_input:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'dna' string or 'strands' array must be provided.",
        )

    # Clean whitespace and enforce uppercase
    dna_clean = "".join(dna_input.split()).upper()
    if not dna_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provided DNA sequence is empty.",
        )

    # Validate nucleotide alphabet
    invalid_bases = set(dna_clean) - {"A", "C", "G", "T"}
    if invalid_bases:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid nucleotide characters detected: {sorted(list(invalid_bases))}. Only A, C, G, T are valid.",
        )

    original_bytes = None
    errors_corrected = 0
    decoding_method = "framed"

    # Strategy A: If explicitly passed as strands, use pipeline decode
    if req.strands:
        try:
            recovered_rs = pipeline_decode(req.strands, codec=codec_module)
            original_bytes, errors_corrected = decode_rs(recovered_rs)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Decoding strands failed: {str(e)}",
            )
    else:
        # Strategy B: Try framed pipeline chunks first
        strand_bytes = INDEX_SIZE + req.payload_len
        nt_per_byte = 6 if req.codec == "goldman" else 4
        strand_nt_len = strand_bytes * nt_per_byte

        if len(dna_clean) % strand_nt_len == 0:
            try:
                candidate_strands = [
                    dna_clean[i : i + strand_nt_len]
                    for i in range(0, len(dna_clean), strand_nt_len)
                ]
                recovered_rs = pipeline_decode(candidate_strands, codec=codec_module)
                original_bytes, errors_corrected = decode_rs(recovered_rs)
                decoding_method = "framed"
            except Exception:
                original_bytes = None

        # Strategy C: If framed decode did not match, try direct raw codec decode
        if original_bytes is None:
            try:
                raw_rs_bytes = codec_module.decode(dna_clean)
                original_bytes, errors_corrected = decode_rs(raw_rs_bytes)
                decoding_method = "direct"
            except ReedSolomonError as e:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Reed-Solomon ECC failure (too many corrupted bytes to recover): {str(e)}",
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Decoding failed for {req.codec} codec: {str(e)}",
                )

    # Decode recovered bytes as UTF-8 string
    text = original_bytes.decode("utf-8", errors="replace")

    # Compute quick stats on input DNA
    gc_count = dna_clean.count("G") + dna_clean.count("C")
    gc_pct = f"{(gc_count / len(dna_clean) * 100):.1f}%"

    return {
        "text": text,
        "errors_corrected": errors_corrected,
        "codec": req.codec,
        "status": "ok",
        "nt_length": len(dna_clean),
        "gc_content": gc_pct,
        "method": decoding_method,
        "recovered_bytes": len(original_bytes),
    }
