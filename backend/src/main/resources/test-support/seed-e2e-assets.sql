-- =========================================================
-- Reseed idempotente dos assets base usados pelos testes E2E
-- =========================================================

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-AVAIL-001', 'NOTEBOOK', 'Dell Latitude E2E 01', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Matriz SP'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-AVAIL-002', 'DESKTOP', 'HP EliteDesk E2E 02', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Matriz SP'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-AVAIL-003', 'TABLET', 'iPad Air E2E 03', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Matriz SP'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-AVAIL-004', 'NOTEBOOK', 'Lenovo ThinkPad E2E 04', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial RJ'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-AVAIL-005', 'DESKTOP', 'Dell OptiPlex E2E 05', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial RJ'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-AVAIL-006', 'MOBILE_PHONE', 'iPhone 14 E2E 06', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial RJ'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-AVAIL-007', 'NOTEBOOK', 'Acer Aspire E2E 07', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial BH'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-AVAIL-008', 'TABLET', 'Samsung Tab S8 E2E 08', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial BH'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-AVAIL-009', 'DESKTOP', 'Positivo Master E2E 09', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial BH'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-AVAIL-010', 'NOTEBOOK', 'Asus ZenBook E2E 10', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Matriz SP'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-ASSIGN-001', 'NOTEBOOK', 'Dell XPS E2E Assign 01', 'ASSIGNED', o.id, u.id, usr.id, 0
FROM public.organizations o
JOIN public.units u ON u.organization_id = o.id AND u.name = 'Matriz SP'
JOIN public.users usr ON usr.email = 'admin@empresa.com'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-ASSIGN-002', 'MOBILE_PHONE', 'Samsung S22 E2E Assign 02', 'ASSIGNED', o.id, u.id, usr.id, 0
FROM public.organizations o
JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial RJ'
JOIN public.users usr ON usr.email = 'gestor@empresa.com'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-ASSIGN-003', 'TABLET', 'iPad Mini E2E Assign 03', 'ASSIGNED', o.id, u.id, usr.id, 0
FROM public.organizations o
JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial BH'
JOIN public.users usr ON usr.email = 'operador@empresa.com'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-ASSIGN-004', 'DESKTOP', 'HP ProDesk E2E Assign 04', 'ASSIGNED', o.id, u.id, usr.id, 0
FROM public.organizations o
JOIN public.units u ON u.organization_id = o.id AND u.name = 'Matriz SP'
JOIN public.users usr ON usr.email = 'admin@empresa.com'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'E2E-ASSIGN-005', 'NOTEBOOK', 'MacBook Pro E2E Assign 05', 'ASSIGNED', o.id, u.id, usr.id, 0
FROM public.organizations o
JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial RJ'
JOIN public.users usr ON usr.email = 'gestor@empresa.com'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;
