from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable

from huggingface_hub import snapshot_download


def get_token() -> str | None:
    token = os.getenv("HUGGINGFACE_HUB_TOKEN")
    token_path = os.getenv("HF_TOKEN_PATH")
    if not token and token_path:
        path = Path(token_path).expanduser()
        if path.is_file():
            token = path.read_text().strip()
    return token or None


def repos_from_env() -> list[str]:
    raw_repos = os.getenv("HF_MODEL_REPOS", "")
    return [repo.strip() for repo in raw_repos.split(",") if repo.strip()]


def download_repos(repo_ids: Iterable[str], *, cache_dir: str, token: str | None, revision: str) -> None:
    for repo_id in repo_ids:
        print(f"Downloading {repo_id}@{revision} into {cache_dir}")
        snapshot_download(
            repo_id=repo_id,
            cache_dir=cache_dir,
            token=token,
            revision=revision,
            local_files_only=False,
            tqdm_class=None,
        )


def main() -> None:
    repos = repos_from_env()
    if not repos:
        print("No HF_MODEL_REPOS configured; skipping prefetch")
        return

    cache_dir = os.getenv("HF_HOME", "/var/huggingface")
    revision = os.getenv("HF_REVISION", "main")
    token = get_token()

    os.makedirs(cache_dir, exist_ok=True)
    download_repos(repos, cache_dir=cache_dir, token=token, revision=revision)


if __name__ == "__main__":
    main()
