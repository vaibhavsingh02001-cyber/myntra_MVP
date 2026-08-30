import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Load Test Script for Myntra AI Agent System.
 * Simulates 100 concurrent Virtual Users (VUs) requesting Fit Scores and Wishlist Nudges.
 *
 * Performance SLAs:
 *  - p95 cached latency < 50ms
 *  - p95 cold latency < 800ms
 *  - Error rate < 0.1%
 */
export const options = {
  stages: [
    { duration: '10s', target: 20 },  // Ramp up to 20 users
    { duration: '30s', target: 100 }, // Peak load: 100 users
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% of requests must finish within 800ms
    http_req_failed: ['rate<0.001'],  // Error rate must be less than 0.1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = 'Bearer dev_secret_min_32_chars_please';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: TEST_TOKEN,
  };

  // 1. Fetch Fit Match Score
  const scoreRes = http.get(
    `${BASE_URL}/api/v1/fit/score/11111111-1111-1111-1111-111111111111/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`,
    { headers }
  );

  check(scoreRes, {
    'fit score status 200': (r) => r.status === 200,
    'has score field': (r) => JSON.parse(r.body).score !== undefined,
    'latency < 800ms': (r) => r.timings.duration < 800,
  });

  // 2. Fetch Wishlist History
  const historyRes = http.get(
    `${BASE_URL}/api/v1/nudge/history?userId=11111111-1111-1111-1111-111111111111`,
    { headers }
  );

  check(historyRes, {
    'nudge history status 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
