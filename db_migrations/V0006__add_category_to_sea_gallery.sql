ALTER TABLE t_p1777038_raider_pallada.sea_gallery ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'sea';
UPDATE t_p1777038_raider_pallada.sea_gallery SET category = 'sea' WHERE category IS NULL;