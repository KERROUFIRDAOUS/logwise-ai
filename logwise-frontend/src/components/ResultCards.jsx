import SimilarIncidentsCard from './SimilarIncidentsCard'
import IncidentTimeline from './IncidentTimeline'
import ResolutionPredictor from './ResolutionPredictor'
import ImpactDashboard from './ImpactDashboard'
import ActionPlanGenerator from './ActionPlanGenerator'
import AIIncidentReport from './AIIncidentReport'

const SEV_CONFIG = {
    Critical: { badge: 'bg-red-400/10 text-red-400 border border-red-400/40',    bar: 'bg-red-400',    width: 'w-full' },
    High:     { badge: 'bg-orange-400/10 text-orange-400 border border-orange-400/40', bar: 'bg-orange-400', width: 'w-3/4' },
    Medium:   { badge: 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/40', bar: 'bg-yellow-400', width: 'w-1/2' },
    Low:      { badge: 'bg-green-400/10 text-green-400 border border-green-400/40',  bar: 'bg-green-400',  width: 'w-1/4' },
}

function ResultCard({ delay, borderColor, iconColor, iconPath, label, labelColor, children }) {
    return (
        <div className={`result-card border-l-2 ${borderColor}`} style={{ animationDelay: delay }}>
            <div className="card-header">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${iconColor}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                    </svg>
                </div>
                <span className={`card-label ${labelColor}`}>{label}</span>
            </div>
            <div className="p-4 text-sm leading-relaxed text-gray-200">{children}</div>
        </div>
    )
}

function SplunkCard({ context }) {
    const hasHistory = context && !context.includes('No previous')
    const occMatch   = context?.match(/(\d+) time/)
    const occurrences = occMatch ? parseInt(occMatch[1]) : 0
    const firstSeen  = context?.match(/First seen: ([^.]+)/)?.[1]?.trim()
    const lastSeen   = context?.match(/Last seen: ([^.]+)/)?.[1]?.trim()

    return (
        <div className={`result-card border-l-2 ${hasHistory ? 'border-l-purple-400' : 'border-l-gray-600'}`} style={{ animationDelay: '0.02s' }}>
            <div className="card-header">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${hasHistory ? 'bg-purple-400/10 text-purple-400' : 'bg-gray-600/20 text-gray-500'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <span className={`card-label ${hasHistory ? 'text-purple-400' : 'text-gray-500'}`}>Splunk History</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-mono font-bold ${hasHistory ? 'bg-purple-400/10 text-purple-400 border border-purple-400/30' : 'bg-gray-700 text-gray-500'}`}>
          {hasHistory ? 'RECURRING' : 'NEW ERROR'}
        </span>
            </div>
            <div className="p-4">
                {hasHistory ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-purple-400/10 border border-purple-400/20 rounded-xl shrink-0">
                                <span className="text-xl font-bold text-purple-400 font-mono">{occurrences}</span>
                                <span className="text-xs text-gray-500">times</span>
                            </div>
                            <div className="flex flex-col gap-1.5 text-xs font-mono">
                                {firstSeen && <div className="flex gap-2"><span className="text-gray-600">first</span><span className="text-gray-300">{firstSeen}</span></div>}
                                {lastSeen  && <div className="flex gap-2"><span className="text-gray-600">last </span><span className="text-purple-300">{lastSeen}</span></div>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-400/5 border border-purple-400/15 rounded-lg px-3 py-2 font-mono">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse shrink-0" />
                            Recurring error — prioritize this fix
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 font-mono">
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full shrink-0" />
                            No previous occurrence found in Splunk index
                        </div>
                        <p className="text-xs text-gray-600 font-mono">This log has been indexed — future analyses will show history</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ResultCards({ result, loading, error }) {
    if (loading) {
        return (
            <div className="card p-8 flex flex-col items-center justify-center gap-3">
                <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                        <span key={i} className="w-2 h-2 bg-lw-blue rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                </div>
                <p className="text-xs text-gray-500 font-mono">Querying Splunk MCP + AI analysis...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="card border border-dashed border-red-400/30 p-8 text-center">
                <p className="text-red-400 text-sm">Analysis failed</p>
                <p className="text-gray-600 text-xs mt-1 font-mono">{error}</p>
            </div>
        )
    }

    if (!result) {
        return (
            <div className="card border border-dashed border-lw-border2 p-8 text-center">
                <svg className="w-7 h-7 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Paste your logs and hit <strong className="text-gray-300">Analyze</strong>.<br />
                    Results appear here, structured and clear.
                </p>
            </div>
        )
    }

    const sev = SEV_CONFIG[result.severity] || SEV_CONFIG.Medium

    return (
        <div className="flex flex-col gap-3">

            {/* 1. Splunk History */}
            {result.splunkContext && <SplunkCard context={result.splunkContext} />}

            {/* 2. Resolution Predictor */}
            <ResolutionPredictor prediction={result.resolutionPrediction} delay="0.05s" />

            {/* 3. Probable Cause */}
            <ResultCard delay="0.08s" borderColor="border-l-red-400" iconColor="bg-red-400/10 text-red-400"
                        iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        label="Probable Cause" labelColor="text-red-400">
                {result.cause}
            </ResultCard>

            {/* 4. Explanation */}
            <ResultCard delay="0.12s" borderColor="border-l-lw-blue" iconColor="bg-lw-blue/10 text-lw-blue"
                        iconPath="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.75 3.75 0 01-5.304 0l-.354-.354z"
                        label="Explanation" labelColor="text-lw-blue">
                {result.explanation}
            </ResultCard>

            {/* 5. Severity */}
            <ResultCard delay="0.16s" borderColor="border-l-yellow-400" iconColor="bg-yellow-400/10 text-yellow-400"
                        iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        label="Severity" labelColor="text-yellow-400">
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${sev.badge}`}>{result.severity}</span>
                    <div className="flex-1 h-1 bg-lw-border2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${sev.bar} ${sev.width}`} />
                    </div>
                </div>
                <p className="mt-2 text-xs text-gray-400">{result.severityReason}</p>
            </ResultCard>

            {/* 6. Impact Dashboard */}
            <ImpactDashboard result={result} delay="0.20s" />

            {/* 7. Suggested Fixes */}
            <ResultCard delay="0.24s" borderColor="border-l-green-400" iconColor="bg-green-400/10 text-green-400"
                        iconPath="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        label="Suggested Fixes" labelColor="text-green-400">
                <div className="flex flex-col gap-2">
                    {result.fixes?.map((fix, i) => (
                        <div key={i} className="fix-item">
                            <span className="w-5 h-5 shrink-0 mt-0.5 bg-lw-blue/10 text-lw-blue border border-lw-blue/30 rounded text-xs font-bold flex items-center justify-center font-mono">{i + 1}</span>
                            <span className="text-gray-300">{fix}</span>
                        </div>
                    ))}
                </div>
            </ResultCard>

            {/* 8. Similar Incidents */}
            <SimilarIncidentsCard incidents={result.similarIncidents} delay="0.28s" />

            {/* 9. Incident Timeline */}
            <IncidentTimeline timeline={result.timeline} />

            {/* 10. Action Plan Generator */}
            <ActionPlanGenerator result={result} />

            {/* 11. AI Incident Report */}
            <AIIncidentReport result={result} />

        </div>
    )
}