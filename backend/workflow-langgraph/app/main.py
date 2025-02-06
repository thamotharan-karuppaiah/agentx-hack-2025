from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.agent import agent_router
from app.routers import workflow_router, execution_router
from app.config import settings
from app.database import init_db

# Create database tables

app = FastAPI(
    title="AI Workflow Orchestration API",
    description="API for managing AI workflows using LangGraph",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize the database on startup"""
    init_db()

# Include routers
app.include_router(
    workflow_router.router, 
    prefix="/workflows",  # Changed from "/api/v1"
    tags=["workflows"]
)

app.include_router(
    execution_router.router,
    prefix="/executions",
    tags=["executions"]
)

app.include_router(
    agent_router.router,
    prefix="/agent",
    tags=["agent"]
)

@app.get("/")
async def root():
    return {"message": "Welcome to AI Workflow Orchestration API"}