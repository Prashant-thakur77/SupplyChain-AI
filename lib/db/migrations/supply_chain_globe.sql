-- Create supply_globe_nodes table
CREATE TABLE IF NOT EXISTS supply_globe_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  lat float NOT NULL,
  lng float NOT NULL,
  type text NOT NULL,
  status text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create supply_globe_arcs table
CREATE TABLE IF NOT EXISTS supply_globe_arcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id uuid NOT NULL REFERENCES supply_globe_nodes(id) ON DELETE CASCADE,
  to_node_id uuid NOT NULL REFERENCES supply_globe_nodes(id) ON DELETE CASCADE,
  label text,
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Seed nodes with real global supply chain locations
INSERT INTO supply_globe_nodes (id, name, lat, lng, type, status, country, city) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Shenzhen Electronics Factory', 22.5431, 114.0579, 'manufacturer', 'active', 'China', 'Shenzhen'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Singapore Port Authority', 1.2897, 103.8501, 'port', 'active', 'Singapore', 'Singapore'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Port of Rotterdam', 51.9225, 4.4792, 'port', 'delayed', 'Netherlands', 'Rotterdam'),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Hamburg Central Warehouse', 53.5753, 10.0153, 'warehouse', 'active', 'Germany', 'Hamburg'),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'Chicago Distribution Hub', 41.8781, -87.6298, 'warehouse', 'active', 'USA', 'Chicago'),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'New York City Retailer', 40.7128, -74.0060, 'retailer', 'active', 'USA', 'New York'),
  ('a1b2c3d4-0007-0007-0007-000000000007', 'Port of Los Angeles', 33.7395, -118.2620, 'port', 'critical', 'USA', 'Los Angeles'),
  ('a1b2c3d4-0008-0008-0008-000000000008', 'Tokyo Manufacturing Plant', 35.6762, 139.6503, 'manufacturer', 'active', 'Japan', 'Tokyo'),
  ('a1b2c3d4-0009-0009-0009-000000000009', 'Mumbai Textile Supplier', 19.0760, 72.8777, 'supplier', 'delayed', 'India', 'Mumbai'),
  ('a1b2c3d4-0010-0010-0010-000000000010', 'São Paulo Retail Center', -23.5505, -46.6333, 'retailer', 'active', 'Brazil', 'São Paulo'),
  ('a1b2c3d4-0011-0011-0011-000000000011', 'Dubai Logistics Hub', 25.2048, 55.2708, 'warehouse', 'active', 'UAE', 'Dubai'),
  ('a1b2c3d4-0012-0012-0012-000000000012', 'Busan Port Terminal', 35.1796, 129.0756, 'port', 'active', 'South Korea', 'Busan');

-- Seed arcs connecting nodes realistically
INSERT INTO supply_globe_arcs (id, from_node_id, to_node_id, label, status) VALUES
  ('b1c2d3e4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002', 'Shenzhen → Singapore', 'active'),
  ('b1c2d3e4-0002-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'a1b2c3d4-0003-0003-0003-000000000003', 'Singapore → Rotterdam', 'delayed'),
  ('b1c2d3e4-0003-0003-0003-000000000003', 'a1b2c3d4-0003-0003-0003-000000000003', 'a1b2c3d4-0004-0004-0004-000000000004', 'Rotterdam → Hamburg', 'active'),
  ('b1c2d3e4-0004-0004-0004-000000000004', 'a1b2c3d4-0004-0004-0004-000000000004', 'a1b2c3d4-0006-0006-0006-000000000006', 'Hamburg → NYC', 'active'),
  ('b1c2d3e4-0005-0005-0005-000000000005', 'a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0007-0007-0007-000000000007', 'Shenzhen → LA Port', 'critical'),
  ('b1c2d3e4-0006-0006-0006-000000000006', 'a1b2c3d4-0007-0007-0007-000000000007', 'a1b2c3d4-0005-0005-0005-000000000005', 'LA Port → Chicago', 'active'),
  ('b1c2d3e4-0007-0007-0007-000000000007', 'a1b2c3d4-0005-0005-0005-000000000005', 'a1b2c3d4-0006-0006-0006-000000000006', 'Chicago → NYC', 'active'),
  ('b1c2d3e4-0008-0008-0008-000000000008', 'a1b2c3d4-0008-0008-0008-000000000008', 'a1b2c3d4-0012-0012-0012-000000000012', 'Tokyo → Busan', 'active'),
  ('b1c2d3e4-0009-0009-0009-000000000009', 'a1b2c3d4-0012-0012-0012-000000000012', 'a1b2c3d4-0002-0002-0002-000000000002', 'Busan → Singapore', 'active'),
  ('b1c2d3e4-0010-0010-0010-000000000010', 'a1b2c3d4-0009-0009-0009-000000000009', 'a1b2c3d4-0011-0011-0011-000000000011', 'Mumbai → Dubai', 'delayed'),
  ('b1c2d3e4-0011-0011-0011-000000000011', 'a1b2c3d4-0011-0011-0011-000000000011', 'a1b2c3d4-0003-0003-0003-000000000003', 'Dubai → Rotterdam', 'active'),
  ('b1c2d3e4-0012-0012-0012-000000000012', 'a1b2c3d4-0002-0002-0002-000000000002', 'a1b2c3d4-0009-0009-0009-000000000009', 'Singapore → Mumbai', 'active');
