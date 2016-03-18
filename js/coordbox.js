define(function () {
"use strict";
const R = React.DOM;

return React.createClass({displayName: 'CoordBox',
  render () {
    return (
      R.table({className: "tool numerical gauge"},
        R.caption(null, this.props.caption),
        R.tbody(null, R.tr(null, Object.keys(this.props.data).map(
          key => [R.th(null, key), R.td(null, this.props.data[key])]
        )))
      )
    );
  }
});
});
