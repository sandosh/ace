(function() {
  var context, passes, passesRoute, strata;

  strata = require('strata');

  context = require('./context');

  passesRoute = function(env, route) {
    route = strata.Router.compileRoute(route, []);
    return route.test(env.pathInfo);
  };

  passes = function(env, conditions) {
    var key, request, value;
    if (conditions === true) {
      return true;
    } else if (typeof conditions === 'function') {
      return conditions(env);
    } else if (typeof conditions === 'string') {
      return passesRoute(env, conditions);
    } else if (Array.isArray(conditions)) {
      return conditions.some(function(route) {
        return passesRoute(env, route);
      });
    } else {
      request = new strata.Request(env);
      for (key in conditions) {
        value = conditions[key];
        if (value.test != null) {
          if (value.test(request[key])) return true;
          if (value.test(env[key])) return true;
        } else {
          if (request[key] === value) return true;
          if (env[key] === value) return true;
        }
      }
      return false;
    }
  };

  module.exports = function(app, conditions, filter, base) {
    return function(env, callback) {
      return app(env, function() {
        var filterCallback, original;
        original = arguments;
        if (passes(env, conditions)) {
          filterCallback = function(status) {
            if (this.status === 200) {
              return callback.apply(null, original);
            } else {
              return callback.apply(null, arguments);
            }
          };
          return context.wrap(filter, base)(env, filterCallback);
        } else {
          return callback.apply(null, original);
        }
      });
    };
  };

}).call(this);