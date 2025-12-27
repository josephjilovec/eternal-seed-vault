/**
 * Purpose: Example usage of Resilience-Mesh module
 * Dependencies: ResilienceMesh, types
 * Module Role: Demonstrates how to initialize and use the self-healing network
 */

import { ResilienceMesh, ProtocolType, ProtocolConfig } from './index.js';

/**
 * Example: Initialize and run Resilience-Mesh
 */
async function main() {
  // Configure protocols in priority order
  const protocolConfigs: ProtocolConfig[] = [
    {
      type: ProtocolType.GRPC,
      primaryPort: 50051,
      alternativePorts: [50052, 50053],
      enabled: true,
      priority: 1
    },
    {
      type: ProtocolType.WEBRTC,
      primaryPort: 9000,
      alternativePorts: [9001, 9002],
      enabled: true,
      priority: 2
    },
    {
      type: ProtocolType.SSH_TUNNEL,
      primaryPort: 22,
      alternativePorts: [2222, 2223],
      enabled: true,
      priority: 3
    },
    {
      type: ProtocolType.P2P_GOSSIP,
      primaryPort: 8080,
      alternativePorts: [8081, 8082],
      enabled: true,
      priority: 4
    }
  ];

  // Create Resilience-Mesh instance
  const mesh = new ResilienceMesh(
    protocolConfigs,
    {
      intervalMs: 60000, // 60 seconds
      failureThreshold: 3,
      timeoutMs: 5000
    },
    {
      minPort: 1024,
      maxPort: 65535,
      maxAttempts: 10
    },
    './logs' // Log directory
  );

  // Set up event listeners
  mesh.on('started', () => {
    console.log('✓ Resilience-Mesh started');
  });

  mesh.on('statusChanged', (status) => {
    console.log(`Status changed: ${status}`);
  });

  mesh.on('protocolRotated', (data) => {
    console.log(`Protocol rotated to: ${data.protocol} on port ${data.port}`);
  });

  mesh.on('portHopped', (data) => {
    console.log(`Port hopped to: ${data.port} for protocol ${data.protocol}`);
  });

  mesh.on('allBypassAttemptsFailed', () => {
    console.error('✗ All bypass attempts failed - manual intervention may be required');
  });

  // Start the mesh
  await mesh.start();

  // Keep running (in a real application, this would be part of your main loop)
  console.log('Resilience-Mesh is running. Press Ctrl+C to stop.');

  // Example: Check status periodically
  setInterval(() => {
    const status = mesh.getStatus();
    console.log('Current status:', status);
  }, 30000); // Every 30 seconds

  // Graceful shutdown on SIGINT
  process.on('SIGINT', () => {
    console.log('\nShutting down Resilience-Mesh...');
    mesh.stop();
    process.exit(0);
  });
}

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

