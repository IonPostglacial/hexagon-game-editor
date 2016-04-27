import React from 'react';

export default class Tab extends React.Component {
  render () {
    const entryIcon = this.props.icon === undefined ? '': 'fa fa-fw ' + this.props.icon;
    return (
      <li onClick={ e => { e.currentTarget.getElementsByTagName('input')[0].click();}} >
        <input name="dummy-tabx" type="radio"  defaultChecked={ this.props.checked ? "checked" : "" } />
        <label htmlFor={ this.props.id }><i className={ entryIcon }></i>{ this.props.label }</label>
      </li>
    );
  }
}
