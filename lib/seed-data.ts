import { supabaseClient } from "@/lib/supabase/client"
import type { User, SupplyChain, Node, Edge, Simulation, Strategy } from "@/lib/types/database"

// Sample user data
const sampleUser: Partial<User> = {
  username: "demo_user",
  email: "demo@example.com",
  password_hash: "hashed_password_placeholder", // In a real app, this would be properly hashed
  role: "analyst",
}

// Sample supply chain data
const sampleSupplyChains: Partial<SupplyChain>[] = [
  {
    name: "Electronics Supply Chain",
    description:
      "Global electronics component supply chain with manufacturing in Asia and distribution in North America and Europe.",
  },
  {
    name: "Automotive Supply Chain",
    description: "Automotive parts supply chain with suppliers across multiple regions.",
  },
]

// Function to seed the database
export async function seedDatabase() {
  try {
    // Check if data already exists
    const { data: existingUsers } = await supabaseClient.from("users").select("user_id").eq("email", sampleUser.email)

    if (existingUsers && existingUsers.length > 0) {
      console.log("Database already seeded")
      return existingUsers[0].user_id
    }

    // Insert user
    const { data: userData, error: userError } = await supabaseClient.from("users").insert(sampleUser).select().single()

    if (userError) {
      console.error("Error seeding user:", userError)
      throw userError
    }

    const userId = userData.user_id

    // Insert supply chains
    const supplyChainPromises = sampleSupplyChains.map(async (supplyChain) => {
      const { data, error } = await supabaseClient
        .from("supply_chains")
        .insert({
          ...supplyChain,
          user_id: userId,
        })
        .select()
        .single()

      if (error) {
        console.error("Error seeding supply chain:", error)
        throw error
      }

      return data
    })

    const supplyChains = await Promise.all(supplyChainPromises)

    // Seed nodes and edges for the first supply chain
    if (supplyChains.length > 0) {
      await seedNodesAndEdges(supplyChains[0].supply_chain_id)
      await seedSimulationsAndStrategies(supplyChains[0].supply_chain_id)
    }

    console.log("Database seeded successfully")
    return userId
  } catch (error) {
    console.error("Error seeding database:", error)
    throw error
  }
}

// Function to seed nodes and edges for a supply chain
async function seedNodesAndEdges(supplyChainId: string) {
  // Sample nodes
  const sampleNodes: Partial<Node>[] = [
    {
      supply_chain_id: supplyChainId,
      type: "supplier",
      name: "Supplier A",
      capacity: 100,
      risk_level: 30,
      data: { x: 100, y: 100, current_inventory: 80 }
    },
    {
      supply_chain_id: supplyChainId,
      type: "warehouse",
      name: "Warehouse B",
      capacity: 200,
      risk_level: 20,
      data: { x: 300, y: 200, current_inventory: 60 }
    },
    {
      supply_chain_id: supplyChainId,
      type: "factory",
      name: "Factory C",
      capacity: 150,
      risk_level: 50,
      data: { x: 500, y: 100, current_inventory: 40 }
    },
    {
      supply_chain_id: supplyChainId,
      type: "distribution",
      name: "Distribution D",
      capacity: 180,
      risk_level: 40,
      data: { x: 700, y: 200, current_inventory: 70 }
    },
    {
      supply_chain_id: supplyChainId,
      type: "supplier",
      name: "Supplier E",
      capacity: 120,
      risk_level: 60,
      data: { x: 100, y: 300, current_inventory: 50 }
    },
  ]

  // Insert nodes
  const { data: nodes, error: nodesError } = await supabaseClient.from("nodes").insert(sampleNodes).select()

  if (nodesError) {
    console.error("Error seeding nodes:", nodesError)
    throw nodesError
  }

  // Create edges between nodes
  if (nodes && nodes.length >= 5) {
    const sampleEdges: Partial<Edge>[] = [
      {
        supply_chain_id: supplyChainId,
        from_node_id: nodes[0].node_id, // Supplier A to Warehouse B
        to_node_id: nodes[1].node_id,
        type: "transport",
        data: { cost: 100, transit_time: 2 }
      },
      {
        supply_chain_id: supplyChainId,
        from_node_id: nodes[1].node_id, // Warehouse B to Factory C
        to_node_id: nodes[2].node_id,
        type: "transport",
        data: { cost: 150, transit_time: 3 }
      },
      {
        supply_chain_id: supplyChainId,
        from_node_id: nodes[2].node_id, // Factory C to Distribution D
        to_node_id: nodes[3].node_id,
        type: "transport",
        data: { cost: 200, transit_time: 4 }
      },
      {
        supply_chain_id: supplyChainId,
        from_node_id: nodes[4].node_id, // Supplier E to Warehouse B
        to_node_id: nodes[1].node_id,
        type: "transport",
        data: { cost: 120, transit_time: 2.5 }
      },
    ]

    const { error: edgesError } = await supabaseClient.from("edges").insert(sampleEdges)

    if (edgesError) {
      console.error("Error seeding edges:", edgesError)
      throw edgesError
    }
  }
}

