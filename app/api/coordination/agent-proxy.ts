import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { AI_MODELS, getAIKeyForModule } from '@/lib/ai-config';
import { z } from 'zod';
import { 
  CoordinationResult, 
  AgentRecommendationSchema, 
  AGENT_CAPABILITIES,
  getAgentEndpoint 
} from './types';

/**
 * Agent Proxy - Wraps existing agents without modifying them
 * Adds coordination metadata and AI-driven next-agent recommendations
 */
export class AgentProxy {
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  
  /**
   * Calls an existing agent and adds coordination metadata
   * @param agentId - The agent to call ('info', 'forecast', 'scenario', 'impact', 'strategy')
   * @param payload - The payload to send to the agent (unchanged from original)
   * @param context - Optional coordination context
   * @returns Original response + coordination metadata
   */
  static async callAgent(
    agentId: string, 
    payload: any, 
    context?: any
  ): Promise<CoordinationResult> {
    const startTime = Date.now();
    
    console.log(`[AGENT PROXY] 🤖 Calling ${agentId} agent with payload:`, payload);
    
    try {
      // Get the endpoint for this agent
      const endpoint = getAgentEndpoint(agentId);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const fullUrl = `${baseUrl}${endpoint}`;
      
      console.log(`[AGENT PROXY] 📡 Making request to: ${fullUrl}`);
      
      // Call the existing agent API exactly as before
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'SupplyChain-Orchestrator/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT)
      });
      
      if (!response.ok) {
        throw new Error(`Agent ${agentId} returned ${response.status}: ${response.statusText}`);
      }
      
      // Get the original response (unchanged)
      const originalResult = await response.json();
      const processingTime = Date.now() - startTime;
      
      console.log(`[AGENT PROXY] ✅ ${agentId} agent completed in ${processingTime}ms`);
      
      // Generate AI-driven next agent recommendation
      const nextRecommendation = await this.getNextAgentRecommendation(
        agentId, 
        originalResult, 
        payload,
        context
      );
      
      console.log(`[AGENT PROXY] 🧠 Next agent recommendation:`, nextRecommendation);
      
      // Return original result + coordination metadata
      const coordinationResult: CoordinationResult = {
        originalResult, // Completely unchanged
        coordinationMetadata: {
          handledBy: agentId,
          processingTime,
          timestamp: new Date().toISOString(),
          nextRecommendation: nextRecommendation.nextAgent !== 'complete' && nextRecommendation.nextAgent !== 'none' ? {
            agent: nextRecommendation.nextAgent,
            reason: nextRecommendation.reasoning,
            confidence: nextRecommendation.confidence,
            urgency: nextRecommendation.priority
          } : undefined,
          contextPassed: !!context,
          workflowStage: this.determineWorkflowStage(agentId)
        }
      };
      
      return coordinationResult;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error(`[AGENT PROXY] ❌ Error calling ${agentId} agent:`, error);
      
