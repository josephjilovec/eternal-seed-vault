# Legacy Bridge - C Shim for COBOL/Fortran to WASM

## Purpose
C shims that wrap COBOL and Fortran logic into WebAssembly modules, allowing mainframe logic to run in modern browser or server environments.

## Dependencies
- Emscripten (for compiling C to WASM)
- COBOL compiler (for compiling COBOL to object files)
- Fortran compiler (for compiling Fortran to object files)
- C compiler (for creating shims)

## Module Role
Bridges legacy mainframe code (1960s-1970s) to modern WebAssembly execution environment.

## Architecture

### COBOL Bridge
1. Compile COBOL source to object file
2. Create C shim that calls COBOL functions
3. Compile C shim + COBOL object to WASM using Emscripten
4. Export standardized WASM interface

### Fortran Bridge
1. Compile Fortran source to object file
2. Create C shim that calls Fortran functions
3. Compile C shim + Fortran object to WASM using Emscripten
4. Export standardized WASM interface

## Build Process

```bash
# Compile COBOL to object
cobc -x -o legacy_cobol.o legacy_cobol.cbl

# Compile C shim
emcc -o legacy_bridge.wasm \
     legacy_cobol.o \
     cobol_shim.c \
     -s EXPORTED_FUNCTIONS='["_process", "_getResult", "_allocate", "_deallocate"]' \
     -s ALLOW_MEMORY_GROWTH=1
```

## Usage

The compiled WASM modules can be loaded using the `WASMLoader` class from the TypeScript bridge.

