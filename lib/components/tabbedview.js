define(require => { "use strict";
const R = React.DOM;

return React.createClass({displayName: 'TabbedView',
  render () {
    return (
      R.div({className: 'tabbed-view'},
        R.ul({className: 'tabs'}, this.props.children),
        R.ul({className: 'tabs-contents'}, React.Children.map(this.props.children, child =>
          R.li({},
            R.input({type: 'radio', id: child.props.id, name: "tabs", defaultChecked: child.props.checked}),
            R.div({className: 'tab-content'},
              child.props.children
            )
          )
        ))
      )
    );
  }
});
});
