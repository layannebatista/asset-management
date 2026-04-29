# =============================================================================
# Stage 1 – Build
# =============================================================================
FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

# Cache de dependências separado do código-fonte para aproveitar o layer cache
COPY pom.xml .
RUN mvn dependency:go-offline -B --no-transfer-progress

COPY src ./src
RUN mvn clean package -DskipTests -B --no-transfer-progress

# =============================================================================
# Stage 2 – Runtime
# =============================================================================
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Usuário não-privilegiado para reduzir superfície de ataque
RUN apt-get update && \
    apt-get install -y --no-install-recommends wget && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd --system appgroup && \
    useradd --system --gid appgroup --no-create-home appuser

COPY --from=build --chown=appuser:appgroup /app/target/*.jar app.jar

USER appuser

EXPOSE 8080

# Flags JVM ajustadas para containers:
#   -XX:MaxRAMPercentage=75  → usa até 75% da memória do container (evita OOM kill)
#   -XX:+UseContainerSupport → leitura correta de CPU/RAM do cgroup
#   -Djava.security.egd     → startup mais rápido (evita bloqueio no /dev/random)
ENTRYPOINT [ \
  "java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar" \
]

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1
