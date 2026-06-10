export default function SimilarIncidentsCard({ incidents, delay }) {
    if (!incidents || incidents.length === 0) return null

    const sevColor = {
        Critical: 'text-red-400 bg-red-400/10 border-red-400/30',
        High:     'text-orange-400 bg-orange-400/10 border-orange-400/30',
        Medium:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
        Low:      'text-green-400 bg-green-400/10 border-green-400/30',
    }

    return (
        <div className="result-card border-l-2 border-l-pink-400" style={{ animationDelay: delay }}>
            <div className="card-header">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-pink-400/10 text-pink-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <span className="card-label text-pink-400">Similar Incidents from Splunk</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-pink-400/10 text-pink-400 border border-pink-400/30">
          {incidents.length} found
        </span>
            </div>

            <div className="p-4 flex flex-col gap-3">
                {incidents.map((incident, i) => (
                    <div key={i} className="bg-lw-bg3 border border-lw-border rounded-lg p-3 flex flex-col gap-2">
                        {/* Header incident */}
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-gray-200 font-mono">{incident.error}</span>
                            <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${sevColor[incident.severity] || sevColor.Medium}`}>
                  {incident.severity}
                </span>
                                <span className="text-xs text-gray-500 font-mono">{incident.date}</span>
                            </div>
                        </div>

                        {/* Cause */}
                        <div className="flex gap-2 text-xs">
                            <span className="text-gray-600 shrink-0 font-mono">cause</span>
                            <span className="text-gray-400">{incident.cause}</span>
                        </div>

                        {/* Solution */}
                        <div className="flex gap-2 text-xs">
                            <span className="text-green-500 shrink-0 font-mono">fix  </span>
                            <span className="text-green-300">{incident.solution}</span>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-3 pt-1 border-t border-lw-border">
              <span className="text-xs text-gray-600 font-mono">
                ⏱ resolved in {incident.resolutionTimeMinutes} min
              </span>
                            <span className="text-xs text-gray-600 font-mono">
                service: {incident.service || 'unknown'}
              </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}