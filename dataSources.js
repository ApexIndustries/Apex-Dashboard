const DEFAULT_TIMEOUT = 8000;

const mockCalendarEvents = [
  { title: 'Ops sync', time: '09:30' },
  { title: 'Security briefing', time: '12:00' },
  { title: 'Release checkpoint', time: '15:45' },
];

const mockWeather = {
  temp: '72°',
  conditions: 'Clear · 12% humidity',
  wind: '6 mph',
  aqi: '42',
  uv: 'Low',
};

const mockServerStatus = {
  uptime: '99.98%',
  services: [
    { name: 'Core API', status: 'Stable' },
    { name: 'Edge Mesh', status: 'Stable' },
    { name: 'Data Lake', status: 'Syncing' },
  ],
  incidents: '0 incidents',
};

const mockGithubPipelines = {
  summary: '5 pipelines',
  items: [
    { name: 'apex-core', status: 'Passing' },
    { name: 'sentinel-ui', status: 'Deploying' },
    { name: 'pulse-api', status: 'Queued' },
    { name: 'nebula-mobile', status: 'Passing' },
  ],
  lastSync: 'Last sync 2m ago',
};

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

function formatEventTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export async function fetchCalendarEvents(config = {}) {
  const provider = config.provider || 'mock';
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

    const response = await fetchWithTimeout(url.toString());
    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) return [];
    return items.map((event) => ({
      title: event.summary || 'Untitled',
      time: formatEventTime(event.start?.dateTime || event.start?.date) || 'All day',
    }));
  }

  if (provider === 'outlook' && config.outlook?.endpoint) {
    const response = await fetchWithTimeout(config.outlook.endpoint, {
      headers: config.outlook.token
        ? { Authorization: `Bearer ${config.outlook.token}` }
        : undefined,
    });
    const data = await response.json();
    const items = Array.isArray(data.value) ? data.value : [];
    return items.slice(0, 5).map((event) => ({
      title: event.subject || 'Untitled',
      time: formatEventTime(event.start?.dateTime) || 'Scheduled',
    }));
  }

  return mockCalendarEvents;
}

export async function fetchWeather(config = {}) {
  const provider = config.provider || 'mock';
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

    const response = await fetchWithTimeout(url.toString());
    const data = await response.json();
    return {
      temp: `${Math.round(data.main.temp)}°`,
      conditions: `${data.weather?.[0]?.main || 'Clear'} · ${data.main.humidity}% humidity`,
      wind: `${Math.round(data.wind.speed)} ${units === 'imperial' ? 'mph' : 'm/s'}`,
      aqi: data.main.pressure ? String(Math.round(data.main.pressure / 10)) : '—',
      uv: data.sys?.country || '—',
    };
  }

  return mockWeather;
}

export async function fetchServerStatus(config = {}) {
  if (Array.isArray(config.endpoints) && config.endpoints.length > 0) {
    const responses = await Promise.all(
      config.endpoints.map((endpoint) => fetchWithTimeout(endpoint).then((res) => res.json())),
    );
    const services = responses.map((item, index) => ({
      name: item.name || `Service ${index + 1}`,
      status: item.status || 'Stable',
    }));
    const uptime = responses[0]?.uptime || '99.9%';
    const incidents = responses[0]?.incidents || '0 incidents';
    return { uptime, services, incidents };
  }

  return mockServerStatus;
}

export async function fetchGithubProjects(config = {}) {
  if (Array.isArray(config.repositories) && config.repositories.length > 0) {
    const headers = config.token ? { Authorization: `Bearer ${config.token}` } : undefined;
    const results = await Promise.all(
      config.repositories.slice(0, 4).map(async (repo) => {
        const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/actions/runs?per_page=1`;
        const response = await fetchWithTimeout(url, { headers });
        const data = await response.json();
        const run = data.workflow_runs?.[0];
        return {
          name: `${repo.owner}/${repo.repo}`,
          status: run?.conclusion ? run.conclusion.replace('_', ' ') : 'Queued',
        };
      }),
    );
    return {
      summary: `${config.repositories.length} pipelines`,
      items: results,
      lastSync: `Last sync ${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    };
  }

  return mockGithubPipelines;
}

export function getMockTelemetry() {
  const uptime = 99.9 + Math.random() * 0.09;
  const latency = 180 + Math.round(Math.random() * 80);
  const alerts = Math.random() > 0.7 ? 2 : 0;
  return {
    type: 'telemetry',
    metrics: {
      availability: `${uptime.toFixed(2)}%`,
      latency: `${latency}ms`,
      alerts: `${alerts} open`,
    },
    server: {
      uptime: `${uptime.toFixed(2)}%`,
      incidents: alerts ? '1 incident' : '0 incidents',
      services: [
        { name: 'Core API', status: uptime > 99.95 ? 'Stable' : 'Degraded' },
        { name: 'Edge Mesh', status: latency > 230 ? 'Recovering' : 'Stable' },
        { name: 'Data Lake', status: 'Syncing' },
      ],
    },
  };
}
