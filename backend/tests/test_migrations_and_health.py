import pathlib

import pytest
from sqlalchemy import create_engine, select

from src.database.cli import healthcheck, migrate_and_seed
from src.database.models import ClinicalLimitRecord, ReferenceEnumRecord


@pytest.mark.anyio
async def test_migrate_seed_and_healthcheck(tmp_path: pathlib.Path, monkeypatch: pytest.MonkeyPatch) -> None:
    db_url = f"sqlite+pysqlite:///{tmp_path}/ci.db"
    monkeypatch.setenv("DATABASE_URL", db_url)

    migrate_and_seed(db_url)
    healthcheck(db_url)

    engine = create_engine(db_url, future=True)
    with engine.connect() as conn:
        enums = conn.execute(select(ReferenceEnumRecord).limit(1)).first()
        limits = conn.execute(select(ClinicalLimitRecord).limit(1)).first()
    assert enums is not None
    assert limits is not None
