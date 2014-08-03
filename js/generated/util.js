var Util;

Util = (function() {
  function Util() {}

  Util.log = function(x) {
    return console.log(x);
  };

  Util.control = function(name) {
    return document.getElementById(name);
  };

  Util.value = function(name) {
    return parseFloat(Util.stringvalue(name));
  };

  Util.stringvalue = function(name) {
    return Util.control(name).value;
  };

  Util.clone = function(x) {
    return JSON.parse(JSON.stringify(x));
  };

  Util.toObj = function(kvPairs) {
    var k, obj, v, _i, _len, _ref;
    obj = {};
    for (_i = 0, _len = kvPairs.length; _i < _len; _i++) {
      _ref = kvPairs[_i], k = _ref[0], v = _ref[1];
      obj[k] = v;
    }
    return obj;
  };

  Util.map = function(obj, fn) {
    var key, result, _fn;
    result = {};
    _fn = function() {
      return result[key] = fn(obj[key], key);
    };
    for (key in obj) {
      _fn();
    }
    return result;
  };

  Util.merge = function(a, b, c) {
    return $.extend(true, a, b, c);
  };

  Util.round = function(n, d) {
    var pow;
    pow = Math.pow(10, d);
    return Math.round(n * pow) / pow;
  };

  Util.time = function(n, f) {
    var s;
    if (n instanceof Function) {
      f = n;
    }
    s = new Date;
    f();
    return new Date - s;
  };

  Util.openDataUrl = function(data, filename) {
    var a, evt;
    a = document.createElement("a");
    a.href = data;
    a.download = filename;
    evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);
    return a.dispatchEvent(evt);
  };

  Util.canvasWidth = function(canvas) {
    return canvas.width / (window.devicePixelRatio || 1);
  };

  Util.canvasHeight = function(canvas) {
    return canvas.height / (window.devicePixelRatio || 1);
  };

  return Util;

})();
