# Diagramas (C4 simplificado)

## Contexto
```mermaid
graph LR
  User((Usuário)) --> Frontend[Next.js Frontend]
  Frontend --> Backend[FastAPI Backend]
  Backend --> Postgres[(Postgres)]
  Backend --> Redis[(Redis Cache)]
  Backend --> OTEL[(OTLP Collector)]
```

## Contêineres
```mermaid
graph TD
  subgraph Web
    FE[Next.js (SSR/CSR)]
  end
  subgraph API
    BE[FastAPI + Orquestrador]
    Worker[Cache/Repos]
  end
  subgraph Data
    PG[(Postgres)]
    RDS[(Redis)]
  end
  FE -->|HTTPS| BE
  BE -->|SQLAlchemy/Alembic| PG
  BE -->|aioredis| RDS
  BE -->|OTLP| OTEL[Collector]
```

## Fluxo crítico (dashboard)
```mermaid
sequenceDiagram
  participant U as Usuário
  participant FE as Frontend
  participant API as FastAPI
  participant Cache as Redis
  participant DB as Postgres

  U->>FE: Solicita /dashboard
  FE->>API: GET /api/dashboard (com trace_id)
  API->>Cache: GET dashboard:{user}
  alt cache hit
    Cache-->>API: payload em envelope
  else cache miss
    API->>DB: consultas agregadas
    DB-->>API: métricas e insights
    API->>Cache: SET dashboard:{user} + TTL
  end
  API-->>FE: envelope JSON + trace_id
  FE-->>U: renderiza gráficos (lazy load)
```
