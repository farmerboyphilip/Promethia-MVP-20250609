from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Node(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    label: str
    ntype: str = Field(index=True)
    distribution: str = ""
    created: datetime = Field(default_factory=datetime.utcnow)
    updated: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

class Edge(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    source_id: int = Field(foreign_key="node.id")
    target_id: int = Field(foreign_key="node.id")
