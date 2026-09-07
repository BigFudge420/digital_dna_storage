import colors from "../config/colors"

const StatCard = ({ title, reading, readingUnit, description, colorIndex = 0, cardColor, isUpdated = false }) => {
    // Select dynamic color theme from palette or fallback
    const theme = cardColor || (colors.palette ? colors.palette[colorIndex % colors.palette.length] : null)
    
    const bgColor = theme ? theme.bg : colors.teal
    const borderColor = theme ? theme.border : colors.yellow
    const textColor = theme ? theme.text : colors.text
    const valColor = theme ? theme.val : (colors.white || '#FFFFFF')

    return (
        <div 
            style={{ borderColor: borderColor, backgroundColor: bgColor, color: textColor }} 
            className={`border-2 rounded-lg flex flex-col gap-2 p-4 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${isUpdated ? 'ring-1 ring-[#A6E22E]/40' : ''}`}
        >
            <div className="flex justify-between items-center">
                <span className="text-xs tracking-widest font-mono uppercase font-bold">{title}</span>
                {isUpdated && (
                    <span 
                        style={{ color: colors.green, backgroundColor: `${colors.green}22`, borderColor: `${colors.green}55` }} 
                        className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border font-semibold"
                    >
                        LIVE
                    </span>
                )}
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