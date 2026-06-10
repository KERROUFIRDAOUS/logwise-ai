export default function IncidentTimeline({ timeline }) {
    if (!timeline || timeline.length === 0) return null

    const levelConfig = {
        WARN:     { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', dot: 'bg-yellow-400', line: 'border-yellow-400/20' },
        ERROR:    { color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30',    dot: 'bg-red-400',    line: 'border-red-400/20' },
        CRITICAL: { color: 'text-red-300',   bg: 'bg-red-500/15',    border: 'border-red-400/50',    dot: 'bg-red-400 animate-pulse', line: 'border-red-400/30' },
        INFO:     { color: 'text-blue-400',  bg: 'bg-blue-400/10',   border: 'border-blue-400/30',   dot: 'bg-blue-400',   line: 'border-blue-400/20' },
    }

    const impactIcon = {
        Low:      '⬇',
        Medium:   '➡',
        High:     '⬆',
        Critical: '🔴',
    }

    const formatTime = (ts) => {
        if (!ts) return ''
        return ts.includes('T') ? ts.split('T')[1].substring(0, 5) : ts
    }

    return (
        <div className="result-card border-l-2 border-l-orange-400 mt-3" style={{ animation: 'none', opacity: 1 }}>
            <div className="card-header">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-orange-400/10 text-orange-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <span className="card-label text-orange-400">Incident Replay Timeline</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-orange-400/10 text-orange-400 border border-orange-400/30">
          {timeline.length} events · Splunk MCP
        </span>
            </div>

            <div className="p-4">
                {/* Duration bar */}
                <div className="flex items-center gap-2 mb-4 text-xs font-mono text-gray-500">
                    <span>{formatTime(timeline[0]?.timestamp)}</span>
                    <div className="flex-1 h-px bg-lw-border2 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-red-400/30 to-red-500/50 rounded" />
                    </div>
                    <span>{formatTime(timeline[timeline.length - 1]?.timestamp)}</span>
                    <span className="text-gray-600">· {timeline.length * 2} min incident</span>
                </div>

                {/* Timeline events */}
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-lw-border2" />

                    <div className="flex flex-col gap-0">
                        {timeline.map((event, i) => {
                            const cfg = levelConfig[event.level] || levelConfig.INFO
                            const isLast = i === timeline.length - 1

                            return (
                                <div key={i} className="flex gap-3 relative">
                                    {/* Dot */}
                                    <div className="flex flex-col items-center shrink-0 z-10">
                                        <div className={`w-10 h-10 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                                            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                                        </div>
                                        {!isLast && <div className="w-px flex-1 bg-lw-border2 my-0.5" style={{ minHeight: '12px' }} />}
                                    </div>

                                    {/* Content */}
                                    <div className={`flex-1 pb-3 ${isLast ? '' : ''}`}>
                                        <div className={`rounded-lg p-2.5 border ${cfg.bg} ${cfg.border} mb-0`}>
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-gray-300">
                            {formatTime(event.timestamp)}
                          </span>
                                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                            {event.level}
                          </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs">{impactIcon[event.impact]}</span>
                                                    <span className="text-xs text-gray-500 font-mono">{event.service}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-300 leading-relaxed">{event.eventDescription}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 font-mono border-t border-lw-border pt-3">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                    Reconstructed from Splunk MCP · {timeline.length} events correlated
                </div>
            </div>
        </div>
    )
}