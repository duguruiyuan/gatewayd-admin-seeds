'use strict';

var _ = require('lodash');
var $ = require('jquery');
var Backbone = require('backbone');
var AdminDispatcher = require('../../../dispatchers/admin-dispatcher');
var CryptoJS = require('crypto-js');
var sessionActions = require('../config.json').actions;
var UserModel = require('../../../modules/users/models/user');

Backbone.$ = $;

var Session = Backbone.Model.extend({
  defaults: {
    sessionKey: '',
    lastLogin: 0,
    credentials: 'ABC' // Base64
  },

  requiredAttrs: {
    sessionKey: {
      type: 'string',
      minLength: 1
    },
    lastLogin: {
      type: 'number' // milliseconds since 1970/01/01
    }
  },

  url: 'http://localhost:5000/v1/users/login',

  resetUserModel: function() {
    var defaults = this.get('userModel').defaults;

    this.get('userModel').set(defaults);

    return this.get('userModel');
  },

  initialize: function() {
    _.bindAll(this);

    this.set('userModel', new UserModel());

    AdminDispatcher.register(this.dispatchCallback);
  },

  dispatchCallback: function(payload) {
    var handleAction = {};

    handleAction[sessionActions.login] = this.login;
    handleAction[sessionActions.logout] = this.logout;
    handleAction[sessionActions.restore] = this.restore;

    if (!_.isUndefined(handleAction[payload.actionType])) {
      handleAction[payload.actionType](payload.data);
    }
  },

  validationErrors: [],

  handleObject: function(attr, minLength) {
    if (attr === null) {
      return false;
    }

    if (Array.isArray(attr)) {
      return attr.length >= minLength;
    }

    return Object.keys(attr).length >= minLength;
  },

  handleString: function(attr, minLength) {
    return !!attr && attr.length >= minLength;
  },

  testValid: function(attr, requirements) {
    var attribute = this.get(attr);
    var testValid = {
      object: this.handleObject,
      string: this.handleString,
    };
    var isDefined = !_.isUndefined(attribute);
    var type = requirements.type === 'array' ? 'object' : requirements.type;
    var isValid = typeof attribute === type;

    if (isValid && !_.isUndefined(testValid[typeof attribute])) {
      isValid = testValid[typeof attribute](attribute, requirements.minLength);
    }

    // custom error messaging
    if (!isDefined) {
      this.validationErrors.push('"' + attr + '" of session data is undefined');
    } else if (!isValid) {
      this.validationErrors.push('"' + attr + '" of session data is invalid');
    }

    return isDefined && isValid;
  },

  validate: function() {
    var isValid = true,
        _this = this;

    _.each(this.requiredAttrs, function(requirements, requiredAttr) {
      if (!_this.testValid(requiredAttr, requirements)) {
        isValid = false;
      }
    });

    if (!isValid) {
      return 'There is an error';
    }
  },

  updateSession: function(sessionKey) {
    this.set({
      sessionKey: sessionKey,
      lastLogin: Date.now()
    });
  },

  updateUser: function(name) {
    this.get('userModel').set({
      name: name,
      role: name,
      isLoggedIn: true
    });
  },

  createCredentials: function(name, sessionKey) {
    var encodedString = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(name + ':' + sessionKey));

    this.set('credentials', 'Basic ' + encodedString);
  },

  login: function(payload) {
    if (!payload.name || !payload.sessionKey) {
      return false;
    }

    var _this = this;

    this.updateSession(payload.sessionKey);
    this.updateUser(payload.name);
    this.createCredentials(payload.name, payload.sessionKey);

    this.save(null, {
      wait: true,
      contentType: 'application/json',
      data: JSON.stringify({
        name: payload.name + '@example.com',
        password: payload.sessionKey
      }),
      headers: {
        'Authorization': _this.get('credentials')
      },
      success: function(model, xhr, response) {
        console.log('login SUCCESS', arguments); // response = {user: {admin: true}}
        sessionStorage.setItem('session', JSON.stringify(_this.toJSON()));
        _this.trigger('loggedIn');
      },
      error: function() {
        console.log('login FAIL', arguments);
      }
    });
  },

  restore: function() {
    var oldSession = sessionStorage.length === 0 ? null : sessionStorage.getItem('session');

    if (oldSession) {
      var oldUser, restoredUser;

      this.set(JSON.parse(oldSession));
      oldUser = this.get('userModel');
      restoredUser = new UserModel(oldUser);
      this.set('userModel', restoredUser);
    }
  },

  logout: function() {
    var resetUser = this.resetUserModel();

    this.set(this.defaults);
    this.set('userModel', resetUser);

    sessionStorage.clear();
  },

  isLoggedIn: function() {
    return this.get('userModel').get('isLoggedIn');
  },

  isExpired: function() {
    return Date.now() - this.get('lastLogin') > 3600000; // 1 hour
  },

  getLogState: function() {
    var logState = {
      true: 'loggedIn',
      false: 'loggedOut'
    };

    return logState[this.isLoggedIn()];
  }

});

module.exports = new Session();