from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
import time
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

app = FastAPI()

# Configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

# PISTON API for Code Execution (No API key needed for basic usage)
PISTON_URL = "https://emkc.org/api/v2/piston/execute"

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase environment variables")

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class CodeExecution(BaseModel):
    language: str
    version: str = "*"
    code: str

class UserRegister(BaseModel):
    email: str
    password: str
    username: str

class UserLogin(BaseModel):
    email: str
    password: str

# Endpoints
@app.get("/")
def read_root():
    return {"status": "Quiz Mate High-Performance Backend v2.0 Running"}

# Code Execution Endpoint (The "CodeChef" style engine)
@app.post("/compiler/execute")
async def execute_code(request: CodeExecution):
    try:
        # Map requested language to Piston identifiers
        lang_map = {
            "python": "python",
            "c": "c",
            "c++": "cpp",
            "java": "java",
            "python3": "python"
        }
        
        target_lang = lang_map.get(request.language.lower(), request.language.lower())
        
        payload = {
            "language": target_lang,
            "version": request.version,
            "files": [{"content": request.code}],
            "stdin": "",
            "args": [],
            "compile_timeout": 10000,
            "run_timeout": 3000,
            "compile_memory_limit": -1,
            "run_memory_limit": -1
        }
        
        response = requests.post(PISTON_URL, json=payload)
        response.raise_for_status()
        
        result = response.json()
        return {
            "stdout": result.get("run", {}).get("stdout", ""),
            "stderr": result.get("run", {}).get("stderr", ""),
            "output": result.get("run", {}).get("output", ""),
            "exit_code": result.get("run", {}).get("code", 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution Failed: {str(e)}")

# Automated Quiz Generation (Mock for now, can be connected to LLM)
@app.post("/admin/generate-quiz")
async def generate_quiz(subject: str, count: int = 5):
    # This endpoint can be used by the frontend to trigger "AI" generation
    # Instead of mock data in the frontend, we can do it here for more control
    return {"status": "pending", "message": "Background generation triggered"}

@app.post("/auth/register")
async def register(user: UserRegister):
    try:
        # 1. Sign up user in Supabase Auth
        res = supabase.auth.sign_up({
            "email": user.email, 
            "password": user.password,
            "options": {"data": {"username": user.username}}
        })
        
        if res.user:
            # 2. Create profile in public.profiles table
            supabase.table("profiles").insert({
                "id": res.user.id,
                "username": user.username,
                "total_xp": 0,
                "streak_count": 0
            }).execute()
            
            return {"message": "User registered successfully", "user": res.user}
        else:
            raise HTTPException(status_code=400, detail="Registration failed")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(user: UserLogin):
    try:
        # Note: In a production app, use sign_in_with_password
        # result = supabase.auth.sign_in_with_password(...)
        res = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        return {"session": res.session, "user": res.user}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Start the engine
    uvicorn.run(app, host="0.0.0.0", port=8000)
