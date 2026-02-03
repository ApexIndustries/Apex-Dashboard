import { Widget } from '../app.js';

export default class ServerStatusWidget extends Widget {
  renderContent() {
    const wrapper = document.createElement('div');
    wrapper.className = 'widget-content';

    const stat = document.createElement('div');
    stat.className = 'widget-stat';
    stat.textContent = '99.98%';

    const list = document.createElement('ul');
    list.className = 'widget-list';
    [
      { name: 'Core API', status: 'Stable' },
      { name: 'Edge Mesh', status: 'Stable' },
      { name: 'Data Lake', status: 'Syncing' },
    ].forEach((service) => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = service.name;
      const badge = document.createElement('span');
      badge.className = 'widget-badge';
      badge.textContent = service.status;
      li.append(label, badge);
      list.appendChild(li);
    });

    const footer = document.createElement('div');
    footer.className = 'widget-footer';
    const uptime = document.createElement('span');
    uptime.className = 'label';
    uptime.textContent = 'Uptime last 24h';
    const incidents = document.createElement('span');
    incidents.className = 'widget-badge';
    incidents.textContent = '0 incidents';
    footer.append(uptime, incidents);

    wrapper.append(stat, list, footer);
    return wrapper;
  }
}
