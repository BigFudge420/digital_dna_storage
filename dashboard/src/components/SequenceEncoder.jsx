import { useState } from "react"
import colors from "../config/colors"
import { Dna, Copy, Check, RotateCcw, ArrowRight, Sparkles, BarChart2, ShieldCheck, RefreshCw, AlertCircle, FileText, CheckCircle2, Wrench } from "lucide-react"

const TEXT_PRESETS = [
    "Isaac -> DNA -> Isaac",
    "Hello DNA Storage!",
    "Digital preservation in DNA"
]

const DNA_PRESETS = [
    {
        label: "Sample Naive DNA",
        codec: "naive",
        dna: "AAAAAAAAAAAAAAAAAAAAACGACAGCCTATCGACCGACCGATAGAACTCTCGACCTATAGAACGGACGCCCTAGCGCCTCTTGTGCTGAAGTCATACGACAAAGTGCTCCATACGGGAAAAAAAAAAAAAAAAA",
        desc: "Clean 136-nt Naive sequence of 'Isaac was here' (4 nt/byte)"
    },
    {
        label: "Sample Goldman DNA",
        codec: "goldman",
        dna: "ACACACACACACACACACACACACACACACACATGACATGAGAGCATCAGAGTCAGAGTCAGATACACGAGTAGCGATAGAGTCAGCATCACGAGTAGATCTAGATATAGCATACGATATATGATCATATCTATGATGATATACATCGACACAGTCACGTAGAGCGACACGTCGATACTACACACACACACACACACACACACA",
        desc: "Clean 204-nt Goldman sequence of 'Isaac was here' (0 homopolymers)"
    },
    {
        label: "Corrupted DNA (1 Error)",
        codec: "naive",
        dna: "AAAAAAAAAAAAAAAAAAAAACGACATCCTATCGACCGACCGATAGAACTCTCGACCTATAGAACGGACGCCCTAGCGCCTCTTGTGCTGAAGTCATACGACAAAGTGCTCCATACGGGAAAAAAAAAAAAAAAAA",
        desc: "Corrupted at base 26; Reed-Solomon will detect and repair it"
    }
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

export const SequenceEncoder = ({ onEncode, onDecode }) => {
    // Mode: "encode" (Text -> DNA) or "decode" (DNA -> Text)
    const [mode, setMode] = useState("encode")

    // Common state
    const [codec, setCodec] = useState("naive")
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    // Encode mode state
    const [inputText, setInputText] = useState("")
    const [encodedResult, setEncodedResult] = useState(null)

    // Decode mode state
    const [inputDna, setInputDna] = useState("")
    const [decodedResult, setDecodedResult] = useState(null)

    // Validate user DNA in real time
    const cleanDnaInput = inputDna.replace(/\s+/g, "").toUpperCase()
    const invalidDnaChars = cleanDnaInput.split("").filter(c => !["A", "C", "G", "T"].includes(c))
    const isDnaValid = cleanDnaInput.length > 0 && invalidDnaChars.length === 0

    // Handler: Encode Text -> DNA
    const handleEncode = async () => {
        if (!inputText.trim()) return
        setLoading(true)
        setErrorMessage(null)
        const startTime = performance.now()

        try {
            const data = await postJson("/api/encode", {
                text: inputText,
                codec: codec,
            })
            const elapsedMs = Math.max(performance.now() - startTime, 1)

            setEncodedResult(data)
            if (onEncode) {
                onEncode({ ...data, elapsedMs })
            }
        } catch (err) {
            console.error("Encode API call failed:", err)
            setErrorMessage(
                err.message.includes("Failed to fetch") || err.message.includes("NetworkError")
                    ? "Could not connect to backend server. Ensure backend is running ('python main.py' at http://localhost:8000)."
                    : err.message
            )
        } finally {
            setLoading(false)
        }
    }

    // Handler: Decode User-Provided DNA -> Text
    const handleDecodeUserDna = async () => {
        if (!cleanDnaInput) return
        setLoading(true)
        setErrorMessage(null)
        const startTime = performance.now()

        try {
            const data = await postJson("/api/decode", {
                dna: cleanDnaInput,
                codec: codec,
            })
            const elapsedMs = Math.max(performance.now() - startTime, 1)

            setDecodedResult(data)
            if (onDecode) {
                onDecode({ ...data, success: true, elapsedMs })
            }
        } catch (err) {
            console.error("Decode API call failed:", err)
            if (onDecode) {
                onDecode({ success: false, elapsedMs: Math.max(performance.now() - startTime, 1) })
            }
            setErrorMessage(
                err.message.includes("Failed to fetch") || err.message.includes("NetworkError")
                    ? "Could not connect to backend server. Ensure backend is running ('python main.py' at http://localhost:8000)."
                    : err.message
            )
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = (text) => {
        if (!text) return
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSendToDecoder = () => {
        if (!encodedResult?.dna) return
        setInputDna(encodedResult.dna)
        setCodec(encodedResult.codec || codec)
        setMode("decode")
        setDecodedResult(null)
    }

    return (
        <div 
            style={{ backgroundColor: colors.surface, borderColor: colors.border }} 
            className="border-2 rounded-xl p-6 shadow-xl mb-6"
        >
            {/* Header with Mode Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#3E3D32] gap-4">
                <div className="flex items-center gap-3">
                    <div 
                        style={{ backgroundColor: `${colors.pink}22`, borderColor: colors.pink }} 
                        className="p-2 border rounded-lg"
                    >
                        <Dna style={{ color: colors.pink }} className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 style={{ color: colors.white }} className="text-lg font-mono font-bold tracking-wide">
                            DNA SEQUENCE STUDIO
                        </h2>
                        <p style={{ color: colors.text }} className="text-xs font-nunito">
                            Encode text to DNA or decode arbitrary DNA sequences with Reed-Solomon ECC
                        </p>
                    </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-2 bg-[#141411] p-1 rounded-lg border border-[#3E3D32] self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => { setMode("encode"); setErrorMessage(null); }}
                        style={{
                            backgroundColor: mode === "encode" ? `${colors.pink}22` : "transparent",
                            borderColor: mode === "encode" ? colors.pink : "transparent",
                            color: mode === "encode" ? colors.white : colors.text
                        }}
                        className="px-3 py-1.5 rounded-md border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <Sparkles className="w-3.5 h-3.5" style={{ color: mode === "encode" ? colors.pink : colors.text }} />
                        <span>Encode (Text to DNA)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setMode("decode"); setErrorMessage(null); }}
                        style={{
                            backgroundColor: mode === "decode" ? `${colors.cyan}22` : "transparent",
                            borderColor: mode === "decode" ? colors.cyan : "transparent",
                            color: mode === "decode" ? colors.white : colors.text
                        }}
                        className="px-3 py-1.5 rounded-md border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <FileText className="w-3.5 h-3.5" style={{ color: mode === "decode" ? colors.cyan : colors.text }} />
                        <span>Decode (DNA to Text)</span>
                    </button>
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
                        <strong className="block mb-0.5 font-bold">Operation Error:</strong>
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

            {/* Codec Selection Toggle (Shared for both modes) */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                    <label style={{ color: colors.text }} className="text-[11px] font-mono uppercase tracking-wider block">
                        Active Mapping Codec:
                    </label>
                    <span 
                        style={{ backgroundColor: `${colors.green}1a`, borderColor: colors.green, color: colors.green }} 
                        className="border px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider flex items-center gap-1"
                    >
                        <ShieldCheck className="w-3 h-3" />
                        <span>Reed-Solomon ECC Protected (10 Parity Bytes)</span>
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
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
                            Rotating ternary mapping; 0 homopolymers
                        </p>
                    </button>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODE 1: ENCODE (Text -> DNA)                              */}
            {/* ========================================================= */}
            {mode === "encode" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {/* Left: Text Input */}
                    <div className="flex flex-col justify-between space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label style={{ color: colors.text }} className="text-xs font-mono uppercase tracking-wider">
                                    Input Text Payload
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

                            {/* Presets */}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span style={{ color: colors.text }} className="text-[11px] font-mono">
                                    Presets:
                                </span>
                                {TEXT_PRESETS.map((sample) => (
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
                                        <span>Synthesizing...</span>
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
                                onClick={() => { setInputText(""); setEncodedResult(null); }}
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

                    {/* Right: Encode Results & Stats */}
                    <div 
                        style={{ backgroundColor: colors.dark, borderColor: "#3E3D32" }} 
                        className="border-2 rounded-lg p-5 flex flex-col justify-between min-h-[340px]"
                    >
                        {encodedResult ? (
                            <div className="space-y-4">
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
                                            onClick={handleSendToDecoder}
                                            style={{
                                                backgroundColor: `${colors.cyan}22`,
                                                borderColor: colors.cyan,
                                                color: colors.cyan
                                            }}
                                            className="border px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 hover:brightness-125 transition-all cursor-pointer"
                                            title="Open in Decoder to test reconstruction"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>Open in Decoder</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(encodedResult.dna)}
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

                                {/* Encoded Sequence Box */}
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

                                {/* Stats Grid */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <BarChart2 className="w-3.5 h-3.5" style={{ color: colors.cyan }} />
                                        <span style={{ color: colors.text }} className="text-[11px] font-mono uppercase tracking-wider">
                                            Biophysical & Storage Statistics
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        <div style={{ backgroundColor: colors.surface, borderColor: "#3E3D32" }} className="p-2.5 rounded border flex flex-col">
                                            <span style={{ color: colors.text }} className="text-[10px] font-mono uppercase">GC Content</span>
                                            <span style={{ color: colors.yellow }} className="font-rajdhani text-xl font-bold">{encodedResult.stats?.gcContent}</span>
                                            <span className="text-[9px] font-mono text-[#A6E22E]">Optimal 40-60%</span>
                                        </div>
                                        <div style={{ backgroundColor: colors.surface, borderColor: "#3E3D32" }} className="p-2.5 rounded border flex flex-col">
                                            <span style={{ color: colors.text }} className="text-[10px] font-mono uppercase">Density</span>
                                            <span style={{ color: colors.cyan }} className="font-rajdhani text-xl font-bold">{encodedResult.stats?.density}</span>
                                            <span style={{ color: colors.text }} className="text-[9px] font-mono">bits/nt</span>
                                        </div>
                                        <div style={{ backgroundColor: colors.surface, borderColor: "#3E3D32" }} className="p-2.5 rounded border flex flex-col">
                                            <span style={{ color: colors.text }} className="text-[10px] font-mono uppercase">NT / Byte</span>
                                            <span style={{ color: colors.pink }} className="font-rajdhani text-xl font-bold">{encodedResult.stats?.ntPerByte}</span>
                                            <span style={{ color: colors.text }} className="text-[9px] font-mono">Ratio</span>
                                        </div>
                                        <div style={{ backgroundColor: colors.surface, borderColor: "#3E3D32" }} className="p-2.5 rounded border flex flex-col">
                                            <span style={{ color: colors.text }} className="text-[10px] font-mono uppercase">Max Repeat</span>
                                            <span style={{ color: colors.purple }} className="font-rajdhani text-xl font-bold">{encodedResult.stats?.maxHomopolymer}</span>
                                            <span style={{ color: colors.text }} className="text-[9px] font-mono">Homopolymer</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Base Distribution Bar */}
                                <div className="pt-1">
                                    <div className="flex justify-between text-[10px] font-mono mb-1.5" style={{ color: colors.text }}>
                                        <span>Base Composition:</span>
                                        <span>{encodedResult.stats?.baseDistribution?.map(b => `${b.base}: ${b.pct}`).join(" · ") || "A: 25% · C: 25% · G: 25% · T: 25%"}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full overflow-hidden flex">
                                        {encodedResult.stats?.baseDistribution?.map(b => (
                                            <div key={b.base} style={{ width: b.pct, backgroundColor: b.color || colors.cyan }} title={`${b.base}: ${b.count} (${b.pct})`} />
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
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
                                <div style={{ backgroundColor: `${colors.cyan}11`, borderColor: `${colors.cyan}33` }} className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center mb-3">
                                    <Dna style={{ color: colors.cyan }} className="w-7 h-7 opacity-70 animate-pulse" />
                                </div>
                                <h3 style={{ color: colors.white }} className="text-sm font-mono font-bold mb-1">No Encoded Sequence Yet</h3>
                                <p style={{ color: colors.text }} className="text-xs font-nunito max-w-xs">
                                    Choose a codec, enter sample text, and click <span style={{ color: colors.pink }}>"Encode"</span> to call the backend with Reed-Solomon protection.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODE 2: DECODE (DNA -> Text)                              */}
            {/* ========================================================= */}
            {mode === "decode" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {/* Left: DNA Input */}
                    <div className="flex flex-col justify-between space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label style={{ color: colors.text }} className="text-xs font-mono uppercase tracking-wider">
                                    Input DNA Sequence (A, C, G, T)
                                </label>
                                <div className="flex items-center gap-2">
                                    {invalidDnaChars.length > 0 ? (
                                        <span className="text-[11px] font-mono text-[#F92672]">
                                            Invalid bases: {Array.from(new Set(invalidDnaChars)).join(", ")}
                                        </span>
                                    ) : (
                                        <span style={{ color: cleanDnaInput.length > 0 ? colors.green : colors.text }} className="text-[11px] font-mono">
                                            {cleanDnaInput.length} nucleotides
                                        </span>
                                    )}
                                </div>
                            </div>

                            <textarea
                                value={inputDna}
                                onChange={(e) => setInputDna(e.target.value)}
                                placeholder="Paste user-provided DNA sequence here (e.g., 'ATCGGTACCGAATG...')..."
                                rows={5}
                                style={{ 
                                    backgroundColor: colors.dark, 
                                    borderColor: invalidDnaChars.length > 0 ? colors.pink : "#3E3D32", 
                                    color: colors.white 
                                }}
                                className="w-full p-3.5 rounded-lg border-2 font-mono text-xs uppercase tracking-wider resize-none focus:outline-none focus:border-[#66D9EF] transition-colors"
                            />

                            {/* Preset DNA Samples */}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span style={{ color: colors.text }} className="text-[11px] font-mono">
                                    Samples:
                                </span>
                                {DNA_PRESETS.map((sample) => (
                                    <button
                                        key={sample.label}
                                        type="button"
                                        onClick={() => {
                                            setInputDna(sample.dna);
                                            setCodec(sample.codec);
                                            setDecodedResult(null);
                                        }}
                                        style={{ 
                                            backgroundColor: colors.dark, 
                                            borderColor: "#3E3D32", 
                                            color: colors.text 
                                        }}
                                        className="text-[11px] font-mono px-2 py-1 rounded border hover:border-[#66D9EF] hover:text-[#F8F8F2] transition-colors cursor-pointer"
                                        title={sample.desc}
                                    >
                                        {sample.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleDecodeUserDna}
                                disabled={!isDnaValid || loading}
                                style={{ 
                                    backgroundColor: isDnaValid ? colors.cyan : "#3E3D32",
                                    color: colors.dark
                                }}
                                className="flex-1 py-2.5 px-4 rounded-lg font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Decoding DNA via /api/decode...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>Decode with {codec === "goldman" ? "Goldman" : "Naive"} + RS ECC</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setInputDna(""); setDecodedResult(null); }}
                                disabled={!inputDna && !decodedResult}
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

                    {/* Right: Decode Results & RS ECC Diagnostics */}
                    <div 
                        style={{ backgroundColor: colors.dark, borderColor: "#3E3D32" }} 
                        className="border-2 rounded-lg p-5 flex flex-col justify-between min-h-[340px]"
                    >
                        {decodedResult ? (
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex justify-between items-center pb-3 border-b border-[#2D2E28]">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" style={{ color: colors.green }} />
                                        <span style={{ color: colors.green }} className="text-xs font-mono uppercase font-bold tracking-wider">
                                            Decoded Text Output
                                        </span>
                                        <span 
                                            style={{ backgroundColor: `${colors.green}22`, color: colors.green }}
                                            className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                                        >
                                            {decodedResult.codec} · {decodedResult.recovered_bytes} Bytes
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(decodedResult.text)}
                                        style={{ 
                                            backgroundColor: copied ? `${colors.green}22` : colors.surface,
                                            borderColor: copied ? colors.green : "#3E3D32",
                                            color: copied ? colors.green : colors.text
                                        }}
                                        className="border px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 hover:text-[#F8F8F2] transition-colors cursor-pointer"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? "Copied" : "Copy Text"}</span>
                                    </button>
                                </div>

                                {/* Recovered Text Box */}
                                <div>
                                    <label style={{ color: colors.text }} className="text-[10px] font-mono uppercase block mb-1.5 opacity-80">
                                        Original Recovered Payload:
                                    </label>
                                    <div 
                                        style={{ backgroundColor: colors.bg, borderColor: colors.green }}
                                        className="p-4 rounded border-2 font-mono text-sm tracking-wide break-all max-h-28 overflow-y-auto leading-relaxed text-[#F8F8F2] selection:bg-[#A6E22E]"
                                    >
                                        {decodedResult.text}
                                    </div>
                                </div>

                                {/* Reed-Solomon Diagnostics Grid */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <ShieldCheck className="w-3.5 h-3.5" style={{ color: colors.green }} />
                                        <span style={{ color: colors.text }} className="text-[11px] font-mono uppercase tracking-wider">
                                            Reed-Solomon ECC Diagnostics
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        <div style={{ backgroundColor: colors.surface, borderColor: "#3E3D32" }} className="p-2.5 rounded border flex flex-col">
                                            <span style={{ color: colors.text }} className="text-[10px] font-mono uppercase">RS Status</span>
                                            <span style={{ color: colors.green }} className="font-rajdhani text-xl font-bold uppercase">{decodedResult.status}</span>
                                            <span className="text-[9px] font-mono text-[#A6E22E]">Verified Lossless</span>
                                        </div>

                                        <div style={{ backgroundColor: colors.surface, borderColor: "#3E3D32" }} className="p-2.5 rounded border flex flex-col">
                                            <span style={{ color: colors.text }} className="text-[10px] font-mono uppercase">RS Errors Fixed</span>
                                            <span style={{ color: decodedResult.errors_corrected > 0 ? colors.yellow : colors.cyan }} className="font-rajdhani text-xl font-bold">
                                                {decodedResult.errors_corrected}
                                            </span>
                                            <span className="text-[9px] font-mono text-opacity-80">
                                                {decodedResult.errors_corrected > 0 ? "Repaired via GF(2^8)" : "Clean Strand"}
                                            </span>
                                        </div>

                                        <div style={{ backgroundColor: colors.surface, borderColor: "#3E3D32" }} className="p-2.5 rounded border flex flex-col">
                                            <span style={{ color: colors.text }} className="text-[10px] font-mono uppercase">Input Length</span>
                                            <span style={{ color: colors.white }} className="font-rajdhani text-xl font-bold">{decodedResult.nt_length}</span>
                                            <span style={{ color: colors.text }} className="text-[9px] font-mono">nucleotides</span>
                                        </div>

                                        <div style={{ backgroundColor: colors.surface, borderColor: "#3E3D32" }} className="p-2.5 rounded border flex flex-col">
                                            <span style={{ color: colors.text }} className="text-[10px] font-mono uppercase">GC Content</span>
                                            <span style={{ color: colors.yellow }} className="font-rajdhani text-xl font-bold">{decodedResult.gc_content}</span>
                                            <span style={{ color: colors.text }} className="text-[9px] font-mono">nucleotide ratio</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Decode Method Info */}
                                <div className="p-2.5 rounded bg-[#141411] border border-[#3E3D32] flex items-center justify-between text-[11px] font-mono text-[#A29F91]">
                                    <div className="flex items-center gap-1.5">
                                        <Wrench className="w-3.5 h-3.5 text-[#66D9EF]" />
                                        <span>Decoding Scheme:</span>
                                    </div>
                                    <span className="text-[#66D9EF] font-bold uppercase">
                                        {decodedResult.method === "framed" ? "Framed Pipeline Strands" : "Direct Raw Codec"}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
                                <div style={{ backgroundColor: `${colors.cyan}11`, borderColor: `${colors.cyan}33` }} className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center mb-3">
                                    <FileText style={{ color: colors.cyan }} className="w-7 h-7 opacity-70" />
                                </div>
                                <h3 style={{ color: colors.white }} className="text-sm font-mono font-bold mb-1">No DNA Decoded Yet</h3>
                                <p style={{ color: colors.text }} className="text-xs font-nunito max-w-xs">
                                    Paste a nucleotide sequence on the left, select the matching codec, and click <span style={{ color: colors.cyan }}>"Decode"</span> to recover text with RS ECC.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SequenceEncoder
