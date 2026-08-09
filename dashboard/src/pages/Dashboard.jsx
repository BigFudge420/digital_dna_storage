import StatCard from '../components/StatCard.jsx'
import Navbar from '../components/Navbar.jsx'

export const Dashboard = () => {
    return (
        <div className="min-h-screen">
            <Navbar/>
            <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-5">
                <StatCard 
                    colorIndex={0} 
                    title="Files Processed" 
                    reading="347" 
                    readingUnit="files"
                    description="Total digital files converted to DNA sequence pools"
                />
                <StatCard 
                    colorIndex={1} 
                    title="Data Processed" 
                    reading="12.5" 
                    readingUnit="GBs"
                    description="Total uncompressed archival payload encoded"
                />
                <StatCard 
                    colorIndex={2} 
                    title="Avg. Storage Density" 
                    reading="1.9" 
                    readingUnit="bits/nt"
                    description="Information density relative to 2.0 b/nt theoretical limit"
                />
                <StatCard 
                    colorIndex={3} 
                    title="Avg. NT per byte" 
                    reading="4.21" 
                    readingUnit="nt/byte"
                    description="Average nucleotides synthesized per payload byte"
                />
                <StatCard 
                    colorIndex={4} 
                    title="Round-trip success rate" 
                    reading="100%" 
                    readingUnit=""
                    description="Files passing encode-noise-decode verification"
                />
                <StatCard 
                    colorIndex={5} 
                    title="Avg. Encode Speed" 
                    reading="1.58" 
                    readingUnit="MB/s"
                    description="Throughput of bit encoding pipeline"
                />
                <StatCard 
                    colorIndex={6} 
                    title="Avg. Decode Speed" 
                    reading="1.3" 
                    readingUnit="MB/s"
                    description="Throughput of consensus alignment & RS decoding"
                />
                <StatCard 
                    colorIndex={7} 
                    title="Avg. GC Content" 
                    reading="45%" 
                    readingUnit=""
                    description="Optimal ratio for thermal stability (40-60% target)"
                />
                <StatCard 
                    colorIndex={0} 
                    title="Max Homopolymer" 
                    reading="0" 
                    readingUnit="nucleotides"
                    description="Consecutive repeating bases observed in produced strands"
                />
                <StatCard 
                    colorIndex={1} 
                    title="Error Recovery Rate" 
                    reading="100%" 
                    readingUnit=""
                    description="Noise errors corrected by Reed-Solomon GF-256 ECC"
                />
            </div>
        </div>
    )
}

export default Dashboard