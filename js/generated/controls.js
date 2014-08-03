var Control, Controls, Joystick, Key, KeyState, OffsetControl, ParamControl, Point, SensitivityControl,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Point = (function() {
  function Point(x, y) {
    this.x = x;
    this.y = y;
  }

  return Point;

})();

Key = (function() {
  function Key() {}

  Key.ctrl = 17;

  Key.meta = 91;

  Key.shift = 16;

  Key.alt = 18;

  Key.space = 32;

  Key.enter = 13;

  return Key;

})();

KeyState = (function() {
  KeyState.prototype.keys = {};

  KeyState.prototype.codeToKey = [];

  function KeyState() {
    var key, _fn;
    _fn = (function(_this) {
      return function() {
        _this[key] = false;
        return _this.codeToKey[Key[key]] = key;
      };
    })(this);
    for (key in Key) {
      _fn();
    }
    this.createBindings();
  }

  KeyState.prototype.createBindings = function() {
    var setDown;
    setDown = (function(_this) {
      return function(val) {
        return function(ev) {
          var keyname;
          keyname = _this.codeToKey[ev.keyCode];
          if (keyname) {
            return _this[keyname] = val;
          }
        };
      };
    })(this);
    document.addEventListener("keydown", setDown(true));
    document.addEventListener("keyup", setDown(false));
    return document.addEventListener("mousedown", (function(_this) {
      return function(evt) {
        var key, _results;
        _results = [];
        for (key in Key) {
          _results.push((function() {
            var pressed;
            pressed = evt[key + "Key"];
            if (pressed != null) {
              return _this[key] = pressed;
            }
          })());
        }
        return _results;
      };
    })(this));
  };

  return KeyState;

})();

Joystick = (function() {
  Joystick.prototype.enabled = true;

  Joystick.prototype.active = false;

  Joystick.prototype.start = new Point(0, 0);

  Joystick.prototype.now = new Point(0, 0);

  function Joystick(canvas) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.createBindings();
  }

  Joystick.prototype.enable = function() {
    return this.enabled = true;
  };

  Joystick.prototype.disable = function() {
    return this.enabled = false;
  };

  Joystick.prototype.onActivate = function() {};

  Joystick.prototype.onRelease = function() {};

  Joystick.prototype.dx = function(sensitivity) {
    return (this.now.x - this.start.x) * (sensitivity ? Math.pow(10, sensitivity - 10) : 1);
  };

  Joystick.prototype.dy = function(sensitivity) {
    return (this.now.y - this.start.y) * (sensitivity ? Math.pow(10, sensitivity - 10) : 1);
  };

  Joystick.prototype.clear = function() {};

  Joystick.prototype.draw = function() {};

  Joystick.prototype.center = function() {
    this.start.x = this.now.x;
    return this.start.y = this.now.y;
  };

  Joystick.prototype.createBindings = function() {
    this.canvas.onmousedown = (function(_this) {
      return function(ev) {
        if (ev.button === 0 && _this.enabled) {
          _this.onActivate();
          _this.active = true;
          return _this.start = new Point(ev.pageX, ev.pageY);
        }
      };
    })(this);
    document.onmouseup = (function(_this) {
      return function() {
        var wasActive;
        if (_this.enabled) {
          wasActive = _this.active;
          _this.active = false;
          if (wasActive) {
            return _this.onRelease();
          }
        }
      };
    })(this);
    document.onmousemove = (function(_this) {
      return function(ev) {
        if (_this.enabled) {
          _this.now.x = ev.pageX;
          return _this.now.y = ev.pageY;
        }
      };
    })(this);
    return document.addEventListener("keydown", (function(_this) {
      return function() {
        if (_this.enabled && _this.active) {
          _this.center();
          return _this.onActivate();
        }
      };
    })(this));
  };

  return Joystick;

})();

Control = (function() {
  function Control(controlkey) {
    this.controlkey = controlkey;
  }

  Control.prototype.tpl = function() {
    return "you need to override this";
  };

  Control.prototype.create = function(container) {
    this.el = $(this.tpl());
    $(container).append(this.el);
    return this.el;
  };

  Control.prototype.getInput = function(param) {
    return this.el.find("[data-param=" + param + "]");
  };

  Control.prototype.getVal = function(param) {
    return parseFloat(this.getInput(param).val());
  };

  Control.prototype.setVal = function(param, value) {
    var input;
    input = this.getInput(param);
    if (parseFloat(input.val()) !== value && !isNaN(parseFloat(value))) {
      return input.val(value);
    }
  };

  Control.prototype.toJson = function() {
    return this.update({});
  };

  Control.prototype.sync = function(setting) {
    _.chain(setting).omit("name").each((function(_this) {
      return function(v, k) {
        return _this.setVal(k, v);
      };
    })(this));
    return setting;
  };

  Control.prototype.update = function(setting) {
    _.each(this.el.find("[data-param]"), (function(_this) {
      return function(el) {
        var key, val;
        key = $(el).data("param");
        val = _this.getVal(key);
        if (!isNaN(val)) {
          return setting[key] = val;
        }
      };
    })(this));
    return setting;
  };

  return Control;

})();

OffsetControl = (function(_super) {
  __extends(OffsetControl, _super);

  function OffsetControl() {
    return OffsetControl.__super__.constructor.apply(this, arguments);
  }

  OffsetControl.prototype.tpl = function() {
    return "<ul class=\"control-row\">\n<li><input required data-param=\"x\" type=\"text\"></li><!--\n--><li><input required data-param=\"y\" type=\"text\"></li><!--\n--><li><input required data-param=\"rot\" type=\"text\"></li>\n</ul>";
  };

  return OffsetControl;

})(Control);

ParamControl = (function(_super) {
  __extends(ParamControl, _super);

  function ParamControl() {
    return ParamControl.__super__.constructor.apply(this, arguments);
  }

  ParamControl.prototype.tpl = function() {
    return "<ul class=\"control-row\">\n<li class=\"label\">" + this.controlkey + "</li><!--\n--><li><input required type=\"text\" data-param=\"value\"></li><!--\n--><li><input required type=\"text\" data-param=\"growth\"></li>\n</ul>";
  };

  ParamControl.prototype.toJson = function() {
    var dummy;
    dummy = new Param(this.controlkey, 0, 0);
    return this.update(dummy).toJson();
  };

  return ParamControl;

})(Control);

SensitivityControl = (function(_super) {
  __extends(SensitivityControl, _super);

  function SensitivityControl() {
    return SensitivityControl.__super__.constructor.apply(this, arguments);
  }

  SensitivityControl.prototype.toJson = function() {
    var dummy;
    dummy = new Sensitivity(this.controlkey, 0, 0);
    return this.update(dummy).toJson();
  };

  return SensitivityControl;

})(ParamControl);

Controls = (function() {
  function Controls(params, ControlType) {
    this.controls = Util.map(params, function(p, k) {
      return new ControlType(k);
    });
  }

  Controls.prototype.create = function(container) {
    return _.each(this.controls, function(c) {
      return c.create(container);
    });
  };

  Controls.prototype.sync = function(params) {
    return Util.map(params, (function(_this) {
      return function(p) {
        return _this.controls[p.name].sync(p);
      };
    })(this));
  };

  Controls.prototype.toJson = function() {
    return Util.map(this.controls, function(c) {
      return c.toJson();
    });
  };

  return Controls;

})();
