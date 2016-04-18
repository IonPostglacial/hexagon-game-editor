define(require => { "use strict";

const R = React.DOM;

return React.createClass({displayName: 'CoordBox',
  render () {
    return (
      R.table({className: "tool numerical gauge"},
        R.caption({}, this.props.caption),
        R.tbody({}, R.tr({}, Object.keys(this.props.data).map(
          key => [R.th({}, key), R.td({}, this.props.data[key])]
        )))
      )
    );
  }
});
});
