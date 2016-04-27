import React from 'react';

export default class PushButton extends React.Component {
  render () {
    const linkAttributes = {className: 'btn', href: this.props.href || "#1", onClick: this.props.onClick};
    if (this.props.download) {
      linkAttributes.download = this.props.download;
    }
    return (
      <a {...linkAttributes}><i className={ 'fa fa-pull-left fa-fw ' + this.props.icon}></i>{ this.props.label }</a>
    );
  }
}
