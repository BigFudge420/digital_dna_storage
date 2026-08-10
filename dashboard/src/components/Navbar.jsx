import colors from "../config/colors"
import {Dna} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"

const codecs = [
    {label : "Goldman", value : "goldman"},
    {label : "Naive", value : "naive"}
]


const Navbar = () => {
    const [active, setActive] = useState(true)
    const [codec, setCodec] = useState('naive')
    
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
                <div style={{backgroundColor : active ? colors.emerald + '1a': colors.red +'1a', borderColor : active ? colors.emerald : colors.red}} className="border-2 mx-4 px-1 flex items-center rounded-md">
                    <span style={{color : active ? colors.emerald : colors.red}} className="uppercase text-xs font-nunito">{active ? 'Active' : 'Inactive'}</span>
                </div>
                <Select items={codecs} value={codec} onValueChange={setCodec}>
                    <SelectTrigger className="w-45">
                        <SelectValue placeholder="Codec"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {codecs.map((codec) => 
                                (<SelectItem key={codec.value} value={codec.value}>
                                    {codec.label}
                                </SelectItem>)
                            )}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

export default Navbar