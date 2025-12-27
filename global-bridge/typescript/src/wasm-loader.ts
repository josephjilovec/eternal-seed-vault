/**
 * Purpose: WebAssembly module loader for legacy code (COBOL/Fortran compiled to WASM)
 * Dependencies: WebAssembly API (Node.js or browser)
 * Module Role: Universal binary format loader for cross-platform execution
 */

/**
 * WASM module interface
 */
export interface WASMModule {
  memory: WebAssembly.Memory;
  exports: {
    process: (inputPtr: number, inputLen: number) => number;
    getResult: (outputPtr: number) => number;
    allocate: (size: number) => number;
    deallocate: (ptr: number) => void;
  };
}

/**
 * WASM module loader for legacy code
 * 
 * @class WASMLoader
 */
export class WASMLoader {
  private module?: WebAssembly.Module;
  private instance?: WebAssembly.Instance;
  private memory?: WebAssembly.Memory;

  /**
   * Load WASM module from buffer
   * 
   * @param wasmBuffer - WASM binary buffer
   * @param imports - WebAssembly imports (memory, functions, etc.)
   * @returns Promise resolving to WASMModule interface
   */
  async load(
    wasmBuffer: ArrayBuffer,
    imports: WebAssembly.Imports = {}
  ): Promise<WASMModule> {
    // Compile WASM module
    this.module = await WebAssembly.compile(wasmBuffer);

    // Create memory if not provided
    if (!imports.env?.memory) {
      this.memory = new WebAssembly.Memory({
        initial: 256, // 256 pages = 16MB
        maximum: 1024 // 1GB max
      });
      imports.env = imports.env || {};
      imports.env.memory = this.memory;
    } else {
      this.memory = imports.env.memory as WebAssembly.Memory;
    }

    // Instantiate module
    this.instance = await WebAssembly.instantiate(this.module, imports);

    // Extract exports
    const exports = this.instance.exports;

    return {
      memory: this.memory,
      exports: {
        process: exports.process as (inputPtr: number, inputLen: number) => number,
        getResult: exports.getResult as (outputPtr: number) => number,
        allocate: exports.allocate as (size: number) => number,
        deallocate: exports.deallocate as (ptr: number) => void
      }
    };
  }

  /**
   * Load WASM module from file path (Node.js only)
   * 
   * @param filePath - Path to WASM file
   * @param imports - WebAssembly imports
   * @returns Promise resolving to WASMModule interface
   */
  async loadFromFile(
    filePath: string,
    imports: WebAssembly.Imports = {}
  ): Promise<WASMModule> {
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    return this.load(buffer, imports);
  }

  /**
   * Call WASM function with string input
   * 
   * @param wasmModule - Loaded WASM module
   * @param input - String input to process
   * @returns Processed result as string
   */
  processString(wasmModule: WASMModule, input: string): string {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const inputBytes = encoder.encode(input);

    // Allocate memory in WASM
    const inputPtr = wasmModule.exports.allocate(inputBytes.length);
    const memoryView = new Uint8Array(wasmModule.memory.buffer);

    // Copy input to WASM memory
    memoryView.set(inputBytes, inputPtr);

    // Call WASM process function
    const outputPtr = wasmModule.exports.process(inputPtr, inputBytes.length);

    // Read result from WASM memory
    // Assuming null-terminated string
    let resultLength = 0;
    while (memoryView[outputPtr + resultLength] !== 0) {
      resultLength++;
    }
    const resultBytes = memoryView.slice(outputPtr, outputPtr + resultLength);
    const result = decoder.decode(resultBytes);

    // Deallocate memory
    wasmModule.exports.deallocate(inputPtr);
    wasmModule.exports.deallocate(outputPtr);

    return result;
  }

  /**
   * Get the loaded WASM instance
   * 
   * @returns WebAssembly instance or undefined
   */
  getInstance(): WebAssembly.Instance | undefined {
    return this.instance;
  }

  /**
   * Get the WASM memory
   * 
   * @returns WebAssembly memory or undefined
   */
  getMemory(): WebAssembly.Memory | undefined {
    return this.memory;
  }
}

