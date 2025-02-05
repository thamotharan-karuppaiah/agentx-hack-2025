from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .routers import workflow_router
from .config import settings

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

# Include routers
app.include_router(
    workflow_router.router, 
    prefix="/workflows",  # Changed from "/api/v1"
    tags=["workflows"]
)

@app.get("/")
async def root():
    return {"message": "Welcome to AI Workflow Orchestration API"} 