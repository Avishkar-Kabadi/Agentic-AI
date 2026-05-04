# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.tasks import router as task_router
from app.api.dashboard import router as dashboard_router
from app.api.agent import router as agent_router
from app.api.email import router as email_router
from app.config import settings
from app.services.scheduler import start_scheduler, stop_scheduler

import os
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = settings.OAUTHLIB_INSECURE_TRANSPORT


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="Agentic AI Productivity Assistant",
    description="AI-powered task management and productivity API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — needed when React frontend connects
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(task_router)
app.include_router(dashboard_router)
app.include_router(agent_router)
app.include_router(email_router)

from app.api.ws import router as ws_router
app.include_router(ws_router)


@app.get("/")
def root():
    return {
        "app": "Agentic AI Productivity Assistant",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}