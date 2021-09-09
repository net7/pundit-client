// clone of tagify dropdown hide method
// to fix shadowroot check
// <tagify>/src/parts/dropdown.js:hide( force )
export function customDropdownHide(force = false): any {
  const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
  const { scope, dropdown } = this.DOM;
  const isManual = this.settings.dropdown.position === 'manual' && !force;

  // if there's no dropdown, this means the dropdown events aren't binded
  if (!dropdown || !shadowRoot.contains(dropdown) || isManual) {
    return null;
  }

  window.removeEventListener('resize', this.dropdown.position);
  this.dropdown.events.binding.call(this, false); // unbind all events

  scope.setAttribute('aria-expanded', false);
  dropdown.parentNode.removeChild(dropdown);

  setTimeout(() => {
    this.state.dropdown.visible = false;
  }, 100);

  this.state.dropdown.query = null;
  this.state.ddItemData = null;
  this.state.ddItemElm = null;
  this.state.selection = null;

  if (this.state.tag && this.state.tag.value.length) {
    this.state.flaggedTags[this.state.tag.baseOffset] = this.state.tag;
  }

  this.trigger('dropdown:hide', dropdown);

  return this;
}

export function getNodeHeight(node) {
  const clone = node.cloneNode(true);
  clone.style.cssText = 'position:fixed; top:-9999px; opacity:0';
  document.body.appendChild(clone);
  const height = clone.clientHeight;
  clone.parentNode.removeChild(clone);
  return height;
}

// clone of tagify dropdown render method
// to fix shadowroot check
// <tagify>/src/parts/dropdown.js:render()
export function customShadowRootRender() {
  const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
  // let the element render in the DOM first, to accurately measure it.
  // this.DOM.dropdown.style.cssText = "left:-9999px; top:-9999px;";
  const ddHeight = getNodeHeight(this.DOM.dropdown);
  const _s = this.settings;

  this.DOM.scope.setAttribute('aria-expanded', true);

  // if the dropdown has yet to be appended to the DOM,
  // append the dropdown to the body element & handle events
  if (!shadowRoot.contains(this.DOM.dropdown)) {
    this.DOM.dropdown.classList.add(_s.classNames.dropdownInital);
    this.dropdown.position(ddHeight);
    _s.dropdown.appendTarget.appendChild(this.DOM.dropdown);

    setTimeout(() => this.DOM.dropdown.classList.remove(_s.classNames.dropdownInital));
  }
  return this;
}
