import tippy from 'tippy.js';
import { selectionFocusRect, isSelectionBackwards } from './range-util';

class Tooltip {
  private instance;

  private fakeTarget: HTMLElement;

  show(selection: Selection) {
    if (!this.instance) {
      this.load();
    }
    this.setPosition(selection);
    this.instance.show();
  }

  private load() {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    // set fake target
    this.fakeTarget = document.createElement('div');
    this.fakeTarget.style.visibility = 'hidden';
    document.body.appendChild(this.fakeTarget);
    // update tooltip wrapper
    const tooltipWrapper = shadowRoot.getElementById('pnd-tooltip');
    tooltipWrapper.setAttribute('style', 'display: block');

    this.instance = tippy(this.fakeTarget, {
      content: tooltipWrapper,
      trigger: 'manual',
      interactive: true,
      theme: 'light-border pnd-tippy',
      appendTo: 'parent'
    });
  }

  private setPosition(selection: Selection) {
    const {
      height, width, left, right, top
    } = selectionFocusRect(selection);
    const isBackwards = isSelectionBackwards(selection);
    this.instance.setProps({
      placement: isBackwards ? 'top' : 'bottom'
    });
    this.fakeTarget.style.position = 'absolute';
    this.fakeTarget.style.height = `${height}px`;
    this.fakeTarget.style.width = `${width}px`;
    this.fakeTarget.style.left = `${left}px`;
    this.fakeTarget.style.right = `${right}px`;
    this.fakeTarget.style.top = `${top}px`;
  }
}

const tooltip = new Tooltip();
export default tooltip;
