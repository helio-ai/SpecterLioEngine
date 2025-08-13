import { defaultAgentService } from '../index';
import { agentLogger } from '../../shared/utils/agent.logger';

async function testAgent() {
  try {
    agentLogger.info('Starting agent test');

    // Test 1: Basic chat
    console.log('\n=== Test 1: Basic Chat ===');
    const response1 = await defaultAgentService.processChat({
      message: 'Search for books about artificial intelligence',
    });
    console.log('Response:', response1.response.substring(0, 200) + '...');

    // Test 2: Follow-up with memory
    console.log('\n=== Test 2: Follow-up with Memory ===');
    const response2 = await defaultAgentService.processChat({
      message: 'What about the books you found earlier?',
      sessionId: response1.sessionId,
    });
    console.log('Response:', response2.response.substring(0, 200) + '...');

    // Test 3: Complex book search request
    console.log('\n=== Test 3: Complex Book Search ===');
    const response3 = await defaultAgentService.processChat({
      message: 'Search for Harry Potter books and tell me about the series',
    });
    console.log('Response:', response3.response.substring(0, 300) + '...');

    // Test 4: Session management
    console.log('\n=== Test 4: Session Management ===');
    const session = defaultAgentService.getSession(response1.sessionId);
    console.log('Session memory size:', session?.stats.messageCount || 0);

    // Test 5: Statistics
    console.log('\n=== Test 5: Statistics ===');
    const stats = defaultAgentService.getMetrics();
    console.log('Active sessions:', stats.sessions.active);
    console.log('Total sessions:', stats.sessions.total);

    agentLogger.info('Agent test completed successfully');
  } catch (error: any) {
    agentLogger.error('Agent test failed', { error: error.message });
    console.error('Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAgent();
}

export { testAgent };
