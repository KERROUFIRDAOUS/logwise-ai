const API_URL = '/api/analyze'

export async function analyzeLogs(logContent) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logContent })
  })

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`)
  }

  return response.json()
}
