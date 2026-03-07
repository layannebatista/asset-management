-- =========================================
-- V3: Allow null password_hash on users
-- =========================================
-- MOTIVO: O fluxo de criação de usuário não define a senha no momento do cadastro.
-- A senha é definida pelo próprio usuário ao ativar a conta via token de ativação
-- (endpoint de ativação → UserActivationService → User.changePassword()).
-- Enquanto o usuário não ativar a conta, password_hash permanece null.
-- O login é bloqueado neste estado pelo UserDetailsServiceImpl.
-- =========================================

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;