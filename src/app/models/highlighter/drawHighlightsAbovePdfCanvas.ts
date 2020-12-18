import { _c } from '../config';
import { getPdfCanvas } from './getPdfCanvas';
import { isCSSPropertySupported } from './isCSSPropertySupported';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * Draw highlights in an SVG layer overlaid on top of a PDF.js canvas.
 *
 * Returns `null` if `highlightEl` is not above a PDF.js page canvas.
 *
 * @param {HTMLElement} highlightEl -
 *   An element that wraps the highlighted text in the transparent text layer
 *   above the PDF.
 * @return {SVGElement|null} -
 *   The SVG graphic element that corresponds to the highlight or `null` if
 *   no PDF page was found below the highlight.
 */
export function drawHighlightsAbovePdfCanvas(highlightEl: HTMLElement): SVGRectElement {
  const canvasEl = getPdfCanvas(highlightEl);
  if (!canvasEl || !canvasEl.parentElement) {
    return null;
  }

  /** @type {SVGElement|null} */
  let svgHighlightLayer: SVGSVGElement | null = canvasEl.parentElement.querySelector(
    `.${_c('highlightTag')}-layer`
  );

  const isCssBlendSupported = isCSSPropertySupported(
    'mix-blend-mode',
    'multiply'
  );

  if (!svgHighlightLayer) {
    // Create SVG layer. This must be in the same stacking context as
    // the canvas so that CSS `mix-blend-mode` can be used to control how SVG
    // content blends with the canvas below.
    svgHighlightLayer = document.createElementNS(SVG_NAMESPACE, 'svg');
    svgHighlightLayer.setAttribute('class', `${_c('highlightTag')}-layer`);
    canvasEl.parentElement.appendChild(svgHighlightLayer);

    // Overlay SVG layer above canvas.
    canvasEl.parentElement.style.position = 'relative';

    const svgStyle = svgHighlightLayer.style;
    svgStyle.position = 'absolute';
    svgStyle.left = '0';
    svgStyle.top = '0';
    svgStyle.width = '100%';
    svgStyle.height = '100%';

    if (isCssBlendSupported) {
      // Use multiply blending so that highlights drawn on top of text darken it
      // rather than making it lighter. This improves contrast and thus readability
      // of highlighted text, especially for overlapping highlights.
      //
      // This choice optimizes for the common case of dark text on a light background.
      //
      (svgStyle as any).mixBlendMode = 'multiply';
    } else {
      // For older browsers (eg. Edge < 79) we draw all the highlights as
      // opaque and then make the entire highlight layer transparent. This means
      // that there is no visual indication of whether text has one or multiple
      // highlights, but it preserves readability.
      svgStyle.opacity = '0.3';
    }
  }

  const canvasRect = canvasEl.getBoundingClientRect();
  const highlightRect = highlightEl.getBoundingClientRect();

  // Create SVG element for the current highlight element.
  const rect = document.createElementNS(SVG_NAMESPACE, 'rect');
  rect.setAttribute('x', (highlightRect.left - canvasRect.left).toString());
  rect.setAttribute('y', (highlightRect.top - canvasRect.top).toString());
  rect.setAttribute('width', highlightRect.width.toString());
  rect.setAttribute('height', highlightRect.height.toString());

  if (isCssBlendSupported) {
    rect.setAttribute('class', 'hypothesis-svg-highlight');
  } else {
    rect.setAttribute('class', 'hypothesis-svg-highlight is-opaque');
  }

  svgHighlightLayer.appendChild(rect);

  return rect;
}
