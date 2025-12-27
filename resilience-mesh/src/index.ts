/**
 * Purpose: Main entry point for Resilience-Mesh Self-Healing Network Module
 * Dependencies: All resilience-mesh modules
 * Module Role: Orchestrates connectivity monitoring, protocol rotation, and port hopping
 */

import { MessageBus } from './message-bus.js';
import { ConnectivityWatchdog } from './connectivity-watchdog.js';
import { FailureLogger } from './failure-logger.js';
import { PortHopper } from './port-hopper.js';
import { ProtocolType, ProtocolConfig, HeartbeatConfig, PortHopConfig } from './types.js';
import { EventEmitter } from 'events';

/**
 * Resilience-Mesh orchestrator
 * Coordinates all components for self-healing network functionality
 * 
 * @class ResilienceMesh
 * @extends EventEmitter
 */
export class ResilienceMesh extends EventEmitter {
  private messageBus: MessageBus;
  private watchdog: ConnectivityWatchdog;
  private failureLogger: FailureLogger;
  private portHopper: PortHopper;
  private isRunning: boolean = false;

  /**
   * Initialize Resilience-Mesh with protocol configurations
   * 
   * @param protocolConfigs - Array of protocol configurations in priority order
   * @param heartbeatConfig - Heartbeat configuration (optional)
   * @param portHopConfig - Port hopping configuration (optional)
   * @param logDir - Directory for failure logs (optional)
   */
  constructor(
    protocolConfigs: ProtocolConfig[],
    heartbeatConfig?: Partial<HeartbeatConfig>,
    portHopConfig?: Partial<PortHopConfig>,
    logDir?: string
  ) {
    super();

    // Initialize components
    this.failureLogger = new FailureLogger(logDir);
    this.messageBus = new MessageBus(protocolConfigs);
    this.watchdog = new ConnectivityWatchdog(
      this.messageBus,
      this.failureLogger,
      heartbeatConfig
    );
    this.portHopper = new PortHopper(
      this.messageBus,
      this.failureLogger,
      portHopConfig
    );

    // Wire up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for automatic protocol rotation and port hopping
   * @private
   */
  private setupEventHandlers(): void {
    // When communication blockage is detected, try protocol rotation
    this.watchdog.on('protocolRotationRequired', async () => {
      console.log('Communication blockage detected, attempting protocol rotation...');
      
      const success = await this.messageBus.rotateProtocol();
      if (success) {
        this.failureLogger.logEvent(
          'protocol_rotation',
          this.messageBus.getCurrentProtocol(),
          'Protocol rotation successful',
          this.messageBus.getCurrentPort()
        );
        this.watchdog.resetFailures();
        this.emit('protocolRotated', {
          protocol: this.messageBus.getCurrentProtocol(),
          port: this.messageBus.getCurrentPort()
        });
      } else {
        // If protocol rotation fails, try port hopping
        console.log('Protocol rotation failed, attempting port hopping...');
        await this.attemptPortHop();
      }
    });

    // Monitor connection status changes
    this.watchdog.on('statusChanged', (status) => {
      this.emit('statusChanged', status);
    });

    // Monitor heartbeat events
    this.watchdog.on('heartbeatSuccess', () => {
      this.emit('heartbeatSuccess');
    });

    this.watchdog.on('heartbeatFailure', (data) => {
      this.emit('heartbeatFailure', data);
    });
  }

  /**
   * Attempt port hopping when protocol rotation fails
   * @private
   */
  private async attemptPortHop(): Promise<void> {
    const currentProtocol = this.messageBus.getCurrentProtocol();
    const success = await this.portHopper.hopPort(currentProtocol);
    
    if (success) {
      this.watchdog.resetFailures();
      this.emit('portHopped', {
        protocol: currentProtocol,
        port: this.messageBus.getCurrentPort()
      });
    } else {
      this.emit('allBypassAttemptsFailed');
    }
  }

  /**
   * Start the Resilience-Mesh system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('ResilienceMesh is already running');
      return;
    }

    console.log('Starting Resilience-Mesh Self-Healing Network Module...');

    // Connect MessageBus
    const connected = await this.messageBus.connect();
    if (!connected) {
      console.warn('Initial MessageBus connection failed, will retry via watchdog');
    }

    // Start watchdog (this will begin sending heartbeats)
    this.watchdog.start();

    this.isRunning = true;
    this.emit('started');
    console.log('Resilience-Mesh started successfully');
  }

  /**
   * Stop the Resilience-Mesh system
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping Resilience-Mesh...');

    this.watchdog.stop();
    this.messageBus.disconnect();

    this.isRunning = false;
    this.emit('stopped');
    console.log('Resilience-Mesh stopped');
  }

  /**
   * Get current connection status
   * 
   * @returns Current connection status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      connectionStatus: this.watchdog.getStatus(),
      protocol: this.messageBus.getCurrentProtocol(),
      port: this.messageBus.getCurrentPort(),
      consecutiveFailures: this.watchdog.getConsecutiveFailures()
    };
  }

  /**
   * Get failure events from logger
   * 
   * @param eventType - Optional event type filter
   * @returns Array of failure events
   */
  getFailureEvents(eventType?: string) {
    if (eventType) {
      return this.failureLogger.getEventsByType(eventType as any);
    }
    return this.failureLogger.getEvents();
  }

  /**
   * Manually trigger protocol rotation (for testing/debugging)
   */
  async rotateProtocol(): Promise<boolean> {
    return await this.messageBus.rotateProtocol();
  }

  /**
   * Manually trigger port hop (for testing/debugging)
   */
  async hopPort(): Promise<boolean> {
    const currentProtocol = this.messageBus.getCurrentProtocol();
    return await this.portHopper.hopPort(currentProtocol);
  }
}

// Default export
export default ResilienceMesh;

// Export all types and classes for external use
export {
  MessageBus,
  ConnectivityWatchdog,
  FailureLogger,
  PortHopper,
  ProtocolType,
  ProtocolConfig,
  ConnectionStatus,
  HeartbeatConfig,
  PortHopConfig,
  FailureEvent
} from './types.js';

