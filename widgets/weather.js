import { Widget } from '../app.js';

const weatherStates = [
  {
    temp: '72°',
    conditions: 'Clear · 12% humidity',
    wind: '6 mph',
    aqi: '42',
    uv: 'Low',
  },
  {
    temp: '68°',
    conditions: 'Marine layer · 20% humidity',
    wind: '9 mph',
    aqi: '39',
    uv: 'Moderate',
  },
  {
    temp: '74°',
    conditions: 'Sunset glow · 15% humidity',
    wind: '4 mph',
    aqi: '45',
    uv: 'Low',
  },
];

export default class WeatherWidget extends Widget {
  constructor(config, dashboard) {
    super(config, dashboard);
    this.stateIndex = 0;
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
    this.interval = window.setInterval(() => this.updateData(), 6000);
    return wrapper;
  }

  updateData() {
    const { temp, conditions, wind, aqi, uv } = weatherStates[this.stateIndex];
    this.tempEl.textContent = temp;
    this.conditionsEl.textContent = conditions;
    this.windEl.querySelector('strong').textContent = wind;
    this.aqiEl.querySelector('strong').textContent = aqi;
    this.uvEl.querySelector('strong').textContent = uv;
    this.stateIndex = (this.stateIndex + 1) % weatherStates.length;
  }
}
