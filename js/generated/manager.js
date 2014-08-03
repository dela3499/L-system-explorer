var AppManager, InputHandler,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

InputHandler = (function() {
  InputHandler.prototype.snapshot = null;

  function InputHandler(keystate, joystick) {
    this.keystate = keystate;
    this.joystick = joystick;
    this.update = __bind(this.update, this);
  }

  InputHandler.prototype.update = function(system) {
    if (!this.joystick.active) {
      return;
    }
    if (this.keystate.alt) {
      system.params.size.value = Util.round(this.snapshot.params.size.value + (this.joystick.dy(system.sensitivities.size.value)), 2);
      return system.params.size.growth = Util.round(this.snapshot.params.size.growth + this.joystick.dx(system.sensitivities.size.growth), 6);
    } else if (this.keystate.meta || this.keystate.ctrl) {
      system.offsets.x = this.snapshot.offsets.x + this.joystick.dx();
      return system.offsets.y = this.snapshot.offsets.y + this.joystick.dy();
    } else {
      system.params.angle.value = Util.round(system.params.angle.value + this.joystick.dx(system.sensitivities.angle.value), 4);
      return system.params.angle.growth = Util.round(system.params.angle.growth + this.joystick.dy(system.sensitivities.angle.growth), 9);
    }
  };

  return InputHandler;

})();

