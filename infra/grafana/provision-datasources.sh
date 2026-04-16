#!/bin/bash

GRAFANA_URL="http://grafana:3000"
GRAFANA_USER="admin"
GRAFANA_PASSWORD="admin123"

# Aguarda Grafana ficar pronto
echo "Aguardando Grafana em $GRAFANA_URL..."
until curl -s "$GRAFANA_URL/api/health" > /dev/null 2>&1; do
  echo "Grafana ainda não está pronto, aguardando..."
  sleep 3
done

echo "✓ Grafana pronto! Provisionando datasources..."
sleep 3

# Cria datasource Prometheus
echo "Criando datasource Prometheus..."
PROMETHEUS_RESPONSE=$(curl -s -X POST "$GRAFANA_URL/api/datasources" \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d '{
    "uid": "prometheus",
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://prometheus:9090",
    "access": "proxy",
    "isDefault": true,
    "jsonData": {
      "httpMethod": "POST",
      "timeInterval": "15s"
    }
  }')
echo "$PROMETHEUS_RESPONSE"
echo ""

# Cria datasource InfluxDB
echo "Criando datasource InfluxDB para k6..."
INFLUXDB_RESPONSE=$(curl -s -X POST "$GRAFANA_URL/api/datasources" \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d '{
    "uid": "influxdb-k6",
    "name": "InfluxDB (k6)",
    "type": "influxdb",
    "url": "http://influxdb:8086",
    "access": "proxy",
    "database": "k6",
    "jsonData": {
      "version": "InfluxQL",
      "dbName": "k6",
      "httpMode": "POST",
      "keepCookies": []
    }
  }')
echo "$INFLUXDB_RESPONSE"
echo ""

# Testa a conexão
echo "Testando conexão ao InfluxDB..."
sleep 2
TEST_RESPONSE=$(curl -s -X POST "$GRAFANA_URL/api/datasources/uid/influxdb-k6/testdata" \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d '{}')
echo "Teste de conexão: $TEST_RESPONSE"
echo ""

echo "✓ Datasources provisionados com sucesso!"
