# Regras de negócio

Este documento resume as regras que protegem o uso correto do sistema. Ele deve ser lido antes de alterar serviços, endpoints ou telas que mexem com ativos.

## Escopo dos dados

- Todo dado operacional pertence a uma organização.
- Muitos dados também pertencem a uma unidade.
- Usuários só devem ver e alterar dados dentro do escopo permitido.
- Consultas precisam respeitar organização/unidade, não apenas o identificador do registro.

## Perfis de acesso

| Perfil | Pode fazer |
|---|---|
| `ADMIN` | Administrar organização, usuários, unidades e dados globais |
| `GESTOR` | Gerenciar ativos e operações da sua unidade ou escopo |
| `OPERADOR` | Executar ações operacionais permitidas |

Se uma ação mudar patrimônio, responsabilidade ou status, registre auditoria.

## Usuários

- Usuários precisam pertencer a uma organização.
- Contas podem exigir ativação antes do uso.
- Senhas devem ser armazenadas com hash, nunca em texto puro.
- MFA pode ser exigido no login conforme configuração.
- Sessões usam access token e refresh token.

## Ativos

Um ativo representa um bem da empresa. As informações mais relevantes são:

- Identificação e número patrimonial.
- Organização e unidade.
- Responsável atual.
- Status.
- Categoria, centro de custo, valor e dados complementares.

Mudanças importantes devem gerar histórico, especialmente:

- Troca de responsável.
- Mudança de status.
- Transferência entre unidades.
- Aposentadoria ou baixa.

## Transferências

- Transferência move um ativo entre responsáveis e/ou unidades.
- Deve existir aprovação quando a regra do perfil exigir.
- A transferência não deve quebrar o isolamento por organização.
- Ao concluir, atualize o ativo e registre histórico.

## Inventário

- Inventário verifica se os ativos registrados continuam no local e estado esperados.
- Uma sessão de inventário agrupa vários itens.
- Cada item deve indicar se foi encontrado, divergente ou pendente.
- Divergências devem ficar rastreáveis para ação posterior.

## Manutenção

- Manutenções registram intervenções, custos, datas e observações.
- Um ativo em manutenção pode ter restrições de uso.
- Histórico de manutenção ajuda a entender custo total do ativo.

## Financeiro e apoio

- Centro de custo ajuda a organizar despesas.
- Seguro registra cobertura, vigência e seguradora.
- Depreciação e valores devem ser tratados com cuidado porque influenciam relatórios.

## Auditoria

Registre eventos que respondam:

- Quem fez?
- O que mudou?
- Quando aconteceu?
- Em qual organização/unidade?
- Qual era o contexto?

Auditoria não é enfeite: ela é a trilha para investigar erro, fraude, divergência ou incidente.

