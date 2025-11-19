# Auditoria Técnica — NICA-Pro (Multi-Agente / iOS26)

## Fase 1 — Recapitulação dos critérios
- Arquitetura modular, MAS orquestrado, camadas claras (domain → serviços → interface), contratos JSON padronizados.
- Código legível, testável, sem valores mágicos, com SOLID e Clean Architecture.
- Multiagentes com isolamento, logs auditáveis, contratos explícitos e rastreáveis.
- UI iOS26: minimalismo, glassmorphism leve, microinterações, acessibilidade, navegação progressiva.
- Alinhamento ao escopo: nutrição personalizada, ingestão → cálculo → tendências → coaching → dashboard, segurança/disclaimers.

## Fase 2 — Auditoria técnica
- Arquitetura MAS: **Parcialmente conforme** — Orquestrador sequencia Planner/NLP/Calc/Trend/Coach/UI e normaliza JSON, mas persiste tudo em repositório em memória sem durabilidade ou concorrência, o que quebra rastreabilidade e escalabilidade esperada para MAS clínico.【F:backend/src/core/orchestrator.py†L46-L123】【F:backend/src/database/memory.py†L10-L45】
- Código & padrões: **Parcialmente conforme** — Dataclasses e serialização estão presentes, porém há valores mágicos (cores/ícones, limiares de alerta) embutidos nas camadas de componente em vez de config/consts, dificultando governança e testes isolados.【F:backend/src/components/dashboard.py†L18-L41】【F:backend/src/components/dashboard.py†L115-L167】
- Segurança/validação: **Não conforme** — Endpoints FastAPI não têm autenticação, rate limiting ou verificação de permissão e aceitam strings livres para sexo/atividade/objetivo, expondo risco de entrada inválida e acesso aberto.【F:backend/src/api/router.py†L16-L52】
- Fluxos MAS → UI: **Parcialmente conforme** — UI recebe dados do orquestrador, mas o front usa perfil e diário hardcoded, sem formulário/estado real de usuário; isso impede aderência multi-usuário e invalida monitoração em tempo real.【F:frontend/src/app/dashboard/page.tsx†L20-L114】
- Testabilidade: **Não conforme** — Apenas o NLPAgent possui testes; demais agentes (Planner/Calc/Coach/Dashboard/Orchestrator) e API ficam sem cobertura mínima, o que bloqueia regressões seguras.【F:backend/tests/test_nlp_agent.py†L1-L43】
- UX iOS26: **Parcialmente conforme** — Estilo glass, cards e animações existem, mas faltam controles de acessibilidade (ARIA/contraste), ausência de alternância real de tema baseada no sistema e navegação ainda estática sem deep-links funcionais.【F:frontend/src/app/dashboard/page.tsx†L124-L320】
- Logs/observabilidade: **Parcialmente conforme** — Há logs unificados no orquestrador, porém inexistem correlações (trace IDs), métricas de agente ou coleta estruturada de erros em tempo de execução.【F:backend/src/core/orchestrator.py†L160-L165】
- Segurança clínica: **Parcialmente conforme** — Existe apenas um disclaimer fixo e mensagens simples; não há validação clínica explícita nem ajustes condicionais por faixa etária/comorbidade conforme prompts pedem.【F:backend/src/services/security.py†L6-L19】

## Fase 3 — Matriz de auditoria
| Critério | Status | Observações |
| --- | --- | --- |
| Arquitetura | Parcial | MAS sequencial ok, mas ausência de persistência durável e isolamento concorrente. |
| Modularização | Parcial | Agentes separados; constantes e limiares espalhados em componentes. |
| Fluxos | Parcial | Planner→Diary→Dashboard existe, porém depende de dados hardcoded no front. |
| UI | Parcial | Visual iOS26 presente, acessibilidade e navegação dinâmica faltando. |
| UX | Parcial | Sem preferências do usuário real nem feedback de carregamento/erro refinado. |
| Segurança | Não conforme | API sem auth/rate limit; dados sensíveis expostos. |
| Escalabilidade | Não conforme | Repositório em memória e sem locks. |
| Multiagentes | Parcial | Contratos JSON ok; ausência de telemetria e testes cruzados. |
| Padronização | Parcial | Limiar/cores hardcoded; ausência de config central. |
| Código | Parcial | Tipagem e dataclasses boas; falta validação forte nos payloads. |
| Documentação | Não conforme | Sem README específico para MAS nem fluxos de uso. |
| Consistência | Parcial | Variáveis hardcoded e falta de autenticação criam desalinhamento com requisitos clínicos. |

