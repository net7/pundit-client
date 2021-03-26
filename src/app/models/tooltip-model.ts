import { createPopper } from '@popperjs/core';
import { Subject } from 'rxjs';
import { selectionFocusRect, isSelectionBackwards } from './range-util';

class TooltipModel {
  public changed$: Subject<any> = new Subject();

  private instance;

  private tooltipWrapper: HTMLElement;

  /** Vertical padding for the tooltip (y axis) */
  private padding = 5;

  private x = 0;

  private y = 0;

  /** Virtual target where the tooltip is bounded */
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

  /**
   * Make the tooltip visible
   * (while some text is selected)
   */
  show(selection: Selection) {
    if (this.hasRectPosition(selection)) {
      if (!this.instance) {
        this.load();
      }
      this.updateTargetPosition(selection);
      this.updateTooltipPlacement(selection);
      this.tooltipWrapper.setAttribute('data-show', '');

      // emit signal
      this.changed$.next();
    }
  }

  /**
   * Make the tooltip invisible
   * (while no text is selected)
   */
  hide() {
    if (!this.tooltipWrapper) {
      return;
    }
    this.tooltipWrapper.removeAttribute('data-show');

    // emit signal
    this.changed$.next();
  }

  isOpen = () => this.tooltipWrapper && this.tooltipWrapper.getAttribute('data-show') !== null;

  /**
   * Loads the tooltip instance when pundit HTML is loaded
   */
  private load() {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    this.tooltipWrapper = shadowRoot.getElementById('pnd-tooltip');

    this.instance = createPopper(this.virtualTarget, this.tooltipWrapper, {
      placement: 'top',
      modifiers: [
        { name: 'eventListeners', options: { scroll: false, } }
      ]
    });
  }

  /**
   * Check if the tooltip should be on the top or bottom
   * side of the highlighted text.
   */
  private updateTooltipPlacement(selection: Selection) {
    const isBackwards = isSelectionBackwards(selection);
    this.instance.setOptions({
      placement: isBackwards ? 'top' : 'bottom'
    });
    this.instance.update();
  }

  /**
   * Check if selection position can be retrieved.
   */
  private hasRectPosition = (selection: Selection) => !!selectionFocusRect(selection);

  /**
   * Update the coordinates of the tooltip after a new text selection
   */
  private updateTargetPosition(selection: Selection) {
    const isBackwards = isSelectionBackwards(selection);
    const {
      x, y, width, height
    } = selectionFocusRect(selection);
    this.x = x + width / 2; this.y = y;
    this.x = isBackwards ? x : x + width;
    this.y = isBackwards ? y - this.padding : y + height + this.padding;
  }
}

export const tooltipModel: TooltipModel = new TooltipModel();
