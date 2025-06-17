
-- Remover todos os dados de exemplo que foram adicionados automaticamente
-- Manter apenas os dados originais criados pelo utilizador

-- Remover os dados de exemplo da categoria "trucks"
DELETE FROM trucks WHERE brand IN ('Volvo', 'Mercedes-Benz', 'Scania') 
AND model IN ('FH16', 'Actros', 'R730');

-- Remover os dados de exemplo da categoria "machinery"  
DELETE FROM trucks WHERE brand IN ('Caterpillar', 'Komatsu', 'JCB')
AND model IN ('320D', 'PC210', '3CX');

-- Remover os dados de exemplo da categoria "agriculture"
DELETE FROM trucks WHERE brand IN ('John Deere', 'New Holland', 'Fendt')
AND model IN ('6155R', 'T7.270', '724 Vario');
