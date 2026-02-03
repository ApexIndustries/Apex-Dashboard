import { Widget } from '../app.js';
import { fetchGithubProjects } from '../dataSources.js';

export default class GithubProjectsWidget extends Widget {
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
    const action = document.createElement('button');
    action.className = 'pill ghost';
    action.textContent = 'Open pipelines';
    this.meta = document.createElement('span');
    this.meta.className = 'label';
    this.meta.textContent = 'Awaiting sync';
    footer.append(action, this.meta);

    wrapper.append(this.stat, this.list, footer);
    this.updateData();
    const refreshMs = this.dashboard.config.dataSources?.github?.refreshMs || 60000;
    this.interval = window.setInterval(() => this.updateData(), refreshMs);
    return wrapper;
  }

  async updateData() {
    const config = this.dashboard.config.dataSources?.github || {};
    try {
      const payload = await fetchGithubProjects(config);
      this.renderProjects(payload);
    } catch (error) {
      const payload = await fetchGithubProjects({});
      this.renderProjects(payload);
    }
  }

  renderProjects(payload) {
    this.stat.textContent = payload.summary;
    this.meta.textContent = payload.lastSync;
    this.list.innerHTML = '';
    payload.items.forEach((repo) => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = repo.name;
      const badge = document.createElement('span');
      badge.className = 'widget-badge';
      badge.textContent = repo.status;
      li.append(label, badge);
      this.list.appendChild(li);
    });
  }
}
