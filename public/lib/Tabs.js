import { $ } from './$.js';
import Hooks from '../lib/Hooks.js';

export class Tab {
  constructor(parent, root) {
    this.root = root;
    this.id = root.id;
  }

  hide() {
    this.root.style.display = 'none';
  }

  show() {
    this.root.setAttribute('style', '');
  }
}

export default class Tabs extends Hooks {
  constructor(selector) {
    super();
    this.root = document.querySelector(selector);

    const panels = $(selector + ' > section:not([hidden])');
    this.panels = panels.map((el) => new Tab(this, el));
    const ids = panels.map((_) => _.id);

    const tabNav = document.querySelector(selector + ' > .tabs ul');
    panels.map((panel) => {
      const a = document.createElement('a');
      a.href = '#' + panel.id;

      a.innerText = panel.dataset.title;
      const li = document.createElement('li');
      li.appendChild(a);
      tabNav.appendChild(li);
    });

    this.tabs = $(selector + ' > .tabs a');

    this.tabs.on('click', (e) => {
      e.preventDefault();
      this.show(e.target.hash.substring(1));
      window.history.pushState(null, '', e.target.hash);
    });

    this.show(window.location.hash.substring(1) || this.panels[0].id);

    window.addEventListener('hashchange', () => {
      const id = window.location.hash.substring(1);
      if (!ids.includes(id)) return; // ignore this
      this.show(id);
    });
  }

  show(id) {
    this.hide();
    this.panels.find((_) => _.id === id).show();
    this.tabs.find((_) => _.hash === '#' + id).className = 'selected';
    this.selected = id;
    this.trigger(id);
  }

  hide() {
    this.tabs.className = '';
    this.panels.forEach((_) => _.hide());
  }
}
