from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.routers import auth, onboarding, catalog, cart, orders, invites
from app.routers.admin import categories, products, orders as admin_orders, users
from app.database import get_db

app = FastAPI(title="Group Purchase API")

# CORS configuration for Telegram Mini App
# Allow all origins since Telegram Mini Apps can open from various domains
# (web.telegram.org, tg.dev, k.tg.dev, desktop app with null origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(catalog.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(invites.router)

# Admin routes
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(admin_orders.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "Group Purchase API"}

@app.get("/health")
@app.head("/health")
def health_check():
    return {"status": "ok"}

@app.get("/debug/tables")
async def debug_tables(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'"))
    return {"tables": [row[0] for row in result.fetchall()]}

@app.get("/debug/alembic")
async def debug_alembic(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM alembic_version"))
    return {"version": [row[0] for row in result.fetchall()]}

@app.get("/debug/migrate")
async def run_migrate():
    import subprocess
    import os
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
        env=os.environ.copy(),
        cwd="/app"
    )
    return {
        "stdout": result.stdout,
        "stderr": result.stderr,
        "returncode": result.returncode
    }
