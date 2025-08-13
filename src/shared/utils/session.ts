import { AgentSession } from '../../agent/types';
import { sessionConfig } from '../../core/config/agent.config';
import { agentLogger } from './agent.logger';

class SessionManager {
  private sessions: Map<string, AgentSession> = new Map();

  createSession(sessionId?: string): AgentSession {
    const id = sessionId || this.generateSessionId();
    const now = new Date();

    const session: AgentSession = {
      id,
      createdAt: now,
      lastActivity: now,
      memory: [],
      metadata: {},
    };

    this.sessions.set(id, session);
    agentLogger.info(`Session created`, { sessionId: id });

    return session;
  }

  getSession(sessionId: string): AgentSession | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session || null;
  }

  updateSession(sessionId: string, updates: Partial<AgentSession>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    Object.assign(session, updates);
    session.lastActivity = new Date();
    return true;
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      agentLogger.info(`Session deleted`, { sessionId });
    }
    return deleted;
  }

  cleanupExpiredSessions(): number {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      const timeDiff = now.getTime() - session.lastActivity.getTime();
      if (timeDiff > sessionConfig.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach((sessionId) => {
      this.sessions.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      agentLogger.info(`Cleaned up expired sessions`, {
        count: expiredSessions.length,
        sessionIds: expiredSessions,
      });
    }

    return expiredSessions.length;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}

export const sessionManager = new SessionManager();

// Cleanup expired sessions every 5 minutes
setInterval(
  () => {
    sessionManager.cleanupExpiredSessions();
  },
  5 * 60 * 1000,
);
