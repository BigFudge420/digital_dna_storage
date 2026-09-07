import { useState } from "react"
import colors from "../config/colors"
import { Dna, Copy, Check, RotateCcw, ArrowRight, Sparkles, BarChart2, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react"

const SAMPLE_PRESETS = [
    "Isaac -> DNA -> Isaac",
    "Hello DNA Storage!",
    "Digital preservation in DNA"
]

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

async function postJson(endpoint, body) {
    // 1. Try relative path first (forwarded by Vite dev proxy)
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            throw new Error(data.detail || `Server returned error (${res.status})`)
        }
        return data
    } catch (err) {
        // 2. If relative request failed due to network/no proxy, try direct backend URL
        if (!endpoint.startsWith("http")) {
            const fullUrl = `${API_BASE}${endpoint}`
            const res = await fetch(fullUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(data.detail || `Server returned error (${res.status})`)
            }
            return data
        }
        throw err
    }
}

export const SequenceEncoder = ({ onEncode }) => {
    const [inputText, setInputText] = useState("")
    const [codec, setCodec] = useState("naive")
    const [encodedResult, setEncodedResult] = useState(null)
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)
    const [decoding, setDecoding] = useState(false)
    const [decodeResult, setDecodeResult] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const handleEncode = async () => {
        if (!inputText.trim()) return
        setLoading(true)
        setErrorMessage(null)
        setDecodeResult(null)

        try {
            const data = await postJson("/api/encode", {
                text: inputText,
                codec: codec,
            })

            setEncodedResult(data)
            if (onEncode) {
                onEncode(data)
            }
        } catch (err) {
            console.error("Encode API call failed:", err)
            setErrorMessage(
                err.message.includes("Failed to fetch") || err.message.includes("NetworkError")
                    ? "Could not connect to backend server. Make sure the backend is running with 'python main.py' at http://localhost:8000."
                    : err.message
            )
        } finally {
            setLoading(false)
        }
    }

    const handleDecode = async () => {
        if (!encodedResult?.dna) return
        setDecoding(true)
        setErrorMessage(null)

        try {
            const data = await postJson("/api/decode", {
                dna: encodedResult.dna,
                strands: encodedResult.strands,
                codec: encodedResult.codec || codec,
            })

            setDecodeResult(data)
        } catch (err) {
            console.error("Decode API call failed:", err)
            setErrorMessage(
                err.message.includes("Failed to fetch") || err.message.includes("NetworkError")
                    ? "Could not connect to backend server for decoding. Make sure 'python main.py' is running."
                    : err.message
            )
        } finally {
            setDecoding(false)
        }
    }

    const handleClear = () => {
        setInputText("")
        setEncodedResult(null)
        setDecodeResult(null)
        setErrorMessage(null)
        setCopied(false)
    }

    const handleCopy = () => {
        if (!encodedResult?.dna) return
        navigator.clipboard.writeText(encodedResult.dna)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div 
            style={{ backgroundColor: colors.surface, borderColor: colors.border }} 
            className="border-2 rounded-xl p-6 shadow-xl mb-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#3E3D32]">
                <div className="flex items-center gap-3">
                    <div 
                        style={{ backgroundColor: `${colors.pink}22`, borderColor: colors.pink }} 
                        className="p-2 border rounded-lg"
                    >
                        <Dna style={{ color: colors.pink }} className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 style={{ color: colors.white }} className="text-lg font-mono font-bold tracking-wide">
                            DNA SEQUENCE SYNTHESIZER
                        </h2>
                        <p style={{ color: colors.text }} className="text-xs font-nunito">
                            Convert digital text to synthetic DNA with Reed-Solomon Error Correction (GF-256)
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span 
                        style={{ backgroundColor: `${colors.green}1a`, borderColor: colors.green, color: colors.green }} 
                        className="border px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5"
                    >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>RS ECC Active (10 Parity Bytes)</span>
                    </span>
                </div>
            </div>

            {/* Error Notification Banner */}
            {errorMessage && (
                <div 
                    style={{ backgroundColor: `${colors.pink}1a`, borderColor: colors.pink, color: colors.pink }}
                    className="p-3.5 rounded-lg border mb-5 text-xs font-mono flex items-start gap-2.5 leading-relaxed"
                >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <strong className="block mb-0.5 font-bold">API Communication Error:</strong>
                        <span>{errorMessage}</span>
                    </div>
                    <button 
                        onClick={() => setErrorMessage(null)} 
                        className="text-xs opacity-70 hover:opacity-100 cursor-pointer ml-2"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* 2-Column Layout: Left (Input) | Right (Results & Stats) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Left Side: Input Text Box */}
                <div className="flex flex-col justify-between space-y-4">
                    <div>
                        {/* Codec Selection Toggle */}
                        <div className="mb-3">
                            <label style={{ color: colors.text }} className="text-[11px] font-mono uppercase tracking-wider block mb-1.5">
                                Select Mapping Codec:
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCodec("naive")}
                                    style={{
                                        backgroundColor: codec === "naive" ? `${colors.cyan}22` : colors.dark,
                                        borderColor: codec === "naive" ? colors.cyan : "#3E3D32",
                                        color: codec === "naive" ? colors.cyan : colors.text
                                    }}
                                    className="p-2.5 rounded-lg border text-left font-mono transition-all cursor-pointer hover:border-[#66D9EF]/60"
                                >
                                    <div className="text-xs font-bold flex items-center justify-between">
                                        <span>Naive (2-Bit)</span>
                                        <span className="text-[10px] opacity-80 font-normal">4 nt/byte</span>
                                    </div>
                                    <p className="text-[10px] font-nunito opacity-70 mt-0.5">
                                        Direct 2-bit mapping (A=00, C=01, G=10, T=11)
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCodec("goldman")}
                                    style={{
                                        backgroundColor: codec === "goldman" ? `${colors.pink}22` : colors.dark,
                                        borderColor: codec === "goldman" ? colors.pink : "#3E3D32",
                                        color: codec === "goldman" ? colors.pink : colors.text
                                    }}
                                    className="p-2.5 rounded-lg border text-left font-mono transition-all cursor-pointer hover:border-[#F92672]/60"
                                >
                                    <div className="text-xs font-bold flex items-center justify-between">
                                        <span>Goldman Rotating</span>
                                        <span className="text-[10px] opacity-80 font-normal">6 nt/byte</span>
                                    </div>
                                    <p className="text-[10px] font-nunito opacity-70 mt-0.5">
                                        Rotating ternary scheme; 0 homopolymers
                                    </p>
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-2">
                            <label style={{ color: colors.text }} className="text-xs font-mono uppercase tracking-wider">
                                Input Payload
                            </label>
                            <span style={{ color: colors.text }} className="text-[11px] font-mono">
                                {inputText.length} chars · {new Blob([inputText]).size} bytes
                            </span>
                        </div>

                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Enter sample text to encode into DNA (e.g., 'Isaac was here' or archival metadata)..."
                            rows={5}
                            style={{ 
                                backgroundColor: colors.dark, 
                                borderColor: "#3E3D32", 
                                color: colors.white 
                            }}
                            className="w-full p-3.5 rounded-lg border-2 font-mono text-sm resize-none focus:outline-none focus:border-[#66D9EF] transition-colors"
                        />

                        {/* Sample Quick Chips */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span style={{ color: colors.text }} className="text-[11px] font-mono">
                                Presets:
                            </span>
                            {SAMPLE_PRESETS.map((sample) => (
                                <button
                                    key={sample}
                                    type="button"
                                    onClick={() => setInputText(sample)}
                                    style={{ 
                                        backgroundColor: colors.dark, 
                                        borderColor: "#3E3D32", 
                                        color: colors.text 
                                    }}
                                    className="text-[11px] font-mono px-2 py-1 rounded border hover:border-[#66D9EF] hover:text-[#F8F8F2] transition-colors cursor-pointer"
                                >
                                    "{sample}"
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleEncode}
                            disabled={!inputText.trim() || loading}
                            style={{ 
                                backgroundColor: inputText.trim() ? colors.pink : "#3E3D32",
                                color: colors.white
                            }}
                            className="flex-1 py-2.5 px-4 rounded-lg font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Synthesizing via /api/encode...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    <span>Encode with {codec === "goldman" ? "Goldman" : "Naive"} + RS</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={!inputText && !encodedResult}
                            style={{ 
                                backgroundColor: colors.dark, 
                                borderColor: "#3E3D32", 
                                color: colors.text 
                            }}
                            className="px-3.5 py-2.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 hover:border-[#F92672] hover:text-[#F92672] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Clear"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Clear</span>
                        </button>
                    </div>
                </div>

                {/* Right Side: Results & Stats */}
                <div 
                    style={{ backgroundColor: colors.dark, borderColor: "#3E3D32" }} 
                    className="border-2 rounded-lg p-5 flex flex-col justify-between min-h-[340px]"
                >
                    {encodedResult ? (
                        <div className="space-y-4">
                            {/* Result Header & Copy */}
                            <div className="flex justify-between items-center pb-3 border-b border-[#2D2E28]">
                                <div className="flex items-center gap-2">
                                    <span style={{ color: colors.green }} className="text-xs font-mono uppercase font-bold tracking-wider">
                                        Encoded DNA Result
                                    </span>
                                    <span 
                                        style={{ backgroundColor: `${colors.green}22`, color: colors.green }}
                                        className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                                    >
                                        {encodedResult.codec || codec} · {encodedResult.stats?.length}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDecode}
                                        disabled={decoding}
                                        style={{
                                            backgroundColor: `${colors.purple}22`,
                                            borderColor: colors.purple,
                                            color: colors.purple
                                        }}
                                        className="border px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 hover:brightness-125 transition-all cursor-pointer disabled:opacity-50"
                                        title="Send to /api/decode for RS Error Correction verification"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${decoding ? 'animate-spin' : ''}`} />
                                        <span>{decoding ? "Decoding..." : "Decode & Verify"}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        style={{ 
                                            backgroundColor: copied ? `${colors.green}22` : colors.surface,
                                            borderColor: copied ? colors.green : "#3E3D32",
                                            color: copied ? colors.green : colors.text
                                        }}
                                        className="border px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 hover:text-[#F8F8F2] transition-colors cursor-pointer"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? "Copied" : "Copy DNA"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Decode Verification Banner (if triggered) */}
                            {decodeResult && (
                                <div 
                                    style={{ backgroundColor: `${colors.green}15`, borderColor: colors.green }}
                                    className="p-2.5 rounded border flex items-center justify-between font-mono text-xs animate-fadeIn"
                                >
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" style={{ color: colors.green }} />
                                        <span style={{ color: colors.white }}>
                                            Decoded via /api/decode: <strong style={{ color: colors.yellow }}>"{decodeResult.text}"</strong>
                                        </span>
                                    </div>
                                    <span style={{ color: colors.green }} className="text-[10px] font-bold">
                                        RS Repaired: {decodeResult.errors_corrected ?? 0} errors
                                    </span>
                                </div>
                            )}

                            {/* Encoded String Box */}
                            <div>
                                <label style={{ color: colors.text }} className="text-[10px] font-mono uppercase block mb-1.5 opacity-80">
                                    Synthesized Sequence:
                                </label>
                                <div 
                                    style={{ backgroundColor: colors.bg, borderColor: "#3E3D32" }}
                                    className="p-3 rounded border font-mono text-xs tracking-wider break-all max-h-24 overflow-y-auto leading-relaxed selection:bg-[#F92672]"
                                >
                                    {encodedResult.dna.split("").map((base, idx) => {
                                        let colorClass = "text-[#A6E22E]"
                                        if (base === "C") colorClass = "text-[#66D9EF]"
                                        else if (base === "G") colorClass = "text-[#E6DB74]"
                                        else if (base === "T") colorClass = "text-[#AE81FF]"
                                        return (
                                            <span key={idx} className={`${colorClass} font-bold`}>
                                                {base}
                                            </span>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Key Stats Grid */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <BarChart2 className="w-3.5 h-3.5" style={{ color: colors.cyan }} />
                                    <span style={{ color: colors.text }} className="text-[11px] font-mono uppercase tracking-wider">
                                        Biophysical & Storage Statistics
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    <div 
                                        style={{ backgroundColor: colors.surface, borderColor: "#3E3D32" }} 
                                        className="p-2.5 rounded border flex flex-col"
                                    >
                                        <span style={{ color: colors.text }} className="text-[10px] font-mono uppercase">
                                            GC Content
                                        </span>
                                        <span style={{ color: colors.yellow }} className="font-rajdhani text-xl font-bold">
                                            {encodedResult.stats?.gcContent}
                                        </span>
                                        <span className="text-[9px] font-mono text-[#A6E22E]">Optimal 40-60%</span>
                                    </div>

                                    <div 
                                        style={{ backgroundColor: colors.surface, borderColor: "#3E3D32" }} 
                                        className="p-2.5 rounded border flex flex-col"
                                    >
                                        <span style={{ color: colors.text }} className="text-[10px] font-mono uppercase">
                                            Density
                                        </span>
                                        <span style={{ color: colors.cyan }} className="font-rajdhani text-xl font-bold">
                                            {encodedResult.stats?.density}
                                        </span>
                                        <span style={{ color: colors.text }} className="text-[9px] font-mono">bits/nt</span>
                                    </div>

                                    <div 
                                        style={{ backgroundColor: colors.surface, borderColor: "#3E3D32" }} 
                                        className="p-2.5 rounded border flex flex-col"
                                    >
                                        <span style={{ color: colors.text }} className="text-[10px] font-mono uppercase">
                                            NT / Byte
                                        </span>
                                        <span style={{ color: colors.pink }} className="font-rajdhani text-xl font-bold">
                                            {encodedResult.stats?.ntPerByte}
                                        </span>
                                        <span style={{ color: colors.text }} className="text-[9px] font-mono">Payload ratio</span>
                                    </div>

                                    <div 
                                        style={{ backgroundColor: colors.surface, borderColor: "#3E3D32" }} 
                                        className="p-2.5 rounded border flex flex-col"
                                    >
                                        <span style={{ color: colors.text }} className="text-[10px] font-mono uppercase">
                                            Max Repeat
                                        </span>
                                        <span style={{ color: colors.purple }} className="font-rajdhani text-xl font-bold">
                                            {encodedResult.stats?.maxHomopolymer}
                                        </span>
                                        <span style={{ color: colors.text }} className="text-[9px] font-mono">Homopolymer</span>
                                    </div>
                                </div>
                            </div>

                            {/* Base Distribution Bar */}
                            <div className="pt-1">
                                <div className="flex justify-between text-[10px] font-mono mb-1.5" style={{ color: colors.text }}>
                                    <span>Base Composition:</span>
                                    <span>
                                        {encodedResult.stats?.baseDistribution?.map(b => `${b.base}: ${b.pct}`).join(" · ") || "A: 25% · C: 25% · G: 25% · T: 25%"}
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full overflow-hidden flex">
                                    {encodedResult.stats?.baseDistribution?.map(b => (
                                        <div 
                                            key={b.base} 
                                            style={{ width: b.pct, backgroundColor: b.color || colors.cyan }} 
                                            title={`${b.base}: ${b.count} (${b.pct})`}
                                        />
                                    )) || (
                                        <>
                                            <div style={{ width: "25%", backgroundColor: colors.green }} />
                                            <div style={{ width: "25%", backgroundColor: colors.cyan }} />
                                            <div style={{ width: "25%", backgroundColor: colors.yellow }} />
                                            <div style={{ width: "25%", backgroundColor: colors.purple }} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
                            <div 
                                style={{ backgroundColor: `${colors.cyan}11`, borderColor: `${colors.cyan}33` }} 
                                className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center mb-3"
                            >
                                <Dna style={{ color: colors.cyan }} className="w-7 h-7 opacity-70 animate-pulse" />
                            </div>
                            <h3 style={{ color: colors.white }} className="text-sm font-mono font-bold mb-1">
                                No Encoded Sequence Yet
                            </h3>
                            <p style={{ color: colors.text }} className="text-xs font-nunito max-w-xs">
                                Choose a codec (<strong>Naive 2-bit</strong> or <strong>Goldman</strong>), enter text, and click <span style={{ color: colors.pink }}>"Encode"</span> to call the backend API with Reed-Solomon protection.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SequenceEncoder
