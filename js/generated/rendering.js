var Bounding, Renderer, RenderingContext,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

RenderingContext = (function() {
  RenderingContext.prototype.initialised = false;

  RenderingContext.prototype.state = null;

  RenderingContext.prototype.bounding = null;

  RenderingContext.prototype.stack = [];

  function RenderingContext(canvas) {
    this.canvas = canvas;
    this.reset = __bind(this.reset, this);
  }

  RenderingContext.prototype.reset = function(system) {
    this.initialised = true;
    this.state = {
      x: (Util.canvasWidth(this.canvas) / 2) + system.offsets.x,
      y: (Util.canvasHeight(this.canvas) / 2) + system.offsets.y,
      orientation: -90 + system.offsets.rot,
      stepAngle: system.params.angle.value,
      stepSize: system.params.size.value
    };
    this.bounding = new Bounding;
    return this.stack = [];
  };

  return RenderingContext;

})();

Bounding = (function() {
  function Bounding() {
    this.height = __bind(this.height, this);
    this.width = __bind(this.width, this);
  }

  Bounding.prototype.x1 = Infinity;

  Bounding.prototype.y1 = Infinity;

  Bounding.prototype.x2 = -Infinity;

  Bounding.prototype.y2 = -Infinity;

  Bounding.prototype.width = function() {
    return this.x2 - this.x1;
  };

  Bounding.prototype.height = function() {
    return this.y2 - this.y1;
  };

  Bounding.prototype.constrain = function(x, y) {
    this.x1 = Math.max(this.x1, 0);
    this.y1 = Math.max(this.y1, 0);
    this.x2 = Math.min(this.x2, x);
    return this.y2 = Math.min(this.y2, y);
  };

  return Bounding;

})();

Renderer = (function() {
  Renderer.prototype.context = null;

  Renderer.prototype.g = null;

  Renderer.prototype.stack = [];

  Renderer.prototype.isDrawing = false;

  function Renderer(canvas) {
    this.canvas = canvas;
    this.render = __bind(this.render, this);
    this.reset = __bind(this.reset, this);
    this.clearCanvas = __bind(this.clearCanvas, this);
    this.context = new RenderingContext(canvas);
    this.g = canvas.getContext("2d");
    enhanceContext(this.canvas, this.g);
  }

  Renderer.prototype.clearCanvas = function() {
    var b, p, padding;
    if (this.context.initialised) {
      b = this.context.bounding;
      p = padding = 5;
      b.constrain(Util.canvasWidth(this.canvas), Util.canvasHeight(this.canvas));
      return this.g.clearRect(b.x1 - p, b.y1 - p, b.width() + 2 * p, b.height() + 2 * p);
    }
  };

  Renderer.prototype.reset = function(system) {
    this.clearCanvas();
    return this.context.reset(system);
  };

  Renderer.prototype.render = function(elems, system) {
    var b, s, start, _ref, _ref1;
    this.isDrawing = true;
    start = new Date;
    this.reset(system);
    this.g.lineWidth = 0.118;
    this.g.strokeStyle = "#fff";
    this.g.beginPath();
    this.g.moveTo(this.context.state.x, this.context.state.y);
    _ref = [this.context.state, this.context.bounding], s = _ref[0], b = _ref[1];
    _ref1 = [s.x, s.y], b.x2 = _ref1[0], b.y2 = _ref1[1];
    _.each(elems, (function(_this) {
      return function(e) {
        return _this.definitions[e](_this.context.state, system.params, _this.g, _this.context);
      };
    })(this));
    this.g.stroke();
    this.isDrawing = false;
    return new Date - start;
  };

  Renderer.prototype.definitions = (function() {
    var ang, c, cloneState, cos, len, max, min, pi, s, sin, _ref;
    _ref = [Math.cos, Math.sin, Math.PI, Math.min, Math.max], cos = _ref[0], sin = _ref[1], pi = _ref[2], min = _ref[3], max = _ref[4];
    len = ang = s = c = 0;
    cloneState = function(c) {
      return {
        x: c.x,
        y: c.y,
        orientation: c.orientation,
        stepAngle: c.stepAngle,
        stepSize: c.stepSize
      };
    };
    return {
      "F": function(state, params, g, context) {
        var bounding;
        ang = ((state.orientation % 360) / 180) * pi;
        state.x += cos(ang) * state.stepSize;
        state.y += sin(ang) * state.stepSize;
        bounding = context.bounding;
        if (state.x < bounding.x1) {
          bounding.x1 = state.x;
        } else if (state.x > bounding.x2) {
          bounding.x2 = state.x;
        }
        if (state.y < bounding.y1) {
          bounding.y1 = state.y;
        } else if (state.y > bounding.y2) {
          bounding.y2 = state.y;
        }
        return g.lineTo(state.x, state.y);
      },
      "+": function(state) {
        return state.orientation += state.stepAngle;
      },
      "-": function(state) {
        return state.orientation -= state.stepAngle;
      },
      "|": function(state) {
        return state.orientation += 180;
      },
      "[": function(state, params, g, context) {
        return context.stack.push(cloneState(state));
      },
      "]": function(state, params, g, context) {
        context.state = state = context.stack.pop();
        return g.moveTo(state.x, state.y);
      },
      "!": function(state) {
        return state.stepAngle *= -1;
      },
      "(": function(state, params) {
        return state.stepAngle *= 1 - params.angle.growth;
      },
      ")": function(state, params) {
        return state.stepAngle *= 1 + params.angle.growth;
      },
      "<": function(state, params) {
        return state.stepSize *= 1 + params.size.growth;
      },
      ">": function(state, params) {
        return state.stepSize *= 1 - params.size.growth;
      }
    };
  })();

  return Renderer;

})();
