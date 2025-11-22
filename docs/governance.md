# Governança técnica e checklist de PR

## Branching
- `main` protegido com CI obrigatório (lint, test, typecheck, pytest) e aprovação dupla.
- Branches de feature com escopo pequeno e vinculadas a issue/ticket.

## Checklist de PR
- [ ] Descrição clara do problema e da solução proposta.
- [ ] Screenshots ou gravações para alterações visuais.
- [ ] Cobertura de testes atualizada (Vitest/pytest) e links para resultados do CI.
- [ ] Documentação atualizada (runbooks, ADRs, diagramas) quando aplicável.
- [ ] Segurança: nenhum segredo commitado, tokens substituídos por variáveis de ambiente, dependências auditadas.
- [ ] Regressão: contratos de API compatíveis ou versionados; migrations reversíveis.

## Revisão
- Use comentários objetivos e sugira alterações concretas.
- Valide rastreabilidade: cada mudança deve apontar para requisito/issue.
- Priorize simplicidade e eliminação de acoplamentos desnecessários.

## Gestão de dependências
- Atualizações mensais planejadas; emergenciais para CVEs críticas.
- `npm audit --omit=dev` e `pip-audit` rodados no CI; bloqueio para severidade alta.
