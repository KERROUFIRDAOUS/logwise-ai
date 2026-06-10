import { useState } from 'react'
import { analyzeLogs } from '../services/api'

export function useAnalyze() {
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function analyze(logContent) {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await analyzeLogs(logContent)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, analyze }
}
