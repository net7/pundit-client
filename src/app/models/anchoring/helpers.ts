export default {
  parents(node: HTMLElement) {
    const parents = [];
    let selectedNode = node;
    while (selectedNode.parentElement) {
      parents.push(selectedNode.parentElement);
      selectedNode = selectedNode.parentElement;
    }
    return parents;
  }
};
