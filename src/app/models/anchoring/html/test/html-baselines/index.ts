/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-webpack-loader-syntax */
import jsonMinimal from './minimal-json';
// import jsonWikipedia from './wikipedia-regression-testing-json';

const htmlMinimal = require('html-loader!./minimal.html');
// const htmlWikipedia = require('html-loader!./wikipedia-regression-testing.html');

// Fixtures for anchoring baseline tests. The goals of these tests are to:
//
// 1) Check for unexpected changes in the selectors captured when describing
//    a Range in a web page.
// 2) Test anchoring in larger and more complex pages than the basic anchoring
//    unit tests.
//
// Each fixture consists of:
//
//  - An HTML file for a web page
//  - A set of annotations in the JSON format returned by the Hypothesis API
//
// To add a new fixture:
//
//  1. Open up a web page in the browser and annotate it.
//  2. Save the web page (HTML only) via File -> Save Page As... as
//     `<fixture name>.html` in this directory.
//     It is important to save the page exactly as it was when annotated, since
//     many pages have at least some dynamic content.
//  3. Fetch the annotations for the web page via the Hypothesis API and save
//     them as `<fixture name>.json` in this directory
//  4. Add an entry to the fixture list below.

export default [
  {
    name: 'Minimal Document',
    html: htmlMinimal,
    annotations: jsonMinimal,
  },
  // {
  //   name: 'Wikipedia - Regression Testing',
  //   html: htmlWikipedia,
  //   annotations: jsonWikipedia,
  // },
];
