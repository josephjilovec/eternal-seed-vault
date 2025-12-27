/**
 * Purpose: MessageBus abstraction for sending heartbeats and messages via different protocols
 * Dependencies: Protocol implementations, types.ts
 * Module Role: Protocol-agnostic communication interface
 */

import { EventEmitter } from 'events';
import { ProtocolType, ProtocolConfig, ConnectionStatus } from './types.js';
import { GRPCProtocol } from './protocols/grpc-protocol.js';
import { WebRTCProtocol } from './protocols/webrtc-protocol.js';
import { SSHTunnelProtocol } from './protocols/ssh-tunnel-protocol.js';
import { P2PGossipProtocol } from './protocols/p2p-gossip-protocol.js';

/**
 * Protocol interface that all protocol implementations must follow
 */
export interface IProtocol {
  connect(): Promise<boolean>;
  disconnect(): void;
  sendHeartbeat(): Promise<boolean>;
  sendMessage(data: Uint8Array): Promise<boolean>;
  getStatus(): ConnectionStatus;
  getProtocolType(): ProtocolType;
}

/**
 * MessageBus manages protocol selection and rotation
 * 
 * @class MessageBus
 * @extends EventEmitter
 */
export class MessageBus extends EventEmitter {
  private protocols: Map<ProtocolType, IProtocol> = new Map();
  private currentProtocol?: IProtocol;
  private protocolConfigs: ProtocolConfig[] = [];
  private currentPort?: number;

  /**
   * Initialize MessageBus with protocol configurations
   * 
   * @param configs - Array of protocol configurations in priority order
   */
  constructor(configs: ProtocolConfig[] = []) {
    super();
    this.protocolConfigs = configs.sort((a, b) => a.priority - b.priority);
    this.initializeProtocols();
  }

  /**
   * Initialize all protocol implementations
   * @private
   */
  private initializeProtocols(): void {
    for (const config of this.protocolConfigs) {
      if (!config.enabled) continue;

      let protocol: IProtocol;
      switch (config.type) {
        case ProtocolType.GRPC:
          protocol = new GRPCProtocol(config.primaryPort);
          break;
        case ProtocolType.WEBRTC:
          protocol = new WebRTCProtocol(config.primaryPort);
          break;
        case ProtocolType.SSH_TUNNEL:
          protocol = new SSHTunnelProtocol(config.primaryPort);
          break;
        case ProtocolType.P2P_GOSSIP:
          protocol = new P2PGossipProtocol(config.primaryPort);
          break;
        default:
          console.warn(`Unknown protocol type: ${config.type}`);
          continue;
      }

      this.protocols.set(config.type, protocol);
    }

    // Set initial protocol (highest priority)
    if (this.protocolConfigs.length > 0 && this.protocolConfigs[0].enabled) {
      this.currentProtocol = this.protocols.get(this.protocolConfigs[0].type);
      this.currentPort = this.protocolConfigs[0].primaryPort;
    }
  }

  /**
   * Connect using the current protocol
   * 
   * @returns True if connection successful
   */
  async connect(): Promise<boolean> {
    if (!this.currentProtocol) {
      throw new Error('No protocol available');
    }

    try {
      const success = await this.currentProtocol.connect();
      if (success) {
        this.emit('connected', {
          protocol: this.currentProtocol.getProtocolType(),
          port: this.currentPort
        });
      }
      return success;
    } catch (error) {
      console.error(`Connection failed: ${error}`);
      return false;
    }
  }

  /**
   * Disconnect from current protocol
   */
  disconnect(): void {
    if (this.currentProtocol) {
      this.currentProtocol.disconnect();
      this.emit('disconnected');
    }
  }

  /**
   * Send a heartbeat via current protocol
   * 
   * @returns True if heartbeat successful
   */
  async sendHeartbeat(): Promise<boolean> {
    if (!this.currentProtocol) {
      return false;
    }

    try {
      return await this.currentProtocol.sendHeartbeat();
    } catch (error) {
      console.error(`Heartbeat failed: ${error}`);
      return false;
    }
  }

  /**
   * Send a message via current protocol
   * 
   * @param data - Message data to send
   * @returns True if message sent successfully
   */
  async sendMessage(data: Uint8Array): Promise<boolean> {
    if (!this.currentProtocol) {
      return false;
    }

    try {
      return await this.currentProtocol.sendMessage(data);
    } catch (error) {
      console.error(`Message send failed: ${error}`);
      return false;
    }
  }

  /**
   * Rotate to the next available protocol
   * 
   * @returns True if rotation successful
   */
  async rotateProtocol(): Promise<boolean> {
    const currentIndex = this.protocolConfigs.findIndex(
      cfg => cfg.type === this.currentProtocol?.getProtocolType()
    );

    // Try next protocols in priority order
    for (let i = currentIndex + 1; i < this.protocolConfigs.length; i++) {
      const config = this.protocolConfigs[i];
      if (!config.enabled) continue;

      const protocol = this.protocols.get(config.type);
      if (!protocol) continue;

      // Disconnect current protocol
      if (this.currentProtocol) {
        this.currentProtocol.disconnect();
      }

      // Try to connect with new protocol
      this.currentProtocol = protocol;
      this.currentPort = config.primaryPort;

      const connected = await this.connect();
      if (connected) {
        this.emit('protocolRotated', {
          protocol: config.type,
          port: config.primaryPort
        });
        return true;
      }
    }

    // If we've tried all protocols, return to first and report failure
    if (this.protocolConfigs.length > 0) {
      const firstConfig = this.protocolConfigs[0];
      const firstProtocol = this.protocols.get(firstConfig.type);
      if (firstProtocol) {
        this.currentProtocol = firstProtocol;
        this.currentPort = firstConfig.primaryPort;
      }
    }

    return false;
  }

  /**
   * Get current protocol type
   * 
   * @returns Current protocol type
   */
  getCurrentProtocol(): ProtocolType {
    return this.currentProtocol?.getProtocolType() ?? ProtocolType.GRPC;
  }

  /**
   * Get current port
   * 
   * @returns Current port number
   */
  getCurrentPort(): number | undefined {
    return this.currentPort;
  }

  /**
   * Get connection status
   * 
   * @returns Current connection status
   */
  getStatus(): ConnectionStatus {
    return this.currentProtocol?.getStatus() ?? ConnectionStatus.DISCONNECTED;
  }
}

