import React, { useEffect, useState } from 'react'
import GraphView from './GraphView'
import NodeEditor from './NodeEditor'
import { fetchNodes, fetchEdges, addNode, deleteNodeApi } from './api'

interface NodeData {
  id: number
  label: string
  ntype: string
  distribution: string
}

interface EdgeData {
  id: number
  source_id: number
  target_id: number
}

const App: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [edges, setEdges] = useState<EdgeData[]>([])
  const [selected, setSelected] = useState<NodeData | null>(null)

  useEffect(() => {
    load()
    const ws = new WebSocket(`ws://${location.host}/ws`)
    ws.onmessage = (ev) => {
      const diffs = JSON.parse(ev.data)
      for (const [id] of diffs) {
        const el = cyRef?.getElementById(String(id))
        if (el) {
          el.flash()
        }
      }
    }
  }, [])

  const [cyRef, setCyRef] = useState<any>(null)

  const load = async () => {
    setNodes(await fetchNodes())
    setEdges(await fetchEdges())
  }

  const addNew = async () => {
    await addNode({ label: 'New Node', ntype: 'Fact', distribution: '' })
    await load()
  }

  const deleteSelected = async () => {
    if (selected) {
      await deleteNodeApi(selected.id)
      setSelected(null)
      await load()
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ position: 'absolute', padding: 10 }}>
        <button onClick={addNew}>Add node</button>
        {selected && <button onClick={deleteSelected}>Delete</button>}
      </div>
      <div style={{ flex: 1 }}>
        <GraphView nodes={nodes} edges={edges} onSelect={setSelected} setCyRef={setCyRef} />
      </div>
      <NodeEditor node={selected} onSaved={load} />
    </div>
  )
}

export default App
