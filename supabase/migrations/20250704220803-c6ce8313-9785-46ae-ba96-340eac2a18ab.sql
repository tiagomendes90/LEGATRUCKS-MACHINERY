
-- ADICIONAR NOVAS COLUNAS (se ainda não existirem)
ALTER TABLE public.vehicle_brands 
ADD COLUMN IF NOT EXISTS category text[],
ADD COLUMN IF NOT EXISTS subcategories text[];

-- INSERIR OU ATUALIZAR DADOS COM BASE NA TABELA FINAL
INSERT INTO public.vehicle_brands (name, category, subcategories)
VALUES
  ('JCB', ARRAY['Machinery', 'Agriculture'], ARRAY['Excavators', 'Loaders', 'Tractors']),
  ('Komatsu', ARRAY['Machinery'], ARRAY['Excavators', 'Dozers']),
  ('Caterpillar', ARRAY['Machinery', 'Trucks'], ARRAY['Excavators', 'Loaders', 'Dump Trucks']),
  ('Volvo', ARRAY['Trucks', 'Machinery'], ARRAY['Dump Trucks', 'Tractors', 'Loaders']),
  ('Hitachi', ARRAY['Machinery'], ARRAY['Excavators']),
  ('Hyundai', ARRAY['Machinery', 'Trucks'], ARRAY['Excavators', 'Loaders', 'Dump Trucks']),
  ('Doosan', ARRAY['Machinery'], ARRAY['Excavators', 'Loaders']),
  ('Liebherr', ARRAY['Machinery'], ARRAY['Cranes', 'Excavators']),
  ('Terex', ARRAY['Machinery', 'Trucks'], ARRAY['Dumpers', 'Loaders']),
  ('Case', ARRAY['Agriculture', 'Machinery'], ARRAY['Tractors', 'Harvesters', 'Loaders']),
  ('New Holland', ARRAY['Agriculture'], ARRAY['Tractors', 'Balers']),
  ('Massey Ferguson', ARRAY['Agriculture'], ARRAY['Tractors', 'Harvesters']),
  ('John Deere', ARRAY['Agriculture', 'Machinery'], ARRAY['Tractors', 'Harvesters', 'Loaders']),
  ('Fendt', ARRAY['Agriculture'], ARRAY['Tractors']),
  ('Deutz-Fahr', ARRAY['Agriculture'], ARRAY['Tractors']),
  ('Valtra', ARRAY['Agriculture'], ARRAY['Tractors']),
  ('Claas', ARRAY['Agriculture'], ARRAY['Harvesters', 'Tractors']),
  ('Ford Trucks', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('MAN', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('Scania', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('Iveco', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('DAF', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('Mercedes-Benz', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('Renault Trucks', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('Kamaz', ARRAY['Trucks'], ARRAY['Dump Trucks', 'Tractors']),
  ('Tatra', ARRAY['Trucks'], ARRAY['Dump Trucks', 'Off-road']),
  ('Hino', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('Bobcat', ARRAY['Machinery'], ARRAY['Loaders', 'Excavators']),
  ('Kubota', ARRAY['Agriculture', 'Machinery'], ARRAY['Tractors', 'Mini Excavators']),
  ('Zetor', ARRAY['Agriculture'], ARRAY['Tractors']),
  ('Krone', ARRAY['Agriculture'], ARRAY['Harvesters', 'Forage Equipment']),
  ('Rauch', ARRAY['Agriculture'], ARRAY['Spreaders']),
  ('Amazone', ARRAY['Agriculture'], ARRAY['Spreaders', 'Sprayers']),
  ('Kuhn', ARRAY['Agriculture'], ARRAY['Mowers', 'Spreaders']),
  ('Kverneland', ARRAY['Agriculture'], ARRAY['Ploughs', 'Harrows']),
  ('Rabe', ARRAY['Agriculture'], ARRAY['Ploughs', 'Cultivators']),
  ('Sulky', ARRAY['Agriculture'], ARRAY['Spreaders']),
  ('Väderstad', ARRAY['Agriculture'], ARRAY['Seed Drills']),
  ('Lemken', ARRAY['Agriculture'], ARRAY['Ploughs', 'Cultivators']),
  ('Grimme', ARRAY['Agriculture'], ARRAY['Harvesters (Potatoes, etc.)'])
ON CONFLICT (name) DO UPDATE
SET category = EXCLUDED.category,
    subcategories = EXCLUDED.subcategories;
