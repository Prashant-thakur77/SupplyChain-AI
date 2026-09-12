/**
 * Seed Script: Iran–India LPG Supply Chain Digital Twin
 * Based on the full PDF report analysis.
 * Creates: 1 supply_chain + 10 nodes + 13 edges in Supabase.
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  console.log('\n🛢️  Seeding: Iran–India LPG Supply Chain Digital Twin\n');

  // ── Get real user ────────────────────────────────────────────────────────────
  const { data: users } = await supabase.from('users').select('id').limit(1).single();
  if (!users?.id) { console.error('❌ No user found in DB'); process.exit(1); }
  const userId = users.id;
  console.log(`👤 Using user: ${userId}`);

  // ── 1. Create Supply Chain ────────────────────────────────────────────────────
  const scId = randomUUID();
  const { error: scErr } = await supabase.from('supply_chains').insert({
    supply_chain_id: scId,
    user_id: userId,
    name: 'Iran–India LPG Supply Chain',
    description:
      'End-to-end digital twin of the Iranian LPG export network shipping to Indian import terminals via the Strait of Hormuz and Arabian Sea. Covers origin ports (Assaluyeh, Abadan), transit chokepoints, and 6 Indian destination terminals.',
    organisation: {
      industry: 'Energy & Petrochemicals',
      location: 'Iran → Arabian Sea → India',
      operator: 'NIOC / PSEEZ / IOC / HPCL / BPCL / Adani',
      commodity: 'Liquefied Petroleum Gas (LPG)',
    },
    form_data: {
      industry: 'Energy',
      sub_industry: 'LPG / Petrochemicals',
      risks: ['Geopolitical', 'Sanctions', 'Weather', 'Piracy', 'Chokepoint Closure'],
      shippingMethods: ['Sea – VLGC Tanker'],
      supplierTiers: '2',
      currency: 'USD',
      annualVolumeType: 'units',
      annualVolumeValue: 5000000,
      country: 'India',
      operationsLocation: ['Iran', 'India', 'Oman', 'Arabian Sea'],
    },
  });
  if (scErr) { console.error('❌ Supply chain insert:', scErr.message); process.exit(1); }
  console.log(`✅ Supply chain created: ${scId}`);

  // ── 2. Define Nodes ────────────────────────────────────────────────────────────
  type NodeDef = {
    node_id: string;
    key: string; // internal reference key for edges
    type: string;
    name: string;
    description: string;
    location_lat: number;
    location_lng: number;
    address: string;
    capacity: number; // in MMTPA
    risk_level: number; // 0-100
    data: Record<string, any>;
  };

  const nodeMap: Record<string, string> = {}; // key → node_id

  const nodes: Omit<NodeDef, 'key'>[] & { key: string }[] = [
    // ─── IRAN ORIGIN NODES ──────────────────────────────────────────────────────
    {
      key: 'assaluyeh',
      node_id: randomUUID(),
      type: 'supplier',
      name: 'Pars Petrochemical Port (Assaluyeh)',
      description: 'Iran\'s premier LPG export terminal operated by PSEEZ/NIOC/NPC. Dock 10 added 2.5 MMTPA export capacity in 2024. Loads LPG from South Pars condensate-processing units.',
      location_lat: 27.0772,
      location_lng: 54.5553,
      address: 'Pars Special Economic Energy Zone (PSEEZ), Assaluyeh, Bushehr Province, Iran',
      capacity: 2.5,
      risk_level: 85,
      data: {
        operator: 'PSEEZ / NIOC / NPC',
        storage_type: 'Pressurized Horton-spheres + horizontal bullets',
        storage_capacity_m3: 50000,
        pump_rate_m3h: 6000,
        typical_cargo_tons: 45000,
        vessel_type: 'VLGC (80,000 m³)',
        feed_source: 'South Pars phases 13-14 (~1.5 MMTPA LPG)',
        dock: 'Dock 10 (new, 2024)',
        sanctions_risk: 'HIGH',
        ais_tracking: 'Partial (dark-shipping reported)',
        flags: ['OFAC sanctions apply', 'Export via shadow fleet', 'IMO IMDG compliant'],
      },
    },
    {
      key: 'abadan',
      node_id: randomUUID(),
      type: 'supplier',
      name: 'Bandar Imam Khomeini (Abadan)',
      description: 'Rebuilt LPG export port near Abadan Refinery (NIORDC) and Khuzestan Petrochemical. First LPG carrier docked 2023. Handles VLGCs 50–80k m³.',
      location_lat: 30.417,
      location_lng: 49.067,
      address: 'Bandar Imam Khomeini Port, Khuzestan Province, Iran',
      capacity: 4.0,
      risk_level: 88,
      data: {
        operator: 'NIOC / NIORDC',
        storage_type: 'Spherical tanks + high-pressure pipelines',
        storage_capacity_m3: 20000,
        pump_rate_m3h: 4000,
        typical_cargo_tons: 40000,
        vessel_type: 'VLGC (60,000–80,000 m³)',
        feed_source: 'Abadan Refinery + Bandar Imam Petrochemical (~1 MMTPA LPG)',
        sanctions_risk: 'HIGH',
        rehabilitation_year: 2023,
        flags: ['OFAC sanctions apply', 'Rebuilt dock', 'Refinery integration'],
      },
    },
    // ─── TRANSIT / CHOKEPOINT NODES ─────────────────────────────────────────────
    {
      key: 'hormuz',
      node_id: randomUUID(),
      type: 'port',
      name: 'Strait of Hormuz (Chokepoint)',
      description: 'Critical maritime chokepoint ~40 km wide at narrowest. All Iran–India LPG transits here. Risk of closure from Iran-Israel conflict, Houthi threats, or Iranian territorial warnings.',
      location_lat: 26.567,
      location_lng: 56.485,
      address: 'Strait of Hormuz, between Iran and Oman',
      capacity: 0,
      risk_level: 75,
      data: {
        type: 'Chokepoint / Strait',
        width_km: 40,
        bi_directional_lanes: true,
        alternative_route: 'Via Cape of Good Hope (+2–3 weeks)',
        transit_time_to_india_days: '4–7 (west coast), 12–15 (east coast)',
        risk_factors: ['Iran-Israel conflict', 'Houthi activity', 'Iranian naval warnings', 'AIS spoofing'],
        ais_monitoring: 'MarineTraffic / LSEG',
        flags: ['Critical infrastructure', 'Naval patrol zone'],
      },
    },
    {
      key: 'arabian_sea',
      node_id: randomUUID(),
      type: 'distribution_center',
      name: 'Arabian Sea Transit Route',
      description: 'Open-sea route from Gulf of Oman southeast across the Arabian Sea to Indian terminals. Bunkering at Fujairah (UAE) or Salalah (Oman). Monsoon weather affects transit May–September.',
      location_lat: 20.0,
      location_lng: 65.0,
      address: 'Arabian Sea (Open Ocean Waypoint)',
      capacity: 0,
      risk_level: 35,
      data: {
        type: 'Sea Route / Waypoint',
        bunkering_ports: ['Fujairah, UAE', 'Salalah, Oman', 'Muscat, Oman'],
        avg_speed_knots: 13,
        transit_hormuz_to_west_india_days: '4–7',
        transit_hormuz_to_east_india_days: '12–15',
        weather_risk: 'Monsoon (Jun–Sep) and cyclones',
        piracy_risk: 'LOW (Arabian Sea currently)',
        flags: ['Monsoon risk May-Sep', 'Typhoon-prone Oct-Nov'],
      },
    },
    // ─── INDIA DESTINATION NODES ─────────────────────────────────────────────────
    {
      key: 'kandla',
      node_id: randomUUID(),
      type: 'warehouse',
      name: 'Kandla LPG Terminal (Gujarat)',
      description: 'Largest Gulf-coast LPG import terminal. IOC terminal 2.5 MMTPA + Aegis 3.0 MMTPA (under development) = 5.5 MMTPA. Rail and pipeline links to North India bottling plants.',
      location_lat: 23.030,
      location_lng: 70.220,
      address: 'Deendayal Port, Kandla (Gandhidham), Gujarat, India',
      capacity: 5.5,
      risk_level: 25,
      data: {
        operator: 'Indian Oil Corporation (IOC), Aegis Logistics, TotalEnergies',
        ioc_capacity_mmtpa: 2.5,
        aegis_capacity_mmtpa: 3.0,
        storage_spheres: 'Multiple (10,000 m³ each)',
        unloading_rate_m3h: 2000,
        vessel_type: 'VLGC (up to 90,000 m³ / 50,000 t)',
        transit_from_iran_days: '5–6',
        pipeline_links: 'Gujarat LPG grid, Koyali bottling plant',
        distribution: 'Rail + Road to North India',
        port: 'Deendayal Port (Kandla)',
        flags: ['Largest import terminal', 'Rail connectivity'],
      },
    },
    {
      key: 'mundra',
      node_id: randomUUID(),
      type: 'warehouse',
      name: 'Mundra LPG Terminal (Adani)',
      description: 'Adani-operated import terminal at Mundra Port with 2.3 MMTPA capacity. Large spheres (4–5k m³). Handles VLGCs ~50,000 t. Rail and road offloading.',
      location_lat: 22.746,
      location_lng: 69.700,
      address: 'Mundra Port, Kutch District, Gujarat, India',
      capacity: 2.3,
      risk_level: 20,
      data: {
        operator: 'Adani Gas / Adani Ports',
        storage_spheres: '4–5 (5,000 m³ each)',
        unloading_rate_m3h: 1800,
        vessel_type: 'VLGC (50,000 t)',
        transit_from_iran_days: '5',
        distribution: 'Rail + Road (Gujarat, Rajasthan)',
        flags: ['Private operator', 'Deep-water port'],
      },
    },
    {
      key: 'dahej',
      node_id: randomUUID(),
      type: 'warehouse',
      name: 'Dahej / Hazira LPG Terminal (GCPTL)',
      description: 'GSPC/GCPTL-operated terminal at 1.8 MMTPA. Integrated with Hazira petrochemical complex and HPCL bottling. Spherical tanks ~5k m³ with pipeline link.',
      location_lat: 21.674,
      location_lng: 72.510,
      address: 'Dahej Port / Hazira, Surat District, Gujarat, India',
      capacity: 1.8,
      risk_level: 20,
      data: {
        operator: 'GSPC / GCPTL',
        storage_spheres: '3–4 (5,000 m³ each)',
        unloading_rate_m3h: 1500,
        vessel_type: 'VLGC (50,000 t)',
        transit_from_iran_days: '5–6',
        petrochem_integration: 'Hazira Petrochemical Complex, HPCL Bottling',
        flags: ['Petrochemical park integration', 'Pipeline to HPCL'],
      },
    },
    {
      key: 'mangalore',
      node_id: randomUUID(),
      type: 'warehouse',
      name: 'Mangalore LPG Terminal (HPCL/Aegis)',
      description: 'Largest South India LPG hub. HPCL 1.8 + Aegis 6.0 upcoming + TotalEnergies 0.7 = ~8.5 MMTPA. New deepwater berth. Serves Karnataka, Tamil Nadu, and interior via pipeline.',
      location_lat: 12.927,
      location_lng: 74.812,
      address: 'New Mangalore Port, Mangalore, Karnataka, India',
      capacity: 8.5,
      risk_level: 18,
      data: {
        operator: 'HPCL, Aegis Logistics, TotalEnergies',
        hpcl_capacity_mmtpa: 1.8,
        aegis_capacity_mmtpa: 6.0,
        total_capacity_mmtpa: 0.7,
        storage_spheres: 'Multiple (5,000 m³ each)',
        unloading_rate_m3h: 2000,
        vessel_type: 'VLGC (50,000 t)',
        transit_from_iran_days: '7–10',
        distribution: 'South India pipeline grid, road',
        flags: ['Largest South India hub', 'New deepwater berth'],
      },
    },
    {
      key: 'kochi',
      node_id: randomUUID(),
      type: 'warehouse',
      name: 'Kochi LPG Terminal (Cochin Port)',
      description: 'IOC-operated terminal at Cochin Port with 1.2 MMTPA. Cryogenic LPG spheres. Serves Kerala and interior bottling plants via pipeline. Monsoon-sensitive port.',
      location_lat: 9.940,
      location_lng: 76.227,
      address: 'Cochin Port, Kochi, Kerala, India',
      capacity: 1.2,
      risk_level: 22,
      data: {
        operator: 'Indian Oil Corporation (IOC)',
        storage_spheres: '2–3 (5,000 m³ each)',
        unloading_rate_m3h: 1200,
        vessel_type: 'VLGC (40,000–50,000 t)',
        transit_from_iran_days: '10–14',
        distribution: 'Kerala pipeline, road to bottling plants',
        weather_risk: 'Monsoon impact (Jun–Sep)',
        flags: ['Monsoon risk', 'Serves Kerala hinterland'],
      },
    },
    {
      key: 'vizag',
      node_id: randomUUID(),
      type: 'warehouse',
      name: 'Visakhapatnam LPG Terminal (EIPL / SA LPG)',
      description: 'East coast terminal at Vizag Port. EIPL 0.6 + South Asia LPG 1.8 = 2.4 MMTPA. Pipeline to Andhra Pradesh bottling. Longest transit from Iran via Indian Ocean around Sri Lanka.',
      location_lat: 17.683,
      location_lng: 83.300,
      address: 'Visakhapatnam Port (Vizag), Andhra Pradesh, India',
      capacity: 2.4,
      risk_level: 22,
      data: {
        operator: 'East India Petroleum Ltd (EIPL), South Asia LPG Co.',
        eipl_capacity_mmtpa: 0.6,
        sa_lpg_capacity_mmtpa: 1.8,
        storage_spheres: '3–4 (5,000 m³ each)',
        unloading_rate_m3h: 1500,
        vessel_type: 'VLGC (60,000–80,000 m³)',
        transit_from_iran_days: '12–15',
        route: 'Iranian Ocean → around Sri Lanka → Bay of Bengal',
        distribution: 'Pipeline to Andhra Pradesh bottling plants',
        flags: ['Longest transit', 'East coast hub', 'Bay of Bengal route'],
      },
    },
  ] as any[];

  // ── Insert Nodes ─────────────────────────────────────────────────────────────
  console.log('\n📍 Inserting nodes...');
  for (const node of nodes) {
    const { key, ...nodeData } = node;
    const { error } = await supabase.from('nodes').insert({
      ...nodeData,
      supply_chain_id: scId,
    });
    if (error) {
      console.error(`  ❌ Node "${node.name}":`, error.message);
    } else {
      nodeMap[key] = node.node_id;
      console.log(`  ✅ ${node.name} [${node.type}]`);
    }
  }

  // ── 3. Define Edges ────────────────────────────────────────────────────────────
  console.log('\n🔗 Inserting edges...');

  type EdgeDef = {
    from_key: string;
    to_key: string;
    type: string;
    label: string;
    transit_days?: string;
    vessel?: string;
    notes?: string;
  };

  const edgeDefs: EdgeDef[] = [
    // Origins → Hormuz
    { from_key: 'assaluyeh', to_key: 'hormuz', type: 'sea', label: 'LPG Export (VLGC)', transit_days: '0.5–1', vessel: 'VLGC', notes: 'Gulf exit via Persian Gulf' },
    { from_key: 'abadan', to_key: 'hormuz', type: 'sea', label: 'LPG Export (VLGC)', transit_days: '1', vessel: 'VLGC', notes: 'Down Shatt al-Arab waterway to Gulf' },
    // Hormuz → Arabian Sea waypoint
    { from_key: 'hormuz', to_key: 'arabian_sea', type: 'sea', label: 'Transit (Open Sea)', transit_days: '0.5', vessel: 'VLGC', notes: 'Gulf of Oman to Arabian Sea' },
    // Arabian Sea → West Coast India
    { from_key: 'arabian_sea', to_key: 'kandla', type: 'sea', label: 'Delivery – West India', transit_days: '4–5', vessel: 'VLGC', notes: 'Kandla: deepwater port, 5.5 MMTPA' },
    { from_key: 'arabian_sea', to_key: 'mundra', type: 'sea', label: 'Delivery – West India', transit_days: '4', vessel: 'VLGC', notes: 'Mundra: Adani, 2.3 MMTPA' },
    { from_key: 'arabian_sea', to_key: 'dahej', type: 'sea', label: 'Delivery – West India', transit_days: '4–5', vessel: 'VLGC', notes: 'Dahej/Hazira: GCPTL, 1.8 MMTPA' },
    { from_key: 'arabian_sea', to_key: 'mangalore', type: 'sea', label: 'Delivery – South India', transit_days: '6–9', vessel: 'VLGC', notes: 'Mangalore: largest south India hub, 8.5 MMTPA' },
    { from_key: 'arabian_sea', to_key: 'kochi', type: 'sea', label: 'Delivery – South India', transit_days: '9–13', vessel: 'VLGC', notes: 'Kochi: IOC, 1.2 MMTPA, monsoon risk' },
    // East coast — longer route via Indian Ocean/Sri Lanka
    { from_key: 'arabian_sea', to_key: 'vizag', type: 'sea', label: 'Delivery – East India', transit_days: '11–14', vessel: 'VLGC', notes: 'Via Indian Ocean, around Sri Lanka → Bay of Bengal' },
    // Alternative: direct Iran sea to Hormuz from Bandar Abbas (minor)
    { from_key: 'assaluyeh', to_key: 'arabian_sea', type: 'sea', label: 'Direct (bypass Hormuz node)', transit_days: '1–2', vessel: 'VLGC', notes: 'Some routes skip Hormuz waypoint directly into Arabian Sea' },
    // Risk / alternate path
    { from_key: 'hormuz', to_key: 'kandla', type: 'sea', label: 'Direct West Coast Route', transit_days: '5–6', vessel: 'VLGC', notes: 'Direct post-Hormuz to Kandla (when Arabian Sea conditions permit)' },
  ];

  for (const e of edgeDefs) {
    const fromId = nodeMap[e.from_key];
    const toId = nodeMap[e.to_key];
    if (!fromId || !toId) {
      console.warn(`  ⚠️  Skipping edge ${e.from_key}→${e.to_key} (node ID missing)`);
      continue;
    }
    const { error } = await supabase.from('edges').insert({
      edge_id: randomUUID(),
      supply_chain_id: scId,
      from_node_id: fromId,
      to_node_id: toId,
      type: e.type,
      data: { label: e.label, transit_days: e.transit_days, vessel: e.vessel, notes: e.notes },
    });
    if (error) {
      console.error(`  ❌ Edge ${e.from_key}→${e.to_key}:`, error.message);
    } else {
      console.log(`  ✅ ${e.label}: ${e.from_key} → ${e.to_key} (${e.transit_days} days)`);
    }
  }

  // ── Final summary ─────────────────────────────────────────────────────────────
  const { count: nc } = await supabase.from('nodes').select('*', { count: 'exact', head: true }).eq('supply_chain_id', scId);
  const { count: ec } = await supabase.from('edges').select('*', { count: 'exact', head: true }).eq('supply_chain_id', scId);

  console.log('\n' + '═'.repeat(60));
  console.log('🎉  Iran–India LPG Digital Twin seeded successfully!');
  console.log(`    Supply Chain ID : ${scId}`);
  console.log(`    Nodes created   : ${nc}`);
  console.log(`    Edges created   : ${ec}`);
  console.log('═'.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
