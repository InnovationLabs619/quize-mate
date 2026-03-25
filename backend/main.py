from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

app = FastAPI()

# Configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase environment variables")

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
    return {"status": "Quiz Mate API Running"}

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
        res = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        return {"session": res.session, "user": res.user}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
