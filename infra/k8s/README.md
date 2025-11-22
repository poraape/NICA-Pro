# Kubernetes manifests

These manifests provide a minimal deployment footprint for the FastAPI backend and Next.js frontend with health probes, HPA, and explicit secrets injection. Before applying, create the `nica-secrets` secret with the keys below and pick the registry/tag used during CI/CD:

- `auth_secret`: shared secret for JWT validation
- `database_url`: Postgres connection string
- `redis_url`: Redis connection string for dashboard caching
- `otel_exporter_otlp_endpoint`: Optional OTLP collector endpoint
- `api_base_url`: Public URL of the backend, injected into the frontend

Apply manifests and update images:

```bash
kubectl apply -f infra/k8s
kubectl set image deployment/nica-backend backend=ghcr.io/<org>/nica-backend:<tag>
kubectl set image deployment/nica-frontend frontend=ghcr.io/<org>/nica-frontend:<tag>
```

Rollout verification and rollback:

```bash
kubectl rollout status deployment/nica-backend --timeout=120s || \
  (kubectl rollout undo deployment/nica-backend && false)
kubectl rollout status deployment/nica-frontend --timeout=120s || \
  (kubectl rollout undo deployment/nica-frontend && false)
```
