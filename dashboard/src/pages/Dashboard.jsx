import { useState, useEffect, useMemo } from 'react'
import StatCard from '../components/StatCard.jsx'
import Navbar from '../components/Navbar.jsx'
import SequenceEncoder from '../components/SequenceEncoder.jsx'
import colors from '../config/colors'
import { RotateCcw, Activity, Layers, Cpu } from 'lucide-react'

const STORAGE_KEY = "nucleodb_dna_storage_stats_v3"
const LEGACY_STORAGE_KEY = "nucleodb_dna_storage_stats_v2"
const VIEW_STORAGE_KEY = "nucleodb_active_codec_view"

const ZERO_CODEC_STATS = {
    filesProcessed: 0,
    totalBytesProcessed: 0,
    totalNtSynthesized: 0,
    totalGcCount: 0,
    maxHomopolymer: 0,
    totalEncodeTimeMs: 0,
    totalEncodeOps: 0,
    totalDecodeTimeMs: 0,
    totalDecodeOps: 0,
    totalDecodedBytes: 0,
    decodeAttempts: 0,
    decodeSuccesses: 0,
    eccErrorsEncountered: 0,
    eccErrorsFixed: 0,
    lastAction: null,
}

function getInitialStats() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed && (parsed.naive || parsed.goldman)) {
                return {
                    naive: { ...ZERO_CODEC_STATS, ...(parsed.naive || {}) },
                    goldman: { ...ZERO_CODEC_STATS, ...(parsed.goldman || {}) },
                }
            }
        }
        // Check for legacy v2 single-stats format and migrate into naive
        const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY)
        if (legacySaved) {
            const parsedLegacy = JSON.parse(legacySaved)
            if (parsedLegacy && typeof parsedLegacy === "object" && parsedLegacy.filesProcessed !== undefined) {
                return {
                    naive: { ...ZERO_CODEC_STATS, ...parsedLegacy },
                    goldman: { ...ZERO_CODEC_STATS },
                }
            }
        }
    } catch (err) {
        console.warn("Failed to read localStorage stats:", err)
    }
    return {
        naive: { ...ZERO_CODEC_STATS },
        goldman: { ...ZERO_CODEC_STATS },
    }
}

function getInitialView() {
    try {
        const savedView = localStorage.getItem(VIEW_STORAGE_KEY)
        if (["all", "naive", "goldman"].includes(savedView)) {
            return savedView
        }
    } catch {
        // Ignore fallback
    }
    return "all"
}

