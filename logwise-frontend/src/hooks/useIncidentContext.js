/**
 * Shared hook to build incident context string
 * used by ChatWithIncident, ActionPlanGenerator, AIIncidentReport
 */
export function useIncidentContext(result) {
  if (!result) return () => ''

  return () => {
    let ctx = `
INCIDENT ANALYSIS:
- Cause: ${result.cause}
- Explanation: ${result.explanation}
- Severity: ${result.severity} — ${result.severityReason}
- Fixes: ${result.fixes?.join(' | ')}
- Splunk History: ${result.splunkContext}
- Estimated Resolution: ${result.resolutionPrediction?.estimatedMinutes ?? '?'} min
`
    if (result.similarIncidents?.length > 0) {
      ctx += '\nSIMILAR PAST INCIDENTS:\n'
      result.similarIncidents.forEach(i => {
        ctx += `- ${i.error} (${i.resolutionTimeMinutes}min): ${i.cause} → ${i.solution}\n`
      })
    }
    if (result.timeline?.length > 0) {
      ctx += '\nTIMELINE:\n'
      result.timeline.forEach(t => {
        ctx += `- ${t.timestamp}: [${t.level}] ${t.eventDescription}\n`
      })
    }
    return ctx
  }
}
