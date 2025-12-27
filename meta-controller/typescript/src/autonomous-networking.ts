/**
 * Purpose: Autonomous networking watchdog that attempts alternative ports/P2P protocols on communication failure
 * Dependencies: ResilienceMesh, TelemetryClient
 * Module Role: Independent network recovery without human intervention
 */

import { EventEmitter } from 'events';
import { ResilienceMesh, ProtocolType, ProtocolConfig } from '../../../resilience-mesh/src/index.js';
import { TelemetryClient } from '../../../global-bridge/typescript/src/telemetry-client.js';

/**
 * Autonomous networking manager
 * Monitors network health and automatically attempts recovery
 * 
 * @class AutonomousNetworking
 * @extends EventEmitter
 */
export class AutonomousNetworking extends EventEmitter {
  private resilienceMesh: ResilienceMesh;
  private telemetryClient: TelemetryClient;
  private isRunning: boolean = false;
  private recoveryAttempts: number = 0;
  private maxRecoveryAttempts: number = 10;

  /**
   * @param protocolConfigs - Protocol configurations for ResilienceMesh
   * @param moduleId - Module ID for telemetry
   */
  constructor(
    protocolConfigs: ProtocolConfig[],
    moduleId: string = 'autonomous-networking'
  ) {
    super();

    // Initialize ResilienceMesh
    this.resilienceMesh = new ResilienceMesh(protocolConfigs);

    // Initialize telemetry client
    this.telemetryClient = new TelemetryClient(moduleId, 'autonomous-networking');

    // Wire up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for automatic recovery
   * @private
   */
  private setupEventHandlers(): void {
    // Monitor ResilienceMesh events
    this.resilienceMesh.on('allBypassAttemptsFailed', () => {
      this.handleAllBypassAttemptsFailed();
    });

    this.resilienceMesh.on('protocolRotated', (data) => {
      this.emit('recoverySuccess', {
        method: 'protocol_rotation',
        protocol: data.protocol,
        port: data.port
      });
      this.recoveryAttempts = 0;
    });

    this.resilienceMesh.on('portHopped', (data) => {
      this.emit('recoverySuccess', {
        method: 'port_hop',
        protocol: data.protocol,
        port: data.port
      });
      this.recoveryAttempts = 0;
    });

    // Report status to telemetry
    setInterval(() => {
      this.reportStatus();
    }, 30000); // Every 30 seconds
  }

  /**
   * Handle case when all bypass attempts have failed
   * @private
   */
  private handleAllBypassAttemptsFailed(): void {
    this.recoveryAttempts++;

    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      this.emit('criticalFailure', {
        message: 'All network recovery attempts exhausted',
        attempts: this.recoveryAttempts
      });

      // Report critical failure to telemetry
      this.telemetryClient.reportStatus('failed', {
        error: 'network_recovery_exhausted',
        attempts: this.recoveryAttempts.toString()
      });
    } else {
      // Try alternative recovery strategies
      this.attemptAlternativeRecovery();
    }
  }

  /**
   * Attempt alternative recovery strategies
   * @private
   */
  private async attemptAlternativeRecovery(): Promise<void> {
    console.log(`Attempting alternative recovery (attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts})...`);

    // Strategy 1: Try manual protocol rotation
    const rotationSuccess = await this.resilienceMesh.rotateProtocol();
    if (rotationSuccess) {
      return;
    }

    // Strategy 2: Try manual port hop
    const hopSuccess = await this.resilienceMesh.hopPort();
    if (hopSuccess) {
      return;
    }

    // Strategy 3: Wait and retry (exponential backoff)
    const backoffTime = Math.min(1000 * Math.pow(2, this.recoveryAttempts), 60000);
    console.log(`Waiting ${backoffTime}ms before retry...`);
    await new Promise(resolve => setTimeout(resolve, backoffTime));

    // Retry connection
    await this.resilienceMesh.start();
  }

  /**
   * Report status to telemetry hub
   * @private
   */
  private async reportStatus(): Promise<void> {
    try {
      const status = this.resilienceMesh.getStatus();
      const healthStatus = status.connectionStatus === 'connected' ? 'healthy' : 'degraded';

      await this.telemetryClient.reportStatus(
        healthStatus,
        {
          protocol: status.protocol,
          port: status.port?.toString() || 'unknown',
          consecutiveFailures: status.consecutiveFailures.toString()
        },
        [
          {
            name: 'recovery_attempts',
            value: this.recoveryAttempts,
            unit: 'count'
          }
        ]
      );
    } catch (error) {
      console.error('Failed to report status to telemetry:', error);
    }
  }

  /**
   * Start autonomous networking
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('AutonomousNetworking is already running');
      return;
    }

    console.log('Starting Autonomous Networking Watchdog...');
    await this.resilienceMesh.start();
    this.isRunning = true;
    this.emit('started');
  }

  /**
   * Stop autonomous networking
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.resilienceMesh.stop();
    this.telemetryClient.close();
    this.isRunning = false;
    this.emit('stopped');
  }

  /**
   * Get current status
   * 
   * @returns Current networking status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      meshStatus: this.resilienceMesh.getStatus(),
      recoveryAttempts: this.recoveryAttempts
    };
  }
}

