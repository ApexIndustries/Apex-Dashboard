import { Widget } from '../app.js';

export default class GithubProjectsWidget extends Widget {
  renderContent() {
    const wrapper = document.createElement('div');
    wrapper.className = 'widget-content';

    const stat = document.createElement('div');
    stat.className = 'widget-stat';
    stat.textContent = '5 pipelines';

    const list = document.createElement('ul');
    list.className = 'widget-list';
    [
      { name: 'apex-core', status: 'Passing' },
      { name: 'sentinel-ui', status: 'Deploying' },
      { name: 'pulse-api', status: 'Queued' },
      { name: 'nebula-mobile', status: 'Passing' },
    ].forEach((repo) => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = repo.name;
      const badge = document.createElement('span');
      badge.className = 'widget-badge';
      badge.textContent = repo.status;
      li.append(label, badge);
      list.appendChild(li);
    });

    const footer = document.createElement('div');
    footer.className = 'widget-footer';
    const action = document.createElement('button');
    action.className = 'pill ghost';
    action.textContent = 'Open pipelines';
    const meta = document.createElement('span');
    meta.className = 'label';
    meta.textContent = 'Last sync 2m ago';
    footer.append(action, meta);

    wrapper.append(stat, list, footer);
    return wrapper;
  }
}
