import { useState } from 'react'

export default function LogInput({ onAnalyze, loading }) {
  const [value, setValue] = useState('')

  function handleSubmit() {
    if (!value.trim()) return
    onAnalyze(value.trim())
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header">
        <svg className="w-4 h-4 text-lw-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="card-label">Paste your logs / error / stacktrace</span>
      </div>

      <textarea
        className="flex-1 bg-transparent resize-none outline-none p-4 font-mono text-xs text-gray-200 leading-relaxed placeholder-gray-600 min-h-[220px]"
        placeholder={`java.lang.NullPointerException\n  at com.example.UserService.getUser(UserService.java:45)\n  at com.example.UserController.profile(UserController.java:32)\n\nPaste any log, stacktrace, or incident here...`}
        value={value}
        onChange={e => setValue(e.target.value)}
      />

      <div className="flex items-center justify-between px-4 py-3 border-t border-lw-border bg-lw-bg3">
        <span className="text-xs text-gray-600 font-mono">Java · JS · Python · Spring Boot · Node</span>
        <button
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
          className="flex items-center gap-2 bg-lw-blue hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-opacity"
        >
          {loading ? (
            <>
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.75 3.75 0 01-5.304 0l-.354-.354z" />
              </svg>
              Analyze
            </>
          )}
        </button>
      </div>
    </div>
  )
}
