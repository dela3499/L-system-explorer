var CompiledSystem, DefaultSystem, NullSystem, SystemCompiler, SystemManager;

NullSystem = new LSystem({}, {}, {}, "", 1, "no system");

DefaultSystem = new LSystem({
  size: {
    value: 12.27
  },
  angle: {
    value: 4187.5
  }
}, {}, {
  size: {
    value: 9
  }
}, "L : SS\nS : F->[F-Y[S(L]]\nY : [-|F-F+)Y]\n", 12, "click-and-drag-me!");

CompiledSystem = (function() {
  function CompiledSystem(system, elements) {
    this.system = system;
    this.elements = elements;
  }

  return CompiledSystem;

})();

SystemCompiler = (function() {
  function SystemCompiler() {}

  SystemCompiler.prototype._halt = false;

  SystemCompiler.prototype.halt = function() {
    return this._halt = true;
  };

  SystemCompiler.prototype.compile = function(system) {
    var CHUNK_SIZE, def, expandChunk, removeNonInstructions, ruleMap, seed, textRules;
    this._halt = false;
    CHUNK_SIZE = 400000;
    def = $.Deferred();
    def.notify(0);
    textRules = system.rules.split("\n").map(function(r) {
      return (r.replace(/\ /g, '')).split(':');
    });
    ruleMap = Util.toObj(textRules);
    seed = textRules[0][0];
    removeNonInstructions = function(expr) {
      return expr.split('').filter(function(e) {
        if (Renderer.prototype.definitions[e]) {
          return true;
        }
      });
    };
    expandChunk = (function(_this) {
      return function(levelNum, levelExpr, acc, start, processed, count) {
        var end, i, reachesEndOfLevel, remaining, symbol;
        while (processed < count) {
          if (_this._halt) {
            def.reject();
            return;
          } else if (levelNum === 0) {
            def.resolve(removeNonInstructions(levelExpr));
            return;
          }
          remaining = count - processed;
          reachesEndOfLevel = remaining >= (levelExpr.length - start);
          if (reachesEndOfLevel) {
            remaining = levelExpr.length - start;
          }
          i = start;
          end = start + remaining;
          while (i < end) {
            symbol = levelExpr[i];
            acc += ruleMap[symbol] || symbol;
            i++;
          }
          processed += remaining;
          start += remaining;
          if (reachesEndOfLevel) {
            levelNum--;
            levelExpr = acc;
            acc = '';
            start = 0;
          }
        }
        def.notify((system.iterations - levelNum) / system.iterations);
        return setTimeout((function() {
          return expandChunk(levelNum, levelExpr, acc, start, 0, count);
        }), 0);
      };
    })(this);
    expandChunk(system.iterations, seed, '', 0, 0, CHUNK_SIZE);
    return def.promise();
  };

  return SystemCompiler;

})();

SystemManager = (function() {
  function SystemManager() {}

  SystemManager.prototype.compiler = new SystemCompiler;

  SystemManager.prototype.stagedSystem = null;

  SystemManager.prototype.activeSystem = NullSystem;

  SystemManager.prototype.compiledElements = null;

  SystemManager.prototype.activate = function(system) {
    var _ref, _ref1;
    if (this.promise && ((_ref = this.stagedSystem) != null ? _ref.isIsomorphicTo(system) : void 0)) {
      this.activeSystem.merge(system);
      return this.promise;
    } else if (((_ref1 = this.promise) != null ? _ref1.state() : void 0) === 'pending') {
      this.compiler.halt();
      return this.promise.fail((function(_this) {
        return function() {
          return _this._recompile(system);
        };
      })(this));
    } else {
      return this._recompile(system);
    }
  };

  SystemManager.prototype._recompile = function(system) {
    this.stagedSystem = system;
    this.promise = this.compiler.compile(system);
    this.promise.fail((function(_this) {
      return function() {
        return _this.stagedSystem = _this.activeSystem;
      };
    })(this));
    return this.promise.pipe((function(_this) {
      return function(elements) {
        _this.activeSystem = system;
        _this.compiledElements = elements;
        return elements;
      };
    })(this));
  };

  SystemManager.prototype.getInstructions = function() {
    return this.compiledElements;
  };

  return SystemManager;

})();
