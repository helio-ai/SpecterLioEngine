import { BaseTool, ToolResult, ToolMetadata } from '../core/base-tool';
import { CampaignModel } from '../../shared/database/campaign/campaign';
import { TemplateMessage } from '../../shared/database/whatsapp/message.schema';
import { Attribution } from '../../shared/database/attribution/attribution.schema';
import { WhatsappTemplate } from '../../shared/database/whatsapp/whatsapp.schema';
import { Types } from 'mongoose';
import { cacheService } from '../../core/cache/cache';

interface CampaignMetrics {
  totalCampaigns: number;
  successfulCampaigns: number;
  failedCampaigns: number;
  processingCampaigns: number;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalClicked: number;
  totalFailed: number;
  averageEngagementRate: number;
  averageDeliveryRate: number;
  averageReadRate: number;
  averageClickRate: number;
}

interface CampaignFailure {
  campaignId: string;
  campaignName: string;
  status: string;
  failureReason?: string;
  totalRecipients: number;
  failedCount: number;
  errorHistory?: any[];
  createdAt: Date;
}

interface TemplateUsage {
  templateId: string;
  templateName: string;
  usageCount: number;
  successRate: number;
  averageEngagement: number;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalClicked: number;
}

interface MessageAnalysis {
  totalMessages: number;
  messageStatusBreakdown: Record<string, number>;
  averageSendAttempts: number;
  failureReasons: Record<string, number>;
  costAnalysis: {
    totalCost: number;
    averageCostPerMessage: number;
    currency: string;
  };
  // Additional AI-friendly data
  campaignAnalytics?: Array<{
    campaignId: string;
    summary: {
      total: number;
      successful: number;
      failed: number;
      successRate: string;
    };
    topIssues: string[];
    errorCodes: string[];
  }>;
  topFailureReasons?: Array<{ reason: string; count: number }>;
  topErrorCodes?: Array<{ code: string; count: number }>;
}

interface AttributionData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  topPerformingCampaigns: Array<{
    campaignId: string;
    campaignName: string;
    revenue: number;
    orders: number;
    conversionRate: number;
  }>;
}

interface CampaignAnalysisResult {
  widgetId: string;
  timeRange: string;
  analysisDate: Date;
  overview: CampaignMetrics;
  failures: CampaignFailure[];
  templateUsage: TemplateUsage[];
  messageAnalysis: MessageAnalysis;
  attributionData?: AttributionData;
  recommendations: string[];
  performanceInsights: {
    bestPerformingCampaign?: {
      id: string;
      name: string;
      engagementRate: number;
      deliveryRate: number;
    };
    worstPerformingCampaign?: {
      id: string;
      name: string;
      failureRate: number;
      issues: string[];
    };
    topTemplates: TemplateUsage[];
    criticalIssues: string[];
  };
  errorInsights?: {
    criticalIssues: Array<{ code: string; count: number; analysis: any }>;
    recommendations: string[];
    retryStrategies: string[];
    immediateActions: string[];
    errorCodeBreakdown: Record<string, { count: number; meaning: string; severity: string }>;
  };
}

export class CampaignAnalyzerTool extends BaseTool {
  // Deduplicate concurrent calls per normalized cache key
  private static inflight: Map<string, Promise<ToolResult<CampaignAnalysisResult>>> = new Map();
  constructor() {
    const metadata: ToolMetadata = {
      name: 'analyzeCampaigns',
      description:
        'Comprehensive campaign analysis tool that provides deep insights into campaign performance, failures, template usage, message analytics, and attribution data. Extracts widgetId from input and performs optimized database queries.',
      version: '1.0.0',
      category: 'analytics',
      tags: ['campaign', 'analysis', 'performance', 'failure', 'attribution'],
      rateLimit: {
        requests: 50,
        window: 3600, // 1 hour
      },
      timeout: 30000,
    };

    super(metadata, {
      maxRetries: 2,
      retryDelay: 2000,
      timeout: 30000,
      cacheEnabled: true,
      cacheTTL: 900000, // 15 minutes
    });

    console.log('📊 [CAMPAIGN-ANALYZER] Initialized with metadata:', {
      name: metadata.name,
      category: metadata.category,
      version: metadata.version,
    });
  }

  private extractWidgetId(input: any): string {
    console.log('🔍 [CAMPAIGN-ANALYZER] Starting widgetId extraction...');

    // If input is already a CampaignAnalysisInput with widgetId
    if (input && typeof input === 'object' && input.widgetId) {
      console.log('✅ [CAMPAIGN-ANALYZER] WidgetId found in input object:', input.widgetId);
      return input.widgetId;
    }

    // If input is a string, ignore freeform extraction and rely on explicit args/context only
    if (typeof input === 'string') {
      console.log('📝 [CAMPAIGN-ANALYZER] Ignoring string extraction; expecting explicit widgetId');
    }

    // If input is an object, look for widgetId in various possible locations
    if (input && typeof input === 'object') {
      console.log('📦 [CAMPAIGN-ANALYZER] Input is object, checking for widgetId...');
      // Check direct property
      if (input.widgetId) {
        console.log('✅ [CAMPAIGN-ANALYZER] WidgetId found in direct property:', input.widgetId);
        return input.widgetId;
      }

      // Check in context
      if (input.context && input.context.widgetId) {
        console.log('✅ [CAMPAIGN-ANALYZER] WidgetId found in context:', input.context.widgetId);
        return input.context.widgetId;
      }

      // Check in query
      if (input.query && typeof input.query === 'string') {
        console.log('🔍 [CAMPAIGN-ANALYZER] Checking query for widgetId...');
        const widgetIdMatch = input.query.match(/widgetId["\s]*:["\s]*([a-fA-F0-9]{24})/);
        if (widgetIdMatch) {
          console.log('✅ [CAMPAIGN-ANALYZER] WidgetId found in query:', widgetIdMatch[1]);
          return widgetIdMatch[1];
        }
      }
      console.log('❌ [CAMPAIGN-ANALYZER] No widgetId found in object input');
    }

    // Do not crawl global sessions anymore; require explicit widgetId in args/context

    console.log('❌ [CAMPAIGN-ANALYZER] Missing widgetId in args/context');
    throw new Error('Missing required widgetId');
  }

