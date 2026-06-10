import { useEffect, useState } from 'react'

export default function ResolutionPredictor({ prediction, delay }) {
    const [animatedMinutes, setAnimatedMinutes] = useState(0)
    const [animatedConfidence, setAnimatedConfidence] = useState(0)

    useEffect(() => {
        if (!prediction) return

        // Animate minutes counter
        const minuteTarget = prediction.estimatedMinutes
        const minuteStep = Math.ceil(minuteTarget / 30)
        let current = 0
        const minuteTimer = setInterval(() => {
            current += minuteStep
            if (current >= minuteTarget) {
                setAnimatedMinutes(minuteTarget)
                clearInterval(minuteTimer)
            } else {
                setAnimatedMinutes(current)
            }
        }, 40)

        // Animate confidence bar
        let conf = 0
        const confTimer = setInterval(() => {
            conf += 2
            if (conf >= prediction.confidenceScore) {
                setAnimatedConfidence(prediction.confidenceScore)
                clearInterval(confTimer)
            } else {
                setAnimatedConfidence(conf)
            }
        }, 20)

        return () => {
            clearInterval(minuteTimer)
            clearInterval(confTimer)
        }
    }, [prediction])

    if (!prediction) return null

    const confidenceColor = () => {
        if (animatedConfidence >= 70) return { bar: 'bg-green-400', text: 'text-green-400', border: 'border-green-400/30', bg: 'bg-green-400/10' }
        if (animatedConfidence >= 40) return { bar: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-400/30', bg: 'bg-yellow-400/10' }
        return { bar: 'bg-red-400', text: 'text-red-400', border: 'border-red-400/30', bg: 'bg-red-400/10' }
    }

    const conf = confidenceColor()

    const confidenceLabel = () => {
        if (prediction.confidenceScore >= 70) return 'High confidence'
        if (prediction.confidenceScore >= 40) return 'Medium confidence'
        return 'Low confidence'
    }

    return (
        <div
            className="result-card border-l-2 border-l-teal-400"
            style={{ animationDelay: delay }}
        >
            {/* Header */}
            <div className="card-header">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-teal-400/10 text-teal-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <span className="card-label text-teal-400">Resolution Predictor</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-teal-400/10 text-teal-400 border border-teal-400/30">
          AI + Splunk MCP
        </span>
            </div>

            <div className="p-4 flex flex-col gap-4">

                {/* Top row — timer + confidence */}
                <div className="flex items-start gap-4">

                    {/* Estimated time */}
                    <div className="flex flex-col items-center justify-center w-20 h-20 bg-teal-400/10 border border-teal-400/20 rounded-2xl shrink-0">
            <span className="text-2xl font-bold text-teal-400 font-mono leading-none">
              {animatedMinutes}
            </span>
                        <span className="text-xs text-gray-500 font-mono mt-0.5">min</span>
                    </div>

                    {/* Confidence */}
                    <div className="flex-1 flex flex-col gap-2 justify-center">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-mono">Confidence</span>
                            <span className={`text-xs font-bold font-mono ${conf.text}`}>
                {animatedConfidence}%
              </span>
                        </div>

                        {/* Confidence bar */}
                        <div className="w-full h-2 bg-lw-border2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-100 ${conf.bar}`}
                                style={{ width: `${animatedConfidence}%` }}
                            />
                        </div>

                        {/* Confidence label */}
                        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border ${conf.bg} ${conf.border} ${conf.text} font-mono`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${conf.bar}`} />
                            {confidenceLabel()}
                        </div>
                    </div>
                </div>

                {/* Based on X incidents */}
                {prediction.incidentsUsed > 0 && (
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-lw-bg3 border border-lw-border rounded-lg px-3 py-2">
                        <svg className="w-3.5 h-3.5 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Based on{' '}
                        <span className="text-teal-400 font-bold">{prediction.incidentsUsed}</span>
                        {' '}similar incident{prediction.incidentsUsed > 1 ? 's' : ''} from Splunk history
                    </div>
                )}

                {prediction.incidentsUsed === 0 && (
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-600 bg-lw-bg3 border border-lw-border rounded-lg px-3 py-2">
                        <svg className="w-3.5 h-3.5 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        No historical data — default estimate based on severity
                    </div>
                )}

                {/* Divider */}
                <div className="border-t border-lw-border" />

                {/* Recommendation */}
                <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest font-mono">
            💡 First action
          </span>
                    <div className="bg-teal-400/5 border border-teal-400/20 rounded-lg px-3 py-2.5 text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                        {prediction.recommendation}
                    </div>
                </div>

            </div>
        </div>
    )
}