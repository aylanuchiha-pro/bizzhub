-- ================================================================
-- BusinessHub — Mise à jour schéma v4
-- Ajoute la colonne "sizes" (JSONB) pour gérer le stock par taille
-- ex: { "S": 5, "M": 10, "L": 5 }
-- À exécuter dans Supabase > SQL Editor
-- ================================================================

alter table products add column if not exists sizes jsonb;
alter table sales add column if not exists size text;
