var Defaults, LSystem, Param, Sensitivity,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Param = (function() {
  Param.urlPrefix = "p";

  function Param(name, value, growth) {
    this.name = name;
    this.value = value;
    this.growth = growth;
  }

  Param.prototype.toUrlComponent = function() {
    return "" + this.constructor.urlPrefix + "." + this.name + "=" + this.value + "," + this.growth;
  };

  Param.fromUrlComponent = function(x) {
    var name, parts, vars;
    if ((x || "").indexOf("" + this.urlPrefix + ".") !== 0) {
      return void 0;
    }
    parts = x.split('=');
    name = parts[0].substring(2);
    vars = parts[1].split(',').map(function(v) {
      return parseFloat(v);
    });
    return new this(name, vars[0], vars[1]);
  };

  Param.fromJson = function(json) {
    return new this(json.name, json.value, json.growth);
  };

  Param.prototype.toJson = function() {
    return {
      name: this.name,
      value: this.value,
      growth: this.growth
    };
  };

  Param.prototype.clone = function() {
    return Param.fromJson(this.toJson());
  };

  return Param;

})();

Sensitivity = (function(_super) {
  __extends(Sensitivity, _super);

  Sensitivity.urlPrefix = "s";

  function Sensitivity(name, value, growth) {
    this.name = name;
    this.value = value;
    this.growth = growth;
  }

  return Sensitivity;

})(Param);

Defaults = (function() {
  function Defaults() {}

  Defaults.offsets = function(input) {
    return Util.merge({
      x: 0,
      y: 0,
      rot: 0
    }, input);
  };

  Defaults.params = function(input) {
    return Util.map(Util.merge(Defaults._params(), input), function(p, k) {
      return _.extend(p, {
        name: k
      });
    });
  };

  Defaults._params = function() {
    return {
      size: {
        value: 1,
        growth: 0.01
      },
      angle: {
        value: 1,
        growth: 0.05
      }
    };
  };

  Defaults.sensitivities = function(input) {
    return Util.map(Util.merge(Util.merge(Util.map(Defaults.params(), this._constrain(0, 10)), Defaults._sensitivites()), input), function(p, k) {
      return _.extend(p, {
        name: k
      });
    });
  };

  Defaults._constrain = function(min, max) {
    return function(val) {
      return Math.max(min, Math.min(max, val));
    };
  };

  Defaults._sensitivites = function() {
    return {
      size: {
        value: 7.7,
        growth: 7.53
      },
      angle: {
        value: 7.6,
        growth: 4
      }
    };
  };

  return Defaults;

})();

LSystem = (function() {
  function LSystem(params, offsets, sensitivities, rules, iterations, name) {
    this.rules = rules;
    this.iterations = iterations;
    this.name = name;
    this.params = Util.map(Defaults.params(params), function(c) {
      return Param.fromJson(c);
    });
    this.offsets = Defaults.offsets(offsets);
    this.sensitivities = Util.map(Defaults.sensitivities(sensitivities), function(s) {
      return Sensitivity.fromJson(s);
    });
  }

  LSystem.prototype.clone = function() {
    return LSystem.fromUrl(this.toUrl());
  };

  LSystem.prototype.toUrl = function() {
    var base, mkQueryString, name, offsets, params, sensitivities;
    base = "#?i=" + this.iterations + "&r=" + (encodeURIComponent(this.rules));
    mkQueryString = function(params) {
      return _.reduce(params, (function(acc, v) {
        return "" + acc + "&" + (v.toUrlComponent());
      }), "");
    };
    params = mkQueryString(this.params);
    sensitivities = mkQueryString(this.sensitivities);
    offsets = "&offsets=" + this.offsets.x + "," + this.offsets.y + "," + this.offsets.rot;
    name = "&name=" + (encodeURIComponent(this.name));
    return base + params + sensitivities + offsets + name;
  };

  LSystem.prototype.merge = function(system) {
    if (system) {
      return _.extend(this, system);
    }
  };

  LSystem.fromUrl = function(url) {
    var config, o, offsets, params, sensitivities;
    if (url == null) {
      url = location.hash;
    }
    if (url === "") {
      return null;
    }
    params = {};
    sensitivities = {};
    config = {};
    _.each(url.substring(2).split("&").map(function(x) {
      return x.split("=");
    }), function(_arg) {
      var k, param, sensitivity, v;
      k = _arg[0], v = _arg[1];
      param = Param.fromUrlComponent("" + k + "=" + v);
      sensitivity = Sensitivity.fromUrlComponent("" + k + "=" + v);
      if (param) {
        params[param.name] = param.toJson();
      } else if (sensitivity) {
        sensitivities[sensitivity.name] = sensitivity.toJson();
      } else {
        config[k] = v;
      }
      if (k === 'i') {
        return config[k] = parseInt(v) || 0;
      }
    });
    offsets = void 0;
    if (config.offsets) {
      o = config.offsets.split(',');
      offsets = {
        x: parseFloat(o[0]),
        y: parseFloat(o[1]),
        rot: parseFloat(o[2])
      };
    }
    return new LSystem(params, offsets, sensitivities, decodeURIComponent(config.r), config.i, decodeURIComponent(config.name) || "unnamed");
  };

  LSystem.prototype.isIsomorphicTo = function(system) {
    if (!system) {
      return false;
    } else {
      return this.rules === system.rules && this.iterations === system.iterations;
    }
  };

  return LSystem;

})();
