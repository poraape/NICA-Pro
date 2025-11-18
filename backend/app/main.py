from fastapi import FastAPI

from app.api import goals, meals, users
from app.api import summary
from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="NICA-Pro Backend")

app.include_router(users.router)
app.include_router(goals.router)
app.include_router(meals.router)
app.include_router(summary.router)


@app.get("/healthcheck")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
