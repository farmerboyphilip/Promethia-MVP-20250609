import React, { useState, useEffect } from 'react'
import { updateNode, deleteNodeApi } from './api'

interface Props {
  node: any | null
  onSaved: () => void
}

const NodeEditor: React.FC<Props> = ({ node, onSaved }) => {
  const [label, setLabel] = useState('')
  const [ntype, setNtype] = useState('Fact')
  const [distribution, setDistribution] = useState('')

  useEffect(() => {
    if (node) {
      setLabel(node.label)
      setNtype(node.ntype)
      setDistribution(node.distribution)
    }
  }, [node])

  if (!node) return <div style={{ width: 300, padding: 10 }}>Select a node</div>

  const save = async () => {
    await updateNode(node.id, { label, ntype, distribution })
    onSaved()
  }

  const del = async () => {
    await deleteNodeApi(node.id)
    onSaved()
  }

  return (
    <div style={{ width: 300, padding: 10 }}>
      <div>
        <label>Label</label>
        <input value={label} onChange={e => setLabel(e.target.value)} />
      </div>
      <div>
        <label>Type</label>
        <select value={ntype} onChange={e => setNtype(e.target.value)}>
          <option value="Fact">Fact</option>
          <option value="Constraint">Constraint</option>
          <option value="Prompt">Prompt</option>
        </select>
      </div>
      <div>
        <label>Distribution</label>
        <input value={distribution} onChange={e => setDistribution(e.target.value)} />
      </div>
      <button onClick={save}>Save</button>
      <button onClick={del}>Delete</button>
    </div>
  )
}

export default NodeEditor
