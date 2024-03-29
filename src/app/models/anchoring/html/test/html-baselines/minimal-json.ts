export default {
  total: 1,
  rows: [{
    id: 'test',
    target: [{
      selector: [{
        type: 'RangeSelector',
        startContainer: '/div[1]',
        endContainer: '/div[1]',
        startOffset: 4,
        endOffset: 7
      }, {
        type: 'TextPositionSelector',
        start: 4,
        end: 7
      }, {
        type: 'TextQuoteSelector',
        prefix: 'One ',
        suffix: ' Three\n',
        exact: 'Two'
      }]
    }]
  }]
};
