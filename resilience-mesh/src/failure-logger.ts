/**
 * Purpose: Logs failure events and communication blockages to failure_log.json
 * Dependencies: fs (Node.js), types.ts
 * Module Role: Persistent logging of network events for audit and debugging
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { FailureEvent } from './types.js';

/**
 * Manages failure event logging to JSON file
 * 
 * @class FailureLogger
 */
export class FailureLogger {
  private logPath: string;
  private events: FailureEvent[] = [];

  /**
   * @param logDir - Directory where failure_log.json will be stored
   */
  constructor(logDir: string = process.cwd()) {
    this.logPath = join(logDir, 'failure_log.json');
    this.loadExistingLogs();
  }

  /**
   * Load existing failure logs from disk
   * @private
   */
  private loadExistingLogs(): void {
    if (existsSync(this.logPath)) {
      try {
        const content = readFileSync(this.logPath, 'utf-8');
        this.events = JSON.parse(content);
      } catch (error) {
        // If file is corrupted, start fresh
        console.warn(`Failed to load existing failure log: ${error}`);
        this.events = [];
      }
    }
  }

  /**
   * Log a failure event with timestamp
   * 
   * @param eventType - Type of failure event
   * @param protocol - Protocol that failed
   * @param message - Human-readable message
   * @param port - Port number (if applicable)
   * @param previousAttempts - Number of previous attempts (if applicable)
   * @returns The logged event
   */
  logEvent(
    eventType: FailureEvent['eventType'],
    protocol: string,
    message: string,
    port?: number,
    previousAttempts?: number
  ): FailureEvent {
    const event: FailureEvent = {
      timestamp: new Date().toISOString(),
      eventType,
      protocol: protocol as any,
      message,
      ...(port !== undefined && { port }),
      ...(previousAttempts !== undefined && { previousAttempts })
    };

    this.events.push(event);
    this.persistLogs();

    return event;
  }

  /**
   * Write all events to disk
   * @private
   */
  private persistLogs(): void {
    try {
      writeFileSync(this.logPath, JSON.stringify(this.events, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Failed to write failure log: ${error}`);
    }
  }

  /**
   * Get all logged events
   * 
   * @returns Array of all failure events
   */
  getEvents(): FailureEvent[] {
    return [...this.events];
  }

  /**
   * Get events filtered by type
   * 
   * @param eventType - Event type to filter by
   * @returns Filtered array of events
   */
  getEventsByType(eventType: FailureEvent['eventType']): FailureEvent[] {
    return this.events.filter(e => e.eventType === eventType);
  }

  /**
   * Get recent events within a time window
   * 
   * @param minutesAgo - Number of minutes to look back
   * @returns Array of recent events
   */
  getRecentEvents(minutesAgo: number = 60): FailureEvent[] {
    const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000);
    return this.events.filter(e => new Date(e.timestamp) >= cutoff);
  }

  /**
   * Clear all logged events (use with caution)
   */
  clearLogs(): void {
    this.events = [];
    this.persistLogs();
  }
}

