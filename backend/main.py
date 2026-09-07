"""
FastAPI Server Entry Point.
Run directly with: python main.py
Or with uvicorn: uvicorn main:app --reload --port 8000
"""

from src.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)
