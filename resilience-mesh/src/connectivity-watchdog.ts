/**
 * Purpose: Monitors network connectivity via heartbeat signals every 60 seconds
 * Dependencies: MessageBus, FailureLogger, types.ts
 * Module Role: Detects communication blockages and triggers protocol rotation
 */

import { EventEmitter } from 'events';
import { MessageBus } from './message-bus.js';
import { FailureLogger } from './failure-logger.js';
import { HeartbeatConfig, ConnectionStatus, ProtocolType } from './types.js';

/**
 * Monitors connectivity and sends periodic heartbeat signals
 * 
 * @class ConnectivityWatchdog
 * @extends EventEmitter
 */
export class ConnectivityWatchdog extends EventEmitter {
  private messageBus: MessageBus;
  private failureLogger: FailureLogger;
  private config: HeartbeatConfig;
  private heartbeatInterval?: NodeJS.Timeout;
  private consecutiveFailures: number = 0;
  private currentStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private isRunning: boolean = false;

  /**
   * @param messageBus - MessageBus instance for sending heartbeats
   * @param failureLogger - FailureLogger instance for logging events
   * @param config - Heartbeat configuration (default: 60s interval, 3 failure threshold)
   */
  constructor(
    messageBus: MessageBus,
    failureLogger: FailureLogger,
    config: Partial<HeartbeatConfig> = {}
  ) {
    super();
    this.messageBus = messageBus;
    this.failureLogger = failureLogger;
    this.config = {
      intervalMs: config.intervalMs ?? 60000, // 60 seconds
      failureThreshold: config.failureThreshold ?? 3,
      timeoutMs: config.timeoutMs ?? 5000 // 5 second timeout
    };
  }

  /**
   * Start the watchdog and begin sending heartbeats
   */
  start(): void {
    if (this.isRunning) {
      console.warn('ConnectivityWatchdog is already running');
      return;
    }

    this.isRunning = true;
    this.currentStatus = ConnectionStatus.CONNECTING;
    this.emit('statusChanged', this.currentStatus);

    // Send initial heartbeat immediately
    this.sendHeartbeat();

    // Then send periodic heartbeats
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.intervalMs);

    console.log(`ConnectivityWatchdog started (interval: ${this.config.intervalMs}ms)`);
  }

  /**
   * Stop the watchdog
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    this.currentStatus = ConnectionStatus.DISCONNECTED;
    this.emit('statusChanged', this.currentStatus);
    console.log('ConnectivityWatchdog stopped');
  }

  /**
   * Send a heartbeat signal and handle response/failure
   * @private
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const startTime = Date.now();
      const success = await Promise.race([
        this.messageBus.sendHeartbeat(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Heartbeat timeout')), this.config.timeoutMs)
        )
      ]);

      if (success) {
        // Heartbeat succeeded
        this.consecutiveFailures = 0;
        if (this.currentStatus !== ConnectionStatus.CONNECTED) {
          this.currentStatus = ConnectionStatus.CONNECTED;
          this.emit('statusChanged', this.currentStatus);
          this.emit('heartbeatSuccess');
        }
      } else {
        this.handleHeartbeatFailure('Heartbeat returned false');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.handleHeartbeatFailure(errorMessage);
    }
  }

  /**
   * Handle a heartbeat failure
   * @private
   */
  private handleHeartbeatFailure(reason: string): void {
    this.consecutiveFailures++;
    const currentProtocol = this.messageBus.getCurrentProtocol();

    this.failureLogger.logEvent(
      'heartbeat_failure',
      currentProtocol,
      `Heartbeat failed: ${reason}`,
      this.messageBus.getCurrentPort(),
      this.consecutiveFailures
    );

    if (this.currentStatus !== ConnectionStatus.FAILED) {
      this.currentStatus = ConnectionStatus.FAILED;
      this.emit('statusChanged', this.currentStatus);
    }

    this.emit('heartbeatFailure', {
      consecutiveFailures: this.consecutiveFailures,
      reason,
      protocol: currentProtocol
    });

    // If we've hit the failure threshold, trigger communication blockage event
    if (this.consecutiveFailures >= this.config.failureThreshold) {
      this.handleCommunicationBlockage();
    }
  }

  /**
   * Handle communication blockage after threshold failures
   * @private
   */
  private handleCommunicationBlockage(): void {
    const currentProtocol = this.messageBus.getCurrentProtocol();
    
    this.failureLogger.logEvent(
      'connection_blockage',
      currentProtocol,
      `Communication blockage detected after ${this.consecutiveFailures} consecutive heartbeat failures`,
      this.messageBus.getCurrentPort(),
      this.consecutiveFailures
    );

    this.currentStatus = ConnectionStatus.BLOCKED;
    this.emit('statusChanged', this.currentStatus);
    this.emit('communicationBlockage', {
      protocol: currentProtocol,
      port: this.messageBus.getCurrentPort(),
      consecutiveFailures: this.consecutiveFailures
    });

    // Trigger protocol rotation
    this.emit('protocolRotationRequired');
  }

  /**
   * Get current connection status
   * 
   * @returns Current connection status
   */
  getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  /**
   * Get number of consecutive failures
   * 
   * @returns Consecutive failure count
   */
  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  /**
   * Reset failure counter (useful after successful protocol rotation)
   */
  resetFailures(): void {
    this.consecutiveFailures = 0;
  }
}

