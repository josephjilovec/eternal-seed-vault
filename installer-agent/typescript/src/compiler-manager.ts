/**
 * Purpose: Installer Agent with full permission to manage local environment and install missing compilers
 * Dependencies: Child process execution, package managers
 * Module Role: Autonomous installation and verification of polyglot stack compilers
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * Compiler types required for polyglot stack
 */
export enum CompilerType {
  RUST = 'rust',
  GO = 'go',
  JULIA = 'julia',
  PYTHON = 'python',
  NODE = 'node',
  GCC = 'gcc',
  CLANG = 'clang',
  EMSCRIPTEN = 'emscripten',
  COBOL = 'cobol',
  FORTRAN = 'fortran'
}

/**
 * Compiler information
 */
export interface CompilerInfo {
  type: CompilerType;
  command: string;
  versionCommand: string;
  installCommand: string;
  versionPattern?: RegExp;
  minVersion?: string;
}

/**
 * Compiler detection result
 */
export interface CompilerStatus {
  type: CompilerType;
  installed: boolean;
  version?: string;
  path?: string;
  error?: string;
}

/**
 * Compiler manager for polyglot stack
 * 
 * @class CompilerManager
 */
export class CompilerManager {
  private compilerInfo: Map<CompilerType, CompilerInfo> = new Map();

  constructor() {
    this.initializeCompilerInfo();
  }

  /**
   * Initialize compiler information
   * @private
   */
  private initializeCompilerInfo(): void {
    const compilers: CompilerInfo[] = [
      {
        type: CompilerType.RUST,
        command: 'rustc',
        versionCommand: 'rustc --version',
        installCommand: 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh'
      },
      {
        type: CompilerType.GO,
        command: 'go',
        versionCommand: 'go version',
        installCommand: 'https://go.dev/dl/'
      },
      {
        type: CompilerType.JULIA,
        command: 'julia',
        versionCommand: 'julia --version',
        installCommand: 'https://julialang.org/downloads/'
      },
      {
        type: CompilerType.PYTHON,
        command: 'python3',
        versionCommand: 'python3 --version',
        installCommand: 'https://www.python.org/downloads/'
      },
      {
        type: CompilerType.NODE,
        command: 'node',
        versionCommand: 'node --version',
        installCommand: 'https://nodejs.org/'
      },
      {
        type: CompilerType.GCC,
        command: 'gcc',
        versionCommand: 'gcc --version',
        installCommand: 'apt-get install gcc' // Platform-specific
      },
      {
        type: CompilerType.CLANG,
        command: 'clang',
        versionCommand: 'clang --version',
        installCommand: 'apt-get install clang'
      },
      {
        type: CompilerType.EMSCRIPTEN,
        command: 'emcc',
        versionCommand: 'emcc --version',
        installCommand: 'git clone https://github.com/emscripten-core/emsdk.git'
      }
    ];

    for (const compiler of compilers) {
      this.compilerInfo.set(compiler.type, compiler);
    }
  }

  /**
   * Check if a compiler is installed
   * 
   * @param type - Compiler type to check
   * @returns Compiler status
   */
  async checkCompiler(type: CompilerType): Promise<CompilerStatus> {
    const info = this.compilerInfo.get(type);
    if (!info) {
      return {
        type,
        installed: false,
        error: 'Unknown compiler type'
      };
    }

    try {
      // Check if command exists
      const { stdout } = await execAsync(`which ${info.command}`, { timeout: 5000 });
      const path = stdout.trim();

      if (!path || path === '') {
        return {
          type,
          installed: false
        };
      }

      // Get version
      let version: string | undefined;
      try {
        const { stdout: versionOutput } = await execAsync(info.versionCommand, { timeout: 5000 });
        version = versionOutput.trim();
      } catch (error) {
        // Version check failed, but compiler exists
        version = 'unknown';
      }

      return {
        type,
        installed: true,
        version,
        path
      };
    } catch (error) {
      return {
        type,
        installed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check all required compilers
   * 
   * @param requiredTypes - Array of required compiler types
   * @returns Map of compiler statuses
   */
  async checkAllCompilers(requiredTypes: CompilerType[]): Promise<Map<CompilerType, CompilerStatus>> {
    const statuses = new Map<CompilerType, CompilerStatus>();

    for (const type of requiredTypes) {
      const status = await this.checkCompiler(type);
      statuses.set(type, status);
    }

    return statuses;
  }

  /**
   * Install a compiler (platform-specific)
   * 
   * @param type - Compiler type to install
   * @returns True if installation successful
   */
  async installCompiler(type: CompilerType): Promise<boolean> {
    const info = this.compilerInfo.get(type);
    if (!info) {
      console.error(`Unknown compiler type: ${type}`);
      return false;
    }

    console.log(`Installing ${type} compiler...`);

    try {
      // Execute install command
      // Note: In production, this would handle different platforms (Windows, Linux, macOS)
      const { stdout, stderr } = await execAsync(info.installCommand, {
        timeout: 300000, // 5 minutes
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });

      console.log(`Installation output: ${stdout}`);
      if (stderr) {
        console.warn(`Installation warnings: ${stderr}`);
      }

      // Verify installation
      const status = await this.checkCompiler(type);
      if (status.installed) {
        console.log(`✓ ${type} compiler installed successfully (version: ${status.version})`);
        return true;
      } else {
        console.error(`✗ ${type} compiler installation failed verification`);
        return false;
      }
    } catch (error) {
      console.error(`Failed to install ${type} compiler: ${error}`);
      return false;
    }
  }

  /**
   * Install all missing compilers
   * 
   * @param requiredTypes - Array of required compiler types
   * @returns Map of installation results
   */
  async installMissingCompilers(requiredTypes: CompilerType[]): Promise<Map<CompilerType, boolean>> {
    const results = new Map<CompilerType, boolean>();

    // Check which compilers are missing
    const statuses = await this.checkAllCompilers(requiredTypes);

    for (const [type, status] of statuses.entries()) {
      if (!status.installed) {
        console.log(`Compiler ${type} is missing, installing...`);
        const success = await this.installCompiler(type);
        results.set(type, success);
      } else {
        console.log(`Compiler ${type} is already installed (${status.version})`);
        results.set(type, true);
      }
    }

    return results;
  }

  /**
   * Verify installation integrity
   * 
   * @param type - Compiler type to verify
   * @returns True if verification successful
   */
  async verifyInstallation(type: CompilerType): Promise<boolean> {
    const status = await this.checkCompiler(type);
    
    if (!status.installed) {
      return false;
    }

    // Try to compile a simple test program
    try {
      // This would compile a test program specific to each compiler
      // For now, just check if the compiler responds
      const info = this.compilerInfo.get(type);
      if (info) {
        await execAsync(info.versionCommand, { timeout: 5000 });
        return true;
      }
    } catch (error) {
      console.error(`Verification failed for ${type}: ${error}`);
      return false;
    }

    return false;
  }
}

