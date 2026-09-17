import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../infrastructure/database/prisma.js";

export interface TransactionOptions {
  maxWait?: number; // default 10000 ms
  timeout?: number; // default 20000 ms
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * Standard transaction helper wrapping Prisma.$transaction.
 * Ensures consistent timeouts and rollback semantics across all modules.
 */
export async function runInTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: TransactionOptions,
  client?: PrismaClient
): Promise<T>;
export async function runInTransaction<T>(
  client: PrismaClient,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: TransactionOptions
): Promise<T>;
export async function runInTransaction<T>(
  first: PrismaClient | ((tx: Prisma.TransactionClient) => Promise<T>),
  second?: ((tx: Prisma.TransactionClient) => Promise<T>) | TransactionOptions,
  third?: TransactionOptions | PrismaClient
): Promise<T> {
  let fn: (tx: Prisma.TransactionClient) => Promise<T>;
  let options: TransactionOptions | undefined;
  let client: PrismaClient;

  if (typeof first === "function") {
    fn = first;
    options = second as TransactionOptions | undefined;
    client = (third as PrismaClient | undefined) ?? defaultPrisma;
  } else {
    client = first;
    fn = second as (tx: Prisma.TransactionClient) => Promise<T>;
    options = third as TransactionOptions | undefined;
  }

  return client.$transaction(fn, {
    maxWait: options?.maxWait ?? 10000,
    timeout: options?.timeout ?? 20000,
    ...(options?.isolationLevel ? { isolationLevel: options.isolationLevel } : {}),
  });
}
