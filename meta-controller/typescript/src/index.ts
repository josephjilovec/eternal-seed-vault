/**
 * Purpose: Meta-Controller main entry point - orchestrates self-transpilation and autonomous networking
 * Dependencies: SelfTranspiler, AutonomousNetworking, TelemetryClient
 * Module Role: High-level controller for autonomous system management
 */

import { SelfTranspiler, SourceLanguage, PerformanceMetrics } from './self-transpiler.js';
import { AutonomousNetworking } from './autonomous-networking.js';
import { ProtocolType, ProtocolConfig } from '../../resilience-mesh/src/index.js';
import { EventEmitter } from 'events';

/**
 * Meta-Controller orchestrates autonomous system management
 * 
 * @class MetaController
 * @extends EventEmitter
 */
export class MetaController extends EventEmitter {
  private selfTranspiler: SelfTranspiler;
  private autonomousNetworking: AutonomousNetworking;
  private isRunning: boolean = false;

  /**
   * @param protocolConfigs - Protocol configurations for networking
   * @param performanceThreshold - Performance threshold for transpilation (ms)
   */
  constructor(
    protocolConfigs: ProtocolConfig[],
    performanceThreshold: number = 100
  ) {
    super();

    this.selfTranspiler = new SelfTranspiler(performanceThreshold);
    this.autonomousNetworking = new AutonomousNetworking(protocolConfigs, 'meta-controller');

    this.setupEventHandlers();
  }

  /**
   * Set up event handlers
   * @private
   */
  private setupEventHandlers(): void {
    // Self-transpiler events
    this.selfTranspiler.on('transpilationCompleted', (result) => {
      this.emit('codeOptimized', result);
      console.log(`Code optimized: ${result.sourceFile} -> ${result.targetFile} (${result.performanceImprovement}% improvement)`);
    });

    // Autonomous networking events
    this.autonomousNetworking.on('recoverySuccess', (data) => {
      this.emit('networkRecovered', data);
      console.log(`Network recovered via ${data.method}: ${data.protocol} on port ${data.port}`);
    });

    this.autonomousNetworking.on('criticalFailure', (data) => {
      this.emit('criticalFailure', data);
      console.error(`Critical failure: ${data.message}`);
    });
  }

  /**
   * Analyze and optimize slow code
   * 
   * @param filePath - Path to source file
   * @param sourceLanguage - Source language
   * @param metrics - Performance metrics
   */
  async optimizeCode(
    filePath: string,
    sourceLanguage: SourceLanguage,
    metrics: PerformanceMetrics
  ): Promise<void> {
    const analysis = this.selfTranspiler.analyzeCode(filePath, sourceLanguage, metrics);

    if (analysis.isSlow) {
      console.log(`Slow code detected: ${filePath} (${metrics.executionTime}ms)`);
      await this.selfTranspiler.transpile(analysis);
    }
  }

  /**
   * Start Meta-Controller
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('MetaController is already running');
      return;
    }

    console.log('Starting Meta-Controller...');
    await this.autonomousNetworking.start();
    this.isRunning = true;
    this.emit('started');
    console.log('Meta-Controller started');
  }

  /**
   * Stop Meta-Controller
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.autonomousNetworking.stop();
    this.isRunning = false;
    this.emit('stopped');
    console.log('Meta-Controller stopped');
  }

  /**
   * Get current status
   * 
   * @returns Current controller status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      networking: this.autonomousNetworking.getStatus(),
      transpilationEnabled: this.selfTranspiler.isEnabled()
    };
  }
}

// Default export
export default MetaController;

// Re-export types
export {
  SelfTranspiler,
  SourceLanguage,
  TargetLanguage,
  PerformanceMetrics,
  CodeAnalysis,
  TranspilationResult
} from './self-transpiler.js';

export { AutonomousNetworking } from './autonomous-networking.js';

export {
  ResilienceMesh,
  ProtocolType,
  ProtocolConfig,
  ConnectionStatus,
  HeartbeatConfig,
  PortHopConfig
} from '../../../resilience-mesh/src/index.js';

