import {
  LitElement, html, customElement, property, css
} from 'lit-element';

@customElement('pundit-client')
export class PunditClient extends LitElement {
  static styles = css``;

  @property()
  value = '';

  render():any {
    return html`
      <div id="root">
        <h3 @click="${this.onClick}">Hello World</h3>
        <p id="root__value">${this.value || 'Nothing selected...'}</p>
        <slot></slot>
      </div>
    `;
  }

  private onClick() {
    // eslint-disable-next-line no-console
    console.log('clicked!');
  }

  private onSelectionChange() {
    this.value = window.document.getSelection()?.toString() || '';
  }

  connectedCallback():void {
    super.connectedCallback();

    window.document.addEventListener('selectionchange', this.onSelectionChange.bind(this));
  }

  disconnectedCallback():void {
    super.disconnectedCallback();

    window.document.removeEventListener('selectionchange', this.onSelectionChange.bind(this));
  }
}
