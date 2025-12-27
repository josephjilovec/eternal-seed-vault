# Build Instructions

## Quick Build Status

✅ **TypeScript Components**: Ready to build (requires `npm install` in each directory)
✅ **Go Components**: Structure correct (requires Go toolchain and proto generation)
✅ **Rust Components**: Cargo.toml configured (requires Rust toolchain)
✅ **Other Languages**: Code structure verified

## TypeScript Components

### Resilience-Mesh
```bash
cd resilience-mesh
npm install
npm run build
```

### Global Bridge
```bash
cd global-bridge/typescript
npm install
npm run build
```

### Meta-Controller
```bash
cd meta-controller/typescript
npm install
npm run build
```

### Installer Agent
```bash
cd installer-agent/typescript
npm install
npm run build
```

## Go Components

### Monitoring Hub
```bash
cd monitoring-hub/go

# First, generate proto files (requires protoc):
protoc --go_out=. --go-grpc_out=. proto/telemetry.proto

# Then build:
go mod download
go build -o monitoring-hub.exe .
```

**Note**: The current version compiles without proto files but has placeholder implementations.

### Simulation Orchestrator
```bash
cd omniscience-simulation/orchestration/go
go build
```

## Rust Components

### Vault Encryption
```bash
cd eternal-seed-vault/performance-layer/rust
cargo build
```

## Language-Specific Requirements

### For Full Functionality:

1. **Proto Generation** (Go components):
   - Install Protocol Buffers compiler: https://grpc.io/docs/protoc-installation/
   - Generate Go code: `protoc --go_out=. --go-grpc_out=. proto/telemetry.proto`

2. **Rust Toolchain**:
   - Install Rust: https://rustup.rs/
   - Run: `cargo build`

3. **Julia** (Quantum components):
   - Install Julia: https://julialang.org/downloads/
   - Install packages: `julia -e 'using Pkg; Pkg.add(["Yao", "CUDA"])'`

4. **Other Languages**:
   - Haskell (GHC) for transpiler analysis
   - Scala (sbt) for transpiler transformation
   - Q# (.NET SDK) for quantum transpilation

## Testing

After building, test components individually:

```bash
# Test Resilience-Mesh
cd resilience-mesh
node dist/src/example.js

# Test Monitoring Hub (after proto generation)
cd monitoring-hub/go
./monitoring-hub.exe
```

## Known Limitations

- Go components need proto file generation for full gRPC functionality
- Some components require language-specific toolchains
- Integration tests require all components to be built

## Status

✅ **Code Structure**: All correct
✅ **Import Paths**: Fixed
✅ **Build Configs**: In place
⚠️ **Runtime**: Requires toolchains and dependencies

