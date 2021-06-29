import * as seedrandom from 'seedrandom';

const COLORS = [
  '#e6e6e4', // default
  '#d7d7d5', // gray
  '#e6d6cf', // brown
  '#fadfd1', // orange
  '#faedd3', // yellow
  '#d5e6e1', // green
  '#d6e4f7', // blue
  '#dfcff5', // purple
  '#f2d0e5', // pink
  '#f9cfd3', // red
];

const cached: {
  [tag: string]: string;
} = {};

export const getTagColor = (tag: string) => {
  if (!cached[tag]) {
    const index = Math.floor(seedrandom(tag).quick() * COLORS.length);
    cached[tag] = COLORS[index];
  }
  return cached[tag];
};
