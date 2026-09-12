"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function invokeEdgeFunction(functionName: string, body: any) {
  try {
    const { data, error } = await supabaseServer.functions.invoke(functionName, {
      body,
    });

    if (error) {
      console.error(`Edge function ${functionName} error:`, error);
      return { data: null, error: error.message || `Failed to invoke ${functionName}` };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error(`Internal error invoking ${functionName}:`, error);
    return { data: null, error: error.message };
  }
}

// Specific wrappers for convenience
export async function getUserSupplyChainsAction(userId: string) {
  try {
    // Bypassing super-worker edge function as it returns 404
    // Fetch directly from database
    const { data: supplyChains, error: scError } = await supabaseServer
      .from('supply_chains')
      .select('*')
      .eq('user_id', userId);

    if (scError) {
      return { data: null, error: scError.message };
    }

    // For each supply chain, fetch nodes and edges
    const enrichedData = await Promise.all((supplyChains || []).map(async (sc) => {
      const [{ data: nodes }, { data: edges }] = await Promise.all([
        supabaseServer.from('nodes').select('*').eq('supply_chain_id', sc.supply_chain_id),
        supabaseServer.from('edges').select('*').eq('supply_chain_id', sc.supply_chain_id)
      ]);

      return {
        ...sc,
        organisation: sc.organisation || {},
        form_data: sc.form_data || {},
        nodes: nodes || [],
        edges: edges || []
      };
    }));

    return { 
      data: { 
        status: 'success', 
        data: enrichedData,
        meta: {
          total_supply_chains: enrichedData.length,
          total_nodes: enrichedData.reduce((acc, sc) => acc + sc.nodes.length, 0),
          total_edges: enrichedData.reduce((acc, sc) => acc + sc.edges.length, 0)
        }
      }, 
      error: null 
    };
  } catch (err: any) {
    console.error("Critical error in getUserSupplyChainsAction:", err);
    return { data: null, error: err.message };
  }
}

export async function saveSupplyChainAction(supplyChainData: any) {
  try {
    const {
      id: supplyChainId,
      name,
      description,
      nodes,
      edges,
      organisation,
      formData,
      timestamp
    } = supplyChainData;

    // 1. Upsert the supply chain record
    const { data: scData, error: scError } = await supabaseServer
      .from('supply_chains')
      .upsert({
        supply_chain_id: supplyChainId,
        name,
        description,
        user_id: organisation?.id,
        // Embed formData and timestamp inside organisation payload since columns might be missing
        organisation: { 
          ...organisation, 
          _form_data_fallback: formData,
          _timestamp_fallback: timestamp || new Date().toISOString()
        }
      })
      .select()
      .single();

    if (scError) {
      console.error('Error upserting supply chain:', scError);
      return { data: null, error: scError.message };
    }

    const sid = scData.supply_chain_id;

    // 2. Clean up existing nodes and edges for this supply chain to ensure consistency
    // (Deletion cascade might handle this if configured, but explicit is safer)
    await Promise.all([
      supabaseServer.from('nodes').delete().eq('supply_chain_id', sid),
      supabaseServer.from('edges').delete().eq('supply_chain_id', sid)
    ]);

    // 3. Insert new nodes
    const nodeIdMap = new Map<string, string>();

    if (nodes && nodes.length > 0) {
      const nodesToInsert = nodes.map((node: any) => {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(node.id);
        const backendId = isUUID ? node.id : crypto.randomUUID();
        nodeIdMap.set(node.id, backendId);

        return {
          node_id: backendId,
          supply_chain_id: sid,
          name: node.data?.label || node.id,
          type: node.data?.type || node.type,
          description: node.data?.description || '',
          data: { ...node.data, original_id: node.id }
        };
      });

      const { error: nodesError } = await supabaseServer
        .from('nodes')
        .insert(nodesToInsert);

      if (nodesError) {
        console.error('Error inserting nodes:', nodesError);
        return { data: null, error: nodesError.message };
      }
    }

    // 4. Insert new edges
    if (edges && edges.length > 0) {
      const edgesToInsert = edges.map((edge: any) => {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(edge.id);
        const backendId = isUUID ? edge.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString());

        return {
          edge_id: backendId,
          supply_chain_id: sid,
          from_node_id: nodeIdMap.get(edge.source) || edge.source,
          to_node_id: nodeIdMap.get(edge.target) || edge.target,
          type: edge.type || 'default',
          data: edge.data,
          selected: edge.selected || false
        };
      });

      const { error: edgesError } = await supabaseServer
        .from('edges')
        .insert(edgesToInsert);

      if (edgesError) {
        console.error('Error inserting edges:', edgesError);
        return { data: null, error: edgesError.message };
      }
    }

    return { 
      data: { 
        status: 'success', 
        supply_chain_id: sid,
        nodes_count: nodes?.length || 0,
        edges_count: edges?.length || 0
      }, 
      error: null 
    };
  } catch (err: any) {
    console.error("Critical error in saveSupplyChainAction:", err);
    return { data: null, error: err.message };
  }
}

