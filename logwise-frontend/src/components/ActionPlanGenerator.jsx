import { useState } from 'react'
import { useIncidentContext } from '../hooks/useIncidentContext'

const PRIORITY_CONFIG = {
  immediate: { text: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30',    label: 'IMMEDIATE' },
  high:      { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', label: 'HIGH' },
  medium:    { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', label: 'MEDIUM' },
}

export default function ActionPlanGenerator({ result }) {
  const [steps, setSteps]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [generated, setGenerated] = useState(false)
  const [checked, setChecked]   = useState({})
  const buildContext = useIncidentContext(result)

  if (!result) return null

  const completedCount = Object.values(checked).filter(Boolean).length

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/action-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: buildContext() })
      })
      const data = await res.json()
      const clean = data.plan.replace(/```json|```/g, '').trim()
      setSteps(JSON.parse(clean))
      setGenerated(true)
    } catch (e) {
      console.error('Action plan error:', e)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setGenerated(false); setSteps([]); setChecked({}) }

  return (
    <div className="result-card border-l-2 border-l-violet-400">
      <div className="card-header">
        <div className="w-6 h-6 rounded-md flex items-center justify-center bg-violet-400/10 text-violet-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <span className="card-label text-violet-400">Action Plan Generator</span>
        {generated && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-violet-400/10 text-violet-400 border border-violet-400/30">
            {completedCount}/{steps.length} done
          </span>
        )}
      </div>

      <div className="p-4">
        {!generated ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-xs font-mono text-center" style={{ color: 'var(--text3)' }}>
              Generate a step-by-step action plan<br />based on this incident + Splunk history
            </p>
            <button onClick={generate} disabled={loading}
              className="flex items-center gap-2 bg-violet-400 hover:opacity-85 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-opacity">
              {loading ? (
                <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Generate Action Plan</>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border2)' }}>
                <div className="h-full bg-violet-400 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / steps.length) * 100}%` }} />
              </div>
              <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text3)' }}>
                {Math.round((completedCount / steps.length) * 100)}%
              </span>
            </div>

            {steps.map((step, i) => {
              const pCfg = PRIORITY_CONFIG[step.priority] || PRIORITY_CONFIG.medium
              const isDone = checked[i]
              return (
                <div key={i} onClick={() => setChecked(p => ({ ...p, [i]: !p[i] }))}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isDone ? 'border-green-400/20 opacity-60' : 'border-lw-border hover:border-violet-400/30'
                  }`}
                  style={{ backgroundColor: isDone ? 'rgba(74,222,128,0.05)' : 'var(--bg3)' }}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    isDone ? 'bg-green-400 border-green-400' : 'border-lw-border2'
                  }`}>
                    {isDone && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className={`text-xs font-mono ${isDone ? 'line-through' : ''}`} style={{ color: isDone ? 'var(--text3)' : 'var(--text)' }}>
                      {step.action}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold border ${pCfg.bg} ${pCfg.text} ${pCfg.border}`}>{pCfg.label}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>⏱ {step.duration}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {completedCount === steps.length && steps.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/5 border border-green-400/20 rounded-lg px-3 py-2 font-mono mt-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                All steps completed — incident resolved! 🎉
              </div>
            )}

            <button onClick={reset} className="text-xs font-mono text-center mt-1 transition-colors"
              style={{ color: 'var(--text3)' }}
              onMouseEnter={e => e.target.style.color = 'var(--text2)'}
              onMouseLeave={e => e.target.style.color = 'var(--text3)'}>
              ↺ Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