AppManager = (function() {
  AppManager.prototype.joystick = null;

  AppManager.prototype.keystate = null;

  AppManager.prototype.inputHandler = null;

  AppManager.prototype.renderer = null;

  AppManager.prototype.systemManager = null;

  function AppManager(canvas, controls) {
    this.canvas = canvas;
    this.controls = controls;
    this.draw = __bind(this.draw, this);
    this.run = __bind(this.run, this);
    this.joystick = new Joystick(canvas);
    this.keystate = new KeyState;
    this.inputHandler = new InputHandler(this.keystate, this.joystick);
    this.joystick.onRelease = (function(_this) {
      return function() {
        return _this.syncLocationQuiet();
      };
    })(this);
    this.joystick.onActivate = (function(_this) {
      return function() {
        return _this.inputHandler.snapshot = _this.systemManager.activeSystem.clone();
      };
    })(this);
    this.renderer = new Renderer(canvas);
    this.systemManager = new SystemManager;
    this.initControls();
    this.joystick.disable();
  }

  AppManager.prototype.initControls = function() {
    this.createBindings();
    return this.createControls();
  };

  AppManager.prototype.syncLocation = function() {
    return location.hash = this.systemManager.activeSystem.toUrl();
  };

  AppManager.prototype.syncLocationQuiet = function() {
    location.quietSync = true;
    return this.syncLocation();
  };

  AppManager.prototype.beforeRecalculate = function() {};

  AppManager.prototype.afterRecalculate = function() {};

  AppManager.prototype.onRecalculateFail = function() {};

  AppManager.prototype.onRecalculateProgress = function() {};

  AppManager.prototype.isRecalculating = function() {
    var _ref;
    return !this.recalculationPromise || ((_ref = this.recalculationPromise) != null ? _ref.state() : void 0) === 'pending';
  };

  AppManager.prototype.recalculate = function(system) {
    if (system == null) {
      system = this.lsystemFromControls();
    }
    this.beforeRecalculate();
    this.recalculationPromise = this.systemManager.activate(system).progress(this.onRecalculateProgress);
    this.recalculationPromise.done((function(_this) {
      return function() {
        _this.joystick.enable();
        _this.syncAll();
        _this.draw();
        return _this.afterRecalculate();
      };
    })(this));
    this.recalculationPromise.fail(this.onRecalculateFail);
    return this.recalculationPromise;
  };

  AppManager.prototype.lsystemFromControls = function() {
    return new LSystem(this.paramControls.toJson(), this.offsetControls.toJson(), this.sensitivityControls.toJson(), $(this.controls.rules).val(), parseInt($(this.controls.iterations).val()), $(this.controls.name).val());
  };

  AppManager.prototype.exportToPng = function(system) {
    var b, c, filename, r, x, y, _ref;
    if (system == null) {
      system = this.systemManager.activeSystem;
    }
    _ref = [(Util.canvasWidth(this.canvas) / 2) + system.offsets.x, (Util.canvasHeight(this.canvas) / 2) + system.offsets.y], x = _ref[0], y = _ref[1];
    b = this.renderer.context.bounding;
    c = $('<canvas></canvas>').attr({
      "width": b.width() + 30,
      "height": b.height() + 30
    })[0];
    r = new Renderer(c);
    r.reset = function(system) {
      r.context.reset(system);
      r.context.state.x = x - b.x1 + 15;
      return r.context.state.y = y - b.y1 + 15;
    };
    this.draw(r);
    filename = "lsys_" + system.name.replace(/[\ \/]/g, "_");
    return Util.openDataUrl(c.toDataURL("image/png"), filename);
  };

  AppManager.prototype.start = function() {
    var startingSystem;
    startingSystem = LSystem.fromUrl() || DefaultSystem;
    return this.recalculate(startingSystem).fail((function(_this) {
      return function() {
        return _this.syncAll(startingSystem);
      };
    })(this)).pipe((function(_this) {
      return function() {
        return _this.draw();
      };
    })(this)).always(this.run);
  };

  AppManager.prototype.run = function() {
    setTimeout(this.run, 10);
    this.inputHandler.update(this.systemManager.activeSystem);
    if (this.joystick.active && !this.renderer.isDrawing) {
      this.draw();
      this.joystick.draw();
      return this.syncControls();
    }
  };

  AppManager.prototype.draw = function(renderer) {
    var elems;
    if (renderer == null) {
      renderer = this.renderer;
    }
    elems = this.systemManager.getInstructions();
    if (elems) {
      return renderer.render(elems, this.systemManager.activeSystem);
    }
  };

  AppManager.prototype.createControls = function() {
    this.paramControls = new Controls(Defaults.params(), ParamControl);
    this.offsetControls = new OffsetControl(Defaults.offsets());
    this.sensitivityControls = new Controls(Defaults.sensitivities(), SensitivityControl);
    this.paramControls.create(this.controls.params);
    this.offsetControls.create(this.controls.offsets);
    return this.sensitivityControls.create(this.controls.sensitivities);
  };

  AppManager.prototype.syncAll = function(system) {
    if (system == null) {
      system = this.systemManager.activeSystem;
    }
    $(this.controls.name).val(system.name);
    this.syncControls(system);
    return this.syncRulesAndIterations(system);
  };

  AppManager.prototype.syncRulesAndIterations = function(system) {
    if (system == null) {
      system = this.systemManager.activeSystem;
    }
    $(this.controls.iterations).val(system.iterations);
    return $(this.controls.rules).val(system.rules);
  };

  AppManager.prototype.syncControls = function(system) {
    if (system == null) {
      system = this.systemManager.activeSystem;
    }
    this.paramControls.sync(system.params);
    this.offsetControls.sync(system.offsets);
    return this.sensitivityControls.sync(system.sensitivities);
  };

  AppManager.prototype.createBindings = function() {
    var setClassIf, updateCursorType;
    setClassIf = (function(_this) {
      return function(onOff, className) {
        var method;
        method = onOff ? 'add' : 'remove';
        return $(_this.canvas)["" + method + "Class"](className);
      };
    })(this);
    updateCursorType = (function(_this) {
      return function(ev) {
        setClassIf(ev.ctrlKey || ev.metaKey, "moving");
        return setClassIf(ev.altKey, "resizing");
      };
    })(this);
    document.addEventListener("keydown", (function(_this) {
      return function(ev) {
        updateCursorType(ev);
        if (ev.keyCode === Key.enter && ev.ctrlKey) {
          _this.recalculate();
          _this.syncLocation();
          return false;
        }
        if (ev.keyCode === Key.enter && ev.shiftKey) {
          return _this.exportToPng();
        }
      };
    })(this));
    document.addEventListener("keyup", updateCursorType);
    document.addEventListener("mousedown", updateCursorType);
    return window.onhashchange = (function(_this) {
      return function() {
        var quiet;
        quiet = location.quietSync;
        location.quietSync = false;
        if (location.hash !== "" && !quiet) {
          return _this.recalculate(LSystem.fromUrl());
        }
      };
    })(this);
  };

  return AppManager;

})();
