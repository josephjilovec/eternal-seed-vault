/**
 * Purpose: Randomly selects new ports between 1024-65535 when primary port appears throttled
 * Dependencies: MessageBus, FailureLogger, types.ts
 * Module Role: Port rotation mechanism to bypass port-based blocking
 */

import { MessageBus } from './message-bus.js';
import { FailureLogger } from './failure-logger.js';
import { PortHopConfig, ProtocolType } from './types.js';

/**
 * Manages port hopping when primary port is blocked
 * 
 * @class PortHopper
 */
export class PortHopper {
  private messageBus: MessageBus;
  private failureLogger: FailureLogger;
  private config: PortHopConfig;
  private attemptedPorts: Set<number> = new Set();

  /**
   * @param messageBus - MessageBus instance to update with new port
   * @param failureLogger - FailureLogger instance for logging port hops
   * @param config - Port hopping configuration
   */
  constructor(
    messageBus: MessageBus,
    failureLogger: FailureLogger,
    config: Partial<PortHopConfig> = {}
  ) {
    this.messageBus = messageBus;
    this.failureLogger = failureLogger;
    this.config = {
      minPort: config.minPort ?? 1024,
      maxPort: config.maxPort ?? 65535,
      maxAttempts: config.maxAttempts ?? 10
    };
  }

  /**
   * Attempt to hop to a new random port
   * 
   * @param protocol - Protocol type to use with new port
   * @returns True if port hop successful
   */
  async hopPort(protocol: ProtocolType): Promise<boolean> {
    const currentPort = this.messageBus.getCurrentPort();
    
    for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
      const newPort = this.generateRandomPort();
      
      if (this.attemptedPorts.has(newPort)) {
        continue; // Skip if we've already tried this port
      }

      this.attemptedPorts.add(newPort);

      this.failureLogger.logEvent(
        'port_hop',
        protocol,
        `Attempting port hop from ${currentPort} to ${newPort} (attempt ${attempt + 1})`,
        newPort,
        attempt + 1
      );

      // In a real implementation, this would:
      // 1. Update MessageBus with new port
      // 2. Attempt connection with new port
      // 3. Verify connectivity
      
      // For demonstration, simulate port hop attempt
      const success = await this.attemptPortConnection(newPort, protocol);
      
      if (success) {
        this.failureLogger.logEvent(
          'bypass_success',
          protocol,
          `Successfully hopped to port ${newPort}`,
          newPort
        );
        
        // Clear attempted ports on success to allow future hops
        this.attemptedPorts.clear();
        return true;
      }
    }

    // All attempts failed
    this.failureLogger.logEvent(
      'port_hop',
      protocol,
      `Port hopping failed after ${this.config.maxAttempts} attempts`,
      undefined,
      this.config.maxAttempts
    );

    return false;
  }

  /**
   * Generate a random port within the configured range
   * @private
   */
  private generateRandomPort(): number {
    const range = this.config.maxPort - this.config.minPort + 1;
    return Math.floor(Math.random() * range) + this.config.minPort;
  }

  /**
   * Attempt connection with a specific port
   * @private
   */
  private async attemptPortConnection(port: number, protocol: ProtocolType): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Create new protocol instance with new port
      // 2. Attempt connection
      // 3. Send test heartbeat
      // 4. Verify response
      
      // For demonstration, simulate connection attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Randomly succeed 70% of the time for demonstration
      return Math.random() > 0.3;
    } catch (error) {
      console.error(`Port connection attempt failed: ${error}`);
      return false;
    }
  }

  /**
   * Clear attempted ports history
   */
  clearAttemptedPorts(): void {
    this.attemptedPorts.clear();
  }

  /**
   * Get number of ports attempted
   * 
   * @returns Number of unique ports attempted
   */
  getAttemptedPortCount(): number {
    return this.attemptedPorts.size;
  }
}

