import { useState } from 'react'
import StatCard from '../components/StatCard.jsx'
import Navbar from '../components/Navbar.jsx'
import SequenceEncoder from '../components/SequenceEncoder.jsx'

const INITIAL_STATS = {
    filesProcessed: 347,
    dataProcessed: 12.5,
    storageDensity: 1.90,
    ntPerByte: 4.21,
    successRate: 100,
    encodeSpeed: 1.58,
    decodeSpeed: 1.30,
    gcContent: 45,
    maxHomopolymer: 0,
    errorRecoveryRate: 100,
    hasUpdated: false,
}

export const Dashboard = () => {
    const [stats, setStats] = useState(INITIAL_STATS)

    const handleNewEncode = (result) => {
        setStats((prev) => {
            const nextFiles = prev.filesProcessed + 1
            const newDensity = parseFloat(result.stats.density)
            const newNtByte = parseFloat(result.stats.ntPerByte)
            const newGc = parseFloat(result.stats.gcContent)
            const newHomo = parseInt(result.stats.maxHomopolymer, 10)

            // Update cumulative running metrics
            const updatedDensity = parseFloat(((prev.storageDensity * prev.filesProcessed + newDensity) / nextFiles).toFixed(2))
            const updatedNtByte = parseFloat(((prev.ntPerByte * prev.filesProcessed + newNtByte) / nextFiles).toFixed(2))
            const updatedGc = Math.round((prev.gcContent * prev.filesProcessed + newGc) / nextFiles)
            const updatedHomo = Math.max(prev.maxHomopolymer, newHomo)
            const updatedData = parseFloat((prev.dataProcessed + Math.max(result.inputBytes / (1024 * 1024 * 1024), 0.01)).toFixed(2))

            return {
                ...prev,
                filesProcessed: nextFiles,
                dataProcessed: updatedData,
                storageDensity: updatedDensity,
                ntPerByte: updatedNtByte,
                gcContent: updatedGc,
                maxHomopolymer: updatedHomo,
                hasUpdated: true,
            }
        })
    }

    return (
        <div className="min-h-screen">
            <Navbar/>
            <div className="flex flex-col p-6 gap-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                    <StatCard 
                        colorIndex={0} 
                        title="Files Processed" 
                        reading={stats.filesProcessed.toString()} 
                        readingUnit="files"
                        description="Total digital files converted to DNA sequence pools"
                        isUpdated={stats.hasUpdated}
                    />
                    <StatCard 
                        colorIndex={1} 
                        title="Data Processed" 
                        reading={stats.dataProcessed.toFixed(2)} 
                        readingUnit="GBs"
                        description="Total uncompressed archival payload encoded"
                        isUpdated={stats.hasUpdated}
                    />
                    <StatCard 
                        colorIndex={2} 
                        title="Avg. Storage Density" 
                        reading={stats.storageDensity.toFixed(2)} 
                        readingUnit="bits/nt"
                        description="Information density relative to 2.0 b/nt theoretical limit"
                        isUpdated={stats.hasUpdated}
                    />
                    <StatCard 
                        colorIndex={3} 
                        title="Avg. NT per byte" 
                        reading={stats.ntPerByte.toFixed(2)} 
                        readingUnit="nt/byte"
                        description="Average nucleotides synthesized per payload byte"
                        isUpdated={stats.hasUpdated}
                    />
                    <StatCard 
                        colorIndex={4} 
                        title="Round-trip success rate" 
                        reading={`${stats.successRate}%`} 
                        readingUnit=""
                        description="Files passing encode-noise-decode verification"
                    />
                    <StatCard 
                        colorIndex={5} 
                        title="Avg. Encode Speed" 
                        reading={stats.encodeSpeed.toFixed(2)} 
                        readingUnit="MB/s"
                        description="Throughput of bit encoding pipeline"
                    />
                    <StatCard 
                        colorIndex={6} 
                        title="Avg. Decode Speed" 
                        reading={stats.decodeSpeed.toFixed(2)} 
                        readingUnit="MB/s"
                        description="Throughput of consensus alignment & RS decoding"
                    />
                    <StatCard 
                        colorIndex={7} 
                        title="Avg. GC Content" 
                        reading={`${stats.gcContent}%`} 
                        readingUnit=""
                        description="Optimal ratio for thermal stability (40-60% target)"
                        isUpdated={stats.hasUpdated}
                    />
                    <StatCard 
                        colorIndex={0} 
                        title="Max Homopolymer" 
                        reading={stats.maxHomopolymer.toString()} 
                        readingUnit="nucleotides"
                        description="Consecutive repeating bases observed in produced strands"
                        isUpdated={stats.hasUpdated}
                    />
                    <StatCard 
                        colorIndex={1} 
                        title="Error Recovery Rate" 
                        reading={`${stats.errorRecoveryRate}%`} 
                        readingUnit=""
                        description="Noise errors corrected by Reed-Solomon GF-256 ECC"
                    />
                </div>
                <SequenceEncoder onEncode={handleNewEncode} />
            </div>
        </div>
    )
}

export default Dashboard