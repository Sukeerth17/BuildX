import redis
import json
import os

_memory_cache = {}
r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

def get_cache(key: str):
    try:
        val = r.get(key)
        return json.loads(val) if val else None
    except Exception:
        return _memory_cache.get(key)

def set_cache(key: str, value, ttl: int = 60):
    try:
        r.set(key, json.dumps(value), ex=ttl)
    except Exception:
        _memory_cache[key] = value

def invalidate_pattern(pattern: str):
    try:
        for key in r.scan_iter(pattern):
            r.delete(key)
    except Exception:
        _memory_cache.clear()
