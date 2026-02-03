const DEFAULT_TIMEOUT = 8000;
const DEFAULT_ENDPOINTS = [
  'https://api.github.com',
  'https://api.github.com/rate_limit',
  'https://api.github.com/meta',
];

const DEFAULT_GITHUB_REPOS = [
  { owner: 'openai', repo: 'openai-cookbook' },
  { owner: 'vercel', repo: 'next.js' },
];

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url, options) {
  const response = await fetchWithTimeout(url, options);
  return response.json();
}

function formatEventTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function resolveEndpointConfig(endpoints) {
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    return DEFAULT_ENDPOINTS.map((url) => ({ url }));
  }
  return endpoints.map((entry) =>
    typeof entry === 'string' ? { url: entry } : { url: entry.url, name: entry.name },
  );
}

function mapWeatherCode(code) {
  const map = new Map([
    [0, 'Clear'],
    [1, 'Mainly clear'],
    [2, 'Partly cloudy'],
    [3, 'Overcast'],
    [45, 'Fog'],
    [48, 'Depositing rime fog'],
    [51, 'Light drizzle'],
    [53, 'Moderate drizzle'],
    [55, 'Dense drizzle'],
    [61, 'Slight rain'],
    [63, 'Moderate rain'],
    [65, 'Heavy rain'],
    [71, 'Slight snow'],
    [73, 'Moderate snow'],
    [75, 'Heavy snow'],
    [80, 'Rain showers'],
    [81, 'Heavy rain showers'],
    [82, 'Violent rain showers'],
    [95, 'Thunderstorm'],
  ]);
  if (map.has(code)) return map.get(code);
  return 'Cloudy';
}

async function fetchEndpointStatus(endpoint) {
  const started = Date.now();
  const response = await fetchWithTimeout(endpoint.url);
  const latency = Date.now() - started;
  let name = endpoint.name;
  try {
    const data = await response.clone().json();
    if (!name) {
      name = data?.name || data?.service?.name;
    }
  } catch (error) {
    // ignore JSON parse failures
  }
  if (!name) {
    const url = new URL(endpoint.url);
    name = `${url.hostname}${url.pathname !== '/' ? url.pathname : ''}`;
  }
  const status = latency > 900 ? 'Degraded' : 'Stable';
  return { name, status, latency, ok: response.ok };
}

function summarizeStatus(results) {
  const total = results.length || 1;
  const successCount = results.filter((result) => result.ok).length;
  const failures = total - successCount;
  const uptime = `${((successCount / total) * 100).toFixed(2)}%`;
  const incidents = failures ? `${failures} incidents` : '0 incidents';
  return {
    uptime,
    incidents,
    failures,
    services: results.map((result) => ({
      name: result.name,
      status: result.ok ? result.status : 'Offline',
    })),
    latencyAvg: Math.round(
      results.reduce((sum, result) => sum + result.latency, 0) / total,
    ),
  };
}

export async function fetchCalendarEvents(config = {}) {
  const provider = config.provider || 'github';
  if (provider === 'google' && config.google?.apiKey && config.google?.calendarId) {
    const timeMin = new Date().toISOString();
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        config.google.calendarId,
      )}/events`,
    );
    url.searchParams.set('key', config.google.apiKey);
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('maxResults', '5');
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');

    const data = await fetchJson(url.toString());
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) return [];
    return items.map((event) => ({
      title: event.summary || 'Untitled',
      time: formatEventTime(event.start?.dateTime || event.start?.date) || 'All day',
    }));
  }

  if (provider === 'outlook' && config.outlook?.endpoint) {
    const data = await fetchJson(config.outlook.endpoint, {
      headers: config.outlook.token
        ? { Authorization: `Bearer ${config.outlook.token}` }
        : undefined,
    });
    const items = Array.isArray(data.value) ? data.value : [];
    return items.slice(0, 5).map((event) => ({
      title: event.subject || 'Untitled',
      time: formatEventTime(event.start?.dateTime) || 'Scheduled',
    }));
  }

  if (provider === 'github') {
    const org = config.github?.org || 'openai';
    const url = `https://api.github.com/orgs/${org}/events?per_page=5`;
    const items = await fetchJson(url);
    if (!Array.isArray(items) || items.length === 0) return [];
    return items.map((event) => ({
      title: `${event.type?.replace(/Event$/, '') || 'Activity'} · ${
        event.repo?.name || org
      }`,
      time: formatEventTime(event.created_at),
    }));
  }

  return [];
}

