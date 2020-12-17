import { createPopper } from '@popperjs/core';
import { selectionFocusRect, isSelectionBackwards } from './range-util';

class TooltipHandler {
  private instance;

  private tooltipWrapper: HTMLElement;

  private x = 0;

  private y = 0;

  private virtualTarget = {
    getBoundingClientRect: () => ({
      width: 0,
      height: 0,
      top: this.y,
      right: this.x,
      bottom: this.y,
      left: this.x,
    }),
  };

  show(selection: Selection) {
    if (!this.instance) {
      this.load();
    }
    this.updateTargetPosition(selection);
    this.updateTooltipPlacement(selection);
    this.tooltipWrapper.setAttribute('data-show', '');
  }

  hide() {
    if (!this.tooltipWrapper) {
      return;
    }
    this.tooltipWrapper.removeAttribute('data-show');
  }

  private load() {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    this.tooltipWrapper = shadowRoot.getElementById('pnd-tooltip');

    this.instance = createPopper(this.virtualTarget, this.tooltipWrapper);
  }

  private updateTooltipPlacement(selection: Selection) {
    const isBackwards = isSelectionBackwards(selection);
    this.instance.setOptions({
      placement: isBackwards ? 'top' : 'bottom'
    });
    this.instance.update();
  }

  private updateTargetPosition(selection: Selection) {
    const isBackwards = isSelectionBackwards(selection);
    const { x, y, width } = selectionFocusRect(selection);
    this.x = isBackwards ? x : x + width;
    this.y = y;
  }
}

const tooltipHandler = new TooltipHandler();
export default tooltipHandler;
