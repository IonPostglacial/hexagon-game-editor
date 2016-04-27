"use strict";

const React = require('react');
const ReactDOM = require('react-dom');
const Editor = require('./mapeditor');

window.onload = e => {
  ReactDOM.render(
    React.createElement(Editor, {initialWidth: 24, initialHeight:12, initialRadius: 32}),
    document.getElementById('editor')
  );
};