export async function fetchWeather(config = {}) {
  const provider = config.provider || 'openMeteo';
  if (provider === 'openWeather' && config.openWeather?.apiKey) {
    const { apiKey, units = 'imperial', location = {} } = config.openWeather;
    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    if (location.lat && location.lon) {
      url.searchParams.set('lat', location.lat);
      url.searchParams.set('lon', location.lon);
    } else if (location.city) {
      url.searchParams.set('q', location.city);
    }
    url.searchParams.set('appid', apiKey);
    url.searchParams.set('units', units);

    const data = await fetchJson(url.toString());
    return {
      temp: `${Math.round(data.main.temp)}°`,
      conditions: `${data.weather?.[0]?.main || 'Clear'} · ${data.main.humidity}% humidity`,
      wind: `${Math.round(data.wind.speed)} ${units === 'imperial' ? 'mph' : 'm/s'}`,
      aqi: data.main.pressure ? String(Math.round(data.main.pressure / 10)) : '—',
      uv: data.sys?.country || '—',
    };
  }

  if (provider === 'openMeteo') {
    const location = config.openMeteo?.location || config.openWeather?.location || {};
    const units = config.openMeteo?.units || 'imperial';
    const latitude = Number(location.lat || 37.7749);
    const longitude = Number(location.lon || -122.4194);
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.set('latitude', latitude);
    weatherUrl.searchParams.set('longitude', longitude);
    weatherUrl.searchParams.set(
      'current',
      'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,uv_index',
    );
    weatherUrl.searchParams.set('timezone', 'auto');
    if (units === 'imperial') {
      weatherUrl.searchParams.set('temperature_unit', 'fahrenheit');
      weatherUrl.searchParams.set('wind_speed_unit', 'mph');
    }

    const weatherData = await fetchJson(weatherUrl.toString());
    const current = weatherData.current || {};
    const aqiUrl = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
    aqiUrl.searchParams.set('latitude', latitude);
    aqiUrl.searchParams.set('longitude', longitude);
    aqiUrl.searchParams.set('current', 'us_aqi');

    let aqiValue = '—';
    try {
      const aqiData = await fetchJson(aqiUrl.toString());
      const aqi = aqiData.current?.us_aqi;
      if (typeof aqi === 'number') aqiValue = String(aqi);
    } catch (error) {
      aqiValue = '—';
    }

    return {
      temp: `${Math.round(current.temperature_2m)}°`,
      conditions: `${mapWeatherCode(current.weather_code)} · ${
        current.relative_humidity_2m
      }% humidity`,
      wind: `${Math.round(current.wind_speed_10m)} ${units === 'imperial' ? 'mph' : 'km/h'}`,
      aqi: aqiValue,
      uv: current.uv_index ? String(current.uv_index) : '—',
    };
  }

  return {
    temp: '—',
    conditions: 'Unavailable',
    wind: '—',
    aqi: '—',
    uv: '—',
  };
}

export async function fetchServerStatus(config = {}) {
  const endpoints = resolveEndpointConfig(config.endpoints);
  const results = await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        return await fetchEndpointStatus(endpoint);
      } catch (error) {
        return {
          name: endpoint.name || endpoint.url,
          status: 'Offline',
          latency: DEFAULT_TIMEOUT,
          ok: false,
        };
      }
    }),
  );
  return summarizeStatus(results);
}

export async function fetchGithubProjects(config = {}) {
  const repositories =
    Array.isArray(config.repositories) && config.repositories.length > 0
      ? config.repositories
      : DEFAULT_GITHUB_REPOS;
  const headers = config.token ? { Authorization: `Bearer ${config.token}` } : undefined;
  const results = await Promise.all(
    repositories.slice(0, 4).map(async (repo) => {
      const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/actions/runs?per_page=1`;
      const data = await fetchJson(url, { headers });
      const run = data.workflow_runs?.[0];
      return {
        name: `${repo.owner}/${repo.repo}`,
        status: run?.conclusion ? run.conclusion.replace('_', ' ') : 'Queued',
      };
    }),
  );
  return {
    summary: `${repositories.length} pipelines`,
    items: results,
    lastSync: `Last sync ${new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`,
  };
}

export async function fetchTelemetrySnapshot(config = {}) {
  const endpoints = resolveEndpointConfig(config.endpoints);
  const results = await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        return await fetchEndpointStatus(endpoint);
      } catch (error) {
        return {
          name: endpoint.name || endpoint.url,
          status: 'Offline',
          latency: DEFAULT_TIMEOUT,
          ok: false,
        };
      }
    }),
  );
  const summary = summarizeStatus(results);
  return {
    type: 'telemetry',
    metrics: {
      availability: summary.uptime,
      latency: `${summary.latencyAvg}ms`,
      alerts: `${summary.failures} open`,
    },
    server: {
      uptime: summary.uptime,
      incidents: summary.incidents,
      services: summary.services,
    },
  };
}
