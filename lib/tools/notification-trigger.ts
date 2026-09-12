/**
 * Notification Trigger Tool
 * 
 * Handles automatic notification generation for critical supply chain events
 * Integrates with the ProductionIntelligenceAgent to create real-time alerts
 */

import { supabaseServer } from '@/lib/supabase/server';
import { logger } from '@/lib/monitoring';

// Notification severity levels
export type NotificationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Notification types
export type NotificationType = 'risk_alert' | 'intelligence_update' | 'weather_warning' | 'supply_disruption' | 'market_alert' | 'geopolitical_event' | 'operational_alert';

// Critical event structure from intelligence agent
export interface CriticalEvent {
  title: string;
  summary: string;
  severity: number; // 0-100
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'WEATHER' | 'GEOPOLITICAL' | 'OPERATIONAL' | 'REGULATORY' | 'ECONOMIC' | 'SECURITY';
  affectedEntities: string[];
  timeframe: string;
  confidence: number; // 0-1
  sources: Array<{
    title: string;
    url: string;
    publishedAt: string;
    credibility: number;
  }>;
}

// Intelligence data structure
export interface IntelligenceData {
  criticalEvents: CriticalEvent[];
  riskAssessment: {
    overallRiskScore: number;
    riskFactors: Array<{
      factor: string;
      probability: number;
      impact: number;
    }>;
  };
  relationshipMapping: Array<{
    source: string;
    target: string;
    relationship: string;
    strength: number;
    context: string;
  }>;
}

// Notification creation interface
export interface NotificationInput {
  user_id: string;
  supply_chain_id?: string;
  node_id?: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  severity: NotificationSeverity;
  citations?: any;
  metadata?: any;
}

/**
 * Notification Trigger Class
 * Processes intelligence data and creates appropriate notifications
 */
export class NotificationTrigger {
  
  /**
   * Main function to process intelligence and trigger notifications
   */
  public static async processIntelligenceForNotifications(
    intelligenceData: IntelligenceData,
    context: {
      user_id: string;
      supply_chain_id: string;
      node_id: string;
      node_name: string;
      node_type: string;
      node_location?: string;
    }
  ): Promise<string[]> {
    const notificationIds: string[] = [];
    
    try {
      logger.info('Processing intelligence for notifications', {
        component: 'NotificationTrigger',
        user_id: context.user_id,
        supply_chain_id: context.supply_chain_id,
        node_id: context.node_id,
        criticalEventsCount: intelligenceData.criticalEvents?.length || 0,
        overallRiskScore: intelligenceData.riskAssessment?.overallRiskScore || 0
      });

      // Process critical events
      if (intelligenceData.criticalEvents && intelligenceData.criticalEvents.length > 0) {
        for (const event of intelligenceData.criticalEvents) {
          if (this.shouldTriggerNotification(event)) {
            const notificationId = await this.createCriticalEventNotification(event, context);
            if (notificationId) {
              notificationIds.push(notificationId);
            }
          }
        }
      }

      // Process high risk score alerts
      if (intelligenceData.riskAssessment?.overallRiskScore > 70) {
        const notificationId = await this.createRiskScoreNotification(
          intelligenceData.riskAssessment,
          context
        );
        if (notificationId) {
          notificationIds.push(notificationId);
        }
      }

      // Process relationship mapping alerts (cascading failures)
      if (intelligenceData.relationshipMapping && intelligenceData.relationshipMapping.length > 0) {
        const highImpactRelationships = intelligenceData.relationshipMapping.filter(
          rel => rel.strength > 0.7
        );
        
        if (highImpactRelationships.length > 0) {
          const notificationId = await this.createCascadingRiskNotification(
            highImpactRelationships,
            context
          );
          if (notificationId) {
            notificationIds.push(notificationId);
          }
        }
      }

      logger.info('Notifications processing complete', {
        component: 'NotificationTrigger',
        notificationsCreated: notificationIds.length,
        notificationIds
      });

      return notificationIds;

    } catch (error) {
      logger.error('Error processing intelligence for notifications', {
        component: 'NotificationTrigger',
        error: error instanceof Error ? error.message : 'Unknown error',
        context
      });
      throw error;
    }
  }

