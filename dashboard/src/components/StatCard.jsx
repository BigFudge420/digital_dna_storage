import colors from "../config/colors"

const StatCard = ({ title, reading, readingUnit, description, colorIndex = 0, cardColor }) => {
    // Select dynamic color theme from palette or fallback
    const theme = cardColor || (colors.palette ? colors.palette[colorIndex % colors.palette.length] : null)
    
    const bgColor = theme ? theme.bg : colors.teal
    const borderColor = theme ? theme.border : colors.yellow
    const textColor = theme ? theme.text : colors.text
    const valColor = theme ? theme.val : (colors.white || '#FFFFFF')

    return (
        <div 
            style={{ borderColor: borderColor, backgroundColor: bgColor, color: textColor }} 
            className="border-2 rounded-lg flex flex-col gap-2 p-4 shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl"
        >
            <div>
                <span className="text-xs tracking-widest font-mono uppercase font-bold">{title}</span>
            </div>
            <div className="flex gap-2 items-baseline">
                <span style={{ color: valColor }} className="font-rajdhani text-3xl font-bold leading-none drop-shadow-sm">{reading}</span>
                <span className="font-mono text-xs flex items-end mb-1 opacity-90">{readingUnit}</span>
            </div>
            {description && <p className="text-[11px] font-nunito opacity-75 mt-1">{description}</p>}
        </div>
    )
}

export default StatCard