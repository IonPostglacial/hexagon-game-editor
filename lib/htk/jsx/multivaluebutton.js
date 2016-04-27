import React from 'react';

export class ButtonValue extends React.Component {
  render () {
    return (
      <span>
        <i className={'fa fa-fw ' + this.props.icon }></i>
        { this.props.label }
      </span>
    );
  }
};

export class MultiValueButton extends React.Component {
  constructor (props) {
    super (props);
    this.state = { selectedValue: 0 };
  }
  handleButtonClick (e) {
    const newSelectedValue = parseInt(e.target.value);
    this.setState({ selectedValue: newSelectedValue });
    if (this.props.onChange) {
      this.props.onChange({ value: newSelectedValue });
    }
  }
  render () {
    return (
      <div className="centered tool-box">
        <div className="btn-group" onChange={ this.handleButtonClick.bind(this) }>
          { React.Children.map(this.props.children, (child, i) =>
            <label className="btn">
              <input name="tile-type" type="radio" value={ i } defaultChecked={ child.props.def ? 'checked' : '' } />
              { child }
            </label>
          )}
        </div>
      </div>
    );
  }
}
