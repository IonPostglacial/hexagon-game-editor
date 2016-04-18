define(require => { "use strict";

const R = React.DOM;

const SelectButton = React.createClass({displayName: 'SelectButton',
  render () {
    return (
      R.label({className: "btn"},
        R.input({name: 'tile-type', type: 'radio', value: this.props.value, defaultChecked: this.props.def ? 'checked' : ''}),
        R.span({},
          R.i({className: 'fa fa-fw fa-' + this.props.symbol}),
          this.props.name
        )
      )
    );
  }
});

return React.createClass({displayName: 'HorizontalSelectBox',
  getInitialState () {
    return { selectedValue: this.props.data.findIndex(tile => tile.def) }
  },
  handleButtonClick (e) {
    const newSelectedValue = parseInt(e.target.value);
    this.setState({ selectedValue: newSelectedValue });
    if (this.props.onChange) {
      this.props.onChange({ value: newSelectedValue });
    }
  },
  render () {
    return (
      R.form({className: "centered tool-box"},
        R.fieldset({onChange: this.handleButtonClick},
          this.props.data.map((tile, val) => React.createElement(SelectButton, Object.assign(tile, {
            key: tile.symbol,
            value: val
          })))
        )
      )
    );
  }
});
});
