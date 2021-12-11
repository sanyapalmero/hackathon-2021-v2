import '../scss/main.scss';
import 'bootstrap';

import { ComponentConstructor, h, render } from 'preact';

function safe(f: () => void) {
  try {
    f();
  } catch (e) {
    console.error(e);
  }
}

function renderPreactComponent(name: string, cls: ComponentConstructor<any>, root?: HTMLElement) {
  function dateReviver(key: string, value: any): any {
    let regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (typeof value == "string" && regex.test(value)) {
      return new Date(value);
    }
    return value
  }

  let elements = (root || document).querySelectorAll(`[data-render="${name}"]`);
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    element.innerHTML = "";
    let props = JSON.parse(element.getAttribute('data-props') || '{}', dateReviver);
    render(h(cls, props), element);
  }
}

safe(() => {
  const { default: HackaphoneSpa } = require("./HackaphoneSpa");
  renderPreactComponent("HackaphoneSpa", HackaphoneSpa);
});
