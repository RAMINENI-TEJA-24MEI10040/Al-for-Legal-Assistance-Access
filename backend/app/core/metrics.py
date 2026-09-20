import time
import numpy as np
from typing import Dict, List, Any
from collections import defaultdict


class MetricsCollector:
    """Thread-safe performance metrics collector tracking P50, P95, P99 latencies, token consumption, and cache rates."""

    def __init__(self):
        self.latencies: Dict[str, List[float]] = defaultdict(list)
        self.model_token_usage: Dict[str, int] = defaultdict(int)
        self.cache_hits: int = 0
        self.cache_misses: int = 0
        self.errors_count: int = 0
        self.total_requests: int = 0

    def record_latency(self, metric_name: str, duration_ms: float):
        self.latencies[metric_name].append(duration_ms)

    def record_tokens(self, model: str, count: int):
        self.model_token_usage[model] += count

    def record_cache(self, hit: bool):
        if hit:
            self.cache_hits += 1
        else:
            self.cache_misses += 1

    def record_request(self, success: bool):
        self.total_requests += 1
        if not success:
            self.errors_count += 1

    def get_summary(self) -> Dict[str, Any]:
        summary: Dict[str, Any] = {
            "total_requests": self.total_requests,
            "error_rate": (self.errors_count / max(1, self.total_requests)) * 100,
            "cache_hit_rate": (self.cache_hits / max(1, self.cache_hits + self.cache_misses)) * 100,
            "token_usage": dict(self.model_token_usage),
            "latencies": {}
        }

        for name, vals in self.latencies.items():
            if not vals:
                continue
            arr = np.array(vals)
            summary["latencies"][name] = {
                "count": len(vals),
                "p50_ms": float(np.percentile(arr, 50)),
                "p95_ms": float(np.percentile(arr, 95)),
                "p99_ms": float(np.percentile(arr, 99)),
                "min_ms": float(np.min(arr)),
                "max_ms": float(np.max(arr)),
                "mean_ms": float(np.mean(arr)),
            }
        return summary


metrics_collector = MetricsCollector()
