import { Widget } from '../app.js';
import { fetchCalendarEvents } from '../dataSources.js';

export default class CalendarWidget extends Widget {
  constructor(config, dashboard) {
    super(config, dashboard);
    this.events = [];
  }

  renderContent() {
    const wrapper = document.createElement('div');
    wrapper.className = 'widget-content';

    this.header = document.createElement('div');
    this.header.className = 'widget-stat';
    this.header.textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    this.list = document.createElement('ul');
    this.list.className = 'widget-list';

    wrapper.append(this.header, this.list);
    this.updateData();
    const refreshMs = this.dashboard.config.dataSources?.calendar?.refreshMs || 300000;
    this.interval = window.setInterval(() => this.updateData(), refreshMs);
    return wrapper;
  }

  async updateData() {
    const config = this.dashboard.config.dataSources?.calendar || {};
    try {
      this.events = await fetchCalendarEvents(config);
    } catch (error) {
      this.events = [];
    }
    this.renderEvents();
  }

  renderEvents() {
    this.list.innerHTML = '';
    if (!this.events.length) {
      const empty = document.createElement('li');
      empty.textContent = 'No upcoming events';
      this.list.appendChild(empty);
      return;
    }
    this.events.forEach((event) => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = `${event.title} ${event.time ? `· ${event.time}` : ''}`.trim();
      const badge = document.createElement('span');
      badge.className = 'widget-badge';
      badge.textContent = 'Confirmed';
      li.append(label, badge);
      this.list.appendChild(li);
    });
  }
}
