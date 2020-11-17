const labels = [
  'Use as subject',
  'Use as object',
  'Comment',
  'Highlight',
  'Add to favorites'
];

export default {
  items: labels.map((label, index) => ({
    label,
    payload: index
  }))
};
