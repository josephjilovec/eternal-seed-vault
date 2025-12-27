/**
 * Purpose: TypeScript gRPC client for module telemetry reporting
 * Dependencies: @grpc/grpc-js, @grpc/proto-loader, proto files
 * Module Role: Type-safe telemetry client for Node.js/TypeScript modules
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load proto file and create service definition
 */
function loadProto(protoPath: string, packageName: string) {
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  return grpc.loadPackageDefinition(packageDefinition)[packageName] as any;
}

/**
 * Telemetry client for reporting module status
 * 
 * @class TelemetryClient
 */
export class TelemetryClient {
  private client: any;
  private moduleId: string;
  private moduleType: string;
  private serverAddress: string;

  /**
   * @param moduleId - Unique identifier for this module
   * @param moduleType - Type of module (e.g., 'resilience-mesh', 'eternal-vault')
   * @param serverAddress - gRPC server address (default: localhost:50051)
   */
  constructor(
    moduleId: string,
    moduleType: string,
    serverAddress: string = 'localhost:50051'
  ) {
    this.moduleId = moduleId;
    this.moduleType = moduleType;
    this.serverAddress = serverAddress;

    const protoPath = join(__dirname, '../../proto/telemetry.proto');
    const telemetryProto = loadProto(protoPath, 'nexus.gates.telemetry');
    this.client = new telemetryProto.ModuleTelemetry(
      serverAddress,
      grpc.credentials.createInsecure()
    );
  }

  /**
   * Report module status to monitoring hub
   * 
   * @param status - Module status
   * @param metadata - Optional metadata map
   * @param metrics - Optional performance metrics
   * @returns Promise resolving to acknowledgment
   */
  async reportStatus(
    status: 'healthy' | 'degraded' | 'failed' | 'initializing',
    metadata?: Record<string, string>,
    metrics?: Array<{ name: string; value: number; unit: string }>
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      const statusMap: Record<string, number> = {
        healthy: 1,
        degraded: 2,
        failed: 3,
        initializing: 4
      };

      const report = {
        module_id: this.moduleId,
        module_type: this.moduleType,
        status: statusMap[status] || 0,
        timestamp: Date.now(),
        metadata: metadata || {},
        metrics: (metrics || []).map(m => ({
          name: m.name,
          value: m.value,
          unit: m.unit,
          timestamp: Date.now()
        }))
      };

      this.client.ReportStatus(report, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            success: response.success,
            message: response.message
          });
        }
      });
    });
  }

  /**
   * Send heartbeat to monitoring hub
   * 
   * @returns Promise resolving to heartbeat response
   */
  async sendHeartbeat(): Promise<{ alive: boolean; serverTimestamp: number }> {
    return new Promise((resolve, reject) => {
      this.client.Heartbeat(
        {
          module_id: this.moduleId,
          timestamp: Date.now()
        },
        (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              alive: response.alive,
              serverTimestamp: response.server_timestamp
            });
          }
        }
      );
    });
  }

  /**
   * Close the gRPC client connection
   */
  close(): void {
    this.client.close();
  }
}

