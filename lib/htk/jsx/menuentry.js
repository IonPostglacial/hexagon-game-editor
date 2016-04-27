import React from 'react';

export default class MenuEntry extends React.Component {
  render () {
    const entryIcon = this.props.icon === undefined ? '': 'fa fa-pull-left fa-fw ' + this.props.icon;
    return (
      <li>
        <a className="menu-entry" href={ this.props.href || "#1" } key={ this.props.label } onClick={ this.props.onClick }>
          <i className={ entryIcon }></i>{ this.props.label }
        </a>
      </li>
    );
  }
}
