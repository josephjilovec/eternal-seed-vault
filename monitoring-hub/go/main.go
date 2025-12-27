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
	pb "nexus-gates/monitoring-hub/proto/gen"
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
	log.Printf("Status report from %s (%s): %v", req.ModuleId, req.ModuleType, req.Status)

	// Update module status
	if h.modules == nil {
		h.modules = make(map[string]*ModuleStatus)
	}

	h.modules[req.ModuleId] = &ModuleStatus{
		ModuleID:   req.ModuleId,
		ModuleType: req.ModuleType,
		Status:     req.Status,
		LastSeen:   time.Now(),
		Metadata:   req.Metadata,
		Metrics:    req.Metrics,
	}

	return &pb.Acknowledgment{
		Success:   true,
		Message:   "Status received",
		Timestamp: time.Now().UnixMilli(),
	}, nil
}

// Heartbeat receives heartbeat signals from modules
func (h *MonitoringHub) Heartbeat(ctx context.Context, req *pb.HeartbeatRequest) (*pb.HeartbeatResponse, error) {
	log.Printf("Heartbeat from module: %s", req.ModuleId)

	// Update last seen time if module is registered
	if status, exists := h.modules[req.ModuleId]; exists {
		status.LastSeen = time.Now()
	}

	return &pb.HeartbeatResponse{
		Alive:          true,
		ServerTimestamp: time.Now().UnixMilli(),
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
	hub := &MonitoringHub{}

	pb.RegisterModuleTelemetryServer(grpcServer, hub)

	log.Println("Monitoring Hub started on :50051")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}

