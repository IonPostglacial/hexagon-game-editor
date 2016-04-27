import React from 'react';

export class Coord extends React.Component {
  render () {
    return <tr><th>{ this.props.label }</th><td>{ this.props.value }</td></tr>;
  }
}

export class CoordBox extends React.Component {
  render () {
    return (
      <table className="tool numerical gauge">
        <caption>{ this.props.caption }</caption>
        <tbody>
          { this.props.children }
        </tbody>
      </table>
    );
  }
}