  async execute(input: any): Promise<ToolResult<CampaignAnalysisResult>> {
    const startTime = Date.now();
    console.log('🚀 [CAMPAIGN-ANALYZER] start');

    try {
      console.log('🔍 [CAMPAIGN-ANALYZER] db check');
      // Check if database is connected
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.log(
          '❌ [CAMPAIGN-ANALYZER] Database not connected, readyState:',
          mongoose.connection.readyState,
        );
        return {
          success: false,
          error: 'Database not connected. Please ensure the database is properly initialized.',
        };
      }
      console.log('✅ [CAMPAIGN-ANALYZER] Database connection verified');

      console.log('🔍 [CAMPAIGN-ANALYZER] extract widgetId');
      // Extract and validate widgetId
      const widgetId = this.extractWidgetId(input);
      console.log('✅ [CAMPAIGN-ANALYZER] WidgetId extracted:', widgetId);

      console.log('🔍 [CAMPAIGN-ANALYZER] parse params');
      // Parse other parameters
      const timeRange = (input && input.timeRange) || '14d';
      console.log('📅 [CAMPAIGN-ANALYZER] TimeRange determined:', timeRange);
      const includeFailed = input && input.includeFailed !== false;
      console.log('❌ [CAMPAIGN-ANALYZER] Include failed campaigns:', includeFailed);
      const includeMessages = input && input.includeMessages !== false;
      console.log('💬 [CAMPAIGN-ANALYZER] Include message analysis:', includeMessages);
      const includeAttribution = input && input.includeAttribution !== false;
      console.log('💰 [CAMPAIGN-ANALYZER] Include attribution data:', includeAttribution);

      console.log('🔍 [CAMPAIGN-ANALYZER] analyze start');

      // Cache key and lookup (normalized)
      const cacheKey = this.generateCacheKey({
        widgetId,
        timeRange,
        includeFailed,
        includeMessages,
        includeAttribution,
      });

      // In-flight deduplication
      const existing = CampaignAnalyzerTool.inflight.get(cacheKey);
      if (existing) {
        console.log('⏳ [CAMPAIGN-ANALYZER] awaiting inflight result');
        return await existing;
      }
      const cached = await cacheService.getJSON<CampaignAnalysisResult>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      console.log('🔍 [CAMPAIGN-ANALYZER] validate widgetId');
      // Validate widgetId
      if (!Types.ObjectId.isValid(widgetId)) {
        console.log('❌ [CAMPAIGN-ANALYZER] Invalid widgetId format:', widgetId);
        return {
          success: false,
          error: 'Invalid widgetId provided. Please provide a valid MongoDB ObjectId.',
        };
      }
      console.log('✅ [CAMPAIGN-ANALYZER] WidgetId validation passed');

      console.log('🔍 [CAMPAIGN-ANALYZER] to ObjectId');
      const widgetIdObj = new Types.ObjectId(widgetId);
      console.log('✅ [CAMPAIGN-ANALYZER] WidgetId converted to ObjectId:', widgetIdObj.toString());

      console.log('🔍 [CAMPAIGN-ANALYZER] date range');
      const since = this.getDateFromTimeRange(timeRange);
      console.log('📅 [CAMPAIGN-ANALYZER] Date range calculated:', {
        timeRange,
        since: since.toISOString(),
        now: new Date().toISOString(),
      });

      console.log('🔄 [CAMPAIGN-ANALYZER] fetch start');
      // Parallel execution of all analysis components
      const workPromise = (async () => {
        const [campaigns, messages, templates, attributionData] = await Promise.all([
          this.getCampaignsData(widgetIdObj, since),
          includeMessages ? this.getMessagesData(widgetIdObj, since) : Promise.resolve(null),
          this.getTemplatesData(widgetIdObj, since),
          includeAttribution
            ? this.getAttributionData(widgetIdObj, since)
            : Promise.resolve(undefined),
        ]);

        console.log('✅ [CAMPAIGN-ANALYZER] Parallel data fetching completed:', {
          campaignsCount: campaigns.length,
          messagesCount: messages?.length || 0,
          templatesCount: templates.length,
          hasAttributionData: !!attributionData,
        });

        console.log('🧮 [CAMPAIGN-ANALYZER] metrics');
        // Calculate comprehensive metrics
        const overview = this.calculateCampaignMetrics(campaigns);
        console.log('✅ [CAMPAIGN-ANALYZER] Campaign metrics calculated:', {
          totalCampaigns: overview.totalCampaigns,
          successfulCampaigns: overview.successfulCampaigns,
          failedCampaigns: overview.failedCampaigns,
          totalRecipients: overview.totalRecipients,
        });

        console.log('🔍 [CAMPAIGN-ANALYZER] failures');
        const failures = this.analyzeFailures(campaigns);
        console.log('✅ [CAMPAIGN-ANALYZER] Failure analysis completed:', {
          failureCount: failures.length,
        });

        console.log('📊 [CAMPAIGN-ANALYZER] templates');
        const templateUsage = this.analyzeTemplateUsage(campaigns, templates);
        console.log('✅ [CAMPAIGN-ANALYZER] Template usage analysis completed:', {
          templateCount: templateUsage.length,
        });

        console.log('💬 [CAMPAIGN-ANALYZER] messages');
        const messageAnalysis = messages
          ? this.analyzeMessages(messages)
          : this.getDefaultMessageAnalysis();
        console.log('✅ [CAMPAIGN-ANALYZER] Message analysis completed:', {
          totalMessages: messageAnalysis.totalMessages,
          hasMessages: !!messages,
        });

        console.log('📈 [CAMPAIGN-ANALYZER] perf insights');
        const performanceInsights = this.generatePerformanceInsights(
          campaigns,
          templateUsage,
          failures,
        );
        console.log('✅ [CAMPAIGN-ANALYZER] Performance insights generated:', {
          hasBestPerforming: !!performanceInsights.bestPerformingCampaign,
          hasWorstPerforming: !!performanceInsights.worstPerformingCampaign,
          criticalIssuesCount: performanceInsights.criticalIssues.length,
        });

        console.log('💡 [CAMPAIGN-ANALYZER] recos');
        // Generate recommendations
        const recommendations = this.generateRecommendations(
          overview,
          failures,
          templateUsage,
          messageAnalysis,
        );
        console.log('✅ [CAMPAIGN-ANALYZER] Recommendations generated:', {
          recommendationCount: recommendations.length,
        });

        // Generate error insights if we have message analytics
        let errorInsights;
        if (messages && messages.length > 0) {
          console.log('🔍 [CAMPAIGN-ANALYZER] Generating error insights from message analytics...');
          errorInsights = this.generateErrorInsights(messages);

          // Add error-specific recommendations to main recommendations
          if (errorInsights.recommendations.length > 0) {
            recommendations.push(...errorInsights.recommendations.slice(0, 3));
          }
        }

        console.log('📋 [CAMPAIGN-ANALYZER] assemble');
        const result: CampaignAnalysisResult = {
          widgetId,
          timeRange,
          analysisDate: new Date(),
          overview,
          failures,
          templateUsage,
          messageAnalysis,
          attributionData,
          recommendations,
          performanceInsights,
          errorInsights,
        };

        const _responseTime = Date.now() - startTime;
        console.log('✅ [CAMPAIGN-ANALYZER] end');

        // store cache (configurable: 15m default)
        await cacheService.setJSON(
          cacheKey,
          result,
          Math.floor((this.getConfig().cacheTTL || 900000) / 1000),
        );

        return {
          success: true,
          data: result,
        } as ToolResult<CampaignAnalysisResult>;
      })();

      CampaignAnalyzerTool.inflight.set(cacheKey, workPromise);
      const finalResult = await workPromise;
      CampaignAnalyzerTool.inflight.delete(cacheKey);
      return finalResult;
    } catch {
      // Clear inflight on failure
      try {
        const partialKey = typeof input === 'object' ? this.generateCacheKey(input) : undefined;
        if (partialKey) CampaignAnalyzerTool.inflight.delete(partialKey);
      } catch {}
      const _responseTime = Date.now() - startTime;
      console.log('❌ [CAMPAIGN-ANALYZER] error');

      return {
        success: false,
        error: 'Campaign analysis failed',
      };
    }
  }

  // Normalize cache key to avoid misses from argument ordering/noise
  protected override generateCacheKey(input: any): string {
    const widgetId = input?.widgetId || input?.context?.widgetId || '';
    const timeRange = input?.timeRange || '14d';
    const includeFailed = input?.includeFailed !== false;
    const includeMessages = input?.includeMessages !== false;
    const includeAttribution = input?.includeAttribution !== false;
    return `campaign:analysis:${widgetId}:${timeRange}:${includeFailed}:${includeMessages}:${includeAttribution}`;
  }

  private getDateFromTimeRange(timeRange: string): Date {
    console.log('📅 [CAMPAIGN-ANALYZER] Calculating date from timeRange:', timeRange);
    const now = new Date();
    let result: Date;

    switch (timeRange) {
      case '7d':
        result = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        console.log('✅ [CAMPAIGN-ANALYZER] 7 days ago:', result.toISOString());
        return result;
      case '14d':
        result = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        console.log('✅ [CAMPAIGN-ANALYZER] 14 days ago:', result.toISOString());
        return result;
      case '30d':
        result = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        console.log('✅ [CAMPAIGN-ANALYZER] 30 days ago:', result.toISOString());
        return result;
      case '90d':
        result = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        console.log('✅ [CAMPAIGN-ANALYZER] 90 days ago:', result.toISOString());
        return result;
      case 'all':
        result = new Date(0);
        console.log('✅ [CAMPAIGN-ANALYZER] All time (epoch start):', result.toISOString());
        return result;
      default:
        result = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        console.log(
          '⚠️ [CAMPAIGN-ANALYZER] Unknown timeRange, defaulting to 30 days:',
          result.toISOString(),
        );
        return result;
    }
  }

  private async getCampaignsData(widgetId: Types.ObjectId, since: Date) {
    console.log('📊 [CAMPAIGN-ANALYZER] Fetching campaigns data...', {
      widgetId: widgetId.toString(),
      since: since.toISOString(),
    });

    try {
      console.log('🔍 [CAMPAIGN-ANALYZER] Executing database query for campaigns...');
      const campaigns = await CampaignModel.find({
        widgetId,
        createdAt: { $gte: since },
        'metrics.totalRecipients': { $gte: 10 }, // remove dummy campaigns
        status: { $in: ['completed', 'processing'] },
      })
        .populate('template', 'name components category')
        .populate('segments.targets', 'name description')
        .populate('segments.excluded', 'name description')
        .lean();

      console.log('✅ [CAMPAIGN-ANALYZER] Campaigns query completed:', {
        campaignsFound: campaigns.length,
        queryTime: new Date().toISOString(),
      });

      // Log some campaign details for debugging
      if (campaigns.length > 0) {
        console.log('📋 [CAMPAIGN-ANALYZER] Sample campaign data:', {
          firstCampaign: {
            id: campaigns[0]._id,
            name: campaigns[0].name,
            status: campaigns[0].status,
          },
          statusBreakdown: campaigns.reduce(
            (acc, c) => {
              acc[c.status] = (acc[c.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        });
      }

      return campaigns;
    } catch (error: any) {
      console.log('❌ [CAMPAIGN-ANALYZER] Failed to fetch campaigns:', {
        error: error.message,
        stack: error.stack,
        widgetId: widgetId.toString(),
        since: since.toISOString(),
      });
      if (error.message.includes('buffering timed out')) {
        throw new Error(
          'Database connection timeout. Please check if MongoDB is running and accessible.',
        );
      }
      throw error;
    }
  }

  private async getMessagesData(widgetId: Types.ObjectId, since: Date) {
    console.log('📊 [CAMPAIGN-ANALYZER] Fetching messages data...', {
      widgetId: widgetId.toString(),
      since: since.toISOString(),
    });

    try {
      console.log('🔍 [CAMPAIGN-ANALYZER] Getting campaign IDs for widget...');
      // Get campaign IDs for this widget
      const campaignIds = await CampaignModel.find({
        widgetId,
        'metrics.totalRecipients': { $gte: 10 },
        createdAt: { $gte: since },
        status: { $in: ['completed', 'processing'] },
      })
        .select('_id')
        .lean()
        .then((campaigns) => campaigns.map((c) => c._id));

      console.log('✅ [CAMPAIGN-ANALYZER] Found campaign IDs:', {
        campaignCount: campaignIds.length,
        campaignIds: campaignIds.map((id) => id.toString()),
      });

      if (campaignIds.length === 0) {
        console.log('⚠️ [CAMPAIGN-ANALYZER] No campaigns found for widget, skipping messages');
        return [];
      }

      console.log('🔍 [CAMPAIGN-ANALYZER] Executing database query for messages...');
      const messages = await TemplateMessage.find({
        sourceId: { $in: campaignIds },
        sourceType: 'Campaign',
        createdAt: { $gte: since },
      })
        .select('status failureReason errorHistory sourceId')
        .lean();

      console.log('✅ [CAMPAIGN-ANALYZER] Messages query completed:', {
        messagesFound: messages.length,
        queryTime: new Date().toISOString(),
      });

      // Group messages by campaign for better AI understanding
      const campaignMessageAnalytics = messages.reduce(
        (acc, message) => {
          const campaignId = message.sourceId.toString();

          if (!acc[campaignId]) {
            acc[campaignId] = {
              campaignId,
              totalMessages: 0,
              statusBreakdown: {},
              failureReasons: {},
              errorCodes: {},
              failedMessages: 0,
              successfulMessages: 0,
            };
          }

          const analytics = acc[campaignId];
          analytics.totalMessages++;

          // Status breakdown
          analytics.statusBreakdown[message.status] =
            (analytics.statusBreakdown[message.status] || 0) + 1;

          // Count failed vs successful
          if (message.status === 'failed') {
            analytics.failedMessages++;
          } else {
            analytics.successfulMessages++;
          }

          // Failure reasons
          if (message.failureReason) {
            analytics.failureReasons[message.failureReason] =
              (analytics.failureReasons[message.failureReason] || 0) + 1;
          }

          // Error codes from error history
          if (message.errorHistory && Array.isArray(message.errorHistory)) {
            message.errorHistory.forEach((error: any) => {
              if (error.code) {
                analytics.errorCodes[error.code] = (analytics.errorCodes[error.code] || 0) + 1;
              }
            });
          }

          return acc;
        },
        {} as Record<string, any>,
      );

      // Convert to array format for easier AI processing
      const campaignAnalytics = Object.values(campaignMessageAnalytics).map((analytics: any) => ({
        campaignId: analytics.campaignId,
        messageSummary: {
          total: analytics.totalMessages,
          successful: analytics.successfulMessages,
          failed: analytics.failedMessages,
          successRate:
            analytics.totalMessages > 0
              ? ((analytics.successfulMessages / analytics.totalMessages) * 100).toFixed(2) + '%'
              : '0%',
        },
        statusBreakdown: analytics.statusBreakdown,
        failureAnalysis: {
          reasons: analytics.failureReasons,
          errorCodes: analytics.errorCodes,
          topFailureReason:
            Object.keys(analytics.failureReasons).length > 0
              ? Object.entries(analytics.failureReasons).sort(
                  ([, a], [, b]) => (b as number) - (a as number),
                )[0]
              : null,
          topErrorCode:
            Object.keys(analytics.errorCodes).length > 0
              ? Object.entries(analytics.errorCodes).sort(
                  ([, a], [, b]) => (b as number) - (a as number),
                )[0]
              : null,
        },
      }));

      console.log('📋 [CAMPAIGN-ANALYZER] Campaign message analytics:', {
        campaignCount: campaignAnalytics.length,
        totalMessages: messages.length,
        analytics: campaignAnalytics.map((ca: any) => ({
          campaignId: ca.campaignId,
          totalMessages: ca.messageSummary.total,
          successRate: ca.messageSummary.successRate,
          failedCount: ca.messageSummary.failed,
        })),
      });

      console.log('📋 [CAMPAIGN-ANALYZER] Campaign message analytics2:', {
        campaignAnalytics,
      });

      return campaignAnalytics;
    } catch (error: any) {
      console.log('❌ [CAMPAIGN-ANALYZER] Failed to fetch messages:', {
        error: error.message,
        stack: error.stack,
        widgetId: widgetId.toString(),
        since: since.toISOString(),
      });
      if (error.message.includes('buffering timed out')) {
        throw new Error(
          'Database connection timeout. Please check if MongoDB is running and accessible.',
        );
      }
      throw error;
    }
  }

  private async getTemplatesData(widgetId: Types.ObjectId, since: Date) {
    console.log('📊 [CAMPAIGN-ANALYZER] Fetching templates data...', {
      widgetId: widgetId.toString(),
      since: since.toISOString(),
    });

    try {
      console.log('🔍 [CAMPAIGN-ANALYZER] Executing database query for templates...');
      const templates = await WhatsappTemplate.find({
        createdAt: { $gte: since },
      }).lean();

      console.log('✅ [CAMPAIGN-ANALYZER] Templates query completed:', {
        templatesFound: templates.length,
        queryTime: new Date().toISOString(),
      });

      return templates;
    } catch (error: any) {
      console.log('❌ [CAMPAIGN-ANALYZER] Failed to fetch templates:', {
        error: error.message,
        stack: error.stack,
        widgetId: widgetId.toString(),
        since: since.toISOString(),
      });
      throw error;
    }
  }

  private async getAttributionData(widgetId: Types.ObjectId, since: Date) {
    console.log('📊 [CAMPAIGN-ANALYZER] Fetching attribution data...', {
      widgetId: widgetId.toString(),
      since: since.toISOString(),
    });

    try {
      console.log('🔍 [CAMPAIGN-ANALYZER] Executing database query for attribution...');
      const attribution = await Attribution.find({
        widgetId,
        createdAt: { $gte: since },
      }).lean();

      console.log('✅ [CAMPAIGN-ANALYZER] Attribution query completed:', {
        attributionRecords: attribution.length,
        queryTime: new Date().toISOString(),
      });

      if (attribution.length === 0) {
        console.log('⚠️ [CAMPAIGN-ANALYZER] No attribution data found');
        return undefined;
      }

      console.log('🧮 [CAMPAIGN-ANALYZER] Processing attribution data...');
      const totalOrders = attribution.length;
      const totalRevenue = attribution.reduce((sum, order) => sum + order.totalAmount, 0);
      const averageOrderValue = totalRevenue / totalOrders;

      console.log('📊 [CAMPAIGN-ANALYZER] Attribution calculations:', {
        totalOrders,
        totalRevenue,
        averageOrderValue,
      });

      // Group by campaign (this would need campaign tracking in attribution)
      const campaignPerformance = attribution.reduce(
        (acc, order) => {
          // This is a simplified example - you'd need to track campaign IDs in attribution
          const campaignId = order.campaign || 'unknown';
          if (!acc[campaignId]) {
            acc[campaignId] = { revenue: 0, orders: 0 };
          }
          acc[campaignId].revenue += order.totalAmount;
          acc[campaignId].orders += 1;
          return acc;
        },
        {} as Record<string, { revenue: number; orders: number }>,
      );

      const topPerformingCampaigns = Object.entries(campaignPerformance)
        .map(([campaignId, data]) => ({
          campaignId,
          campaignName: campaignId,
          revenue: data.revenue,
          orders: data.orders,
          conversionRate: 0, // Would need total campaign recipients to calculate
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      console.log('✅ [CAMPAIGN-ANALYZER] Attribution data processed:', {
        topPerformingCampaigns: topPerformingCampaigns.length,
      });

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        conversionRate: 0, // Would need total recipients to calculate
        topPerformingCampaigns,
      };
    } catch (error: any) {
      console.log('❌ [CAMPAIGN-ANALYZER] Failed to fetch attribution data:', {
        error: error.message,
        stack: error.stack,
        widgetId: widgetId.toString(),
        since: since.toISOString(),
      });
      throw error;
    }
  }

  private calculateCampaignMetrics(campaigns: any[]): CampaignMetrics {
    console.log('🧮 [CAMPAIGN-ANALYZER] Starting campaign metrics calculation...', {
      campaignCount: campaigns.length,
    });

    const totalCampaigns = campaigns.length;
    const successfulCampaigns = campaigns.filter((c) => c.status === 'completed').length;
    const failedCampaigns = campaigns.filter((c) => c.status === 'failed').length;
    const processingCampaigns = campaigns.filter((c) => c.status === 'processing').length;

    console.log('📊 [CAMPAIGN-ANALYZER] Campaign status breakdown:', {
      total: totalCampaigns,
      successful: successfulCampaigns,
      failed: failedCampaigns,
      processing: processingCampaigns,
    });

    const totalRecipients = campaigns.reduce(
      (sum, c) => sum + (c.metrics?.totalRecipients || 0),
      0,
    );
    const totalSent = campaigns.reduce((sum, c) => sum + (c.metrics?.sent || 0), 0);
    const totalDelivered = campaigns.reduce((sum, c) => sum + (c.metrics?.delivered || 0), 0);
    const totalRead = campaigns.reduce((sum, c) => sum + (c.metrics?.read || 0), 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + (c.metrics?.click || 0), 0);
    const totalFailed = campaigns.reduce((sum, c) => sum + (c.metrics?.failed || 0), 0);

    console.log('📈 [CAMPAIGN-ANALYZER] Message metrics:', {
      totalRecipients,
      totalSent,
      totalDelivered,
      totalRead,
      totalClicked,
      totalFailed,
    });

    const averageEngagementRate =
      totalRecipients > 0 ? (totalRead + totalClicked) / totalRecipients : 0;
    const averageDeliveryRate = totalSent > 0 ? totalDelivered / totalSent : 0;
    const averageReadRate = totalDelivered > 0 ? totalRead / totalDelivered : 0;
    const averageClickRate = totalRead > 0 ? totalClicked / totalRead : 0;

    console.log('📊 [CAMPAIGN-ANALYZER] Calculated rates:', {
      averageEngagementRate: averageEngagementRate.toFixed(4),
      averageDeliveryRate: averageDeliveryRate.toFixed(4),
      averageReadRate: averageReadRate.toFixed(4),
      averageClickRate: averageClickRate.toFixed(4),
    });

    const metrics = {
      totalCampaigns,
      successfulCampaigns,
      failedCampaigns,
      processingCampaigns,
      totalRecipients,
      totalSent,
      totalDelivered,
      totalRead,
      totalClicked,
      totalFailed,
      averageEngagementRate,
      averageDeliveryRate,
      averageReadRate,
      averageClickRate,
    };

    console.log('✅ [CAMPAIGN-ANALYZER] Campaign metrics calculation completed');
    return metrics;
  }

  private analyzeFailures(campaigns: any[]): CampaignFailure[] {
    return campaigns
      .filter((c) => c.status === 'failed')
      .map((campaign) => ({
        campaignId: campaign._id.toString(),
        campaignName: campaign.name,
        status: campaign.status,
        failureReason: campaign.failureReason,
        totalRecipients: campaign.metrics?.totalRecipients || 0,
        failedCount: campaign.metrics?.failed || 0,
        errorHistory: campaign.errorHistory,
        createdAt: campaign.createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private analyzeTemplateUsage(campaigns: any[], _templates: any[]): TemplateUsage[] {
    const templateUsage = new Map<
      string,
      {
        templateId: string;
        templateName: string;
        usageCount: number;
        totalRecipients: number;
        totalSent: number;
        totalDelivered: number;
        totalRead: number;
        totalClicked: number;
        totalFailed: number;
      }
    >();

    campaigns.forEach((campaign) => {
      const templateId = campaign.template?._id?.toString();
      if (!templateId) return;

      const templateName = campaign.template?.name || 'Unknown Template';

      if (!templateUsage.has(templateId)) {
        templateUsage.set(templateId, {
          templateId,
          templateName,
          usageCount: 0,
          totalRecipients: 0,
          totalSent: 0,
          totalDelivered: 0,
          totalRead: 0,
          totalClicked: 0,
          totalFailed: 0,
        });
      }

      const usage = templateUsage.get(templateId)!;
      usage.usageCount++;
      usage.totalRecipients += campaign.metrics?.totalRecipients || 0;
      usage.totalSent += campaign.metrics?.sent || 0;
      usage.totalDelivered += campaign.metrics?.delivered || 0;
      usage.totalRead += campaign.metrics?.read || 0;
      usage.totalClicked += campaign.metrics?.click || 0;
      usage.totalFailed += campaign.metrics?.failed || 0;
    });

    return Array.from(templateUsage.values())
      .map((usage) => ({
        ...usage,
        successRate:
          usage.totalSent > 0 ? (usage.totalSent - usage.totalFailed) / usage.totalSent : 0,
        averageEngagement:
          usage.totalRecipients > 0
            ? (usage.totalRead + usage.totalClicked) / usage.totalRecipients
            : 0,
      }))
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  private analyzeMessages(campaignAnalytics: any[]): MessageAnalysis {
    console.log('💬 [CAMPAIGN-ANALYZER] Analyzing campaign message analytics...', {
      campaignCount: campaignAnalytics.length,
    });

    if (campaignAnalytics.length === 0) {
      console.log('⚠️ [CAMPAIGN-ANALYZER] No campaign analytics to analyze');
      return this.getDefaultMessageAnalysis();
    }

    // Aggregate data across all campaigns
    const totalMessages = campaignAnalytics.reduce((sum, ca) => sum + ca.messageSummary.total, 0);
    const totalSuccessful = campaignAnalytics.reduce(
      (sum, ca) => sum + ca.messageSummary.successful,
      0,
    );
    const totalFailed = campaignAnalytics.reduce((sum, ca) => sum + ca.messageSummary.failed, 0);

    // Aggregate status breakdown
    const statusBreakdown = campaignAnalytics.reduce(
      (acc, ca) => {
        Object.entries(ca.statusBreakdown).forEach(([status, count]) => {
          acc[status] = (acc[status] || 0) + (count as number);
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    // Aggregate failure reasons
    const failureReasons = campaignAnalytics.reduce(
      (acc, ca) => {
        Object.entries(ca.failureAnalysis.reasons).forEach(([reason, count]) => {
          acc[reason] = (acc[reason] || 0) + (count as number);
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    // Aggregate error codes
    const errorCodes = campaignAnalytics.reduce(
      (acc, ca) => {
        Object.entries(ca.failureAnalysis.errorCodes).forEach(([code, count]) => {
          acc[code] = (acc[code] || 0) + (count as number);
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    // Find campaigns with issues
    const campaignsWithIssues = campaignAnalytics.filter((ca) => ca.messageSummary.failed > 0);
    const topFailureReasons = Object.entries(failureReasons)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);

    console.log('📊 [CAMPAIGN-ANALYZER] Message analysis results:', {
      totalMessages,
      totalSuccessful,
      totalFailed,
      successRate:
        totalMessages > 0 ? ((totalSuccessful / totalMessages) * 100).toFixed(2) + '%' : '0%',
      campaignsWithIssues: campaignsWithIssues.length,
      topFailureReasons: topFailureReasons.slice(0, 3),
      statusBreakdown,
    });

    return {
      totalMessages,
      messageStatusBreakdown: statusBreakdown,
      averageSendAttempts: 0, // Not available in new format
      failureReasons,
      costAnalysis: {
        totalCost: 0, // Not available in new format
        averageCostPerMessage: 0,
        currency: 'INR',
      },
      // Additional AI-friendly data
      campaignAnalytics: campaignAnalytics.map((ca) => ({
        campaignId: ca.campaignId,
        summary: ca.messageSummary,
        topIssues: ca.failureAnalysis.topFailureReason
          ? [ca.failureAnalysis.topFailureReason[0]]
          : [],
        errorCodes: Object.keys(ca.failureAnalysis.errorCodes),
      })),
      topFailureReasons: topFailureReasons.map(([reason, count]) => ({
        reason,
        count: count as number,
      })),
      topErrorCodes: Object.entries(errorCodes)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([code, count]) => ({ code, count: count as number })),
    };
  }

  private getDefaultMessageAnalysis(): MessageAnalysis {
    return {
      totalMessages: 0,
      messageStatusBreakdown: {},
      averageSendAttempts: 0,
      failureReasons: {},
      costAnalysis: {
        totalCost: 0,
        averageCostPerMessage: 0,
        currency: 'INR',
      },
      campaignAnalytics: [],
      topFailureReasons: [],
      topErrorCodes: [],
    };
  }

  private generatePerformanceInsights(
    campaigns: any[],
    templateUsage: TemplateUsage[],
    failures: CampaignFailure[],
  ) {
    // Find best performing campaign
    const campaignsWithEngagement = campaigns
      .filter((c) => c.metrics?.totalRecipients > 0)
      .map((campaign) => {
        const metrics = campaign.metrics;
        const engagementRate = (metrics.read + metrics.click) / metrics.totalRecipients;
        const deliveryRate = metrics.sent > 0 ? metrics.delivered / metrics.sent : 0;
        return { ...campaign, engagementRate, deliveryRate };
      })
      .sort((a, b) => b.engagementRate - a.engagementRate);

    const bestPerformingCampaign = campaignsWithEngagement[0];

    // Find worst performing campaign
    const worstPerformingCampaign = campaigns
      .filter((c) => c.status === 'failed')
      .sort((a, b) => (b.metrics?.failed || 0) - (a.metrics?.failed || 0))[0];

    // Top templates
    const topTemplates = templateUsage.slice(0, 5);

    // Critical issues
    const criticalIssues: string[] = [];

    if (failures.length > 0) {
      criticalIssues.push(`${failures.length} campaigns have failed recently`);
    }

    const lowEngagementTemplates = templateUsage.filter((t) => t.averageEngagement < 0.1);
    if (lowEngagementTemplates.length > 0) {
      criticalIssues.push(`${lowEngagementTemplates.length} templates have low engagement rates`);
    }

    return {
      bestPerformingCampaign: bestPerformingCampaign
        ? {
            id: bestPerformingCampaign._id.toString(),
            name: bestPerformingCampaign.name,
            engagementRate: bestPerformingCampaign.engagementRate,
            deliveryRate: bestPerformingCampaign.deliveryRate,
          }
        : undefined,
      worstPerformingCampaign: worstPerformingCampaign
        ? {
            id: worstPerformingCampaign._id.toString(),
            name: worstPerformingCampaign.name,
            failureRate:
              worstPerformingCampaign.metrics?.failed /
                worstPerformingCampaign.metrics?.totalRecipients || 0,
            issues: [worstPerformingCampaign.failureReason || 'Unknown failure'],
          }
        : undefined,
      topTemplates,
      criticalIssues,
    };
  }

  private generateRecommendations(
    overview: CampaignMetrics,
    failures: CampaignFailure[],
    templateUsage: TemplateUsage[],
    messageAnalysis: MessageAnalysis,
  ): string[] {
    const recommendations: string[] = [];

    // Campaign success rate recommendations
    if (overview.failedCampaigns > 0) {
      recommendations.push(
        `Review ${overview.failedCampaigns} failed campaigns to identify common failure patterns`,
      );
    }

    if (overview.averageEngagementRate < 0.1) {
      recommendations.push(
        'Consider improving message content and targeting to increase engagement rates',
      );
    }

    if (overview.averageDeliveryRate < 0.9) {
      recommendations.push(
        'Investigate delivery issues - check phone number validity and WhatsApp Business API configuration',
      );
    }

    // Template recommendations
    const lowPerformingTemplates = templateUsage.filter((t) => t.successRate < 0.8);
    if (lowPerformingTemplates.length > 0) {
      recommendations.push(
        `Review ${lowPerformingTemplates.length} templates with low success rates`,
      );
    }

    // Message analysis recommendations
    if (messageAnalysis.averageSendAttempts > 2) {
      recommendations.push(
        'High retry attempts detected - review message content and recipient validation',
      );
    }

    if (Object.keys(messageAnalysis.failureReasons).length > 0) {
      recommendations.push(
        'Address common failure reasons in message content and delivery configuration',
      );
    }

    // Performance recommendations
    if (overview.totalCampaigns < 5) {
      recommendations.push('Consider running more campaigns to gather better performance data');
    }

    if (overview.totalRecipients < 100) {
      recommendations.push(
        'Increase campaign reach to improve statistical significance of results',
      );
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private getWhatsAppErrorAnalysis(errorCode: string): {
    meaning: string;
    cause: string;
    retryStrategy: string;
    immediateAction: string;
    longTermFix: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    const errorMap: Record<string, any> = {
      '131049': {
        meaning: 'Not delivered to maintain a healthy ecosystem',
        cause: 'Meta caps marketing template messages per user. Hit per-user cap.',
        retryStrategy: "Don't retry immediately. Use exponential backoff and retry later.",
        immediateAction: 'Back off for 24-48 hours before retrying to the same user.',
        longTermFix: 'Implement user-level throttling and use utility templates when possible.',
        severity: 'high',
      },
      '131026': {
        meaning: 'Message Undeliverable (receiver incapable)',
        cause: "User not on WhatsApp, hasn't accepted ToS, or using old client version.",
        retryStrategy:
          "Don't retry. User needs to update WhatsApp or confirm they can message your business.",
        immediateAction: 'Contact user via alternate channel (SMS/email) to update WhatsApp.',
        longTermFix: 'Validate phone numbers before sending and maintain updated contact lists.',
        severity: 'medium',
      },
      '130472': {
        meaning: "User's number is part of an experiment",
        cause: 'Recipient is in a Meta experiment; delivery blocked.',
        retryStrategy: 'Skip this user. Cannot force delivery.',
        immediateAction: 'Remove user from current campaign and retry later.',
        longTermFix: 'Implement experiment detection and user exclusion logic.',
        severity: 'low',
      },
      '131048': {
        meaning: 'Spam/quality rate limit hit for your number',
        cause: 'Your WhatsApp number hit quality/spam rate limits.',
        retryStrategy: 'Slow down sending rate and improve content quality.',
        immediateAction: 'Check WhatsApp Manager for quality issues and reduce send frequency.',
        longTermFix: 'Improve targeting, content quality, and implement better rate limiting.',
        severity: 'critical',
      },
      '131056': {
        meaning: 'BA/CA pair rate limit (too many messages to same user quickly)',
        cause: 'Sending too many messages to the same user in short time.',
        retryStrategy: 'Add throttling/backoff per user with exponential delays.',
        immediateAction: 'Implement per-user rate limiting (max 1 message per 24 hours).',
        longTermFix: 'Build user-level throttling system with proper backoff strategies.',
        severity: 'high',
      },
      '131047': {
        meaning: 'Re-engagement needed (outside reply window)',
        cause: 'User outside the 24-hour reply window for free-form messages.',
        retryStrategy: 'Use a template message to re-open conversation.',
        immediateAction: 'Send a template message to re-engage the user.',
        longTermFix: 'Implement proper conversation flow management and template usage.',
        severity: 'medium',
      },
      '131050': {
        meaning: 'User opted out of marketing',
        cause: 'User has opted out of marketing messages.',
        retryStrategy: 'Stop marketing to this user immediately.',
        immediateAction: 'Remove user from all marketing campaigns and respect opt-out.',
        longTermFix: 'Implement proper opt-out management and respect user preferences.',
        severity: 'medium',
      },
      '131000': {
        meaning: 'Unknown internal error',
        cause: "Meta's internal system error.",
        retryStrategy: 'Retry with jitter and exponential backoff.',
        immediateAction: 'Wait 5-10 minutes and retry with exponential backoff.',
        longTermFix: 'Implement robust retry logic with proper error handling.',
        severity: 'medium',
      },
      '131008': {
        meaning: 'Required parameter missing',
        cause: 'Missing required parameters in the API request.',
        retryStrategy: 'Fix the request body and retry.',
        immediateAction: 'Check and fix template parameters, components, and phone format.',
        longTermFix: 'Implement request validation before sending.',
        severity: 'low',
      },
      '100': {
        meaning: 'Invalid parameter',
        cause: 'Invalid template name, language, or phone format.',
        retryStrategy: 'Validate and fix parameters before retrying.',
        immediateAction: 'Check template name, language code, and phone number format.',
        longTermFix: 'Implement parameter validation and template management system.',
        severity: 'low',
      },
      '132000': {
        meaning: 'Template parameter count mismatch',
        cause: 'Wrong number of variables passed to template.',
        retryStrategy: 'Pass exactly the required number of variables.',
        immediateAction: 'Count and match template variables exactly.',
        longTermFix: 'Build template validation system with parameter counting.',
        severity: 'low',
      },
      '132012': {
        meaning: 'Template parameter format mismatch',
        cause: 'Wrong format for template variables (currency, date, etc.).',
        retryStrategy: 'Match placeholder format requirements.',
        immediateAction: 'Check variable formats (currency, date, number) and fix.',
        longTermFix: 'Implement format validation for template variables.',
        severity: 'low',
      },
      '132001': {
        meaning: "Template doesn't exist or not approved",
        cause: "Template name/language doesn't exist or is not approved.",
        retryStrategy: 'Verify template name and language, wait for approval.',
        immediateAction: 'Check template approval status and language codes.',
        longTermFix: 'Implement template management system with approval tracking.',
        severity: 'medium',
      },
      '132015': {
        meaning: 'Template paused for quality',
        cause: 'Template paused due to quality issues.',
        retryStrategy: 'Edit template or create new higher-quality template.',
        immediateAction: 'Review and improve template content quality.',
        longTermFix: 'Implement template quality monitoring and improvement process.',
        severity: 'medium',
      },
      '132016': {
        meaning: 'Template disabled for quality',
        cause: 'Template disabled due to quality issues.',
        retryStrategy: 'Create new higher-quality template.',
        immediateAction: 'Create new template with better content quality.',
        longTermFix: 'Implement template quality standards and review process.',
        severity: 'medium',
      },
      '133010': {
        meaning: 'Sender number not registered',
        cause: 'Your WhatsApp number is not registered or verified.',
        retryStrategy: 'Register and verify the WhatsApp number first.',
        immediateAction: 'Complete WhatsApp Business API registration and verification.',
        longTermFix: 'Ensure proper WhatsApp Business API setup and verification.',
        severity: 'critical',
      },
    };

    const errorInfo = errorMap[errorCode];
    if (errorInfo) {
      return errorInfo;
    }

    // Default for unknown error codes
    return {
      meaning: 'Unknown error code',
      cause: 'Unrecognized WhatsApp error code',
      retryStrategy: 'Retry with exponential backoff and monitor for patterns.',
      immediateAction: 'Log the error and implement general retry logic.',
      longTermFix: 'Monitor error patterns and implement specific handling as needed.',
      severity: 'medium',
    };
  }

  private generateErrorInsights(campaignAnalytics: any[]): {
    criticalIssues: Array<{ code: string; count: number; analysis: any }>;
    recommendations: string[];
    retryStrategies: string[];
    immediateActions: string[];
    errorCodeBreakdown: Record<string, { count: number; meaning: string; severity: string }>;
  } {
    console.log('🔍 [CAMPAIGN-ANALYZER] Generating error insights...');

    // Collect all error codes and their counts
    const errorCodeCounts: Record<string, number> = {};
    const failureReasonCounts: Record<string, number> = {};

    campaignAnalytics.forEach((ca) => {
      Object.entries(ca.failureAnalysis.errorCodes).forEach(([code, count]) => {
        errorCodeCounts[code] = (errorCodeCounts[code] || 0) + (count as number);
      });
      Object.entries(ca.failureAnalysis.reasons).forEach(([reason, count]) => {
        failureReasonCounts[reason] = (failureReasonCounts[reason] || 0) + (count as number);
      });
    });

    // Analyze each error code
    const criticalIssues = Object.entries(errorCodeCounts)
      .map(([code, count]) => ({
        code,
        count,
        analysis: this.getWhatsAppErrorAnalysis(code),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate recommendations based on error patterns
    const recommendations: string[] = [];
    const retryStrategies: string[] = [];
    const immediateActions: string[] = [];

    criticalIssues.forEach((issue) => {
      const { analysis } = issue;

      if (analysis.severity === 'critical') {
        immediateActions.push(
          `🚨 CRITICAL: ${analysis.immediateAction} (Error ${issue.code}: ${analysis.meaning})`,
        );
      }

      if (analysis.severity === 'high') {
        immediateActions.push(
          `⚠️ HIGH PRIORITY: ${analysis.immediateAction} (Error ${issue.code})`,
        );
      }

      recommendations.push(`📋 ${analysis.longTermFix} (Error ${issue.code})`);
      retryStrategies.push(`🔄 ${analysis.retryStrategy} (Error ${issue.code})`);
    });

    // Add general recommendations based on error patterns
    const totalErrors = Object.values(errorCodeCounts).reduce((sum, count) => sum + count, 0);
    if (totalErrors > 0) {
      const successRate =
        campaignAnalytics.reduce((sum, ca) => sum + ca.messageSummary.successful, 0) /
        campaignAnalytics.reduce((sum, ca) => sum + ca.messageSummary.total, 0);

      if (successRate < 0.8) {
        recommendations.push(
          '📊 Overall success rate is low. Consider implementing comprehensive error handling and retry logic.',
        );
      }

      if (errorCodeCounts['131049'] > 0) {
        recommendations.push(
          '🎯 Implement user-level throttling to avoid hitting per-user marketing caps.',
        );
      }

      if (errorCodeCounts['131048'] > 0) {
        recommendations.push(
          '📈 Improve content quality and reduce send frequency to avoid spam rate limits.',
        );
      }
    }

    // Create error code breakdown
    const errorCodeBreakdown: Record<string, { count: number; meaning: string; severity: string }> =
      {};
    Object.entries(errorCodeCounts).forEach(([code, count]) => {
      const analysis = this.getWhatsAppErrorAnalysis(code);
      errorCodeBreakdown[code] = {
        count,
        meaning: analysis.meaning,
        severity: analysis.severity,
      };
    });

    console.log('✅ [CAMPAIGN-ANALYZER] Error insights generated:', {
      criticalIssuesCount: criticalIssues.length,
      recommendationsCount: recommendations.length,
      retryStrategiesCount: retryStrategies.length,
      immediateActionsCount: immediateActions.length,
      errorCodesAnalyzed: Object.keys(errorCodeBreakdown).length,
    });

    return {
      criticalIssues,
      recommendations,
      retryStrategies,
      immediateActions,
      errorCodeBreakdown,
    };
  }

  public getEnhancedDescription(): string {
    return `${this.metadata.description}

Available parameters:
- widgetId (required): MongoDB ObjectId of the widget to analyze
- timeRange (optional): Analysis time range ('7d', '14d', '30d', '90d', 'all', default: '14d')
- includeFailed (optional): Include failed campaigns in analysis (default: true)
- includeMessages (optional): Include detailed message analysis (default: true)
- includeAttribution (optional): Include attribution and revenue data (default: true)

Example usage:
{
  "widgetId": "507f1f77bcf86cd799439011",
  "timeRange": "30d",
  "includeFailed": true,
  "includeMessages": true,
  "includeAttribution": true
}`;
  }

  public override getOpenAIFunctionSpec() {
    return {
      type: 'function',
      function: {
        name: this.getMetadata().name,
        description: this.getEnhancedDescription(),
        parameters: {
          type: 'object',
          properties: {
            widgetId: { type: 'string', description: 'MongoDB ObjectId' },
            timeRange: {
              type: 'string',
              enum: ['7d', '14d', '30d', '90d', 'all'],
              default: '14d',
            },
            includeFailed: { type: 'boolean', default: true },
            includeMessages: { type: 'boolean', default: true },
            includeAttribution: { type: 'boolean', default: true },
          },
          required: [],
          additionalProperties: true,
        },
      },
    } as const;
  }
}
