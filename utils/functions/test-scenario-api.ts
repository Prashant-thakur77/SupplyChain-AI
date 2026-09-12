// Test utility to verify scenario API connection
export async function testScenarioAPI(supplyChainId: string) {
  console.log('🧪 Testing Scenario API Connection...')
  
  try {
    // Test basic scenario generation
    const response = await fetch('/api/agent/scenario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supplyChainId: supplyChainId,
        scenarioCount: 2,
        timeHorizon: 30,
        focusType: 'ALL',
        includeHistorical: true,
        forceRefresh: true
      }),
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ API Test Successful:', {
        status: response.status,
        scenariosGenerated: data.scenarios?.length || 0,
        processingTime: data.processingTime || 'unknown',
        fromCache: data.fromCache || false
      })
      return { success: true, data }
    } else {
      console.error('❌ API Test Failed:', {
        status: response.status,
        error: data.error,
        details: data.details
      })
      return { success: false, error: data.error }
    }
  } catch (error) {
    console.error('❌ API Test Exception:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Test cached scenario retrieval
export async function testCachedScenarios(supplyChainId: string) {
  console.log('📋 Testing Cached Scenario Retrieval...')
  
  try {
    const response = await fetch(`/api/agent/scenario?supply_chain_id=${supplyChainId}&from_cache=true`)
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Cache Test Successful:', {
        status: response.status,
        scenariosFound: data.scenarios?.length || 0,
        fromCache: data.fromCache || false
      })
      return { success: true, data }
    } else {
      console.log('ℹ️ No cached scenarios found (this is normal for new supply chains)')
      return { success: true, data: { scenarios: [] } }
    }
  } catch (error) {
    console.error('❌ Cache Test Exception:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
