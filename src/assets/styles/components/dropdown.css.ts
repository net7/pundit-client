import { css } from 'lit-element';

export default css`
  ul.pundit-dropdown {
    list-style: none;
    padding: 0;
  }

  ul.pundit-dropdown li {
    background: lightgray;
    padding: 10px;
    border-bottom: 1px solid white;
  }

  ul.pundit-dropdown li:hover {
    background: white;
    cursor: pointer;
  }
`;
