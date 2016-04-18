define(require => { "use strict";
const R = React.DOM;

const PushButton = React.createClass({displayName: 'PushButton',
  render () {
    const linkAttributes = {className: 'btn', href: this.props.href || "#1", onClick: this.props.onClick};
    if (this.props.download) {
      linkAttributes.download = this.props.download;
    }
    return (
      R.a(linkAttributes,
        R.i({className: 'fa fa-pull-left fa-fw ' + this.props.icon}),
        this.props.text
      )
    );
  }
});

return PushButton;
});
