
-- Criar índices para melhorar performance das queries mais utilizadas
CREATE INDEX IF NOT EXISTS idx_trucks_created_at ON trucks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trucks_category ON trucks(category);
CREATE INDEX IF NOT EXISTS idx_trucks_brand ON trucks(brand);
CREATE INDEX IF NOT EXISTS idx_trucks_price ON trucks(price);
CREATE INDEX IF NOT EXISTS idx_trucks_year ON trucks(year);

-- Índice composto para filtros combinados
CREATE INDEX IF NOT EXISTS idx_trucks_category_brand ON trucks(category, brand);
CREATE INDEX IF NOT EXISTS idx_trucks_category_created_at ON trucks(category, created_at DESC);

-- Índices para as outras tabelas importantes
CREATE INDEX IF NOT EXISTS idx_brands_category ON brands(category);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_filter_options_category ON filter_options(category);
CREATE INDEX IF NOT EXISTS idx_filter_options_filter_type ON filter_options(filter_type);

-- Índice para orders
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Otimizar a tabela vehicle_specifications
CREATE INDEX IF NOT EXISTS idx_vehicle_specs_truck_id ON vehicle_specifications(truck_id);

-- Analisar as tabelas para atualizar estatísticas
ANALYZE trucks;
ANALYZE brands;
ANALYZE filter_options;
ANALYZE orders;
ANALYZE vehicle_specifications;
