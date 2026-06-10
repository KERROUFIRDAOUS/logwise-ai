import { useState } from 'react'
import LogInput from './components/LogInput'
import ResultCards from './components/ResultCards'
import ChatWithIncident from './components/ChatWithIncident'
import { useAnalyze } from './hooks/useAnalyze'

export default function App() {
  const [darkMode, setDarkMode] = useState(true)
  const { result, loading, error, analyze } = useAnalyze()

  const toggleTheme = (dark) => {
    setDarkMode(dark)
    // Apply class to <html> so CSS variables work everywhere
    document.documentElement.classList.toggle('light', !dark)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)', transition: 'background-color 0.3s, color 0.3s' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* ── Topbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', backgroundColor: 'var(--blue)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: '#fff' }}>
              LW
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                Log<span style={{ color: 'var(--blue)' }}>Wise</span>
              </span>
              <span style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                intelligent log analysis
              </span>
            </div>
          </div>

          {/* Theme toggle */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '20px', padding: '3px', gap: '2px' }}>
            {[
              { label: '🌙 Dark', dark: true },
              { label: '☀️ Light', dark: false },
            ].map(({ label, dark }) => (
              <button
                key={label}
                onClick={() => toggleTheme(dark)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: darkMode === dark ? '1px solid var(--border2)' : 'none',
                  backgroundColor: darkMode === dark ? 'var(--bg3)' : 'transparent',
                  color: darkMode === dark ? 'var(--text)' : 'var(--text2)',
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Input area ── */}
        <LogInput onAnalyze={analyze} loading={loading} />

        {/* ── Results (below input) ── */}
        {(result || loading || error) && (
          <div style={{ marginTop: '1rem' }}>
            <ResultCards result={result} loading={loading} error={error} />
          </div>
        )}

        {/* ── Chat (only when result available) ── */}
        {result && (
          <div style={{ marginTop: '1rem' }}>
            <ChatWithIncident result={result} />
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '10px', color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--blue)', display: 'inline-block' }} />
          Powered by Splunk MCP + AI · LogWise v1.0
        </div>

      </div>
    </div>
  )
}
