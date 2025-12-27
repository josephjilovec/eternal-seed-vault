/**
 * Purpose: Go-based monitoring hub for cross-language telemetry
 * Dependencies: gRPC Go libraries
 * Module Role: Centralized telemetry collection and status monitoring
 */

package main

import (
	"context"
	"log"
	"net"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	pb "nexus-gates/monitoring-hub/go/proto"
)

// MonitoringHub implements the ModuleTelemetry gRPC service
type MonitoringHub struct {
	pb.UnimplementedModuleTelemetryServer
	modules map[string]*ModuleStatus
}

// ModuleStatus tracks the status of a registered module
type ModuleStatus struct {
	ModuleID   string
	ModuleType string
	Status     pb.ModuleStatus
	LastSeen   time.Time
	Metadata   map[string]string
	Metrics    []*pb.Metric
}

// ReportStatus receives status reports from modules
func (h *MonitoringHub) ReportStatus(ctx context.Context, req *pb.StatusReport) (*pb.Acknowledgment, error) {
	// In production, uncomment after proto generation:
	// log.Printf("Status report from %s (%s): %v", req.ModuleId, req.ModuleType, req.Status)
	log.Printf("Status report received")

	// Update module status
	if h.modules == nil {
		h.modules = make(map[string]*ModuleStatus)
	}

	// In production, use actual req fields:
	// h.modules[req.ModuleId] = &ModuleStatus{...}

	return map[string]interface{}{
		"success":   true,
		"message":   "Status received",
		"timestamp": time.Now().UnixMilli(),
	}, nil
}

// Heartbeat receives heartbeat signals from modules
// Note: Uncomment after proto generation
func (h *MonitoringHub) Heartbeat(ctx context.Context, req interface{}) (interface{}, error) {
	// reqTyped := req.(*pb.HeartbeatRequest)
	log.Printf("Heartbeat received")

	// Update last seen time if module is registered
	// if status, exists := h.modules[reqTyped.ModuleId]; exists {
	// 	status.LastSeen = time.Now()
	// }

	return map[string]interface{}{
		"alive":          true,
		"serverTimestamp": time.Now().UnixMilli(),
	}, nil
}

// GetModuleStatus returns the current status of a module
func (h *MonitoringHub) GetModuleStatus(moduleID string) (*ModuleStatus, bool) {
	status, exists := h.modules[moduleID]
	return status, exists
}

// GetAllModules returns all registered modules
func (h *MonitoringHub) GetAllModules() map[string]*ModuleStatus {
	return h.modules
}

func main() {
	// Create gRPC server
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer(grpc.Creds(insecure.NewCredentials()))
	hub := &MonitoringHub{
		modules: make(map[string]*ModuleStatus),
	}

	// Note: In production, uncomment after generating proto files:
	// pb.RegisterModuleTelemetryServer(grpcServer, hub)
	_ = hub // Suppress unused variable warning

	log.Println("Monitoring Hub started on :50051")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}

