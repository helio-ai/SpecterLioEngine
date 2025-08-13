import { OpenAIClient, ChatMessage } from '../../core/openai/openai-client';
import { agentConfig } from '../../core/config/agent.config';

export class ResponseComposer {
  private llm: OpenAIClient;

  constructor(llm?: OpenAIClient) {
    this.llm = llm || new OpenAIClient({ model: agentConfig.model, temperature: 0.2 });
  }

  async composeFromData(task: string, data: unknown): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a Shopify campaign analytics expert. Only use the data provided below. Do not invent or infer beyond the data. If information is missing, clearly say so. Provide concise, actionable insights and next steps.',
      },
      {
        role: 'user',
        content: `${task}\n\nData:\n${JSON.stringify(data).substring(0, 20000)}`,
      },
    ];

    try {
      // Keep responses tight to reduce latency/timeouts
      return await this.llm.chat(messages, {
        temperature: 0.2,
        maxTokens: 600,
        reasoningEffort: 'low',
      });
    } catch {
      // Fallback: generate a deterministic summary without LLM
      return this.fallbackSummary(task, data);
    }
  }

  private fallbackSummary(task: string, data: unknown): string {
    try {
      const d: any = data || {};
      const lines: string[] = [];
      lines.push(`# Summary (fallback)`);
      lines.push(`Task: ${task}`);
      // Overview metrics
      if (d.overview) {
        const o = d.overview;
        lines.push(
          `- Campaigns: total=${o.totalCampaigns} completed=${o.successfulCampaigns} failed=${o.failedCampaigns}`,
        );
        lines.push(
          `- Recipients: total=${o.totalRecipients}, sent=${o.totalSent}, delivered=${o.totalDelivered}`,
        );
        if (typeof o.averageDeliveryRate === 'number') {
          lines.push(
            `- Rates: delivery=${(o.averageDeliveryRate * 100).toFixed(
              1,
            )}% read=${(o.averageReadRate * 100).toFixed(1)}% click=${(
              o.averageClickRate * 100
            ).toFixed(1)}%`,
          );
        }
      }
      // Failures
      if (Array.isArray(d.failures) && d.failures.length) {
        const top = d.failures
          .slice(0, 3)
          .map(
            (f: any) =>
              `${f.campaignName || f.campaignId}: ${
                f.failureReason || 'Unknown'
              } (failed=${f.failedCount || 0})`,
          );
        lines.push(`- Recent failures: ${top.join('; ')}`);
      }
      // Template usage
      if (Array.isArray(d.templateUsage) && d.templateUsage.length) {
        const t = d.templateUsage
          .slice(0, 3)
          .map(
            (u: any) =>
              `${u.templateName}: used ${u.usageCount}x, success ${(u.successRate * 100).toFixed(
                1,
              )}%`,
          );
        lines.push(`- Top templates: ${t.join('; ')}`);
      }
      // Message analysis
      if (d.messageAnalysis) {
        const m = d.messageAnalysis;
        lines.push(`- Messages: total=${m.totalMessages}`);
        if (Array.isArray(m.topFailureReasons) && m.topFailureReasons.length) {
          const fr = m.topFailureReasons.slice(0, 3).map((x: any) => `${x.reason} (${x.count})`);
          lines.push(`- Top failure reasons: ${fr.join('; ')}`);
        }
      }
      // Attribution
      if (d.attributionData) {
        const a = d.attributionData;
        lines.push(
          `- Attribution: orders=${a.totalOrders}, revenue=${a.totalRevenue}, AOV=${a.averageOrderValue}`,
        );
      }
      // Recommendations
      if (Array.isArray(d.recommendations) && d.recommendations.length) {
        const rec = d.recommendations.slice(0, 5);
        lines.push('## Recommendations');
        rec.forEach((r: string, i: number) => lines.push(`${i + 1}. ${r}`));
      }
      return lines.join('\n');
    } catch {
      return `Task: ${task}\nData available but summarization timed out.`;
    }
  }

  // Optional: compact conversation summary for improved follow-ups
  async summarizeConversation(history: { role: string; content: string }[]): Promise<string> {
    if (!history || history.length === 0) return '';
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'Summarize the following conversation for internal use (do not include IDs). Return 2-3 bullet points capturing user intent, constraints, and any provided context like time range or goals.',
      },
      {
        role: 'user',
        content: history
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n')
          .slice(0, 8000),
      },
    ];
    try {
      return await this.llm.chat(messages, { maxTokens: 200 });
    } catch {
      return '';
    }
  }
}

export const responseComposer = new ResponseComposer();
