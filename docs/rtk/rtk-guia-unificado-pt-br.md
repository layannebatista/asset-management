# RTK - Guia Unificado (Multi-IA)

## Objetivo
Padronizar instalacao, validacao e troubleshooting do RTK para Claude Code, GitHub Copilot, Cursor, Codeium, Google Gemini e OpenCode.

## Status Real no Repositorio
- Script base: `scripts/install-rtk.sh`
- Script interativo multi-IA: `scripts/install-rtk-multi-ia.sh`
- Integracao de hooks Claude: `.claude/settings.local.json`
- Observacao importante no Windows PowerShell: RTK pode nao entrar no PATH automaticamente.

## Fluxo Recomendado de Instalacao
1. Execute `./scripts/install-rtk.sh` em shell compatível (Git Bash, WSL, Linux, macOS).
2. Valide com `rtk --version`.
3. No Windows PowerShell, valide tambem com `Get-Command rtk`.
4. Se nao encontrar binario, adicione o diretório de instalacao ao PATH e reinicie o terminal.

## Integracao por Ferramenta
### Claude Code
- Ja existe hook no workspace.
- Necessario apenas garantir o binario `rtk` disponivel no ambiente do terminal.

### GitHub Copilot e Cursor
- Integracao via shell hook (`rtk hook bash` ou `rtk hook zsh`).
- Recomendado configurar no arquivo de shell do usuario (`.bashrc` ou `.zshrc`).

### Codeium
- Mesmo modelo de integracao via shell.

### Google Gemini CLI
- Mesmo modelo de shell hook.
- Requer `gcloud` instalado e autenticado.

### OpenCode
- Integracao via shell/plugin conforme ambiente da IDE.
- Requer Node.js e configuracao especifica do editor.

## Troubleshooting Rapido
- `rtk: command not found`: PATH nao configurado no shell em uso.
- Funciona no Git Bash e nao no PowerShell: PATH distinto entre shells.
- Nao reduziu tokens: comando foi executado sem prefixo RTK ou sem hook carregado.

## Regras Operacionais
- Para este repositorio, prefira executar comandos como `rtk <comando>` quando o binario estiver disponivel.
- Quando RTK nao estiver disponivel no ambiente atual, execute o comando normal e registre o gap de setup.

## Arquivos Consolidados
Este arquivo substitui e consolida os seguintes documentos legados:
- `docs/rtk-guia-multiplas-ias-pt-br.md`
- `docs/rtk-comparacao-instalacao-pt-br.md`
- `docs/rtk-resumo-implementacao-pt-br.md`
- `docs/rtk-claude-code-pt-br.md`
- `docs/rtk-github-copilot-pt-br.md`
- `docs/rtk-cursor-pt-br.md`
- `docs/rtk-codeium-pt-br.md`
- `docs/rtk-google-gemini-pt-br.md`
- `docs/rtk-opencode-pt-br.md`
