INSERT INTO users (
    name,
    email,
    password,
    role,
    created_at
) VALUES (
    'Administrador',
    'admin@admin.com',
    '$2a$10$7qJ6GZpJ0zJc9x8m4E4pUu2pJc1J9b0uY1yE0KZc1Zp7QwZ6cQz3S',
    'ADMIN',
    NOW()
);
