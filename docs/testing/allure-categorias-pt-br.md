# Categorias no Allure

O Allure organiza os testes para facilitar leitura. A categorização deve responder rapidamente: qual área falhou e que tipo de teste era?

## Tipos

| Tipo | Uso |
|---|---|
| Unitário | Valida uma regra pequena |
| Integração | Valida componentes juntos |
| BDD/E2E | Valida comportamento ou fluxo do usuário |
| Performance | Valida carga, latência e erro |

## Áreas sugeridas

- Autenticação.
- Usuários.
- Ativos.
- Transferências.
- Inventário.
- Manutenção.
- Auditoria.
- Relatórios.
- Segurança.

## Boas práticas

- Nome do teste deve dizer o comportamento esperado.
- Tags devem ser consistentes.
- Falhas conhecidas devem ser investigadas, não apenas ignoradas.
- Teste instável deve ser tratado como débito técnico.

## Exemplo de intenção

```text
Área: Ativos
Tipo: BDD/E2E
Cenário: operador não pode baixar ativo sem permissão
```

No relatório, isso ajuda a enxergar se o problema é de regra, integração ou interface.

