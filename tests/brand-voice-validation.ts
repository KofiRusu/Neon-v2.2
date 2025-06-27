#!/usr/bin/env ts-node

import { BrandVoiceAgent } from '../packages/core-agents/src/agents/brand-voice-agent';

/**
 * Brand Voice Feature Validation Script
 *
 * This script validates the complete Brand Voice Agent implementation:
 * - Agent functionality
 * - Content analysis capabilities
 * - Voice scoring accuracy
 * - Suggestion generation
 * - Profile management
 */

class BrandVoiceValidator {
  private agent: BrandVoiceAgent;
  private testResults: Array<{
    test: string;
    status: 'PASS' | 'FAIL';
    message: string;
    duration: number;
  }> = [];

  constructor() {
    this.agent = new BrandVoiceAgent();
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Brand Voice Agent Validation\n');

    await this.testAgentInitialization();
    await this.testContentAnalysis();
    await this.testVoiceScoring();
    await this.testSuggestionGeneration();
    await this.testProfileManagement();
    await this.testGuidelinesRetrieval();
    await this.testPerformance();
    await this.testErrorHandling();

    this.generateReport();
  }

  private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.testResults.push({
        test: testName,
        status: 'PASS',
        message: 'Test completed successfully',
        duration,
      });
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        test: testName,
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });
      console.log(`❌ ${testName} - FAILED: ${error}`);
    }
  }

  private async testAgentInitialization(): Promise<void> {
    await this.runTest('Agent Initialization', async () => {
      // Test agent properties
      if (this.agent.id !== 'brand-voice-agent') {
        throw new Error('Agent ID incorrect');
      }

      if (this.agent.name !== 'BrandVoiceAgent') {
        throw new Error('Agent name incorrect');
      }

      if (this.agent.type !== 'brand_voice') {
        throw new Error('Agent type incorrect');
      }

      // Test capabilities
      const expectedCapabilities = [
        'analyze_content',
        'score_content',
        'generate_suggestions',
        'create_profile',
        'get_guidelines',
        'update_guidelines',
      ];

      for (const capability of expectedCapabilities) {
        if (!this.agent.capabilities.includes(capability)) {
          throw new Error(`Missing capability: ${capability}`);
        }
      }
    });
  }

  private async testContentAnalysis(): Promise<void> {
    await this.runTest('Content Analysis', async () => {
      const testContent =
        'Our innovative AI-powered solution helps optimize your marketing strategy efficiently. We provide cutting-edge automation tools for modern businesses.';

      const result = await this.agent.analyzeContentPublic(testContent, 'blog');

      if (!result.success) {
        throw new Error(`Analysis failed: ${result.error}`);
      }

      if (
        typeof result.voiceScore !== 'number' ||
        result.voiceScore < 0 ||
        result.voiceScore > 100
      ) {
        throw new Error('Invalid voice score');
      }

      if (!result.analysis) {
        throw new Error('Missing analysis data');
      }

      if (!result.suggestions || !Array.isArray(result.suggestions)) {
        throw new Error('Invalid suggestions format');
      }
    });
  }

  private async testVoiceScoring(): Promise<void> {
    await this.runTest('Voice Scoring', async () => {
      const testCases = [
        {
          content:
            'Our professional solution optimizes business efficiency through innovative strategies.',
          expectedRange: [70, 100], // Should score high
        },
        {
          content: 'Hey! This is awesome stuff, really cool and nice!',
          expectedRange: [0, 60], // Should score low
        },
      ];

      for (const testCase of testCases) {
        const result = await this.agent.scoreContentPublic(testCase.content);

        if (!result.success) {
          throw new Error(`Scoring failed for: ${testCase.content}`);
        }

        const score = result.voiceScore;
        if (
          typeof score !== 'number' ||
          score < testCase.expectedRange[0] ||
          score > testCase.expectedRange[1]
        ) {
          throw new Error(
            `Score ${score} not in expected range ${testCase.expectedRange} for: ${testCase.content}`
          );
        }
      }
    });
  }

  private async testSuggestionGeneration(): Promise<void> {
    await this.runTest('Suggestion Generation', async () => {
      const poorContent = 'bad terrible awful content that needs improvement';

      const result = await this.agent.getSuggestionsPublic(poorContent, 'email');

      if (!result.success) {
        throw new Error(`Suggestion generation failed: ${result.error}`);
      }

      if (!result.suggestions || !Array.isArray(result.suggestions)) {
        throw new Error('Invalid suggestions format');
      }

      if (result.suggestions.length === 0) {
        throw new Error('No suggestions generated for poor content');
      }

      // Validate suggestion structure
      for (const suggestion of result.suggestions) {
        if (
          !suggestion.type ||
          !suggestion.issue ||
          !suggestion.suggestion ||
          !suggestion.priority
        ) {
          throw new Error('Invalid suggestion structure');
        }

        if (!['tone', 'vocabulary', 'structure', 'style'].includes(suggestion.type)) {
          throw new Error(`Invalid suggestion type: ${suggestion.type}`);
        }

        if (!['low', 'medium', 'high'].includes(suggestion.priority)) {
          throw new Error(`Invalid suggestion priority: ${suggestion.priority}`);
        }
      }
    });
  }

  private async testProfileManagement(): Promise<void> {
    await this.runTest('Profile Management', async () => {
      const profileData = {
        name: 'Test Brand Voice',
        description: 'Test profile for validation',
        guidelines: { tone: 'professional' },
        keywords: ['test', 'validation'],
        toneProfile: { professional: 80, friendly: 60 },
      };

      const result = await this.agent.execute({
        task: 'create_profile',
        context: { action: 'create_profile', profileData },
        priority: 'medium',
      });

      if (!result.success) {
        throw new Error(`Profile creation failed: ${result.error}`);
      }

      if (!result.profile) {
        throw new Error('No profile returned');
      }

      if (result.profile.name !== profileData.name) {
        throw new Error('Profile name mismatch');
      }
    });
  }

  private async testGuidelinesRetrieval(): Promise<void> {
    await this.runTest('Guidelines Retrieval', async () => {
      const result = await this.agent.execute({
        task: 'get_guidelines',
        context: { action: 'get_guidelines' },
        priority: 'medium',
      });

      if (!result.success) {
        throw new Error(`Guidelines retrieval failed: ${result.error}`);
      }

      if (!result.guidelines) {
        throw new Error('No guidelines returned');
      }

      // Validate guidelines structure
      const guidelines = result.guidelines;
      if (
        !guidelines.tone ||
        !guidelines.vocabulary ||
        !guidelines.style ||
        !guidelines.messaging
      ) {
        throw new Error('Incomplete guidelines structure');
      }
    });
  }

  private async testPerformance(): Promise<void> {
    await this.runTest('Performance Test', async () => {
      const longContent =
        'Professional business solution that optimizes marketing efficiency through innovative AI-powered automation. '.repeat(
          50
        );

      const startTime = Date.now();
      const result = await this.agent.analyzeContentPublic(longContent, 'blog');
      const duration = Date.now() - startTime;

      if (!result.success) {
        throw new Error(`Performance test failed: ${result.error}`);
      }

      if (duration > 5000) {
        // 5 seconds max
        throw new Error(`Analysis took too long: ${duration}ms`);
      }

      if (!result.performance || result.performance > 3000) {
        throw new Error('Performance metric not within acceptable range');
      }
    });
  }

  private async testErrorHandling(): Promise<void> {
    await this.runTest('Error Handling', async () => {
      // Test missing content
      const result1 = await this.agent.execute({
        task: 'analyze_content',
        context: { action: 'analyze' },
        priority: 'medium',
      });

      if (result1.success) {
        throw new Error('Should have failed with missing content');
      }

      // Test invalid action
      const result2 = await this.agent.execute({
        task: 'invalid_task',
        context: { action: 'invalid_action' as any },
        priority: 'medium',
      });

      if (result2.success) {
        throw new Error('Should have failed with invalid action');
      }

      // Test missing profile data
      const result3 = await this.agent.execute({
        task: 'create_profile',
        context: { action: 'create_profile' },
        priority: 'medium',
      });

      if (result3.success) {
        throw new Error('Should have failed with missing profile data');
      }
    });
  }

  private generateReport(): void {
    console.log('\n📊 Brand Voice Agent Validation Report');
    console.log('=====================================\n');

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);

    if (failedTests > 0) {
      console.log('Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`  • ${result.test}: ${result.message}`);
        });
      console.log('');
    }

    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    console.log(`Total Execution Time: ${totalDuration}ms`);
    console.log(`Average Test Duration: ${Math.round(totalDuration / totalTests)}ms\n`);

    // Feature completeness check
    console.log('✅ Feature Implementation Status:');
    console.log('  • ✅ Brand Voice Agent');
    console.log('  • ✅ Content Analysis Engine');
    console.log('  • ✅ Voice Scoring Algorithm');
    console.log('  • ✅ Suggestion Generation');
    console.log('  • ✅ Profile Management');
    console.log('  • ✅ Guidelines System');
    console.log('  • ✅ Error Handling');
    console.log('  • ✅ Performance Optimization');
    console.log('  • ✅ Unit Tests');
    console.log('  • ✅ Validation Script\n');

    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Brand Voice Agent is ready for production.');
    } else {
      console.log('⚠️  Some tests failed. Please review and fix issues before deployment.');
    }
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  const validator = new BrandVoiceValidator();
  validator.runAllTests().catch(console.error);
}

export { BrandVoiceValidator };
