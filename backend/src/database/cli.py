from __future__ import annotations

import argparse
import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from .models import Base
from .seeds import ensure_reference_data


DEFAULT_DB_URL = "sqlite+pysqlite:///./nica.db"


def _backend_root() -> Path:
    # backend root holds alembic.ini and migrations/
    return Path(__file__).resolve().parents[2]


def _config(database_url: str) -> Config:
    cfg = Config(str(_backend_root() / "alembic.ini"))
    cfg.set_main_option("script_location", str(_backend_root() / "migrations"))
    cfg.set_main_option("sqlalchemy.url", database_url)
    return cfg


def migrate(database_url: str | None = None) -> None:
    url = database_url or os.getenv("DATABASE_URL", DEFAULT_DB_URL)
    command.upgrade(_config(url), "head")


def seed(database_url: str | None = None) -> None:
    url = database_url or os.getenv("DATABASE_URL", DEFAULT_DB_URL)
    engine = create_engine(url, future=True, pool_pre_ping=True)
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)
    with session_factory() as session, session.begin():
        ensure_reference_data(session)


def migrate_and_seed(database_url: str | None = None) -> None:
    migrate(database_url)
    seed(database_url)


def healthcheck(database_url: str | None = None) -> None:
    url = database_url or os.getenv("DATABASE_URL", DEFAULT_DB_URL)
    engine = create_engine(url, future=True, pool_pre_ping=True)
    with engine.connect() as conn:
        conn.execute(text("select 1"))
        conn.execute(text("select count(*) from reference_enums"))
        conn.execute(text("select count(*) from clinical_limits"))


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Migration and seed helper")
    parser.add_argument(
        "action",
        choices=["migrate", "seed", "migrate-seed", "healthcheck"],
        help="Action to execute",
    )
    parser.add_argument(
        "--url",
        dest="database_url",
        default=None,
        help="Database URL; defaults to DATABASE_URL or sqlite fallback",
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    if args.action == "migrate":
        migrate(args.database_url)
    elif args.action == "seed":
        seed(args.database_url)
    elif args.action == "migrate-seed":
        migrate_and_seed(args.database_url)
    elif args.action == "healthcheck":
        migrate(args.database_url)
        healthcheck(args.database_url)


if __name__ == "__main__":
    main()
