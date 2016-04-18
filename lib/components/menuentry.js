define(require => { "use strict";
const R = React.DOM;

return React.createClass({displayName: 'MenuEntry',
  render () {
    const entryIcon = this.props.icon === undefined ? '': 'fa fa-pull-left fa-fw ' + this.props.icon;
    return (
      R.li({},
        R.a({className: 'menu-entry', href: this.props.href || "#1", key: this.props.label, onClick: this.props.onClick}, R.i({className: entryIcon}), this.props.label)
      )
    );
  }
});
});
