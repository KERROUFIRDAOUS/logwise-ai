export default function ImpactDashboard({ result, delay }) {
    if (!result) return null

    const sevColor = {
        Critical: { text: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30' },
        High:     { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
        Medium:   { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
        Low:      { text: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30' },
    }
    const sev = sevColor[result.severity] || sevColor.Medium

    // Extraire le service affecté depuis la cause
    const extractService = () => {
        // Chercher dans cause + explanation + similarIncidents
        const text = `${result.cause || ''} ${result.explanation || ''}`
        const match = text.match(/([A-Z][a-zA-Z]+(Service|Controller|Repository|Handler))/g)
        if (match) return match[0]

        // Fallback : chercher dans les incidents similaires
        if (result.similarIncidents?.length > 0) {
            const service = result.similarIncidents[0]?.service
            if (service && service !== 'unknown') return service
        }

        // Fallback : extraire depuis splunkContext
        if (result.splunkContext?.includes('NotificationService')) return 'NotificationService'
        if (result.splunkContext?.includes('AuthorizationService')) return 'AuthorizationService'

        return 'Application Service'
    }

    // Risques basés sur la sévérité
    const getRisks = () => {
        switch (result.severity) {
            case 'Critical': return ['Complete service outage', 'Data loss possible', 'All users affected']
            case 'High':     return ['Authentication failures', 'Partial service degradation', 'Some users affected']
            case 'Medium':   return ['Degraded performance', 'Limited functionality', 'Few users affected']
            default:         return ['Minor inconvenience', 'Minimal user impact']
        }
    }

    const estimatedTime = result.resolutionPrediction?.estimatedMinutes || '—'
    const affectedService = extractService()
    const risks = getRisks()

    return (
        <div className="result-card border-l-2 border-l-indigo-400" style={{ animationDelay: delay }}>
            {/* Header */}
            <div className="card-header">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-indigo-400/10 text-indigo-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <span className="card-label text-indigo-400">Impact Dashboard</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold border ${sev.bg} ${sev.text} ${sev.border}`}>
          {result.severity}
        </span>
            </div>

            <div className="p-4">
                {/* Metrics grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">

                    {/* Affected Service */}
                    <div className="bg-lw-bg3 border border-lw-border rounded-lg p-3 flex flex-col gap-1">
                        <span className="text-xs text-gray-600 font-mono uppercase tracking-wider">Service</span>
                        <span className="text-xs font-bold text-gray-200 font-mono truncate">{affectedService}</span>
                    </div>

                    {/* Severity */}
                    <div className={`${sev.bg} border ${sev.border} rounded-lg p-3 flex flex-col gap-1`}>
                        <span className="text-xs text-gray-600 font-mono uppercase tracking-wider">Severity</span>
                        <span className={`text-xs font-bold ${sev.text} font-mono`}>{result.severity}</span>
                    </div>

                    {/* Estimated Resolution */}
                    <div className="bg-teal-400/10 border border-teal-400/30 rounded-lg p-3 flex flex-col gap-1">
                        <span className="text-xs text-gray-600 font-mono uppercase tracking-wider">Est. Fix</span>
                        <span className="text-xs font-bold text-teal-400 font-mono">{estimatedTime} min</span>
                    </div>

                </div>

                {/* Risks */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-1">⚠️ Potential Risks</span>
                    {risks.map((risk, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-400 font-mono">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  i === 0 ? 'bg-red-400' : i === 1 ? 'bg-orange-400' : 'bg-yellow-400'
              }`} />
                            {risk}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}