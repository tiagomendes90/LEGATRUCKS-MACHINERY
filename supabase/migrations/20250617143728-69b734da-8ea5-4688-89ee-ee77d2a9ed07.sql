
-- Inserir dados de exemplo para a categoria "trucks"
INSERT INTO trucks (brand, model, category, subcategory, year, mileage, price, condition, engine, transmission, description, features, images, horsepower) VALUES
('Volvo', 'FH16', 'trucks', 'tractor-unit', 2020, 150000, 85000, 'used', 'D16G', 'automatic', 'Camião tractor Volvo FH16 em excelente estado, ideal para transporte de longa distância.', 
 ARRAY['GPS Navigation', 'Air Conditioning', 'Cruise Control', 'ABS Brakes'], 
 ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop'], 750),

('Mercedes-Benz', 'Actros', 'trucks', 'tractor-unit', 2019, 200000, 75000, 'used', 'OM471', 'automated-manual', 'Mercedes-Benz Actros com tecnologia de ponta e baixo consumo de combustível.',
 ARRAY['Adaptive Cruise Control', 'Lane Departure Warning', 'ESP System'], 
 ARRAY['https://images.unsplash.com/photo-1494905998402-395d579af36f?w=500&h=300&fit=crop'], 625),

('Scania', 'R730', 'trucks', 'truck-over', 2021, 80000, 95000, 'used', 'DC16', 'manual', 'Scania R730 V8, potência e robustez para os trabalhos mais exigentes.',
 ARRAY['V8 Engine', 'Heavy Duty Suspension', 'Retarder'], 
 ARRAY['https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=500&h=300&fit=crop'], 730);

-- Inserir dados de exemplo para a categoria "machinery"
INSERT INTO trucks (brand, model, category, subcategory, year, mileage, price, condition, engine, transmission, description, features, images, horsepower) VALUES
('Caterpillar', '320D', 'machinery', 'excavators', 2018, 3500, 120000, 'used', 'C6.4', 'hydraulic', 'Escavadora Caterpillar 320D com excelente desempenho em obras de construção.',
 ARRAY['Hydraulic Hammer Ready', 'Quick Coupler', 'Air Conditioning'], 
 ARRAY['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&h=300&fit=crop'], 158),

('Komatsu', 'PC210', 'machinery', 'excavators', 2019, 2800, 135000, 'used', '6D107E-1', 'hydraulic', 'Escavadora Komatsu PC210 com tecnologia avançada e baixo consumo.',
 ARRAY['Eco Mode', 'GPS Tracking', 'Backup Camera'], 
 ARRAY['https://images.unsplash.com/photo-1572242577755-e2a93ed58acd?w=500&h=300&fit=crop'], 165),

('JCB', '3CX', 'machinery', 'loaders-backhoe', 2020, 1200, 85000, 'used', '444 Dieselmax', 'powershift', 'Retroescavadora JCB 3CX versátil para múltiplas aplicações.',
 ARRAY['4-Wheel Drive', 'Extendible Dipper', 'Side Shift'], 
 ARRAY['https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=500&h=300&fit=crop'], 109);

-- Inserir mais dados para a categoria "agriculture"
INSERT INTO trucks (brand, model, category, subcategory, year, mileage, price, condition, engine, transmission, description, features, images, horsepower) VALUES
('John Deere', '6155R', 'agriculture', NULL, 2019, 1800, 95000, 'used', '6.8L PowerTech', 'powershift', 'Tractor John Deere 6155R com tecnologia de precisão para agricultura moderna.',
 ARRAY['AutoTrac Guidance', 'PTO 540/1000', 'Hydraulic Remote'], 
 ARRAY['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=300&fit=crop'], 155),

('New Holland', 'T7.270', 'agriculture', NULL, 2020, 1500, 110000, 'used', 'F5C', 'continuously-variable', 'Tractor New Holland T7.270 com transmissão CVT e máximo conforto.',
 ARRAY['CVT Transmission', 'IntelliSteer', 'SideWinder Armrest'], 
 ARRAY['https://images.unsplash.com/photo-1574347501956-c4df4b846bc5?w=500&h=300&fit=crop'], 270),

('Fendt', '724 Vario', 'agriculture', NULL, 2021, 900, 125000, 'excellent', 'MAN', 'continuously-variable', 'Tractor Fendt 724 Vario de última geração com eficiência máxima.',
 ARRAY['Vario Transmission', 'Variable Rate Application', 'GPS Ready'], 
 ARRAY['https://images.unsplash.com/photo-1551734834-8c80765c5a96?w=500&h=300&fit=crop'], 240);
