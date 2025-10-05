/**
 * Rate Limiting using Upstash Redis
 * Prevents API abuse with sliding window algorithm
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimitInstance: Ratelimit | null = null;

/**
 * Get or create rate limiter instance
 * 20 requests per 1 minute sliding window
 */
export function getRatelimit(): Ratelimit | null {
  // Skip rate limiting in development if Redis not configured
  if (
    process.env.NODE_ENV === 'development' &&
    (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)
  ) {
    return null;
  }

  if (!ratelimitInstance) {
    try {
      const redis = Redis.fromEnv();
      
      ratelimitInstance = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 m'),
        analytics: true,
        prefix: 'smileflow',
      });
    } catch (error) {
      console.error('Failed to initialize rate limiter:', error);
      return null;
    }
  }

  return ratelimitInstance;
}

/**
 * Check rate limit for an identifier (usually IP or user ID)
 */
export async function checkRateLimit(
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
  const ratelimit = getRatelimit();

  // If rate limiting disabled, allow all requests
  if (!ratelimit) {
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: new Date(Date.now() + 60000),
    };
  }

  try {
    const result = await ratelimit.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow request to proceed
    return {
      success: true,
      limit: 20,
      remaining: 0,
      reset: new Date(Date.now() + 60000),
    };
  }
}

/**
 * Higher rate limit for authenticated staff (100 req/min)
 */
export function getStaffRatelimit(): Ratelimit | null {
  // Skip in development if not configured
  if (
    process.env.NODE_ENV === 'development' &&
    (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)
  ) {
    return null;
  }

  try {
    const redis = Redis.fromEnv();
    
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'smileflow:staff',
    });
  } catch (error) {
    console.error('Failed to initialize staff rate limiter:', error);
    return null;
  }
}

