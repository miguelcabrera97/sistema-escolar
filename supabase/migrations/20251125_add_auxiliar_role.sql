-- Add 'auxiliar_calificaciones' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'auxiliar_calificaciones';
