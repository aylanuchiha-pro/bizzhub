-- ================================================================
-- BusinessHub — Mise à jour schéma v3
-- Ajoute la colonne "size" sur la table products (taille vêtement)
-- À exécuter dans Supabase > SQL Editor
-- ================================================================

alter table products add column if not exists size text;
