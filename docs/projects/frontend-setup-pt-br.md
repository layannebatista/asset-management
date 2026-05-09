# Frontend

O frontend é a interface web do Asset Management. Ele fica em `frontend/` e usa React, TypeScript e Vite.

## Rodando pelo Docker

O caminho mais simples é subir a aplicação pelo Compose:

```bash
docker compose -f docker-compose.yml up --build
```

Acesse:

```text
http://localhost:5173
```

## Desenvolvimento local

Se for rodar fora do Docker, entre na pasta `frontend/`, instale dependências e use os scripts do `package.json`.

Fluxo esperado:

```bash
npm install
npm run dev
```

## Cuidados

- Mantenha chamadas à API centralizadas.
- Trate `401` como sessão expirada.
- Não confie no frontend para autorização real.
- Use seletores estáveis (`data-testid`) em fluxos cobertos por E2E.
- Mantenha mensagens claras para erro de validação e erro de permissão.

