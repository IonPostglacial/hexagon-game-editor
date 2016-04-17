define(require => { "use strict";
const R = React.DOM;

return React.createClass({displayName: 'Tab',
  render () {
    const entryIcon = this.props.icon === undefined ? '': 'fa fa-fw ' + this.props.icon;
    return (
      R.li({onClick: e => { e.currentTarget.getElementsByTagName('input')[0].click();}},
        R.input({name: 'dummy-tabx', type: 'radio', defaultChecked: this.props.checked ? "checked" : ""}),
        R.label({htmlFor: this.props.id}, R.i({className: entryIcon}), this.props.label)
      )
    );
  }
});
});
