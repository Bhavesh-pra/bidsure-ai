import net from "node:net";
import { config } from "../../config/env.js";
import { logger } from "../logging/logger.js";

export interface ScanResult {
  isClean: boolean;
  scanStatus: "CLEAN" | "INFECTED" | "ERROR";
  virusName?: string | undefined;
  failureCode?: string | undefined;
  failureMessage?: string | undefined;
}

export interface ScannerAdapter {
  readonly mode: "REAL" | "DEVELOPMENT";
  scanDocument(buffer: Buffer, originalFilename: string): Promise<ScanResult>;
}

/** Standard EICAR test virus signature string (RFC standard) */
const EICAR_SIGNATURE = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

/**
 * Development / Test Scanner Adapter:
 * Uses deterministic test fixtures (EICAR signature, 'malware' or 'virus' in filename or content).
 * Explicitly identified as a DEVELOPMENT fixture, NOT production malware scanning.
 */
export class DevelopmentScannerAdapter implements ScannerAdapter {
  readonly mode = "DEVELOPMENT" as const;

  async scanDocument(buffer: Buffer, originalFilename: string): Promise<ScanResult> {
    const contentString = buffer.toString("utf-8", 0, Math.min(buffer.length, 4096));
    const lowerFilename = originalFilename.toLowerCase();

    // Check for EICAR standard test signature or explicit simulated malware payloads
    if (
      contentString.includes(EICAR_SIGNATURE) ||
      contentString.includes("MALICIOUS_VIRUS_PAYLOAD") ||
      lowerFilename.includes("eicar") ||
      lowerFilename.includes("virus") ||
      lowerFilename.includes("infected")
    ) {
      logger.warn(
        { originalFilename, mode: "DEVELOPMENT", reason: "Simulated test signature matched" },
        "Document flagged as infected by DevelopmentScannerAdapter"
      );

      return {
        isClean: false,
        scanStatus: "INFECTED",
        virusName: "Eicar-Test-Signature",
        failureCode: "SECURITY_SCAN_QUARANTINED",
        failureMessage: "This document has been isolated by the security scan and cannot continue through normal processing.",
      };
    }

    return {
      isClean: true,
      scanStatus: "CLEAN",
    };
  }
}

/**
 * Production-compatible ClamAV Scanner Adapter:
 * Streams buffer to ClamAV daemon (`clamd`) via TCP INSTREAM command (RFC standard).
 */
export class ClamAVScannerAdapter implements ScannerAdapter {
  readonly mode = "REAL" as const;
  private readonly host: string;
  private readonly port: number;

  constructor(host = config.clamavHost || "localhost", port = config.clamavPort) {
    this.host = host;
    this.port = port;
  }

  async scanDocument(buffer: Buffer, originalFilename: string): Promise<ScanResult> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let response = "";

      socket.setTimeout(10000);

      socket.connect(this.port, this.host, () => {
        // ClamAV INSTREAM protocol: 'zINSTREAM\0' followed by chunks of [length (4 bytes big-endian), data], ended by [0, 0, 0, 0]
        socket.write("zINSTREAM\0");
        const chunkSize = 2048;
        for (let i = 0; i < buffer.length; i += chunkSize) {
          const chunk = buffer.subarray(i, i + chunkSize);
          const header = Buffer.alloc(4);
          header.writeUInt32BE(chunk.length, 0);
          socket.write(header);
          socket.write(chunk);
        }
        const zeroHeader = Buffer.alloc(4);
        zeroHeader.writeUInt32BE(0, 0);
        socket.write(zeroHeader);
      });

      socket.on("data", (data) => {
        response += data.toString("utf-8");
      });

      socket.on("end", () => {
        const cleanResponse = response.trim();
        if (cleanResponse.includes("OK")) {
          resolve({ isClean: true, scanStatus: "CLEAN" });
        } else if (cleanResponse.includes("FOUND")) {
          const match = cleanResponse.match(/stream:\s*(.+)\s+FOUND/);
          const virusName = match ? match[1] : "Unknown-Malware";
          logger.warn({ virusName, originalFilename }, "Antivirus detected threat in uploaded document");
          resolve({
            isClean: false,
            scanStatus: "INFECTED",
            virusName,
            failureCode: "SECURITY_SCAN_QUARANTINED",
            failureMessage: "This document has been isolated by the security scan and cannot continue through normal processing.",
          });
        } else {
          logger.error({ response: cleanResponse }, "Unexpected ClamAV daemon response");
          resolve({
            isClean: false,
            scanStatus: "ERROR",
            failureCode: "SCANNER_ERROR",
            failureMessage: "Security scanning service unavailable. Please retry later.",
          });
        }
      });

      socket.on("error", (err) => {
        logger.error({ err: err.message, host: this.host, port: this.port }, "ClamAV socket connection failed");
        resolve({
          isClean: false,
          scanStatus: "ERROR",
          failureCode: "SCANNER_ERROR",
          failureMessage: "Security scan failed to connect to scanner daemon.",
        });
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve({
          isClean: false,
          scanStatus: "ERROR",
          failureCode: "SCANNER_TIMEOUT",
          failureMessage: "Security scan timed out.",
        });
      });
    });
  }
}

let scannerInstance: ScannerAdapter | null = null;

export function getScannerAdapter(): ScannerAdapter {
  if (!scannerInstance) {
    if (config.scannerMode === "real" && config.clamavHost) {
      scannerInstance = new ClamAVScannerAdapter();
      logger.info({ mode: "REAL", host: config.clamavHost }, "Initialized Real ClamAV security scanner adapter");
    } else {
      scannerInstance = new DevelopmentScannerAdapter();
      logger.info({ mode: "DEVELOPMENT" }, "Initialized Development security scanner adapter with deterministic fixtures");
    }
  }
  return scannerInstance;
}

export function setScannerAdapter(adapter: ScannerAdapter): void {
  scannerInstance = adapter;
}
