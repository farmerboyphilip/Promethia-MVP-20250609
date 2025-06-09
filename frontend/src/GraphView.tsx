import React, { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'
import edgehandles from 'cytoscape-edgehandles'
import { createEdge, deleteEdgeApi } from './api'

cytoscape.use(edgehandles)

interface Props {
  nodes: any[]
  edges: any[]
  onSelect: (n: any | null) => void
  setCyRef: (cy: any) => void
}

const GraphView: React.FC<Props> = ({ nodes, edges, onSelect, setCyRef }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (!cyRef.current) {
      cyRef.current = cytoscape({
        container: containerRef.current,
        style: [
          { selector: 'node', style: { 'background-color': '#ccc', label: 'data(label)' } },
          { selector: 'edge', style: { width: 2, 'line-color': '#888', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#888' } },
          { selector: '.flash', style: { 'background-color': 'yellow' } }
        ]
      })
      const eh = cyRef.current.edgehandles()
      cyRef.current.on('ehcomplete', async (_: any, source: any, target: any, edge: any) => {
        await createEdge(Number(source.id()), Number(target.id()))
      })
      cyRef.current.on('cxttap', 'edge', async (e: any) => {
        await deleteEdgeApi(Number(e.target.id()))
      })
      cyRef.current.on('select', 'node', (e: any) => onSelect(e.target.data()))
      cyRef.current.on('unselect', 'node', () => onSelect(null))
      cyRef.current.nodes().forEach(n => {
        ;(n as any).flash = () => {
          n.addClass('flash')
          setTimeout(() => n.removeClass('flash'), 1000)
        }
      })
      setCyRef(cyRef.current)
    }
    cyRef.current.json({ elements: { nodes: nodes.map(n => ({ data: { ...n, id: String(n.id) } })), edges: edges.map(e => ({ data: { id: String(e.id), source: String(e.source_id), target: String(e.target_id) } })) } })
    cyRef.current.nodes().forEach(n => {
      if (!(n as any).flash) {
        ;(n as any).flash = () => {
          n.addClass('flash')
          setTimeout(() => n.removeClass('flash'), 1000)
        }
      }
    })
  }, [nodes, edges])

  return <div style={{ width: '100%', height: '100%' }} ref={containerRef} />
}

export default GraphView
