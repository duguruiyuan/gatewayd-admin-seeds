"use strict";

var React = require('react');

// React Router
var RouteHandler = require('react-router').RouteHandler;
var Navigation = require('react-router').Navigation;
var DocumentTitle = require('react-document-title');

// session model and dispatch actions
var session = require('../modules/session/models/session');
var sessionActions = require('../modules/session/actions');

// React components
var TopBar = require('../shared/components/header/top-bar.jsx');

// required to use React Bootstrap in child modules
require('react-bootstrap');

var topBarConfig = {
  brandName: 'Gatewayd Basic',
  wrapperClass: 'navbar-inverse navbar-fixed-top top-bar container-fluid',
  links: []
};

var App =
  React.createClass({
    mixins: [Navigation],

    render:function(){
      if (!session.isLoggedIn()) {

        // attempt session restoration
        sessionActions.restore();

        // redirect to login if session restoration failed
        if (!session.isLoggedIn()) {
          this.transitionTo('/login');
        }
      }

      return (
        <div>
          <TopBar setup={topBarConfig} />
          <div className="container">
            <div className="row">
              <div className="col-sm-12 col-md-12 main">
              <DocumentTitle title='Gatewayd Basic Admin'>
                <RouteHandler />
              </DocumentTitle>
              </div>
            </div>
          </div>
        </div>
      )
    }
});

module.exports = App;
