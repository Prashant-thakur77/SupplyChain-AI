import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, supplyChainId, notification: clientNotification } = body;

    if ((!notificationId && !clientNotification) || !supplyChainId) {
       return NextResponse.json({ error: "Missing notification reference or supplyChainId" }, { status: 400 });
    }

    // 1. Fetch or use the Notification Details (News Article)
    let notification = clientNotification;
    
    if (!notification) {
        const { data: dbNotif, error: notifError } = await supabaseServer
          .from('notifications')
          .select('*')
          .eq('notification_id', notificationId)
          .single();

        if (notifError || !dbNotif) {
           return NextResponse.json({ error: "Notification not found in database" }, { status: 404 });
        }
        notification = dbNotif;
    }

    // 2. Fetch Supply Chain Nodes (to map affected entities if needed)
    const { data: nodes } = await supabaseServer
      .from('nodes')
      .select('*')
      .eq('supply_chain_id', supplyChainId);

    // Also verify the supply chain itself exists
    const { data: supplyChain } = await supabaseServer
      .from('supply_chains')
      .select('supply_chain_id, name')
      .eq('supply_chain_id', supplyChainId)
      .single();

    if (!supplyChain) {
       return NextResponse.json({ error: "Supply chain not found" }, { status: 404 });
    }

    const allNodes = nodes || [];

    // Extract citations to figure out what nodes might be affected
    const citations = notification.citations as any || {};
    
    // Map affected entities from the citations to an actual existing node ID in this supply chain
    let affectedNodes: string[] = [];
    if (citations.affectedEntities && Array.isArray(citations.affectedEntities) && allNodes.length > 0) {
        // Try mapping by name or location
        affectedNodes = allNodes
           .filter((node: any) => citations.affectedEntities.some((entity: string) => 
               node.name?.toLowerCase().includes(entity.toLowerCase()) || 
               node.address?.toLowerCase().includes(entity.toLowerCase())
           ))
           .map((node: any) => node.node_id);
    } 
    
    // If no nodes matched explicitly, use the highest risk node as a simulation baseline
    if (affectedNodes.length === 0 && allNodes.length > 0) {
        const topNode = [...allNodes].sort((a: any, b: any) => (b.risk_level || 0) - (a.risk_level || 0))[0];
        if (topNode) affectedNodes.push(topNode.node_id);
    }
    // If supply chain has no nodes yet, we still create the simulation — AI analysis works without nodes
    
    // 3. Create a unique simulation record for this news event against this specific supply chain
    const simulationName = `News Sim: ${notification.title?.substring(0, 30)}...`;
    
    const dbRecord = {
      supply_chain_id: supplyChainId,
      name: simulationName,
      scenario_type: 'REAL_WORLD_EVENT',
      parameters: {
          scenarioName: simulationName,
          scenarioType: 'REAL_WORLD_EVENT',
          affected_nodes: affectedNodes,
          description: notification.message || notification.title,
          probability: 1.0, // Because it evaluates a live event that has already occurred or been signaled
          associated_news: notification.title,
          news_metadata: citations
      },
      status: 'generated'
    };

    const { data: insertedSimulation, error: insertError } = await supabaseServer
      .from('simulations')
      .insert(dbRecord)
      .select()
      .single();

    if (insertError || !insertedSimulation) {
       console.error('[NEWS-SIMULATION] Database Insert Error:', JSON.stringify(insertError, null, 2));
       return NextResponse.json({ error: "Failed to construct simulation from news", details: insertError }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        simulation_id: insertedSimulation.simulation_id,
        affected_nodes_count: affectedNodes.length,
        message: "Successfully converted news to simulation." 
    });

  } catch (error) {
    console.error('[NEWS-SIMULATION] Fatal error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Error" 
    }, { status: 500 });
  }
}
