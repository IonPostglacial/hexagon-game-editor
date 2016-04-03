define(require => { "use strict";
const R = React.DOM;

return React.createClass({displayName: 'MenuEntry',
  render () {
    const entryIcon = this.props.icon === undefined ? '': 'fa fa-pull-left fa-fw ' + this.props.icon;
    return (
      R.li(null,
        R.a({className: 'menu-entry', key: this.props.label, onClick: this.props.onClick}, R.i({className: entryIcon}), this.props.label)
      )
    );
  }
});
});
