import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../../config/env.js";
import { logger } from "../logging/logger.js";

export interface StorageService {
  upload(key: string, content: Buffer, mimeType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): string;
}

/**
 * Builds an authoritative, secure storage key that NEVER incorporates
 * untrusted client-supplied filenames, protecting against path traversal.
 *
 * Format: organizations/{orgId}/bids/{bidId}/documents/{docId}/original
 */
export function buildStorageKey(
  organizationId: string,
  bidId: string,
  documentId: string
): string {
  // Sanitize IDs strictly to UUID-safe characters
  const cleanOrg = organizationId.replace(/[^a-zA-Z0-9-]/g, "");
  const cleanBid = bidId.replace(/[^a-zA-Z0-9-]/g, "");
  const cleanDoc = documentId.replace(/[^a-zA-Z0-9-]/g, "");
  return `organizations/${cleanOrg}/bids/${cleanBid}/documents/${cleanDoc}/original`;
}

/**
 * Local filesystem-backed object storage for development, testing, and isolated environments.
 * Stores files outside the web root in dedicated protected storage.
 */
export class LocalStorageService implements StorageService {
  private readonly rootDir: string;

  constructor(rootDir = config.documentStorageDir) {
    this.rootDir = path.resolve(rootDir);
  }

  private resolveSafePath(key: string): string {
    // Prevent directory traversal
    const normalizedKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
    const fullPath = path.resolve(this.rootDir, normalizedKey);
    if (!fullPath.startsWith(this.rootDir)) {
      throw new Error(`Path traversal attempt detected for storage key: ${key}`);
    }
    return fullPath;
  }

  async upload(key: string, content: Buffer, mimeType: string): Promise<string> {
    const targetPath = this.resolveSafePath(key);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, content);
    logger.debug({ key, targetPath, mimeType, size: content.length }, "Object stored in local storage");
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const targetPath = this.resolveSafePath(key);
    return fs.readFile(targetPath);
  }

  async delete(key: string): Promise<boolean> {
    try {
      const targetPath = this.resolveSafePath(key);
      await fs.unlink(targetPath);
      return true;
    } catch (err: any) {
      if (err.code === "ENOENT") return false;
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const targetPath = this.resolveSafePath(key);
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    return `file://${this.resolveSafePath(key)}`;
  }
}

/**
 * S3-compatible object storage service (AWS S3, MinIO, Cloudflare R2).
 * Operates over HTTPS using standard S3 REST endpoints when credentials are provided.
 */
export class S3StorageService implements StorageService {
  private readonly endpoint: string;
  private readonly bucket: string;
  private readonly region: string;
  private readonly accessKey?: string | undefined;
  private readonly secretKey?: string | undefined;

  constructor(options?: {
    endpoint?: string;
    bucket?: string | undefined;
    region?: string | undefined;
    accessKey?: string | undefined;
    secretKey?: string | undefined;
  }) {
    this.endpoint = options?.endpoint || config.s3Endpoint || "http://localhost:9000";
    this.bucket = options?.bucket || config.s3Bucket;
    this.region = options?.region || config.s3Region;
    this.accessKey = options?.accessKey ?? config.s3AccessKey;
    this.secretKey = options?.secretKey ?? config.s3SecretKey;
  }

  async upload(key: string, content: Buffer, mimeType: string): Promise<string> {
    const url = `${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${key}`;
    const headers: Record<string, string> = {
      "Content-Type": mimeType,
      "Content-Length": String(content.length),
    };

    if (this.accessKey && this.secretKey) {
      headers["Authorization"] = `AWS ${this.accessKey}:${this.secretKey}`;
    }

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: new Uint8Array(content),
    });

    if (!res.ok && res.status !== 200 && res.status !== 201) {
      throw new Error(`S3 upload failed with status ${res.status}: ${res.statusText}`);
    }

    logger.debug({ key, bucket: this.bucket, size: content.length }, "Object uploaded to S3 storage");
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const url = `${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`S3 download failed with status ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(key: string): Promise<boolean> {
    const url = `${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${key}`;
    const res = await fetch(url, { method: "DELETE" });
    return res.ok;
  }

  async exists(key: string): Promise<boolean> {
    const url = `${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${key}`;
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  }

  getUrl(key: string): string {
    return `${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${key}`;
  }
}

let storageInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageInstance) {
    if (config.s3Endpoint && config.s3AccessKey) {
      storageInstance = new S3StorageService();
      logger.info({ backend: "S3", bucket: config.s3Bucket }, "Initialized S3 object storage");
    } else {
      storageInstance = new LocalStorageService();
      logger.info({ backend: "Local", root: config.documentStorageDir }, "Initialized Local object storage");
    }
  }
  return storageInstance;
}

export function setStorageService(service: StorageService): void {
  storageInstance = service;
}
