# Deploy com Docker e Hugging Face

Este guia descreve como construir e operar a imagem do backend com integração opcional à Hugging Face, garantindo build reprodutível, cache de modelos isolado e inicialização com migrações automáticas.

## Componentes criados
- `Dockerfile`: build multi-stage que compila dependências, copia o código e entrega uma imagem final mínima usando `python:3.11-slim`.
- `infra/docker/entrypoint.sh`: entrypoint que opcionalmente executa migrações e pré-busca modelos antes de iniciar o `uvicorn`.
- `infra/docker/prefetch_models.py`: script que baixa snapshots de modelos definidos em variáveis de ambiente usando `huggingface_hub`.
- `infra/docker/docker-compose.deploy.yml`: orquestra backend + PostgreSQL + cache dedicado de modelos com secrets externos.
- `infra/docker/stack.env`: template de variáveis para `docker compose`.
- `infra/docker/huggingface_token.txt.example`: placeholder para montar o token via `secrets` sem versionamento.

## Build da imagem
```bash
docker build \
  --file Dockerfile \
  --build-arg PYTHON_VERSION=3.11 \
  -t nica-pro-backend:latest .
```

**Melhorias incluídas**
- **Imagem enxuta**: dependências compiladas em estágio separado e apenas binários copiados para o runtime.
- **Segurança**: usuário sem privilégios (`appuser`), secrets lidos via `/run/secrets/huggingface_token`, cache isolado em `/var/huggingface`.
- **Reprodutibilidade**: build controlado por `PYTHON_VERSION` e dependências fixadas no `pyproject.toml`.

## Execução local com Compose
```bash
cd infra/docker
docker compose -f docker-compose.deploy.yml --env-file stack.env up -d --build
```

- Monte o token: `cp huggingface_token.txt.example huggingface_token.txt && echo "<TOKEN>" > huggingface_token.txt`.
- Ajuste `HF_MODEL_REPOS` em `stack.env` (lista separada por vírgulas). Ex.: `HF_MODEL_REPOS=sentence-transformers/all-MiniLM-L6-v2`.
- O volume `hf-cache` persiste downloads da Hugging Face entre recriações de contêiner.

## Variáveis relevantes
- `DATABASE_URL`: URL completa para o banco (usada para migrações se `RUN_DB_MIGRATIONS=1`).
- `RUN_DB_MIGRATIONS`: `1` para aplicar `python -m src.database.cli migrate-seed` na subida.
- `HF_MODEL_REPOS`: lista de repositórios Hugging Face a pré-baixar.
- `HF_REVISION`: branch/tag/commit dos modelos.
- `HUGGINGFACE_HUB_TOKEN`: token opcional lido pelo script; prefira montar via secret `huggingface_token`.

## Fluxo de inicialização
1. `entrypoint.sh` executa migrações se habilitado.
2. Pré-busca modelos via `prefetch_models.py` (respeitando token/secret e revisão).
3. Sobe `uvicorn` expondo `0.0.0.0:8000`.

## Boas práticas de produção
- Configure limites de memória/CPU no Compose ou orquestrador.
- Use registro privado para armazenar a imagem resultante e habilite scans de vulnerabilidade.
- Utilize `HF_HOME` em volume dedicado criptografado em produção.
- Armazene secrets somente via mecanismo seguro do seu orchestrator (Docker/Swarm/Kubernetes/Secrets Manager).
- Habilite `OTEL_EXPORTER_OTLP_ENDPOINT` e `OTEL_SERVICE_NAME` para exportar traces.
