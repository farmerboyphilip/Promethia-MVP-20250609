import json
from datetime import datetime
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, create_engine, select

from .models import Node, Edge
from .graph import add_node, add_edge, delete_node, ripple_update

DATABASE_URL = "sqlite:///backend/db.sqlite"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active:
            self.active.remove(websocket)

    async def broadcast(self, message: str):
        for ws in list(self.active):
            try:
                await ws.send_text(message)
            except WebSocketDisconnect:
                self.disconnect(ws)

manager = ConnectionManager()

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        count = session.exec(select(Node)).first()
        if count is None:
            n1 = add_node(session, "Example A")
            n2 = add_node(session, "Example B")
            n3 = add_node(session, "Example C")
            add_edge(session, n2.id, n1.id)
            add_edge(session, n3.id, n2.id)

# REST endpoints

@app.get("/nodes")
def get_nodes():
    with Session(engine) as session:
        return session.exec(select(Node)).all()

@app.get("/edges")
def get_edges():
    with Session(engine) as session:
        return session.exec(select(Edge)).all()

@app.post("/nodes")
def create_node(node: Node):
    with Session(engine) as session:
        created = add_node(session, node.label, node.ntype, node.distribution)
        diffs = ripple_update(session, created.id)
    message = json.dumps(diffs)
    import asyncio
    asyncio.create_task(manager.broadcast(message))
    return created

@app.put("/nodes/{node_id}")
def update_node(node_id: int, data: Node):
    with Session(engine) as session:
        node = session.get(Node, node_id)
        if not node:
            return {"error": "not found"}
        old = node.dict()
        node.label = data.label
        node.ntype = data.ntype
        node.distribution = data.distribution
        node.updated = datetime.utcnow()
        session.add(node)
        session.commit()
        session.refresh(node)
        diffs = [(node_id, old, node.dict())]
        diffs += ripple_update(session, node_id)
    message = json.dumps(diffs)
    import asyncio
    asyncio.create_task(manager.broadcast(message))
    return node

@app.delete("/nodes/{node_id}")
def delete_node_route(node_id: int):
    with Session(engine) as session:
        delete_node(session, node_id)
        diffs = ripple_update(session, node_id)
    message = json.dumps(diffs)
    import asyncio
    asyncio.create_task(manager.broadcast(message))
    return {"status": "ok"}

@app.post("/edges")
def create_edge(edge: Edge):
    with Session(engine) as session:
        created = add_edge(session, edge.source_id, edge.target_id)
        diffs = ripple_update(session, edge.source_id)
    message = json.dumps(diffs)
    import asyncio
    asyncio.create_task(manager.broadcast(message))
    return created

@app.delete("/edges/{edge_id}")
def delete_edge(edge_id: int):
    with Session(engine) as session:
        edge = session.get(Edge, edge_id)
        if edge:
            source = edge.source_id
            session.delete(edge)
            session.commit()
            diffs = ripple_update(session, source)
        else:
            diffs = []
    message = json.dumps(diffs)
    import asyncio
    asyncio.create_task(manager.broadcast(message))
    return {"status": "ok"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
