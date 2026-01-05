/**
 * Knowledge Synthesizer
 * Aggregates outputs from multiple room executions into cohesive results
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

interface RoomOutput {
  provider: string;
  executionId: string;
  content: string;
  timestamp: number;
}

interface SynthesisResult {
  summary: string;
  sections: Array<{
    provider: string;
    title: string;
    content: string;
  }>;
  recommendations: string[];
  artifacts: string[];
  metadata: {
    totalProviders: number;
    synthesizedAt: string;
    totalDuration: number;
  };
}

export class KnowledgeSynthesizer {
  private workDir: string;

  constructor(workDir?: string) {
    this.workDir = workDir || join(__dirname, '../../work');
  }

  /**
   * Collect all room outputs from work directory
   */
  collectOutputs(): RoomOutput[] {
    if (!existsSync(this.workDir)) {
      return [];
    }

    const files = readdirSync(this.workDir)
      .filter(f => f.endsWith('-output.md'));

    return files.map(file => {
      const content = readFileSync(join(this.workDir, file), 'utf-8');
      const parts = file.replace('-output.md', '').split('-');
      const provider = parts[1];
      const timestamp = parseInt(parts[2], 10);

      return {
        provider,
        executionId: file.replace('-output.md', ''),
        content,
        timestamp
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Synthesize multiple room outputs into a unified result
   */
  synthesize(outputs: RoomOutput[]): SynthesisResult {
    const sections = outputs.map(output => ({
      provider: output.provider,
      title: this.extractTitle(output.content) || `${output.provider} Output`,
      content: output.content
    }));

    const recommendations = this.extractRecommendations(outputs);
    const artifacts = this.extractArtifacts(outputs);
    const summary = this.generateSummary(outputs);

    const timestamps = outputs.map(o => o.timestamp);
    const totalDuration = timestamps.length > 0
      ? Math.max(...timestamps) - Math.min(...timestamps)
      : 0;

    return {
      summary,
      sections,
      recommendations,
      artifacts,
      metadata: {
        totalProviders: outputs.length,
        synthesizedAt: new Date().toISOString(),
        totalDuration
      }
    };
  }

  /**
   * Generate a unified summary from all outputs
   */
  private generateSummary(outputs: RoomOutput[]): string {
    const providerSummaries = outputs.map(output => {
      const firstParagraph = output.content.split('\n\n')[0];
      return `**${output.provider.toUpperCase()}**: ${firstParagraph.substring(0, 200)}...`;
    });

    return `# Synthesized Results\n\n${providerSummaries.join('\n\n')}`;
  }

  /**
   * Extract title from markdown content
   */
  private extractTitle(content: string): string | null {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1] : null;
  }

  /**
   * Extract recommendations from all outputs
   */
  private extractRecommendations(outputs: RoomOutput[]): string[] {
    const recommendations: string[] = [];

    for (const output of outputs) {
      // Look for recommendation sections
      const recMatch = output.content.match(/##\s*(Recommendations?|Next Steps?|Suggestions?)\s*\n([\s\S]*?)(?=\n##|$)/i);
      if (recMatch) {
        const lines = recMatch[2].split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
          .map(line => `[${output.provider}] ${line.trim().substring(1).trim()}`);
        recommendations.push(...lines);
      }
    }

    return recommendations;
  }

  /**
   * Extract code artifacts from outputs
   */
  private extractArtifacts(outputs: RoomOutput[]): string[] {
    const artifacts: string[] = [];

    for (const output of outputs) {
      // Find code blocks
      const codeBlocks = output.content.match(/```[\s\S]*?```/g) || [];
      for (const block of codeBlocks) {
        if (block.length > 100) { // Only significant code blocks
          artifacts.push(`[${output.provider}] ${block.substring(0, 50)}...`);
        }
      }
    }

    return artifacts;
  }

  /**
   * Write synthesized result to file
   */
  writeFinalOutput(result: SynthesisResult): string {
    const outputPath = join(this.workDir, 'final-output.md');

    let content = `${result.summary}\n\n`;
    content += `---\n\n`;

    // Add sections from each provider
    for (const section of result.sections) {
      content += `## ${section.title} (${section.provider.toUpperCase()})\n\n`;
      content += `${section.content}\n\n`;
      content += `---\n\n`;
    }

    // Add recommendations
    if (result.recommendations.length > 0) {
      content += `## Aggregated Recommendations\n\n`;
      for (const rec of result.recommendations) {
        content += `- ${rec}\n`;
      }
      content += `\n`;
    }

    // Add metadata
    content += `## Synthesis Metadata\n\n`;
    content += `- **Providers Used**: ${result.metadata.totalProviders}\n`;
    content += `- **Synthesized At**: ${result.metadata.synthesizedAt}\n`;
    content += `- **Artifacts Found**: ${result.artifacts.length}\n`;

    writeFileSync(outputPath, content);
    return outputPath;
  }

  /**
   * Run full synthesis pipeline
   */
  run(): string {
    console.log('🔄 Collecting room outputs...');
    const outputs = this.collectOutputs();

    if (outputs.length === 0) {
      console.log('⚠️  No outputs found in work directory');
      return '';
    }

    console.log(`📚 Found ${outputs.length} outputs from: ${outputs.map(o => o.provider).join(', ')}`);

    console.log('🧠 Synthesizing knowledge...');
    const result = this.synthesize(outputs);

    console.log('📝 Writing final output...');
    const outputPath = this.writeFinalOutput(result);

    console.log(`✅ Synthesis complete: ${outputPath}`);
    return outputPath;
  }
}

// CLI usage
if (require.main === module) {
  const synthesizer = new KnowledgeSynthesizer();
  synthesizer.run();
}
