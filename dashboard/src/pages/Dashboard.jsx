import { useState, useEffect } from 'react'
import StatCard from '../components/StatCard.jsx'
import Navbar from '../components/Navbar.jsx'
import SequenceEncoder from '../components/SequenceEncoder.jsx'
import colors from '../config/colors'
import { RotateCcw, Activity } from 'lucide-react'

const STORAGE_KEY = "nucleodb_dna_storage_stats_v2"

const ZERO_STATS = {
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
            return { ...ZERO_STATS, ...parsed }
        }
    } catch (err) {
        console.warn("Failed to read localStorage stats:", err)
    }
    return ZERO_STATS
}

export const Dashboard = () => {
    const [stats, setStats] = useState(getInitialStats)

    // Persist stats in localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
        } catch (err) {
            console.warn("Failed to save stats to localStorage:", err)
        }
    }, [stats])

    const handleNewEncode = (result) => {
        setStats((prev) => {
            const nextFiles = prev.filesProcessed + 1
            const nextBytes = prev.totalBytesProcessed + (result.inputBytes || 0)
            const ntCount = result.stats?.ntCount || result.dna?.length || 0
            const nextNt = prev.totalNtSynthesized + ntCount

            const gCount = result.stats?.baseDistribution?.find(b => b.base === 'G')?.count || 0
            const cCount = result.stats?.baseDistribution?.find(b => b.base === 'C')?.count || 0
            const nextGc = prev.totalGcCount + gCount + cCount

            const homo = parseInt(result.stats?.maxHomopolymer || 0, 10)
            const nextHomo = Math.max(prev.maxHomopolymer, homo)

            const nextEncodeTime = prev.totalEncodeTimeMs + (result.elapsedMs || 20)
            const nextEncodeOps = prev.totalEncodeOps + 1

            return {
                ...prev,
                filesProcessed: nextFiles,
                totalBytesProcessed: nextBytes,
                totalNtSynthesized: nextNt,
                totalGcCount: nextGc,
                maxHomopolymer: nextHomo,
                totalEncodeTimeMs: nextEncodeTime,
                totalEncodeOps: nextEncodeOps,
                lastAction: Date.now(),
            }
        })
    }

    const handleNewDecode = (result) => {
        setStats((prev) => {
            const nextAttempts = prev.decodeAttempts + 1
            const nextSuccesses = prev.decodeSuccesses + (result.success ? 1 : 0)
            const nextDecodeTime = prev.totalDecodeTimeMs + (result.elapsedMs || 20)
            const nextDecodeOps = prev.totalDecodeOps + 1
            const decodedBytes = result.recovered_bytes || result.recoveredBytes || 0
            const nextDecodedBytes = prev.totalDecodedBytes + decodedBytes
            const errorsFixed = result.errors_corrected || 0

            return {
                ...prev,
                decodeAttempts: nextAttempts,
                decodeSuccesses: nextSuccesses,
                totalDecodeTimeMs: nextDecodeTime,
                totalDecodeOps: nextDecodeOps,
                totalDecodedBytes: nextDecodedBytes,
                eccErrorsEncountered: prev.eccErrorsEncountered + errorsFixed,
                eccErrorsFixed: prev.eccErrorsFixed + errorsFixed,
                lastAction: Date.now(),
            }
        })
    }

    const handleResetStats = () => {
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch (e) {
            console.warn(e)
        }
        setStats(ZERO_STATS)
    }

    // --- Dynamic Formatted Metrics (Starting at 0 for all) ---
    // 1. Data Processed formatted with dynamic units
    let dataReading = "0"
    let dataUnit = "Bytes"
    if (stats.totalBytesProcessed > 0) {
        if (stats.totalBytesProcessed < 1024) {
            dataReading = stats.totalBytesProcessed.toString()
            dataUnit = "Bytes"
        } else if (stats.totalBytesProcessed < 1024 * 1024) {
            dataReading = (stats.totalBytesProcessed / 1024).toFixed(2)
            dataUnit = "KB"
        } else {
            dataReading = (stats.totalBytesProcessed / (1024 * 1024)).toFixed(2)
            dataUnit = "MB"
        }
    }

    // 2. Average Storage Density (bits per nucleotide)
    const densityReading = stats.totalNtSynthesized > 0
        ? ((stats.totalBytesProcessed * 8) / stats.totalNtSynthesized).toFixed(2)
        : "0.00"

    // 3. Average Nucleotides synthesized per payload byte
    const ntPerByteReading = stats.totalBytesProcessed > 0
        ? (stats.totalNtSynthesized / stats.totalBytesProcessed).toFixed(2)
        : "0.00"

    // 4. Round-trip success rate
    const successRateReading = stats.decodeAttempts > 0
        ? `${Math.round((stats.decodeSuccesses / stats.decodeAttempts) * 100)}%`
        : "0%"

    // 5. Average Encode Speed in MB/s
    const encodeSpeedReading = stats.totalEncodeTimeMs > 0 && stats.totalBytesProcessed > 0
        ? ((stats.totalBytesProcessed / (1024 * 1024)) / (stats.totalEncodeTimeMs / 1000)).toFixed(2)
        : "0.00"

    // 6. Average Decode Speed in MB/s
    const decodeSpeedReading = stats.totalDecodeTimeMs > 0 && stats.totalDecodedBytes > 0
        ? ((stats.totalDecodedBytes / (1024 * 1024)) / (stats.totalDecodeTimeMs / 1000)).toFixed(2)
        : "0.00"

    // 7. Average GC Content (%)
    const gcContentReading = stats.totalNtSynthesized > 0
        ? `${((stats.totalGcCount / stats.totalNtSynthesized) * 100).toFixed(1)}%`
        : "0%"

    // 8. Error Recovery Rate (%)
    const errorRecoveryRateReading = stats.decodeSuccesses > 0 ? "100%" : "0%"

    const hasAnyActivity = stats.filesProcessed > 0 || stats.decodeAttempts > 0

    return (
        <div className="min-h-screen">
            <Navbar/>
            <div className="flex flex-col p-6 gap-6">
                {/* Metric Cards Section Header */}
                <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" style={{ color: colors.cyan }} />
                        <span style={{ color: colors.text }} className="text-xs font-mono uppercase tracking-wider font-bold">
                            Live System Metrics · Zero Baseline
                        </span>
                        {hasAnyActivity && (
                            <span 
                                style={{ backgroundColor: `${colors.green}18`, color: colors.green, borderColor: `${colors.green}40` }}
                                className="border px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
                            >
                                LocalStorage Active
                            </span>
                        )}
                    </div>

                    {hasAnyActivity && (
                        <button
                            type="button"
                            onClick={handleResetStats}
                            style={{ 
                                backgroundColor: colors.surface, 
                                borderColor: "#3E3D32", 
                                color: colors.text 
                            }}
                            className="px-2.5 py-1 rounded border text-[11px] font-mono flex items-center gap-1.5 hover:border-[#F92672] hover:text-[#F92672] transition-colors cursor-pointer"
                            title="Clear all accumulated metrics back to zero"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset Metrics to 0</span>
                        </button>
                    )}
                </div>

                {/* 10 Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                    <StatCard 
                        colorIndex={0} 
                        title="Files Processed" 
                        reading={stats.filesProcessed.toString()} 
                        readingUnit="files"
                        description="Total digital files converted to DNA sequence pools"
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
                        description="Information density relative to 2.0 b/nt theoretical limit"
                        isUpdated={hasAnyActivity}
                    />
                    <StatCard 
                        colorIndex={3} 
                        title="Avg. NT per byte" 
                        reading={ntPerByteReading} 
                        readingUnit="nt/byte"
                        description="Average nucleotides synthesized per payload byte"
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
                        reading={stats.maxHomopolymer.toString()} 
                        readingUnit="nucleotides"
                        description="Consecutive repeating bases observed in produced strands"
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