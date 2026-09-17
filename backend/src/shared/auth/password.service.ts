import crypto from "node:crypto";

/**
 * Dedicated Password Hashing Service.
 *
 * Uses OWASP & RFC 7914 recommended memory-hard `scrypt` algorithm.
 * Parameters:
 *   N = 16384 (cost = 2^14)
 *   r = 8 (block size)
 *   p = 1 (parallelization)
 *   keylen = 64 bytes
 *   salt = 16 bytes CSPRNG
 *
 * Output format:
 *   $scrypt$N=16384,r=8,p=1$<saltHex>$<derivedKeyHex>
 *
 * Verifies with constant-time equality check (`crypto.timingSafeEqual`).
 */
export class PasswordService {
  private static readonly N = 16384;
  private static readonly r = 8;
  private static readonly p = 1;
  private static readonly KEY_LEN = 64;

  /**
   * Securely hash a plaintext password.
   */
  async hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== "string") {
      throw new Error("Password must be a non-empty string");
    }

    const salt = crypto.randomBytes(16);
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(
        password,
        salt,
        PasswordService.KEY_LEN,
        {
          cost: PasswordService.N,
          blockSize: PasswordService.r,
          parallelization: PasswordService.p,
        },
        (err, progress) => {
          if (err) reject(err);
          else resolve(progress as Buffer);
        }
      );
    });

    return `$scrypt$N=${PasswordService.N},r=${PasswordService.r},p=${PasswordService.p}$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
  }

  /**
   * Verify a plaintext password against a stored scrypt hash.
   * Uses constant-time comparison to prevent timing side-channel attacks.
   */
  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    if (!password || !storedHash || typeof password !== "string" || typeof storedHash !== "string") {
      return false;
    }

    try {
      const parts = storedHash.split("$");
      // Expected format: ["", "scrypt", "N=16384,r=8,p=1", "<salt>", "<key>"]
      if (parts.length !== 5 || parts[1] !== "scrypt") {
        return false;
      }

      const params = parts[2];
      const saltHex = parts[3];
      const hashHex = parts[4];

      if (!params || !saltHex || !hashHex) return false;

      const salt = Buffer.from(saltHex, "hex");
      const expectedKey = Buffer.from(hashHex, "hex");

      // Parse parameters
      const costMatch = params.match(/N=(\d+)/);
      const blockMatch = params.match(/r=(\d+)/);
      const parallelMatch = params.match(/p=(\d+)/);

      const cost = costMatch ? parseInt(costMatch[1]!, 10) : PasswordService.N;
      const blockSize = blockMatch ? parseInt(blockMatch[1]!, 10) : PasswordService.r;
      const parallelization = parallelMatch ? parseInt(parallelMatch[1]!, 10) : PasswordService.p;

      const derivedKey = await new Promise<Buffer>((resolve, reject) => {
        crypto.scrypt(
          password,
          salt,
          expectedKey.length,
          { cost, blockSize, parallelization },
          (err, progress) => {
            if (err) reject(err);
            else resolve(progress as Buffer);
          }
        );
      });

      if (derivedKey.length !== expectedKey.length) {
        return false;
      }

      return crypto.timingSafeEqual(derivedKey, expectedKey);
    } catch {
      return false;
    }
  }
}

export const passwordService = new PasswordService();
