# Nexus-Gates Engineering System - Setup Guide

## Quick Start

### Prerequisites

1. **Node.js 18+** and npm
2. **TypeScript 5.3+** (installed globally or via npm)
3. **Go 1.21+** (for monitoring hub)
4. **Protocol Buffers Compiler** (protoc) - optional for Go proto generation

### Step 1: Install Dependencies

```bash
# Resilience-Mesh
cd resilience-mesh
npm install
npm run build

# Global Bridge (TypeScript)
cd ../global-bridge/typescript
npm install
npm run build

# Meta-Controller
cd ../../meta-controller/typescript
npm install
npm run build

# Installer Agent
cd ../../installer-agent/typescript
npm install
npm run build
```

### Step 2: Setup Monitoring Hub (Go)

```bash
cd monitoring-hub/go

# Generate proto files (if protoc is installed)
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
       proto/telemetry.proto

# Install Go dependencies
go mod download

# Build and run
go run main.go
```

### Step 3: Run the System

**Terminal 1 - Monitoring Hub:**
```bash
cd monitoring-hub/go
go run main.go
# Should output: "Monitoring Hub started on :50051"
```

**Terminal 2 - Resilience-Mesh:**
```bash
cd resilience-mesh
npm start
# Or: node dist/src/example.js
```

**Terminal 3 - Meta-Controller:**
```bash
cd meta-controller/typescript
npm start
```

## Configuration

### Resilience-Mesh Configuration

Edit `resilience-mesh/src/example.ts` to configure protocols:

```typescript
const protocolConfigs: ProtocolConfig[] = [
  {
    type: ProtocolType.GRPC,
    primaryPort: 50051,
    alternativePorts: [50052, 50053],
    enabled: true,
    priority: 1
  },
  // Add more protocols...
];
```

### Monitoring Hub Configuration

Edit `monitoring-hub/go/main.go` to change the listening port:

```go
lis, err := net.Listen("tcp", ":50051") // Change port here
```

## Testing

### Test Resilience-Mesh

```bash
cd resilience-mesh
npm test  # If tests are implemented
```

### Test Telemetry Client

```typescript
import { TelemetryClient } from './global-bridge/typescript/src/telemetry-client';

const client = new TelemetryClient('test-module', 'test-type');
await client.reportStatus('healthy');
await client.sendHeartbeat();
```

### Test Compiler Manager

```typescript
import { CompilerManager, CompilerType } from './installer-agent/typescript/src/compiler-manager';

const manager = new CompilerManager();
const status = await manager.checkCompiler(CompilerType.RUST);
console.log(status);
```

## Troubleshooting

### Issue: gRPC connection fails

**Solution:** Ensure Monitoring Hub is running on port 50051:
```bash
# Check if port is in use
netstat -an | grep 50051  # Linux/Mac
netstat -an | findstr 50051  # Windows
```

### Issue: TypeScript compilation errors

**Solution:** Ensure all dependencies are installed:
```bash
npm install
npm run build
```

### Issue: Go proto generation fails

**Solution:** Install protoc and Go plugins:
```bash
# Install protoc (varies by OS)
# Then install Go plugins:
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

### Issue: WASM modules fail to load

**Solution:** Ensure Emscripten is installed for legacy code compilation:
```bash
# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
```

## Development Workflow

1. **Make changes** to TypeScript source files
2. **Build** with `npm run build` or `tsc`
3. **Test** with `npm test` or run examples
4. **Check logs** in `failure_log.json` (Resilience-Mesh)
5. **Monitor** via Monitoring Hub gRPC interface

## File Locations

- **Failure Logs**: `failure_log.json` (in Resilience-Mesh working directory)
- **Compiled Code**: `dist/` directories in each module
- **Proto Definitions**: `global-bridge/proto/` and `monitoring-hub/go/proto/`

## Next Steps

1. Implement unit tests for each module
2. Set up CI/CD pipeline
3. Add Docker containers for easy deployment
4. Implement quantum-classical interface
5. Build Eternal Seed Vault components

## Support

For issues or questions:
1. Check `ARCHITECTURE.md` for system design
2. Review `IMPLEMENTATION_SUMMARY.md` for component details
3. Examine source code comments (JSDoc format)

