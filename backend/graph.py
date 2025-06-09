from datetime import datetime
from typing import List, Tuple, Dict, Any
from sqlmodel import Session
from .models import Node, Edge

Diff = Tuple[int, Dict[str, Any], Dict[str, Any]]


def add_node(session: Session, label: str, ntype: str = "Fact", distribution: str = "") -> Node:
    node = Node(label=label, ntype=ntype, distribution=distribution)
    session.add(node)
    session.commit()
    session.refresh(node)
    return node


def add_edge(session: Session, source_id: int, target_id: int) -> Edge:
    edge = Edge(source_id=source_id, target_id=target_id)
    session.add(edge)
    session.commit()
    session.refresh(edge)
    return edge


def delete_node(session: Session, node_id: int) -> None:
    node = session.get(Node, node_id)
    if node:
        session.delete(node)
        session.commit()


def ripple_update(session: Session, changed_node_id: int) -> List[Diff]:
    """Update timestamp of downstream nodes and return diffs."""
    diffs: List[Diff] = []
    query = (
        "WITH RECURSIVE desc(id, depth) AS ("
        " SELECT :start_id, 0"
        " UNION ALL"
        " SELECT edge.source_id, depth + 1"
        " FROM edge JOIN desc ON edge.target_id = desc.id"
        ") SELECT id, depth FROM desc ORDER BY depth;"
    )
    results = session.exec(query, {"start_id": changed_node_id}).all()
    for node_id, depth in results:
        node = session.get(Node, node_id)
        if not node:
            continue
        old = node.dict()
        if depth > 0:  # propagate to downstream nodes only
            node.updated = datetime.utcnow()
            session.add(node)
        session.commit()
        session.refresh(node)
        diffs.append((node_id, old, node.dict()))
    return diffs
