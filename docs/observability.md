# Observabilidade e Telemetria

Este serviço publica **logs estruturados**, **métricas** e **traces** usando OpenTelemetry:

- **Traces**: spans são abertos nos estágios `plan`, `calc`, `trend`, `coach` e `dashboard`, e propagam o `trace_id` recebido via API ou gerado no backend.
- **Métricas**: contadores expõem atividade de agentes (`agent.invocations`), eventos da orquestração (`orchestrator.events`) e fila (`event_bus.*`). Os exports usam `ConsoleSpanExporter`/`ConsoleMetricExporter` por padrão e alternam para OTLP gRPC ou HTTP quando habilitado.
- **Logs**: `trace_id` é injetado em todos os registros via `TraceIdFilter`, permitindo correlação rápida entre chamadas de API, eventos e spans.

Para enviar telemetria para um collector OTEL, defina:

- `OTEL_EXPORTER_OTLP_ENABLED=true` ou configure `OTEL_EXPORTER_OTLP_ENDPOINT`/`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`.
- `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf` (padrão) ou `grpc` para escolher o protocolo.
- `OTEL_SERVICE_NAME`, `OTEL_SERVICE_VERSION` e `DEPLOY_ENV` para enriquecer os atributos da `Resource`.

Sem variáveis setadas, o backend permanece seguro usando apenas exporters de console. O cabeçalho `x-trace-id` permite correlacionar clientes e agentes.

## MAS (multiagente) e alertas clínicos
- Cada estágio do pipeline multiagente (`calc`, `trend`, `coach`, `dashboard`) abre spans filhos do `trace_id` da API, facilitando identificar em qual agente um alerta foi gerado.
- Alertas clínicos carregam o `trace_id` no payload retornado pela API para permitir auditoria e correlação em dashboards externos.
- Métricas por agente (`agent.invocations`, `agent.latency`) ajudam a detectar regressões específicas; alimente-as em um dashboard por ambiente (dev/stage/prod).