      // Return error in coordination format
      return {
        originalResult: {
          error: `Failed to call ${agentId} agent`,
          details: error instanceof Error ? error.message : 'Unknown error',
          success: false
        },
        coordinationMetadata: {
          handledBy: agentId,
          processingTime,
          timestamp: new Date().toISOString(),
          nextRecommendation: undefined,
          contextPassed: !!context,
          workflowStage: this.determineWorkflowStage(agentId)
        }
      };
    }
  }
  
  /**
   * Uses AI to determine what agent should handle the analysis next
   */
  private static async getNextAgentRecommendation(
    currentAgent: string,
    result: any,
    originalPayload: any,
    context?: any
  ) {
    try {
      console.log(`[AGENT PROXY] 🤔 Analyzing next agent recommendation for ${currentAgent}...`);
      
      const capabilities = AGENT_CAPABILITIES;
      
      const google = createGoogleGenerativeAI({ apiKey: getAIKeyForModule('agents') });
      const { object: recommendation } = await generateObject({
        model: google(AI_MODELS.agents),
        schema: AgentRecommendationSchema,
        system: `You are an expert at agent coordination in supply chain analysis.
        
Your job is to analyze the current agent's output and determine which agent should handle the analysis next.

Available Agents:
${Object.entries(capabilities).map(([id, cap]) => 
  `- ${id}: ${cap.description}\n  Specializations: ${cap.specializations.join(', ')}`
).join('\n')}

Agent Flow Logic:
- info → forecast (if temporal patterns detected)
- info → scenario (if immediate risks identified) 
- forecast → scenario (if concerning predictions made)
- scenario → impact (if scenarios show significant risk)
- impact → strategy (if quantitative assessment shows high impact)
- strategy → complete (strategies generated)

Return 'complete' if:
- Current agent is 'strategy' and has generated actionable plans
- Analysis appears comprehensive for the user's query
- No further agent processing would add value

Return 'none' if:
- Current agent's output is incomplete or failed
- Error occurred that prevents continuation`,

        prompt: `Current Agent: ${currentAgent}
Current Agent Output: ${JSON.stringify(result)}
Original User Request: ${JSON.stringify(originalPayload)}
Context: ${JSON.stringify(context)}

Based on this output, which agent should handle the analysis next and why?

Consider:
1. What insights were generated?
2. What patterns or risks were identified?
3. What type of analysis would add the most value next?
4. Is the analysis complete for the user's needs?`
      });

      return recommendation;
      
    } catch (error) {
      console.error(`[AGENT PROXY] ❌ Error generating next agent recommendation:`, error);
      
      // Fallback to simple rule-based recommendation
      return this.getFallbackRecommendation(currentAgent, result);
    }
  }
  
  /**
   * Fallback recommendation logic when AI fails
   */
  private static getFallbackRecommendation(currentAgent: string, result: any) {
    const simpleFlow = {
      info: 'forecast',
      forecast: 'scenario', 
      scenario: 'impact',
      impact: 'strategy',
      strategy: 'complete'
    };
    
    const nextAgent = simpleFlow[currentAgent as keyof typeof simpleFlow] || 'complete';
    
    return {
      nextAgent: nextAgent as any,
      reasoning: `Following standard workflow: ${currentAgent} → ${nextAgent}`,
      confidence: 0.6,
      priority: 'medium' as const,
      dataToPass: result
    };
  }
  
  /**
   * Determines the workflow stage based on current agent
   */
  private static determineWorkflowStage(agentId: string): string {
    const stageMapping = {
      info: 'intelligence',
      forecast: 'forecast',
      scenario: 'scenario', 
      impact: 'impact',
      strategy: 'strategy'
    };
    
    return stageMapping[agentId as keyof typeof stageMapping] || 'intelligence';
  }
  
  /**
   * Validates agent response for basic structure
   */
  private static validateAgentResponse(agentId: string, response: any): boolean {
    if (!response || typeof response !== 'object') {
      return false;
    }
    
    // Basic validation - each agent should return some data
    switch (agentId) {
      case 'info':
        return !!(response.intelligence || response.data || response.analysis);
      case 'forecast':
        return !!(response.forecast || response.predictions || response.trends);
      case 'scenario':
        return !!(response.scenarios || response.simulations);
      case 'impact':
        return !!(response.impact || response.assessment || response.results);
      case 'strategy':
        return !!(response.strategies || response.recommendations || response.plan);
      default:
        return true; // Unknown agent, assume valid
    }
  }
  
  /**
   * Logs coordination reasoning for transparency
   */
  static logCoordinationReasoning(
    fromAgent: string, 
    toAgent: string, 
    reasoning: string,
    confidence: number
  ): void {
    const timestamp = new Date().toISOString();
    const confidenceEmoji = confidence > 0.8 ? '🎯' : confidence > 0.6 ? '🤔' : '❓';
    
    console.log(`[COORDINATION] ${timestamp} ${confidenceEmoji}`);
    console.log(`[COORDINATION] ${fromAgent.toUpperCase()} AGENT → ${toAgent.toUpperCase()} AGENT`);
    console.log(`[COORDINATION] Reasoning: "${reasoning}"`);
    console.log(`[COORDINATION] Confidence: ${Math.round(confidence * 100)}%`);
    console.log(`[COORDINATION] ────────────────────────────────────`);
  }
  
  /**
   * Gets health status of all agents
   */
  static async getAgentHealthStatus(): Promise<Record<string, boolean>> {
    const agents = ['info', 'forecast', 'scenario', 'impact', 'strategy'];
    const healthStatus: Record<string, boolean> = {};
    
    for (const agentId of agents) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${getAgentEndpoint(agentId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ healthCheck: true }),
          signal: AbortSignal.timeout(5000) // Quick health check
        });
        
        healthStatus[agentId] = response.ok;
      } catch {
        healthStatus[agentId] = false;
      }
    }
    
    return healthStatus;
  }
}
