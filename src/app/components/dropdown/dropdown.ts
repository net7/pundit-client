import {
  LitElement,
  customElement,
  property,
  css,
  TemplateResult
} from 'lit-element';
import tpl from './dropdown.html';
import mock from './dropdown.mock';

type PunditDropdownData = {
  items: {
    label: string;
    payload: any;
  }[]
};

@customElement('pundit-dropdown')
export class PunditDropdown extends LitElement {
  static styles = css``;

  @property({ type: Object })
  data: PunditDropdownData | null = mock;

  render(): TemplateResult {
    return tpl(this);
  }

  onClick(payload: number): void {
    console.log('payload----->', payload);
  }

  createRenderRoot(): PunditDropdown {
    return this;
  }

  connectedCallback():void {
    super.connectedCallback();
    // TODO
  }

  disconnectedCallback():void {
    super.disconnectedCallback();
    // TODO
  }
}
