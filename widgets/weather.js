import { Widget } from '../app.js';
import { fetchWeather } from '../dataSources.js';

export default class WeatherWidget extends Widget {
  constructor(config, dashboard) {
    super(config, dashboard);
    this.interval = null;
  }

  renderContent() {
    const wrapper = document.createElement('div');
    wrapper.className = 'widget-content';

    this.tempEl = document.createElement('div');
    this.tempEl.className = 'widget-stat';

    this.conditionsEl = document.createElement('p');
    this.conditionsEl.className = 'muted';

    const grid = document.createElement('div');
    grid.className = 'weather-grid';

    this.windEl = document.createElement('div');
    this.windEl.innerHTML = '<p class="label">Wind</p><strong></strong>';
    this.aqiEl = document.createElement('div');
    this.aqiEl.innerHTML = '<p class="label">AQI</p><strong></strong>';
    this.uvEl = document.createElement('div');
    this.uvEl.innerHTML = '<p class="label">UV</p><strong></strong>';

    grid.append(this.windEl, this.aqiEl, this.uvEl);
    wrapper.append(this.tempEl, this.conditionsEl, grid);

    this.updateData();
    const refreshMs = this.dashboard.config.dataSources?.weather?.refreshMs || 60000;
    this.interval = window.setInterval(() => this.updateData(), refreshMs);
    return wrapper;
  }

  async updateData() {
    const config = this.dashboard.config.dataSources?.weather || {};
    try {
      const payload = await fetchWeather(config);
      const { temp, conditions, wind, aqi, uv } = payload;
      this.tempEl.textContent = temp;
      this.conditionsEl.textContent = conditions;
      this.windEl.querySelector('strong').textContent = wind;
      this.aqiEl.querySelector('strong').textContent = aqi;
      this.uvEl.querySelector('strong').textContent = uv;
    } catch (error) {
      this.tempEl.textContent = '—';
      this.conditionsEl.textContent = 'Weather feed unavailable';
      this.windEl.querySelector('strong').textContent = '—';
      this.aqiEl.querySelector('strong').textContent = '—';
      this.uvEl.querySelector('strong').textContent = '—';
    }
  }
}
