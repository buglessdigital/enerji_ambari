-- Tosla ödeme entegrasyonu için orders tablosuna yeni alanlar
-- Supabase Dashboard > SQL Editor'da çalıştırın

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_error TEXT;
