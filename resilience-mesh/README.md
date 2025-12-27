# Resilience-Mesh Self-Healing Network Module

## Purpose
Self-healing network layer with automatic protocol rotation and port hopping to prevent communication blockages and digital isolation.

## Dependencies
- `@grpc/grpc-js`: gRPC client library
- `wrtc`: WebRTC for Node.js
- `ws`: WebSocket library for P2P gossip
- `ssh2`: SSH tunneling support
- TypeScript 5.3+

## Module Role
Monitors network connectivity via heartbeat signals every 60 seconds. If three consecutive heartbeats fail, automatically attempts to re-establish connection using alternative protocols (WebRTC, SSH Tunneling, P2P Gossip) and port hopping.

## Architecture

### Components

1. **ConnectivityWatchdog**: Sends heartbeat signals every 60s, detects failures
2. **MessageBus**: Protocol-agnostic communication interface with rotation support
3. **FailureLogger**: Timestamped logging of all blocking attempts and bypasses
4. **PortHopper**: Random port selection (1024-65535) when primary port is throttled
5. **Protocol Implementations**:
   - `GRPCProtocol`: Primary communication protocol
   - `WebRTCProtocol`: Bypasses port-based blocking via P2P
   - `SSHTunnelProtocol`: Masks traffic as SSH
   - `P2PGossipProtocol`: Discovers local nodes for mesh networking

## Usage

```typescript
import { ResilienceMesh, ProtocolType, ProtocolConfig } from './index.js';

const protocolConfigs: ProtocolConfig[] = [
  {
    type: ProtocolType.GRPC,
    primaryPort: 50051,
    alternativePorts: [50052, 50053],
    enabled: true,
    priority: 1
  },
  // ... more protocols
];

const mesh = new ResilienceMesh(protocolConfigs);
await mesh.start();
```

## Failure Logging

All events are logged to `failure_log.json` with timestamps:
- `heartbeat_failure`: Individual heartbeat failures
- `connection_blockage`: Communication blockage detected
- `protocol_rotation`: Protocol rotation attempts
- `port_hop`: Port hopping attempts
- `bypass_success`: Successful bypass of blocking

## Protocol Priority

Protocols are tried in priority order (lower number = higher priority):
1. gRPC (primary)
2. WebRTC (bypass port blocking)
3. SSH Tunnel (mask as SSH)
4. P2P Gossip (local mesh network)

## Performance

- Heartbeat interval: 60 seconds (configurable)
- Failure threshold: 3 consecutive failures (configurable)
- Port hopping range: 1024-65535 (configurable)
- Protocol rotation timeout: < 2 seconds
- Port hop timeout: < 500ms

