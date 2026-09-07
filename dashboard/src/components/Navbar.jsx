import colors from "../config/colors"
import { Dna } from 'lucide-react'
import { useState, useEffect } from "react"

const Navbar = () => {
    const [active, setActive] = useState(false)

    useEffect(() => {
        const checkBackend = async () => {
            try {
                const res = await fetch("/api/health").catch(() => fetch("http://localhost:8000/api/health"))
                setActive(Boolean(res && res.ok))
            } catch {
                setActive(false)
            }
        }
        checkBackend()
        const interval = setInterval(checkBackend, 5000)
        return () => clearInterval(interval)
    }, [])
    
    return (
        <div style={{backgroundColor : colors.bg, borderBottomColor : colors.borderStrong}} className="p-4 border-b-2 flex justify-between items-center">
            <div className="flex gap-2">
                <Dna color={`${colors.coral}`}/>
                <span style={{color : colors.text}} className="uppercase text-s font-mono">NucleoDB</span>
                <div style={{backgroundColor : colors.emerald + `1a`, borderColor : colors.emerald}} className="border-2 mx-4 px-1 flex items-center rounded-xs">
                    <span style={{color : colors.emerald}} className="uppercase text-xs font-nunito">Research Dashboard</span>
                </div>
            </div>
            <div className="flex">
                <div style={{backgroundColor : active ? colors.emerald + '1a': colors.red +'1a', borderColor : active ? colors.emerald : colors.red}} className="border-2 px-2.5 py-1 flex items-center rounded-md">
                    <span style={{color : active ? colors.emerald : colors.red}} className="uppercase text-xs font-nunito font-semibold tracking-wider">{active ? 'Active' : 'Inactive'}</span>
                </div>
            </div>
        </div>
    )
}

export default Navbar