export const Dashboard = () => {
    const [stats, setStats] = useState(getInitialStats)
    const [activeView, setActiveView] = useState(getInitialView)

    // Persist stats in localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
        } catch (err) {
            console.warn("Failed to save stats to localStorage:", err)
        }
    }, [stats])

    // Persist active view selection
    useEffect(() => {
        try {
            localStorage.setItem(VIEW_STORAGE_KEY, activeView)
        } catch (err) {
            console.warn("Failed to save view to localStorage:", err)
        }
    }, [activeView])

    const handleNewEncode = (result) => {
        const codecKey = result.codec === "goldman" ? "goldman" : "naive"

        setStats((prev) => {
            const prevCodec = prev[codecKey] || ZERO_CODEC_STATS
            const nextFiles = prevCodec.filesProcessed + 1
            const nextBytes = prevCodec.totalBytesProcessed + (result.inputBytes || 0)
            const ntCount = result.stats?.ntCount || result.dna?.length || 0
            const nextNt = prevCodec.totalNtSynthesized + ntCount

            const gCount = result.stats?.baseDistribution?.find(b => b.base === 'G')?.count || 0
            const cCount = result.stats?.baseDistribution?.find(b => b.base === 'C')?.count || 0
            const nextGc = prevCodec.totalGcCount + gCount + cCount

            const homo = parseInt(result.stats?.maxHomopolymer || 0, 10)
            const nextHomo = Math.max(prevCodec.maxHomopolymer, homo)

            const nextEncodeTime = prevCodec.totalEncodeTimeMs + (result.elapsedMs || 20)
            const nextEncodeOps = prevCodec.totalEncodeOps + 1

            return {
                ...prev,
                [codecKey]: {
                    ...prevCodec,
                    filesProcessed: nextFiles,
                    totalBytesProcessed: nextBytes,
                    totalNtSynthesized: nextNt,
                    totalGcCount: nextGc,
                    maxHomopolymer: nextHomo,
                    totalEncodeTimeMs: nextEncodeTime,
                    totalEncodeOps: nextEncodeOps,
                    lastAction: Date.now(),
                }
            }
        })

        // Auto-switch to the codec just used if user is currently in a specific codec tab
        if (activeView !== "all" && activeView !== codecKey) {
            setActiveView(codecKey)
        }
    }

    const handleNewDecode = (result) => {
        const codecKey = result.codec === "goldman" ? "goldman" : "naive"

        setStats((prev) => {
            const prevCodec = prev[codecKey] || ZERO_CODEC_STATS
            const nextAttempts = prevCodec.decodeAttempts + 1
            const nextSuccesses = prevCodec.decodeSuccesses + (result.success ? 1 : 0)
            const nextDecodeTime = prevCodec.totalDecodeTimeMs + (result.elapsedMs || 20)
            const nextDecodeOps = prevCodec.totalDecodeOps + 1
            const decodedBytes = result.recovered_bytes || result.recoveredBytes || 0
            const nextDecodedBytes = prevCodec.totalDecodedBytes + decodedBytes
            const errorsFixed = result.errors_corrected || 0

            return {
                ...prev,
                [codecKey]: {
                    ...prevCodec,
                    decodeAttempts: nextAttempts,
                    decodeSuccesses: nextSuccesses,
                    totalDecodeTimeMs: nextDecodeTime,
                    totalDecodeOps: nextDecodeOps,
                    totalDecodedBytes: nextDecodedBytes,
                    eccErrorsEncountered: prevCodec.eccErrorsEncountered + errorsFixed,
                    eccErrorsFixed: prevCodec.eccErrorsFixed + errorsFixed,
                    lastAction: Date.now(),
                }
            }
        })

        // Auto-switch to the codec just used if user is currently in a specific codec tab
        if (activeView !== "all" && activeView !== codecKey) {
            setActiveView(codecKey)
        }
    }

    const handleResetStats = (target) => {
        if (target === "all") {
            try {
                localStorage.removeItem(STORAGE_KEY)
                localStorage.removeItem(LEGACY_STORAGE_KEY)
            } catch (e) {
                console.warn(e)
            }
            setStats({
                naive: { ...ZERO_CODEC_STATS },
                goldman: { ...ZERO_CODEC_STATS },
            })
        } else if (target === "naive" || target === "goldman") {
            setStats((prev) => ({
                ...prev,
                [target]: { ...ZERO_CODEC_STATS },
            }))
        }
    }

    // Compute metrics according to active view filter
    const displayedStats = useMemo(() => {
        if (activeView === "naive") return stats.naive
        if (activeView === "goldman") return stats.goldman

        // Aggregate "all" codecs
        const n = stats.naive
        const g = stats.goldman

        return {
            filesProcessed: n.filesProcessed + g.filesProcessed,
            totalBytesProcessed: n.totalBytesProcessed + g.totalBytesProcessed,
            totalNtSynthesized: n.totalNtSynthesized + g.totalNtSynthesized,
            totalGcCount: n.totalGcCount + g.totalGcCount,
            maxHomopolymer: Math.max(n.maxHomopolymer, g.maxHomopolymer),
            totalEncodeTimeMs: n.totalEncodeTimeMs + g.totalEncodeTimeMs,
            totalEncodeOps: n.totalEncodeOps + g.totalEncodeOps,
            totalDecodeTimeMs: n.totalDecodeTimeMs + g.totalDecodeTimeMs,
            totalDecodeOps: n.totalDecodeOps + g.totalDecodeOps,
            totalDecodedBytes: n.totalDecodedBytes + g.totalDecodedBytes,
            decodeAttempts: n.decodeAttempts + g.decodeAttempts,
            decodeSuccesses: n.decodeSuccesses + g.decodeSuccesses,
            eccErrorsEncountered: n.eccErrorsEncountered + g.eccErrorsEncountered,
            eccErrorsFixed: n.eccErrorsFixed + g.eccErrorsFixed,
            lastAction: Math.max(n.lastAction || 0, g.lastAction || 0) || null,
        }
    }, [stats, activeView])

    // --- Dynamic Formatted Metrics (Starting at 0 for all) ---
    // 1. Data Processed formatted with dynamic units
    let dataReading = "0"
    let dataUnit = "Bytes"
    if (displayedStats.totalBytesProcessed > 0) {
        if (displayedStats.totalBytesProcessed < 1024) {
            dataReading = displayedStats.totalBytesProcessed.toString()
            dataUnit = "Bytes"
        } else if (displayedStats.totalBytesProcessed < 1024 * 1024) {
            dataReading = (displayedStats.totalBytesProcessed / 1024).toFixed(2)
            dataUnit = "KB"
        } else {
            dataReading = (displayedStats.totalBytesProcessed / (1024 * 1024)).toFixed(2)
            dataUnit = "MB"
        }
    }

    // 2. Average Storage Density (bits per nucleotide)
    const densityReading = displayedStats.totalNtSynthesized > 0
        ? ((displayedStats.totalBytesProcessed * 8) / displayedStats.totalNtSynthesized).toFixed(2)
        : "0.00"

    // 3. Average Nucleotides synthesized per payload byte
    const ntPerByteReading = displayedStats.totalBytesProcessed > 0
        ? (displayedStats.totalNtSynthesized / displayedStats.totalBytesProcessed).toFixed(2)
        : "0.00"

    // 4. Round-trip success rate
    const successRateReading = displayedStats.decodeAttempts > 0
        ? `${Math.round((displayedStats.decodeSuccesses / displayedStats.decodeAttempts) * 100)}%`
        : "0%"

    // 5. Average Encode Speed in MB/s
    const encodeSpeedReading = displayedStats.totalEncodeTimeMs > 0 && displayedStats.totalBytesProcessed > 0
        ? ((displayedStats.totalBytesProcessed / (1024 * 1024)) / (displayedStats.totalEncodeTimeMs / 1000)).toFixed(2)
        : "0.00"

    // 6. Average Decode Speed in MB/s
    const decodeSpeedReading = displayedStats.totalDecodeTimeMs > 0 && displayedStats.totalDecodedBytes > 0
        ? ((displayedStats.totalDecodedBytes / (1024 * 1024)) / (displayedStats.totalDecodeTimeMs / 1000)).toFixed(2)
        : "0.00"

    // 7. Average GC Content (%)
    const gcContentReading = displayedStats.totalNtSynthesized > 0
        ? `${((displayedStats.totalGcCount / displayedStats.totalNtSynthesized) * 100).toFixed(1)}%`
        : "0%"

    // 8. Error Recovery Rate (%)
    const errorRecoveryRateReading = displayedStats.decodeSuccesses > 0 ? "100%" : "0%"

    const hasAnyActivity = displayedStats.filesProcessed > 0 || displayedStats.decodeAttempts > 0
    const hasTotalActivity = (stats.naive.filesProcessed + stats.naive.decodeAttempts + 
                              stats.goldman.filesProcessed + stats.goldman.decodeAttempts) > 0

    // Codec contextual descriptions
    const codecDescriptions = {
        all: {
            label: "All Codecs",
            densityDesc: "Information density relative to 2.0 b/nt theoretical limit",
            ntPerByteDesc: "Average nucleotides synthesized per payload byte across codecs",
            homopolymerDesc: "Consecutive repeating bases observed across active codecs",
        },
        naive: {
            label: "Naive (2-Bit)",
            densityDesc: "Direct 2-bit mapping (max theoretical 2.0 b/nt, with RS ECC)",
            ntPerByteDesc: "Average nucleotides synthesized per byte (~4 nt/byte base)",
            homopolymerDesc: "Consecutive repeating bases observed in Naive strands",
        },
        goldman: {
            label: "Goldman Rotating",
            densityDesc: "Rotating ternary mapping (max theoretical 1.33 b/nt, with RS ECC)",
            ntPerByteDesc: "Average nucleotides synthesized per byte (~6 nt/byte base)",
            homopolymerDesc: "Rotating ternary guarantees 0 repeating consecutive nucleotides",
        },
    }

    const currentMeta = codecDescriptions[activeView] || codecDescriptions.all

    return (
        <div className="min-h-screen">
            <Navbar/>
            <div className="flex flex-col p-6 gap-6">
                {/* Metric Cards Section Header & Codec Switcher */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                    {/* Left: Title & Codec Filter Switcher Tabs */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" style={{ color: colors.cyan }} />
                            <span style={{ color: colors.white }} className="text-sm font-mono font-bold tracking-wide">
                                METRICS
                            </span>
                        </div>

                        {/* Codec Filter Selector Tabs */}
                        <div className="flex items-center bg-[#141411] p-1 rounded-lg border border-[#3E3D32]">
                            <button
                                type="button"
                                onClick={() => setActiveView("all")}
                                style={{
                                    backgroundColor: activeView === "all" ? `${colors.yellow}26` : "transparent",
                                    borderColor: activeView === "all" ? colors.yellow : "transparent",
                                    color: activeView === "all" ? colors.yellow : colors.text,
                                }}
                                className="px-2.5 py-1 rounded-md border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Layers className="w-3 h-3" />
                                <span>All Codecs</span>
                                <span 
                                    style={{ backgroundColor: activeView === "all" ? `${colors.yellow}33` : "#272822" }}
                                    className="text-[10px] px-1.5 py-0.2 rounded font-mono font-normal"
                                >
                                    {stats.naive.filesProcessed + stats.goldman.filesProcessed}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveView("naive")}
                                style={{
                                    backgroundColor: activeView === "naive" ? `${colors.cyan}26` : "transparent",
                                    borderColor: activeView === "naive" ? colors.cyan : "transparent",
                                    color: activeView === "naive" ? colors.cyan : colors.text,
                                }}
                                className="px-2.5 py-1 rounded-md border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Cpu className="w-3 h-3" />
                                <span>Naive (2-Bit)</span>
                                <span 
                                    style={{ backgroundColor: activeView === "naive" ? `${colors.cyan}33` : "#272822" }}
                                    className="text-[10px] px-1.5 py-0.2 rounded font-mono font-normal"
                                >
                                    {stats.naive.filesProcessed}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveView("goldman")}
                                style={{
                                    backgroundColor: activeView === "goldman" ? `${colors.pink}26` : "transparent",
                                    borderColor: activeView === "goldman" ? colors.pink : "transparent",
                                    color: activeView === "goldman" ? colors.pink : colors.text,
                                }}
                                className="px-2.5 py-1 rounded-md border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Cpu className="w-3 h-3" />
                                <span>Goldman Rotating</span>
                                <span 
                                    style={{ backgroundColor: activeView === "goldman" ? `${colors.pink}33` : "#272822" }}
                                    className="text-[10px] px-1.5 py-0.2 rounded font-mono font-normal"
                                >
                                    {stats.goldman.filesProcessed}
                                </span>
                            </button>
                        </div>

                        {hasTotalActivity && (
                            <span 
                                style={{ backgroundColor: `${colors.green}18`, color: colors.green, borderColor: `${colors.green}40` }}
                                className="border px-2 py-0.5 rounded text-[10px] font-mono font-semibold hidden sm:inline-block"
                            >
                                LocalStorage Active
                            </span>
                        )}
                    </div>

                    {/* Right: Reset Action Buttons */}
                    <div className="flex items-center gap-2 self-start md:self-auto">
                        {hasAnyActivity && (
                            <button
                                type="button"
                                onClick={() => handleResetStats(activeView)}
                                style={{ 
                                    backgroundColor: colors.surface, 
                                    borderColor: "#3E3D32", 
                                    color: colors.text 
                                }}
                                className="px-2.5 py-1.5 rounded border text-[11px] font-mono flex items-center gap-1.5 hover:border-[#F92672] hover:text-[#F92672] transition-colors cursor-pointer"
                                title={`Reset ${currentMeta.label} metrics back to zero`}
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset {activeView === "all" ? "All" : currentMeta.label} to 0</span>
                            </button>
                        )}

                        {hasTotalActivity && activeView !== "all" && (
                            <button
                                type="button"
                                onClick={() => handleResetStats("all")}
                                style={{ 
                                    backgroundColor: colors.dark, 
                                    borderColor: "#3E3D32", 
                                    color: colors.text 
                                }}
                                className="px-2 py-1.5 rounded border text-[10px] font-mono opacity-80 hover:opacity-100 hover:border-[#F92672] hover:text-[#F92672] transition-colors cursor-pointer"
                                title="Reset all codecs back to zero"
                            >
                                Reset All Codecs
                            </button>
                        )}
                    </div>
                </div>

                {/* 10 Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                    <StatCard 
                        colorIndex={0} 
                        title="Files Processed" 
                        reading={displayedStats.filesProcessed.toString()} 
                        readingUnit="files"
                        description={`Total ${activeView === "all" ? "digital files" : currentMeta.label} converted to DNA sequence pools`}
                        isUpdated={hasAnyActivity}
                    />
                    <StatCard 
                        colorIndex={1} 
                        title="Data Processed" 
                        reading={dataReading} 
                        readingUnit={dataUnit}
                        description="Total uncompressed archival payload encoded"
                        isUpdated={hasAnyActivity}
                    />
                    <StatCard 
                        colorIndex={2} 
                        title="Avg. Storage Density" 
                        reading={densityReading} 
                        readingUnit="bits/nt"
                        description={currentMeta.densityDesc}
                        isUpdated={hasAnyActivity}
                    />
                    <StatCard 
                        colorIndex={3} 
                        title="Avg. NT per byte" 
                        reading={ntPerByteReading} 
                        readingUnit="nt/byte"
                        description={currentMeta.ntPerByteDesc}
                        isUpdated={hasAnyActivity}
                    />
                    <StatCard 
                        colorIndex={4} 
                        title="Round-trip success rate" 
                        reading={successRateReading} 
                        readingUnit=""
                        description="Files passing encode-noise-decode verification"
                        isUpdated={hasAnyActivity}
                    />
                    <StatCard 
                        colorIndex={5} 
                        title="Avg. Encode Speed" 
                        reading={encodeSpeedReading} 
                        readingUnit="MB/s"
                        description="Throughput of bit encoding pipeline"
                        isUpdated={hasAnyActivity}
                    />
                    <StatCard 
                        colorIndex={6} 
                        title="Avg. Decode Speed" 
                        reading={decodeSpeedReading} 
                        readingUnit="MB/s"
                        description="Throughput of consensus alignment & RS decoding"
                        isUpdated={hasAnyActivity}
                    />
                    <StatCard 
                        colorIndex={7} 
                        title="Avg. GC Content" 
                        reading={gcContentReading} 
                        readingUnit=""
                        description="Optimal ratio for thermal stability (40-60% target)"
                        isUpdated={hasAnyActivity}
                    />
                    <StatCard 
                        colorIndex={0} 
                        title="Max Homopolymer" 
                        reading={displayedStats.maxHomopolymer.toString()} 
                        readingUnit="nucleotides"
                        description={currentMeta.homopolymerDesc}
                        isUpdated={hasAnyActivity}
                    />
                    <StatCard 
                        colorIndex={1} 
                        title="Error Recovery Rate" 
                        reading={errorRecoveryRateReading} 
                        readingUnit=""
                        description="Noise errors corrected by Reed-Solomon GF-256 ECC"
                        isUpdated={hasAnyActivity}
                    />
                </div>

                {/* Sequence Synthesizer & Decoder Studio */}
                <SequenceEncoder 
                    onEncode={handleNewEncode} 
                    onDecode={handleNewDecode} 
                />
            </div>
        </div>
    )
}

export default Dashboard