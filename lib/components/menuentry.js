define(require => { "use strict";
const R = React.DOM;

return React.createClass({displayName: 'MenuEntry',
  render () {
    return (
      R.li(null,
        R.a({className: 'menu-entry', key: this.props.label, onClick: this.props.onClick}, this.props.label)
      )
    );
  }
});
});
