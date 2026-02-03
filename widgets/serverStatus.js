import { Widget } from '../app.js';
import { fetchServerStatus } from '../dataSources.js';

export default class ServerStatusWidget extends Widget {
  renderContent() {
    const wrapper = document.createElement('div');
    wrapper.className = 'widget-content';

    this.stat = document.createElement('div');
    this.stat.className = 'widget-stat';
    this.stat.textContent = '—';

    this.list = document.createElement('ul');
    this.list.className = 'widget-list';

    const footer = document.createElement('div');
    footer.className = 'widget-footer';
    const uptime = document.createElement('span');
    uptime.className = 'label';
    uptime.textContent = 'Uptime last 24h';
    this.incidents = document.createElement('span');
    this.incidents.className = 'widget-badge';
    this.incidents.textContent = '—';
    footer.append(uptime, this.incidents);

    wrapper.append(this.stat, this.list, footer);
    this.updateData();
    const refreshMs = this.dashboard.config.dataSources?.serverStatus?.refreshMs || 15000;
    this.interval = window.setInterval(() => this.updateData(), refreshMs);
    if (this.dashboard.telemetry) {
      this.unsubscribe = this.dashboard.telemetry.subscribe((payload) => {
        if (payload.type === 'telemetry' && payload.server) {
          this.renderStatus(payload.server);
        }
      });
    }
    return wrapper;
  }

  async updateData() {
    const config = this.dashboard.config.dataSources?.serverStatus || {};
    try {
      const payload = await fetchServerStatus(config);
      this.renderStatus(payload);
    } catch (error) {
      const payload = await fetchServerStatus({});
      this.renderStatus(payload);
    }
  }

  renderStatus(payload) {
    this.stat.textContent = payload.uptime;
    this.incidents.textContent = payload.incidents;
    this.list.innerHTML = '';
    payload.services.forEach((service) => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = service.name;
      const badge = document.createElement('span');
      badge.className = 'widget-badge';
      badge.textContent = service.status;
      li.append(label, badge);
      this.list.appendChild(li);
    });
  }
}
