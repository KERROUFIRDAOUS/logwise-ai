import { useState, useRef, useEffect } from 'react'
import { useIncidentContext } from '../hooks/useIncidentContext'

export default function ChatWithIncident({ result }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef(null)
  const buildContext = useIncidentContext(result)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!result) return null

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', text: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg.text, incidentContext: buildContext() })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error: could not get response.' }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    'Why do you think this is the cause?',
    'What should I check first?',
    'Is this critical?',
    'How long will this take to fix?',
  ]

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <div style={{ width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(79,128,255,0.1)', color: 'var(--blue)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <span className="card-label" style={{ color: 'var(--blue)' }}>Chat with this Incident</span>
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace' }}>powered by Splunk MCP + AI</span>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => setInput(s)}
              style={{ fontSize: '11px', padding: '6px 12px', backgroundColor: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--blue)'; e.target.style.color = 'var(--blue)' }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && (
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(79,128,255,0.15)', border: '1px solid rgba(79,128,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--blue)' }}>LW</span>
                </div>
              )}
              <div style={{
                maxWidth: '75%', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', lineHeight: 1.6,
                backgroundColor: msg.role === 'user' ? 'var(--blue)' : 'var(--bg3)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(79,128,255,0.15)', border: '1px solid rgba(79,128,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--blue)' }}>LW</span>
              </div>
              <div style={{ backgroundColor: 'var(--bg3)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '12px', borderBottomLeftRadius: '4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0,1,2].map(i => <span key={i} className="animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--blue)', display: 'inline-block', animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask anything about this incident..."
          style={{ flex: 1, backgroundColor: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: 'var(--text)', fontFamily: 'monospace', outline: 'none' }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          style={{ backgroundColor: 'var(--blue)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', opacity: (loading || !input.trim()) ? 0.4 : 1 }}>
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