export async function deleteSupplyChainAction(supplyChainId: string, organisationId: string) {
  try {
    // Delete in FK-safe order: edges → nodes → supply_chain
    await supabaseServer.from('edges').delete().eq('supply_chain_id', supplyChainId);
    await supabaseServer.from('nodes').delete().eq('supply_chain_id', supplyChainId);
    const { error } = await supabaseServer
      .from('supply_chains')
      .delete()
      .eq('supply_chain_id', supplyChainId);

    if (error) {
      console.error('Error deleting supply chain:', error);
      return { data: null, error: error.message };
    }

    return { data: { status: 'success', supply_chain_id: supplyChainId }, error: null };
  } catch (err: any) {
    console.error('Critical error in deleteSupplyChainAction:', err);
    return { data: null, error: err.message };
  }
}

export async function getSupplyChainByIdAction(supplyChainId: string) {
  try {
    // Bypassing dynamic-endpoint edge function as it returns 404
    // Fetch directly from database
    const { data: supplyChain, error: scError } = await supabaseServer
      .from('supply_chains')
      .select('*')
      .eq('supply_chain_id', supplyChainId)
      .single();

    if (scError) {
      return { data: null, error: scError.message };
    }

    const [{ data: nodes }, { data: edges }] = await Promise.all([
      supabaseServer.from('nodes').select('*').eq('supply_chain_id', supplyChainId),
      supabaseServer.from('edges').select('*').eq('supply_chain_id', supplyChainId)
    ]);

    return {
      data: {
        ...supplyChain,
        nodes: nodes || [],
        edges: edges || []
      },
      error: null
    };
  } catch (err: any) {
    console.error("Critical error in getSupplyChainByIdAction:", err);
    return { data: null, error: err.message };
  }
}