// Function to seed simulations and strategies
async function seedSimulationsAndStrategies(supplyChainId: string) {
  // Sample simulation
  const sampleSimulation: Partial<Simulation> = {
    supply_chain_id: supplyChainId,
    name: "Port Strike Scenario",
    scenario_type: "disruption",
    parameters: {
      severity: 70,
      duration: 14,
      affectedNode: "supplier-a",
      description: "Simulating a port strike affecting key suppliers with moderate severity and 2-week duration.",
    },
    status: "completed",
    result_summary: {
      costImpact: "$1.2M",
      timeDelay: "14.5 days",
      inventoryImpact: "-42%",
      recoveryTime: "35 days",
    },
    simulated_at: new Date().toISOString(),
  }

  // Insert simulation
  const { data: simulation, error: simulationError } = await supabaseClient
    .from("simulations")
    .insert(sampleSimulation)
    .select()
    .single()

  if (simulationError) {
    console.error("Error seeding simulation:", simulationError)
    throw simulationError
  }

  // Sample strategies
  if (simulation) {
    const sampleStrategies: Partial<Strategy>[] = [
      {
        simulation_id: simulation.simulation_id,
        strategy_title: "Dual-Sourcing Strategy",
        description:
          "Implement dual-sourcing for critical components from Supplier A to reduce dependency and mitigate supply disruption risks.",
        details: {},
        estimated_roi: 280,
        cost_estimate: 150000,
        risk_reduction: 35,
        implementation_time: "2-3 months",
        complexity: "Medium",
        status: "AI Generated",
        tags: ["Supplier Risk", "Resilience", "Critical Components"],
      },
      {
        simulation_id: simulation.simulation_id,
        strategy_title: "Safety Stock Optimization",
        description:
          "Increase safety stock levels for high-risk components while optimizing inventory costs through advanced forecasting algorithms.",
        details: {},
        estimated_roi: 320,
        cost_estimate: 80000,
        risk_reduction: 28,
        implementation_time: "1-2 months",
        complexity: "Low",
        status: "Approved",
        tags: ["Inventory", "Cost Optimization", "Forecasting"],
      },
      {
        simulation_id: simulation.simulation_id,
        strategy_title: "Alternative Transportation Routes",
        description:
          "Develop and implement alternative transportation routes and modes to avoid single points of failure in the logistics network.",
        details: {},
        estimated_roi: 210,
        cost_estimate: 200000,
        risk_reduction: 42,
        implementation_time: "3-4 months",
        complexity: "High",
        status: "In Review",
        tags: ["Logistics", "Transportation", "Network Resilience"],
      },
      {
        simulation_id: simulation.simulation_id,
        strategy_title: "Supplier Risk Monitoring System",
        description:
          "Implement real-time supplier risk monitoring with automated alerts and predictive analytics to anticipate disruptions.",
        details: {},
        estimated_roi: 350,
        cost_estimate: 120000,
        risk_reduction: 45,
        implementation_time: "2-3 months",
        complexity: "Medium",
        status: "AI Generated",
        tags: ["Monitoring", "Predictive Analytics", "Early Warning"],
      },
    ]

    const { error: strategiesError } = await supabaseClient.from("strategies").insert(sampleStrategies)

    if (strategiesError) {
      console.error("Error seeding strategies:", strategiesError)
      throw strategiesError
    }
  }
}
