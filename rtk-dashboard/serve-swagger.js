#!/usr/bin/env node

/**
 * Swagger UI Server
 * Serve a documentação Swagger em localhost com suporte a YAML
 *
 * Uso:
 *   node serve-swagger.js
 *   PORT=8081 node serve-swagger.js
 *
 * Depois acesse: http://localhost:8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;

// MIME types - importante incluir YAML e JSON
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.yaml': 'application/yaml; charset=utf-8',
  '.yml': 'application/yaml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Log da requisição
  console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);

  // Remover / inicial e final
  pathname = pathname.replace(/^\/|\/$/g, '');

  // Rota padrão para swagger-ui.html
  if (pathname === '' || pathname === '/' || pathname === 'swagger-ui' || pathname === 'swagger-ui/') {
    pathname = 'swagger-ui.html';
  }

  // Resolver o caminho do arquivo
  const filePath = path.join(__dirname, pathname);

  // Verificar se o arquivo está dentro do diretório (segurança)
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Acesso negado',
      message: 'Você não tem permissão para acessar esse arquivo'
    }));
    return;
  }

  // Ler e servir o arquivo
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Arquivo não encontrado
        console.error(`❌ Arquivo não encontrado: ${pathname} (${filePath})`);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: `Arquivo não encontrado: ${pathname}`,
          available_files: [
            'swagger-ui.html',
            'openapi.yaml'
          ]
        }));
      } else {
        // Outro erro
        console.error(`❌ Erro ao ler: ${filePath}`, err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Erro interno do servidor',
          message: err.message
        }));
      }
      return;
    }

    // Determinar MIME type
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Headers de resposta
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, must-revalidate, max-age=0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    res.writeHead(200, headers);
    res.end(data);

    // Log de sucesso
    console.log(`✅ ${res.statusCode} ${ext} (${(data.length / 1024).toFixed(2)}KB)`);
  });
});

// Tratamento de erros do servidor
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Erro: Porta ${PORT} já está em uso!\n`);
    console.log(`Opções:\n`);
    console.log(`  1. Feche a aplicação usando a porta ${PORT}`);
    console.log(`  2. Use outra porta:\n`);
    console.log(`     PORT=8081 node serve-swagger.js\n`);
    process.exit(1);
  } else {
    console.error('❌ Erro no servidor:', err);
    throw err;
  }
});

// Iniciar servidor
server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                 📚 Swagger UI Server                      ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  ✅ Servidor rodando!                                    ║
║                                                           ║
║  🌐 Acesse em seu navegador:                            ║
║                                                           ║
║     👉 ${url}
║                                                           ║
║  📄 Arquivos servidos:                                   ║
║     • swagger-ui.html  (Interface Swagger)              ║
║     • openapi.yaml     (Especificação em YAML)          ║
║                                                           ║
║  🔍 O que você verá:                                     ║
║     ✓ Toda documentação em PORTUGUÊS                    ║
║     ✓ Descrição de cada API                             ║
║     ✓ Parâmetros explicados                             ║
║     ✓ Exemplos JSON de request/response                 ║
║     ✓ Casos de uso práticopausários                      ║
║     ✓ Botão "Try it out" para testar                   ║
║                                                           ║
║  ⌨️  Comandos:                                           ║
║     • Ctrl+C para parar o servidor                      ║
║     • Recarregue a página (Ctrl+F5) se houver cache    ║
║     • Verifique o console (F12) para mensagens          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando servidor...');
  server.close(() => {
    console.log('✓ Servidor finalizado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  server.close(() => {
    console.log('✓ Servidor finalizado');
    process.exit(0);
  });
});
