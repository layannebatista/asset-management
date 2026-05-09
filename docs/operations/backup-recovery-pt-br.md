# Backup e recuperação

Backup existe para permitir recuperação quando dados forem perdidos, corrompidos ou alterados por engano.

## O que proteger

- Banco PostgreSQL.
- Arquivo `.env` e configurações de ambiente.
- Dashboards e alertas customizados.
- Relatórios importantes, se forem guardados fora do banco.
- Segredos, sempre em cofre próprio e nunca em repositório.

## Ambiente local

Em desenvolvimento, os dados ficam em volumes Docker. Para apagar tudo:

```bash
docker compose down -v
```

Use isso com cuidado, porque remove o banco local.

## Estratégia recomendada

| Item | Recomendação |
|---|---|
| Banco | Backup automático e recorrente |
| Retenção | Definir período conforme necessidade do negócio |
| Teste de restore | Executar periodicamente |
| Segredos | Guardar em cofre seguro |
| Configuração | Versionar o que não for segredo |

## Recuperação

Fluxo simples:

1. Identifique o ponto de restauração desejado.
2. Separe evidências do problema.
3. Restaure em ambiente isolado primeiro.
4. Valide dados e aplicação.
5. Planeje janela de troca, se for produção.
6. Registre o que aconteceu e como evitar repetição.

## RTO e RPO

- RTO: quanto tempo o sistema pode ficar indisponível.
- RPO: quanto dado pode ser perdido entre o último backup e o incidente.

Esses números devem ser definidos pelo negócio. Sem isso, a operação fica no improviso.

## Cuidados de segurança

- Não envie dump com dados reais por e-mail ou chat.
- Proteja backups com controle de acesso.
- Criptografe backups sensíveis.
- Teste restauração, não apenas geração de backup.
- Remova dados pessoais quando usar dump para desenvolvimento.

