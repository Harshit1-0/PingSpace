from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from Database.db import Base, engine
from Routers import chat, auth
import traceback

app = FastAPI()

# Allowed origins (frontend URLs)
origins = [
    "http://localhost:5173",           
    "http://127.0.0.1:5173",           
    "https://pingspace1.vercel.app", 
    "http://localhost:4173",
    "*"  
]

# Add CORS middleware - IMPORTANT: Must be added before exception handlers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,       
    allow_methods=["*"],          
    allow_headers=["*"],
    expose_headers=["*"]           
)

# Exception handler for HTTPException to ensure CORS headers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Check if origin is in allowed origins
    origin = request.headers.get("origin")
    cors_headers = {}
    if origin:
        cors_headers["Access-Control-Allow-Origin"] = origin
        cors_headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "message": exc.detail},
        headers=cors_headers
    )

# Exception handler to ensure CORS headers are included in error responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the error for debugging
    print(f"Unhandled exception: {exc}")
    print(traceback.format_exc())
    
    # Check if origin is in allowed origins
    origin = request.headers.get("origin")
    cors_headers = {}
    if origin:
        cors_headers["Access-Control-Allow-Origin"] = origin
        cors_headers["Access-Control-Allow-Credentials"] = "true"
    
    # Return JSON response with CORS headers
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "message": str(exc)},
        headers=cors_headers
    )

# Validation error handler with CORS headers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Check if origin is in allowed origins
    origin = request.headers.get("origin")
    cors_headers = {}
    if origin:
        cors_headers["Access-Control-Allow-Origin"] = origin
        cors_headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "message": "Validation error"},
        headers=cors_headers
    )

Base.metadata.create_all(bind=engine)

# Routers - No prefix needed
app.include_router(chat.router)
app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "PingSpace API is running", "websocket": "/ws/{room_id}"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}