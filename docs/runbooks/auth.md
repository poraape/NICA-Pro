# Runbook: Falhas de autenticação e tokens inválidos

## Sintoma
- Requisições retornam 401/403 mesmo com sessão ativa.
- Logs com `auth_secret_missing` ou `invalid_signature`.

## Diagnóstico rápido
1. Verifique variáveis `AUTH_SECRET` e `NEXT_PUBLIC_API_BASE_URL` no ambiente (Secrets/GitHub Environment ou Kubernetes secret `nica-secrets`).
2. Cheque o header `authorization` nos requests do frontend (Network tab) e o traço associado no backend (`x-trace-id`).
3. Consulte métricas/alertas: `auth.failures`, `auth.missing_secret`, `http.responses{status=401|403}`.

## Mitigação
- Confirme que o segredo é idêntico no frontend (geração) e backend (validação). Reaplique secret e reinicie o deploy.
- Em caso de emergência, gire um novo segredo e faça deploy simultâneo frontend/backend (etapa “Apply manifests and update images” do workflow `deploy.yml`).

## Rollback
- `kubectl rollout undo deployment/nica-backend` (ou usar o step automático de rollback em caso de falha de rollout na pipeline).
- Restaurar segredo anterior e reexecutar o workflow.

## Pós-incidente
- Adicionar alerta para spikes de 401/403 e validação de expiração de token.
- Confirmar que runbooks e documentação de segredos estão atualizados.
