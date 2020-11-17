import { html, TemplateResult } from 'lit-element';
import { PunditDropdown } from './dropdown';

export default (component: PunditDropdown): TemplateResult => html`
${component.data !== null
    ? html`
    <ul class="pundit-dropdown">
      ${component.data.items.map((item) => html`
        <li @click="${() => component.onClick(item.payload)}">${item.label}</li>
      `)}
    </ul>
  ` : null
}
`;
