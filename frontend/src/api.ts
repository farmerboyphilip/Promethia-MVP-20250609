export interface NodePayload {
  label: string
  ntype: string
  distribution: string
}

export const fetchNodes = async () => {
  const res = await fetch('/nodes')
  return res.json()
}

export const fetchEdges = async () => {
  const res = await fetch('/edges')
  return res.json()
}

export const updateNode = async (id: number, data: NodePayload) => {
  await fetch(`/nodes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export const addNode = async (data: NodePayload) => {
  const res = await fetch('/nodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export const deleteNodeApi = async (id: number) => {
  await fetch(`/nodes/${id}`, { method: 'DELETE' })
}

export const createEdge = async (source_id: number, target_id: number) => {
  await fetch('/edges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_id, target_id })
  })
}

export const deleteEdgeApi = async (id: number) => {
  await fetch(`/edges/${id}`, { method: 'DELETE' })
}
