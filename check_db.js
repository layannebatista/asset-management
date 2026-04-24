const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'asset_management',
  user: 'asset_user',
  password: 'asset123',
});

async function checkDB() {
  const client = await pool.connect();
  try {
    // Verificar quantidade de registros
    const countResult = await client.query('SELECT COUNT(*) FROM token_savings_log');
    console.log('Total de registros:', countResult.rows[0].count);

    // Verificar datas
    const datesResult = await client.query(
      'SELECT MIN(timestamp) as earliest, MAX(timestamp) as latest FROM token_savings_log'
    );
    console.log('Período:', datesResult.rows[0]);

    // Verificar tipos de análise
    const typesResult = await client.query(
      'SELECT DISTINCT analysis_type FROM token_savings_log'
    );
    console.log('Tipos de análise:', typesResult.rows.map(r => r.analysis_type));

    // Verificar modelos
    const modelsResult = await client.query(
      'SELECT DISTINCT model FROM token_savings_log'
    );
    console.log('Modelos:', modelsResult.rows.map(r => r.model));

    // Resumo por tipo
    const summaryResult = await client.query(`
      SELECT 
        analysis_type,
        COUNT(*) as count,
        AVG(raw_tokens) as avg_raw,
        AVG(final_tokens) as avg_final,
        AVG(total_reduction_pct) as avg_reduction
      FROM token_savings_log
      GROUP BY analysis_type
      ORDER BY analysis_type
    `);
    console.log('\nResumo por tipo de análise:');
    console.log(JSON.stringify(summaryResult.rows, null, 2));

  } finally {
    client.release();
    await pool.end();
  }
}

checkDB();