  /**
   * Determine if an event should trigger a notification
   */
  private static shouldTriggerNotification(event: CriticalEvent): boolean {
    // Trigger notification if:
    // 1. Impact is HIGH or CRITICAL
    // 2. Severity score is above 60
    // 3. Confidence is above 0.6
    return (
      (event.impact === 'HIGH' || event.impact === 'CRITICAL') ||
      event.severity > 60 ||
      (event.severity > 40 && event.confidence > 0.6)
    );
  }

  /**
   * Create notification for critical events
   */
  private static async createCriticalEventNotification(
    event: CriticalEvent,
    context: {
      user_id: string;
      supply_chain_id: string;
      node_id: string;
      node_name: string;
      node_type: string;
      node_location?: string;
    }
  ): Promise<string | null> {
    try {
      const notificationType = this.mapCategoryToNotificationType(event.category);
      const severity = this.mapImpactToSeverity(event.impact);

      const notification: NotificationInput = {
        user_id: context.user_id,
        title: `${event.impact} Alert: ${event.title}`,
        message: this.buildCriticalEventMessage(event, context),
        notification_type: notificationType,
        severity: severity,
        citations: {
          sources: event.sources,
          confidence: event.confidence,
          category: event.category,
          affectedEntities: event.affectedEntities
        },
        metadata: {
          supply_chain_id: context.supply_chain_id,
          node_id: context.node_id,
          node_name: context.node_name,
          node_type: context.node_type,
          node_location: context.node_location,
          event_severity: event.severity,
          event_impact: event.impact,
          event_category: event.category,
          timeframe: event.timeframe,
          generated_at: new Date().toISOString(),
          source: 'intelligence_agent'
        }
      };

      return await this.saveNotification(notification);

    } catch (error) {
      logger.error('Error creating critical event notification', {
        component: 'NotificationTrigger',
        error: error instanceof Error ? error.message : 'Unknown error',
        event_title: event.title
      });
      return null;
    }
  }

  /**
   * Create notification for high risk scores
   */
  private static async createRiskScoreNotification(
    riskAssessment: { overallRiskScore: number; riskFactors: any[] },
    context: {
      user_id: string;
      supply_chain_id: string;
      node_id: string;
      node_name: string;
      node_type: string;
      node_location?: string;
    }
  ): Promise<string | null> {
    try {
      const severity = riskAssessment.overallRiskScore > 85 ? 'CRITICAL' : 
                     riskAssessment.overallRiskScore > 70 ? 'HIGH' : 'MEDIUM';

      const topRiskFactors = riskAssessment.riskFactors
        .sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact))
        .slice(0, 3);

      const notification: NotificationInput = {
        user_id: context.user_id,
        title: `High Risk Score Alert: ${context.node_name}`,
        message: this.buildRiskScoreMessage(riskAssessment.overallRiskScore, topRiskFactors, context),
        notification_type: 'risk_alert',
        severity: severity as NotificationSeverity,
        citations: {
          risk_score: riskAssessment.overallRiskScore,
          top_risk_factors: topRiskFactors
        },
        metadata: {
          supply_chain_id: context.supply_chain_id,
          node_id: context.node_id,
          node_name: context.node_name,
          node_type: context.node_type,
          node_location: context.node_location,
          overall_risk_score: riskAssessment.overallRiskScore,
          risk_factors_count: riskAssessment.riskFactors.length,
          generated_at: new Date().toISOString(),
          source: 'intelligence_agent'
        }
      };

