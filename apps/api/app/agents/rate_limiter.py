"""In-memory token bucket rate limiter for GROQ API."""

import asyncio
import time


class TokenBucket:
    """Async-safe token bucket rate limiter."""

    def __init__(self, rate: float, capacity: float) -> None:
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def consume(self, tokens: float = 1.0) -> bool:
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_refill
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last_refill = now
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False

    async def wait_and_consume(self, tokens: float = 1.0, max_wait: float = 60.0) -> bool:
        deadline = time.monotonic() + max_wait
        while time.monotonic() < deadline:
            if await self.consume(tokens):
                return True
            await asyncio.sleep(1.0)
        return False


class TpmRpmLimiter:
    """Combined TPM and RPM rate limiter. Singleton per settings config."""

    def __init__(self, tpm_limit: int = 6000, rpm_limit: int = 30) -> None:
        self.tpm_bucket = TokenBucket(rate=tpm_limit / 60.0, capacity=float(tpm_limit))
        self.rpm_bucket = TokenBucket(rate=rpm_limit / 60.0, capacity=float(rpm_limit))
        self.tpm_limit = tpm_limit
        self.rpm_limit = rpm_limit

    async def check(self, estimated_tokens: int = 1000) -> bool:
        if not await self.rpm_bucket.consume(1.0):
            return False
        if not await self.tpm_bucket.consume(float(estimated_tokens)):
            return False
        return True

    async def wait_and_check(self, estimated_tokens: int = 1000, max_wait: float = 60.0) -> bool:
        return (
            await self.rpm_bucket.wait_and_consume(1.0, max_wait)
            and await self.tpm_bucket.wait_and_consume(float(estimated_tokens), max_wait)
        )
