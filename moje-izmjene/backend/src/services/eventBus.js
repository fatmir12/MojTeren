const clients = new Set()

export function addSseClient(res) {
  clients.add(res)
  res.on("close", () => {
    clients.delete(res)
  })
}

export function emitEvent(type, payload) {
  const data = JSON.stringify({
    type,
    payload,
    ts: new Date().toISOString(),
  })

  for (const res of clients) {
    try {
      res.write(`event: ${type}\n`)
      res.write(`data: ${data}\n\n`)
    } catch {
      clients.delete(res)
    }
  }
}

