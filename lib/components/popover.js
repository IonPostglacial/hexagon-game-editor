define(require => { "use strict";
const R = React.DOM;

return React.createClass({displayName: 'Popover',
  render () {
    return (
      R.label({className: 'popover btn'},
        R.input({type: 'checkbox'}),
        R.span({},
          R.i({className: 'fa fa-pull-right fa-caret-down'}), this.props.label
        ),
        R.div({className: 'popover-panel'},
          R.ul({},
            this.props.children
          )
        )
      )
    );
  }
});
});
