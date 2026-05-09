-- =========================================================
-- Cleanup centralizado dos dados gerados por testes
-- - Remove resíduos de Playwright (model LIKE 'E2E-Temp-%')
-- - Remove resíduos de k6 (Org K6 / Dell K6 / Teste K6)
-- - Limpa efeitos colaterais sobre os seeds E2E (asset_tag LIKE 'E2E-%')
-- =========================================================

-- Auditoria de organizações criadas pelo k6
DELETE FROM audit_events
WHERE type LIKE 'ORGANIZATION_%'
  AND target_id IN (
    SELECT id FROM organizations WHERE name LIKE 'Org K6 %'
  );

-- Auditoria de transferências ligadas a assets de teste
DELETE FROM audit_events
WHERE type LIKE 'TRANSFER_%'
  AND target_id IN (
    SELECT tr.id
    FROM transfer_requests tr
    JOIN assets a ON a.id = tr.asset_id
    WHERE a.asset_tag LIKE 'E2E-%'
       OR a.model LIKE 'E2E-Temp-%'
       OR a.model LIKE 'Dell K6 %'
  );

-- Auditoria de manutenções ligadas a assets de teste ou descrições do k6
DELETE FROM audit_events
WHERE type LIKE 'MAINTENANCE_%'
  AND target_id IN (
    SELECT mr.id
    FROM maintenance_records mr
    JOIN assets a ON a.id = mr.asset_id
    WHERE a.asset_tag LIKE 'E2E-%'
       OR a.model LIKE 'E2E-Temp-%'
       OR a.model LIKE 'Dell K6 %'
       OR mr.description LIKE 'Teste K6 %'
  );

-- Auditoria ligada diretamente a assets de teste
DELETE FROM audit_events
WHERE type LIKE 'ASSET_%'
  AND target_id IN (
    SELECT id
    FROM assets
    WHERE asset_tag LIKE 'E2E-%'
       OR model LIKE 'E2E-Temp-%'
       OR model LIKE 'Dell K6 %'
  );

-- Dependências de assets de teste
DELETE FROM asset_insurance
WHERE asset_id IN (
  SELECT id
  FROM assets
  WHERE asset_tag LIKE 'E2E-%'
     OR model LIKE 'E2E-Temp-%'
     OR model LIKE 'Dell K6 %'
);

DELETE FROM maintenance_records
WHERE asset_id IN (
  SELECT id
  FROM assets
  WHERE asset_tag LIKE 'E2E-%'
     OR model LIKE 'E2E-Temp-%'
     OR model LIKE 'Dell K6 %'
)
   OR description LIKE 'Teste K6 %';

DELETE FROM transfer_requests
WHERE asset_id IN (
  SELECT id
  FROM assets
  WHERE asset_tag LIKE 'E2E-%'
     OR model LIKE 'E2E-Temp-%'
     OR model LIKE 'Dell K6 %'
);

DELETE FROM asset_assignment_history
WHERE asset_id IN (
  SELECT id
  FROM assets
  WHERE asset_tag LIKE 'E2E-%'
     OR model LIKE 'E2E-Temp-%'
     OR model LIKE 'Dell K6 %'
);

DELETE FROM asset_status_history
WHERE asset_id IN (
  SELECT id
  FROM assets
  WHERE asset_tag LIKE 'E2E-%'
     OR model LIKE 'E2E-Temp-%'
     OR model LIKE 'Dell K6 %'
);

-- Remove assets temporários e seeds E2E para re-semeadura limpa
DELETE FROM assets
WHERE asset_tag LIKE 'E2E-%'
   OR model LIKE 'E2E-Temp-%'
   OR model LIKE 'Dell K6 %';

-- Organizações criadas pelo k6
DELETE FROM organizations
WHERE name LIKE 'Org K6 %';
