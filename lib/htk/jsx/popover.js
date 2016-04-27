import React from 'react';

export default class Popover extends React.Component {
  render () {
    return (
      <label className="popover btn">
        <input type="checkbox" />
        <span>
          <i className="fa fa-pull-right fa-caret-down"></i>{ this.props.label }
        </span>
        <div className="popover-panel">
          <ul>
            { this.props.children }
          </ul>
        </div>
      </label>
    );
  }
}