export async function getNewsRoomInfoAction(userId: string) {
  try {
    const { data: supplyChains } = await supabaseServer.from('supply_chains').select('*').eq('user_id', userId);
    if (!supplyChains || supplyChains.length === 0) return { data: {}, error: null };

    // Fetch last 7 days of alert notifications (precise node-level match only)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [{ data: alertNotifications }, { data: weatherRecords }] = await Promise.all([
      supabaseServer
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .in('notification_type', ['supply_chain_alert', 'live_news_alert'])
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false }),
      // Read pre-computed weather intelligence from the dedicated table
      supabaseServer
        .from('weather_intelligence')
        .select('*')
        .eq('user_id', userId)
        .order('fetched_at', { ascending: false })
    ]);

    // Index weather records by node_id for O(1) lookup
    const weatherMap = new Map<string, any>();
    for (const wr of (weatherRecords || [])) {
      if (!weatherMap.has(wr.node_id)) weatherMap.set(wr.node_id, wr);
    }

    const result: any = {};

    for (const sc of supplyChains) {
      const [{ data: nodes }, { data: edges }] = await Promise.all([
        supabaseServer.from('nodes').select('*').eq('supply_chain_id', sc.supply_chain_id),
        supabaseServer.from('edges').select('*').eq('supply_chain_id', sc.supply_chain_id),
      ]);
      if (!nodes || nodes.length === 0) continue;

      const scKey = `${sc.name}_${sc.supply_chain_id}`;
      const batchTimestamp = new Date().toISOString();
      const batchNodes: any[] = [];
      const matchedAlertIds = new Set<string>();

      // ── A. Per-node: alerts matched by citations.affectedNodes (precise) ─────
      for (const node of nodes) {
        const criticalEvents: any[] = [];

        // B. Pull weather from weather_intelligence table for this node FIRST
        const wr = weatherMap.get(node.node_id);
        const weatherForecast = wr ? { forecast: { location: wr.location_name || node.name, conditions: wr.weather_main, temp: wr.temp_celsius } } : null;

        // ONLY match alerts where this exact node_id is in citations.affectedNodes
        // AND exclude WEATHER alerts if we are already displaying live weather for this node
        const nodeAlerts = (alertNotifications || []).filter(a =>
          a.citations?.affectedNodes?.includes(node.node_id) &&
          !(a.citations?.category === 'WEATHER' && wr && wr.is_adverse)
        );

        nodeAlerts.forEach(alert => {
          matchedAlertIds.add(alert.notification_id);
          // Use the stored category from citations if it exists, otherwise infer
          const storedCategory = alert.citations?.category;
          let category = 'OPERATIONAL';
          if (storedCategory && ['WEATHER', 'GEOPOLITICAL', 'ECONOMIC', 'OPERATIONAL'].includes(storedCategory)) {
            category = storedCategory;
          } else {
            const msg = (alert.message || '').toLowerCase();
            if (msg.includes('strike') || msg.includes('war') || msg.includes('sanction') || msg.includes('tariff') || msg.includes('geopolit')) category = 'GEOPOLITICAL';
            else if (msg.includes('economic') || msg.includes('inflation') || msg.includes('recession') || msg.includes('bankruptc')) category = 'ECONOMIC';
            else if (msg.includes('weather') || msg.includes('storm') || msg.includes('flood') || msg.includes('cyclone') || msg.includes('earthquake') || msg.includes('snow') || msg.includes('hurricane')) category = 'WEATHER';
          }

          criticalEvents.push({
            title: alert.title || 'Supply Chain Alert',
            summary: alert.message,
            severity: alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 0.9 : alert.severity === 'MEDIUM' ? 0.6 : 0.3,
            impact: alert.severity === 'CRITICAL' ? 'HIGH' : (alert.severity || 'MEDIUM'),
            category,
            affectedEntities: alert.citations?.affectedEntities || [node.name],
            timeframe: 'Immediate',
            confidence: alert.citations?.confidence || 0.85,
            sources: alert.citations?.sources || []
          });
        });

        if (wr && wr.is_adverse) {
          criticalEvents.push({
            title: `⛈️ ${wr.severity} Weather: ${wr.weather_main} at ${node.name}`,
            summary: wr.ai_summary || `Adverse weather (${wr.weather_main}: ${wr.weather_desc}) at ${node.name}. Temp: ${wr.temp_celsius}°C, Wind: ${wr.wind_speed_ms} m/s.`,
            severity: wr.severity === 'CRITICAL' ? 0.99 : wr.severity === 'HIGH' ? 0.8 : 0.5,
            impact: wr.severity === 'CRITICAL' || wr.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
            category: 'WEATHER',
            affectedEntities: [node.name, wr.location_name || node.name],
            timeframe: 'Current — Live',
            confidence: 1.0,
            sources: [{ url: 'https://openweathermap.org', title: 'OpenWeather Live Satellite', credibility: 1, publishedAt: wr.fetched_at }]
          });
        }

        if (criticalEvents.length > 0) {
          batchNodes.push({
            nodeId: node.node_id,
            nodeName: node.name,
            nodeType: node.type,
            recordTimestamp: new Date().toISOString(),
            weather: weatherForecast,
            criticalEvents,
            mitigationSuggestions: []
          });
        }
      }

      // ── C. Transit route weather from weather_intelligence table ─────────────
      const nodeMap = new Map((nodes || []).map((n: any) => [n.node_id, n]));
      for (const edge of (edges || [])) {
        const edgeKey = `edge:${edge.from_node_id}-${edge.to_node_id}`;
        const wr = weatherMap.get(edgeKey);
        if (!wr || !wr.is_adverse) continue;

        const fromNode = nodeMap.get(edge.from_node_id);
        const toNode = nodeMap.get(edge.to_node_id);
        const routeName = wr.node_name || `${fromNode?.name ?? 'Origin'} → ${toNode?.name ?? 'Destination'}`;

        batchNodes.push({
          nodeId: edgeKey,
          nodeName: routeName,
          nodeType: 'transit_route',
          recordTimestamp: new Date().toISOString(),
          weather: { forecast: { location: wr.location_name || routeName, conditions: wr.weather_main, temp: wr.temp_celsius } },
          criticalEvents: [{
            title: `🚢 Transit Route Warning: ${wr.weather_main}`,
            summary: wr.ai_summary || `Transit route ${routeName} is experiencing ${wr.weather_desc}. Temp: ${wr.temp_celsius}°C, Wind: ${wr.wind_speed_ms} m/s. Expect delays.`,
            severity: wr.severity === 'CRITICAL' ? 0.99 : 0.8,
            impact: wr.severity === 'CRITICAL' || wr.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
            category: 'WEATHER',
            affectedEntities: [routeName],
            timeframe: 'Current — Live',
            confidence: 1.0,
            sources: [{ url: 'https://openweathermap.org', title: 'OpenWeather Live Satellite', credibility: 1, publishedAt: wr.fetched_at }]
          }],
          mitigationSuggestions: []
        });
      }

      // ── D. Unmatched alerts → supply-chain-level fallback node ───────────────
      // ONLY include unmatched alerts that actually belong to this specific supply chain
      const unmatchedAlerts = (alertNotifications || []).filter(a => 
        !matchedAlertIds.has(a.notification_id) && 
        // We look for the supply chain ID in the citations, or we check if the node belongs to this SC
        (a.citations?.supplyChainId === sc.supply_chain_id || 
         a.citations?.affectedNodes?.some((nodeId: string) => nodeMap.has(nodeId)))
      );
      if (unmatchedAlerts.length > 0) {
        batchNodes.push({
          nodeId: `sc-level-${sc.supply_chain_id}`,
          nodeName: `${sc.name} — Network Intelligence`,
          nodeType: 'supply_chain',
          recordTimestamp: new Date().toISOString(),
          weather: null,
          criticalEvents: unmatchedAlerts.map(alert => {
            const storedCat = alert.citations?.category;
            let category = 'OPERATIONAL';
            if (storedCat && ['WEATHER', 'GEOPOLITICAL', 'ECONOMIC', 'OPERATIONAL'].includes(storedCat)) {
              category = storedCat;
            }
            return {
              title: alert.title || 'Network Intelligence Alert',
              summary: alert.message,
              severity: alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 0.9 : 0.5,
              impact: alert.severity === 'CRITICAL' ? 'HIGH' : (alert.severity || 'MEDIUM'),
              category,
              affectedEntities: alert.citations?.affectedEntities || [sc.name],
              timeframe: 'Recent',
              confidence: 0.75,
              sources: alert.citations?.sources || []
            };
          }),
          mitigationSuggestions: []
        });
      }

      if (batchNodes.length > 0) {
        result[scKey] = [{ batchTimestamp, nodes: batchNodes }];
      }
    }

    return { data: result, error: null };
  } catch (err: any) {
    console.error("Critical error in getNewsRoomInfoAction:", err);
    return { data: {}, error: err.message };
  }
}


