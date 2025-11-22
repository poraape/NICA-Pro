# Runbook: Rotação de segredos

## Escopo
- `AUTH_SECRET`, `DATABASE_URL`, `REDIS_URL`, `NEXT_PUBLIC_API_BASE_URL`, tokens HF.

## Passos
1. Criar novos valores nos ambientes correspondentes (GitHub Environments/Kubernetes secrets). Não remover o valor antigo até completar validação.
2. Executar o workflow `deploy.yml` no ambiente-alvo para aplicar o novo secret e disparar rollout.
3. Confirmar healthcheck e métricas de autenticação/cache/banco após o deploy.
4. Revogar o segredo antigo (remover do secret e da store de secrets do provedor).

## Rollback
- Se qualquer etapa falhar, restaurar o secret antigo e acionar `kubectl rollout undo` nos deployments afetados.

## Observabilidade
- Validar logs de `auth_secret_missing`, erros de conexão de banco/redis e taxa de 401/500.
- Alertar para divergência de segredos se versões diferentes forem detectadas entre serviços.
