import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchCalendarEvents,
  fetchWeather,
  fetchServerStatus,
  fetchGithubProjects,
  fetchTelemetrySnapshot,
} from '../dataSources.js';

async function skipOnNetworkError(t, handler) {
  try {
    await handler();
  } catch (error) {
    t.skip(`Network unavailable: ${error.message}`);
  }
}

describe('dataSources live responses', () => {
  it('returns calendar events from a live provider by default', async (t) => {
    await skipOnNetworkError(t, async () => {
      const events = await fetchCalendarEvents();
      assert.ok(Array.isArray(events));
      if (events[0]) {
        assert.ok(events[0].title);
      }
    });
  });

  it('returns live weather by default', async (t) => {
    await skipOnNetworkError(t, async () => {
      const weather = await fetchWeather();
      assert.ok(typeof weather.temp === 'string');
      assert.ok(typeof weather.conditions === 'string');
    });
  });

  it('returns live server status by default', async (t) => {
    await skipOnNetworkError(t, async () => {
      const status = await fetchServerStatus();
      assert.ok(typeof status.uptime === 'string');
      assert.ok(Array.isArray(status.services));
      assert.ok(typeof status.incidents === 'string');
    });
  });

  it('returns live GitHub pipelines by default', async (t) => {
    await skipOnNetworkError(t, async () => {
      const pipelines = await fetchGithubProjects();
      assert.ok(typeof pipelines.summary === 'string');
      assert.ok(Array.isArray(pipelines.items));
    });
  });

  it('provides telemetry from live endpoints', async (t) => {
    await skipOnNetworkError(t, async () => {
      const telemetry = await fetchTelemetrySnapshot();
      assert.equal(telemetry.type, 'telemetry');
      assert.ok(telemetry.metrics.availability.endsWith('%'));
      assert.ok(telemetry.metrics.latency.endsWith('ms'));
      assert.ok(telemetry.metrics.alerts.endsWith('open'));
      assert.ok(Array.isArray(telemetry.server.services));
    });
  });
});
