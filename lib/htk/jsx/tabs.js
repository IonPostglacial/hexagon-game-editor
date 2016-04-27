import React from 'react';

export default class Tabs extends React.Component {
  render () {
    return (
      <div className="tabbed-view">
        <ul className="tabs">{ this.props.children }</ul>
        <ul className="tabs-contents">
        {
          React.Children.map(this.props.children, child =>
            <li>
              <input type="radio" id={ child.props.id } name="tabs" defaultChecked={ child.props.checked } />
              <div className="tab-content">
                 { child.props.children }
              </div>
            </li>
          )
        }
        </ul>
      </div>
    );
  }
}
