import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture()
def reset_state(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", f"sqlite+pysqlite:///{tmp_path/'test.db'}")
    import src.database.postgres as pg
    import src.core.orchestrator as orchestrator

    pg._ENGINE = None
    pg._repository = None
    orchestrator._orchestrator = None
    yield
    repo = pg.get_repository()
    repo.reset()
