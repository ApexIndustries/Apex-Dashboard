import { Widget } from '../app.js';

export default class CalendarWidget extends Widget {
  renderContent() {
    const wrapper = document.createElement('div');
    wrapper.className = 'widget-content';

    const date = new Date();
    const header = document.createElement('div');
    header.className = 'widget-stat';
    header.textContent = date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const list = document.createElement('ul');
    list.className = 'widget-list';
    ['Ops sync 09:30', 'Security briefing 12:00', 'Release checkpoint 15:45'].forEach(
      (item) => {
        const li = document.createElement('li');
        li.textContent = item;
        const badge = document.createElement('span');
        badge.className = 'widget-badge';
        badge.textContent = 'Confirmed';
        li.appendChild(badge);
        list.appendChild(li);
      },
    );

    wrapper.append(header, list);
    return wrapper;
  }
}