## Fase 4 — Plano de correção e evolução
### 4.1 Correções obrigatórias
- Persistência real (Postgres/Supabase) com locks ou transações para perfis, planos, diários e dashboards.
- Autenticação/autorização no FastAPI (JWT ou Supabase Auth) + validação forte de enum (sexo/atividade/objetivo).
- Remover dados hardcoded no frontend; criar fluxo de criação de perfil e input de diário.
- Cobertura de testes mínima para Planner, Calc, Coach, DashboardAgent e Orchestrator.

### 4.2 Melhorias recomendadas
- Externalizar limiares/cores/ícones para config versionada; adicionar modo de acessibilidade (alto contraste, ARIA labels, foco visível).
- Instrumentar logs com trace_id/request_id e métricas por agente.
- Enriquecer segurança clínica com validações por faixa etária, IMC, sódio/pressão e alergias.

### 4.3 Evoluções estruturais
- Introduzir camada de domínio explícita e repositorios interfaceados para trocar armazenamento (Clean Architecture).
- Implementar pipeline de eventos assíncronos (queue) para desacoplar ingestão/coach/dashboard.
- Criar navegação real por rotas (Next.js app router) com filtros por nutriente e histórico.

### 4.4 Lista de tarefas acionáveis
- [PERSISTÊNCIA] — Garantir durabilidade e isolamento — `backend/src/database/*`, `backend/src/core/orchestrator.py`, `backend/src/api/router.py`
- [AUTH] — Proteger endpoints e validar enums — `backend/src/api/router.py`, `backend/src/services/security.py`
- [DESHARDEN FRONT] — Substituir mocks por formulários reais — `frontend/src/app/dashboard/page.tsx`, `frontend/src/lib/api.ts`
- [TESTES] — Cobrir agentes/fluxos críticos — `backend/tests/`
- [CONFIG] — Centralizar limiares/cores — `backend/src/components/dashboard.py`, `frontend/src/styles/*`
- [OBSERVABILIDADE] — Adicionar trace/logs estruturados — `backend/src/core/logging.py`, `backend/src/core/orchestrator.py`
- [ACESSIBILIDADE] — Inserir ARIA/contraste e tema auto — `frontend/src/app/dashboard/page.tsx`

### 4.5 Critérios de aceitação
- Banco persistente habilitado com migrações e testes de concorrência passando.
- Todas as rotas protegidas por auth e validação de enums/intervalos; respostas 4xx adequadas.
- Frontend permite criar perfil, registrar diário real e visualizar dashboard sem dados hardcoded.
- Suite de testes cobrindo pelo menos Planner, Calc, Coach, DashboardAgent e Orchestrator com >80% de cobertura nessas áreas críticas.
- Limiar/cores configuráveis via arquivo/env; UI com labels/contraste auditados.
- Logs incluem trace_id e eventos de agente correlacionados; alertas clínicos contextualizados.

## Fase 5 — Prompt de Execução (para Codex/Builders)
"Implemente persistência real (Postgres/Supabase) com repositórios e transações, proteja endpoints FastAPI com JWT/Supabase Auth e valida enums, remova mocks hardcoded do dashboard criando formulários de perfil/diário, centralize limiares/cores em config, adicione testes para Planner/Calc/Coach/Dashboard/Orchestrator, insira trace_id em logs, melhore acessibilidade (ARIA/contraste) e valide alertas clínicos por faixa etária/IMC."

## Fase 6 — Verificação final
- Escopo original respeitado (MAS nutricional end-to-end) e inconsistências críticas evidenciadas em negrito.
- Sem omissões intencionais; plano cobre arquitetura, segurança, testes, UI e observabilidade.