      return await this.saveNotification(notification);

    } catch (error) {
      logger.error('Error creating risk score notification', {
        component: 'NotificationTrigger',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Create notification for cascading risk relationships
   */
  private static async createCascadingRiskNotification(
    relationships: Array<{
      source: string;
      target: string;
      relationship: string;
      strength: number;
      context: string;
    }>,
    context: {
      user_id: string;
      supply_chain_id: string;
      node_id: string;
      node_name: string;
      node_type: string;
      node_location?: string;
    }
  ): Promise<string | null> {
    try {
      const highestImpactRelationship = relationships.reduce((prev, current) => 
        current.strength > prev.strength ? current : prev
      );

      const notification: NotificationInput = {
        user_id: context.user_id,
        title: `Cascading Risk Alert: ${context.node_name}`,
        message: this.buildCascadingRiskMessage(relationships, context),
        notification_type: 'operational_alert',
        severity: 'HIGH',
        citations: {
          relationships: relationships,
          highest_impact: highestImpactRelationship
        },
        metadata: {
          supply_chain_id: context.supply_chain_id,
          node_id: context.node_id,
          node_name: context.node_name,
          node_type: context.node_type,
          node_location: context.node_location,
          relationships_count: relationships.length,
          max_relationship_strength: Math.max(...relationships.map(r => r.strength)),
          generated_at: new Date().toISOString(),
          source: 'intelligence_agent'
        }
      };

      return await this.saveNotification(notification);

    } catch (error) {
      logger.error('Error creating cascading risk notification', {
        component: 'NotificationTrigger',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Save notification to database
   */
  private static async saveNotification(notification: NotificationInput): Promise<string | null> {
    try {
      const { data, error } = await supabaseServer
        .from('notifications')
        .insert({
          user_id: notification.user_id,
          title: notification.title,
          message: notification.message,
          notification_type: notification.notification_type,
          severity: notification.severity,
          citations: notification.citations,
          read_status: false,
          created_at: new Date().toISOString()
        })
        .select('notification_id')
        .single();

      if (error) {
        logger.error('Database error saving notification', {
          component: 'NotificationTrigger',
          error: error.message
        });
        return null;
      }

      logger.info('Notification saved successfully', {
        component: 'NotificationTrigger',
        notification_id: data.notification_id,
        type: notification.notification_type,
        severity: notification.severity
      });

      return data.notification_id;

    } catch (error) {
      logger.error('Error saving notification to database', {
        component: 'NotificationTrigger',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Helper functions for mapping and message building
   */
  private static mapCategoryToNotificationType(category: string): NotificationType {
    const mapping: Record<string, NotificationType> = {
      'WEATHER': 'weather_warning',
      'GEOPOLITICAL': 'geopolitical_event',
      'OPERATIONAL': 'operational_alert',
      'REGULATORY': 'market_alert',
      'ECONOMIC': 'market_alert',
      'SECURITY': 'supply_disruption'
    };
    
    return mapping[category] || 'intelligence_update';
  }

  private static mapImpactToSeverity(impact: string): NotificationSeverity {
    const mapping: Record<string, NotificationSeverity> = {
      'LOW': 'LOW',
      'MEDIUM': 'MEDIUM',
      'HIGH': 'HIGH',
      'CRITICAL': 'CRITICAL'
    };
    
    return mapping[impact] || 'MEDIUM';
  }

  private static buildCriticalEventMessage(
    event: CriticalEvent,
    context: { node_name: string; node_type: string; node_location?: string }
  ): string {
    return `🚨 ${event.impact} impact event detected at ${context.node_name} (${context.node_type})${context.node_location ? ` in ${context.node_location}` : ''}.\n\n` +
           `📋 Event Details:\n${event.summary}\n\n` +
           `📊 Severity Score: ${event.severity}/100\n` +
           `⏱️ Timeframe: ${event.timeframe}\n` +
           `🎯 Affected Entities: ${event.affectedEntities.join(', ')}\n` +
           `🔍 Confidence Level: ${Math.round(event.confidence * 100)}%\n\n` +
           `Take immediate action to assess and mitigate potential impacts on your supply chain operations.`;
  }

  private static buildRiskScoreMessage(
    riskScore: number,
    topRiskFactors: any[],
    context: { node_name: string; node_type: string; node_location?: string }
  ): string {
    const factorsList = topRiskFactors
      .map(factor => `• ${factor.factor} (Impact: ${factor.impact}/100, Probability: ${Math.round(factor.probability * 100)}%)`)
      .join('\n');

    return `⚠️ High risk score detected for ${context.node_name} (${context.node_type})${context.node_location ? ` in ${context.node_location}` : ''}.\n\n` +
           `📊 Overall Risk Score: ${riskScore}/100\n\n` +
           `🔍 Top Risk Factors:\n${factorsList}\n\n` +
           `Consider implementing risk mitigation strategies to reduce exposure and protect supply chain continuity.`;
  }

  private static buildCascadingRiskMessage(
    relationships: any[],
    context: { node_name: string; node_type: string }
  ): string {
    const relationshipsList = relationships
      .slice(0, 3)
      .map(rel => `• ${rel.source} → ${rel.target} (Strength: ${Math.round(rel.strength * 100)}%)`)
      .join('\n');

    return `🔗 Cascading risk relationships detected for ${context.node_name}.\n\n` +
           `High-impact dependencies identified:\n${relationshipsList}\n\n` +
           `These relationships could amplify disruptions across your supply chain network. Consider implementing redundancy measures.`;
  }
}
