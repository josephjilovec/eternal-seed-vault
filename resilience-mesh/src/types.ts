/**
 * Purpose: Type definitions for Resilience-Mesh network module
 * Dependencies: None (base types)
 * Module Role: Type safety for network communication and protocol management
 */

/**
 * Protocol types available for communication
 */
export enum ProtocolType {
  GRPC = 'grpc',
  WEBRTC = 'webrtc',
  SSH_TUNNEL = 'ssh_tunnel',
  P2P_GOSSIP = 'p2p_gossip'
}

/**
 * Connection status states
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  FAILED = 'failed',
  BLOCKED = 'blocked'
}

/**
 * Heartbeat configuration
 */
export interface HeartbeatConfig {
  /** Interval in milliseconds between heartbeats */
  intervalMs: number;
  /** Number of consecutive failures before triggering protocol rotation */
  failureThreshold: number;
  /** Timeout for heartbeat response in milliseconds */
  timeoutMs: number;
}

/**
 * Protocol configuration
 */
export interface ProtocolConfig {
  type: ProtocolType;
  /** Primary port for this protocol */
  primaryPort: number;
  /** Alternative ports to try if primary fails */
  alternativePorts: number[];
  /** Whether this protocol is currently enabled */
  enabled: boolean;
  /** Priority order (lower number = higher priority) */
  priority: number;
}

/**
 * Failure event logged to failure_log.json
 */
export interface FailureEvent {
  timestamp: string;
  eventType: 'heartbeat_failure' | 'connection_blockage' | 'protocol_rotation' | 'port_hop' | 'bypass_success';
  protocol: ProtocolType;
  port?: number;
  message: string;
  previousAttempts?: number;
}

/**
 * Node information for P2P gossip protocol
 */
export interface NodeInfo {
  nodeId: string;
  address: string;
  port: number;
  protocols: ProtocolType[];
  lastSeen: Date;
}

/**
 * Port hopping configuration
 */
export interface PortHopConfig {
  minPort: number;
  maxPort: number;
  /** Number of ports to try before giving up */
  maxAttempts: number;
}

