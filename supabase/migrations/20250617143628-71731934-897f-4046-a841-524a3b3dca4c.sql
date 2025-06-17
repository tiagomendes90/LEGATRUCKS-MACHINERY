
-- Verificar quantos veículos existem por categoria
SELECT 
  category,
  COUNT(*) as total_vehicles
FROM trucks 
GROUP BY category
ORDER BY category;

-- Verificar todos os veículos na base de dados
SELECT 
  id,
  brand,
  model,
  category,
  subcategory,
  year,
  price,
  created_at
FROM trucks 
ORDER BY created_at DESC;

-- Verificar se há veículos sem categoria definida
SELECT 
  COUNT(*) as vehicles_without_category
FROM trucks 
WHERE category IS NULL OR category = '';
