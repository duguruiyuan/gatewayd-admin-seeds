"use strict";

var React = require('react');

// needed for dev tools to work
window.React = React;

// React Router
var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var NotFoundRoute = Router.NotFoundRoute;
var Redirect = Router.Redirect;
var NotFound = require('./not-found/not-found.jsx');

var sessionModel = require('../modules/session/models/session');
var SessionComponent = require('../modules/session/components/session.jsx');
var LoginForm = require('../modules/session/components/login-form.jsx');

// continuously fetch ripple transactions when tab is active
var Payments = require('../modules/payments/components/payments.jsx');
var paymentActions = require('../modules/payments/actions.js');
var heartbeats = require('heartbeats');
var pollingHeart = new heartbeats.Heart(1000);

//todo stop polling when not logged in, start when logged in
var pollWhenActive = function() {
  if (sessionModel.isLoggedIn()) {
    paymentActions.fetchRippleTransactions();
  }
};

pollingHeart.onBeat(5, pollWhenActive);

window.onfocus = function() {
  pollingHeart.clearEvents();
  pollingHeart.onBeat(5, pollWhenActive);
};

window.onblur = function() {
  pollingHeart.onBeat(60 * 5, pollingHeart.clearEvents);
};

var App = require('./app.jsx');

var routes = (
  <Route name="app" path="/" handler={App}>
    <DefaultRoute handler={Payments} />
    <Route name="login" handler={SessionComponent} />
    <Route name="logout" handler={SessionComponent} />
    <Route name="payments" path="payments/:direction/:state" handler={Payments}/>
    <Route name="notFound" handler={NotFound} />
    <NotFoundRoute handler={NotFound} />
    <Redirect from="/" to="/payments/outgoing/all" />
  </Route>
);

module.exports = routes;
