CREATE TABLE IF NOT EXISTS t_p1777038_raider_pallada.sea_gallery (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);