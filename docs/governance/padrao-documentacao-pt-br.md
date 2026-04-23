# Padrao de Documentacao (pt-br)

## Escopo
Este padrao vale para todos os arquivos dentro de `docs/`.

## Idioma
- Idioma obrigatorio: portugues brasileiro.
- Evitar blocos longos em ingles, exceto termos tecnicos inevitaveis.
- Preferir vocabulario simples e direto.

## Nomenclatura de Arquivos
- Formato obrigatorio: `assunto-pt-br.md`.
- Usar somente minusculas.
- Usar `-` como separador.
- Nao usar espacos, camelCase ou sufixo `pt-BR`.

## Estrutura Recomendada
Todo documento deve seguir, quando aplicavel:
1. Titulo
2. Objetivo
3. Contexto
4. Passos/Procedimento
5. Validacao
6. Referencias

## Estilo de Escrita
- Frases curtas.
- Listas objetivas.
- Evitar duplicacao de conteudo entre arquivos.
- Quando houver sobreposicao, manter um documento principal e referenciar os demais.

## Vinculacao e Referencias
- Links relativos dentro de `docs/`.
- Evitar links quebrados para arquivos removidos/renomeados.
- Atualizar o indice em `docs/indice-pt-br.md` sempre que criar, mover ou remover documentos.

## Excecoes Controladas
- Arquivos operacionais exigidos por ferramentas podem permanecer fora de `docs/`.
- Quando houver excecao, manter espelho em `docs/governance/` e registrar no indice.
