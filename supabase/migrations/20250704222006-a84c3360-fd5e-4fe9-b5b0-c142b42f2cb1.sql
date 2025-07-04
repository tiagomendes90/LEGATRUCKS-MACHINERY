
-- Adicionar as colunas category e subcategories à tabela vehicle_brands
ALTER TABLE public.vehicle_brands 
ADD COLUMN IF NOT EXISTS category text[],
ADD COLUMN IF NOT EXISTS subcategories text[];

-- Inserir ou atualizar todas as marcas com as suas categorias e subcategorias
INSERT INTO public.vehicle_brands (name, slug, category, subcategories)
VALUES
  ('JCB', 'jcb', ARRAY['Machinery', 'Agriculture'], ARRAY['Excavators', 'Loaders', 'Tractors']),
  ('Komatsu', 'komatsu', ARRAY['Machinery'], ARRAY['Excavators', 'Dozers']),
  ('Caterpillar', 'caterpillar', ARRAY['Machinery', 'Trucks'], ARRAY['Excavators', 'Loaders', 'Dump Trucks']),
  ('Volvo', 'volvo', ARRAY['Trucks', 'Machinery'], ARRAY['Dump Trucks', 'Tractors', 'Loaders']),
  ('Hitachi', 'hitachi', ARRAY['Machinery'], ARRAY['Excavators']),
  ('Hyundai', 'hyundai', ARRAY['Machinery', 'Trucks'], ARRAY['Excavators', 'Loaders', 'Dump Trucks']),
  ('Doosan', 'doosan', ARRAY['Machinery'], ARRAY['Excavators', 'Loaders']),
  ('Liebherr', 'liebherr', ARRAY['Machinery'], ARRAY['Cranes', 'Excavators']),
  ('Terex', 'terex', ARRAY['Machinery', 'Trucks'], ARRAY['Dumpers', 'Loaders']),
  ('Case', 'case', ARRAY['Agriculture', 'Machinery'], ARRAY['Tractors', 'Harvesters', 'Loaders']),
  ('New Holland', 'new-holland', ARRAY['Agriculture'], ARRAY['Tractors', 'Balers']),
  ('Massey Ferguson', 'massey-ferguson', ARRAY['Agriculture'], ARRAY['Tractors', 'Harvesters']),
  ('John Deere', 'john-deere', ARRAY['Agriculture', 'Machinery'], ARRAY['Tractors', 'Harvesters', 'Loaders']),
  ('Fendt', 'fendt', ARRAY['Agriculture'], ARRAY['Tractors']),
  ('Deutz-Fahr', 'deutz-fahr', ARRAY['Agriculture'], ARRAY['Tractors']),
  ('Valtra', 'valtra', ARRAY['Agriculture'], ARRAY['Tractors']),
  ('Claas', 'claas', ARRAY['Agriculture'], ARRAY['Harvesters', 'Tractors']),
  ('Ford Trucks', 'ford-trucks', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('MAN', 'man', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('Scania', 'scania', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('Iveco', 'iveco', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('DAF', 'daf', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('Mercedes-Benz', 'mercedes-benz', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('Renault Trucks', 'renault-trucks', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('Kamaz', 'kamaz', ARRAY['Trucks'], ARRAY['Dump Trucks', 'Tractors']),
  ('Tatra', 'tatra', ARRAY['Trucks'], ARRAY['Dump Trucks', 'Off-road']),
  ('Hino', 'hino', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors']),
  ('Bobcat', 'bobcat', ARRAY['Machinery'], ARRAY['Loaders', 'Excavators']),
  ('Kubota', 'kubota', ARRAY['Agriculture', 'Machinery'], ARRAY['Tractors', 'Mini Excavators']),
  ('Zetor', 'zetor', ARRAY['Agriculture'], ARRAY['Tractors']),
  ('Krone', 'krone', ARRAY['Agriculture'], ARRAY['Harvesters', 'Forage Equipment']),
  ('Rauch', 'rauch', ARRAY['Agriculture'], ARRAY['Spreaders']),
  ('Amazone', 'amazone', ARRAY['Agriculture'], ARRAY['Spreaders', 'Sprayers']),
  ('Kuhn', 'kuhn', ARRAY['Agriculture'], ARRAY['Mowers', 'Spreaders']),
  ('Kverneland', 'kverneland', ARRAY['Agriculture'], ARRAY['Ploughs', 'Harrows']),
  ('Rabe', 'rabe', ARRAY['Agriculture'], ARRAY['Ploughs', 'Cultivators']),
  ('Sulky', 'sulky', ARRAY['Agriculture'], ARRAY['Spreaders']),
  ('Väderstad', 'vaderstad', ARRAY['Agriculture'], ARRAY['Seed Drills']),
  ('Lemken', 'lemken', ARRAY['Agriculture'], ARRAY['Ploughs', 'Cultivators']),
  ('Grimme', 'grimme', ARRAY['Agriculture'], ARRAY['Harvesters (Potatoes, etc.)']),
  ('Renault', 'renault', ARRAY['Trucks'], ARRAY['Cargo', 'Tractors'])
ON CONFLICT (name) DO UPDATE
SET category = EXCLUDED.category,
    subcategories = EXCLUDED.subcategories,
    slug = EXCLUDED.slug;
