from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, onboarding, catalog, cart, orders
from app.routers.admin import categories, products, orders as admin_orders, users

app = FastAPI(title="Group Purchase API")

@app.on_event("startup")
async def startup_event():
    import subprocess
    import os
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
        env=os.environ.copy()
    )
    print(result.stdout)
    print(result.stderr)

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

# Admin routes
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(admin_orders.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "Group Purchase API"}
