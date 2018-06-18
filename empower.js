(function() {
  /**
   * Return an Empower instance
   * @param {Object} item
   */
  function Empower(item) {
    var args = Array.prototype.slice.apply(arguments);
    args = args.slice(1);
    if (item.constructor.name === 'WrapObject') {
      item.initArgs = args; //update the args
      return item;
    }
    var wrapObj = new WrapObject(item, args);

    for (var prop in item) {
      Object.defineProperty(wrapObj, prop, {
        get: WrapObject.prototype.getFactory(prop),
        set: WrapObject.prototype.setFactory(prop)
      });

      var propWrap = isObject(item[prop]) ? new Empower(item[prop]) : new WrapObject(item[prop]);
      propWrap.setTarget(wrapObj);
      propWrap.setProp(prop);
      if (!wrapObj['$' + prop]) {
        wrapObj['$' + prop] = propWrap;
      }
    }
    return wrapObj;
  }

  /**
   * The wrap object
   * @param {Object} item
   */
  function WrapObject(item, args) {
    this.rawItem = item;
    this.target = this;
    this.prop = null;
    this.initArgs = args;
    this.runIntervals = [];
    this.subWraps = [];
  }

  /**
   * ================================================
   * Generic utilities
   * ================================================
   */

  /**
   * Set the target for running all functions towards
   * @return {Object}
   */
  WrapObject.prototype.setTarget = function(target) {
    this.target = target;
  };

  /**
   * Set the prop (of the target)
   * @return {Object}
   */
  WrapObject.prototype.setProp = function(prop) {
    this.prop = prop;
  };

  /**
   * Get the raw object held within the wrap
   * @return {Object}
   */
  WrapObject.prototype.value = function() {
    return this.rawItem;
  };

  /**
   * Get the string representation of the raw object held in the wrap
   * @return {String}
   */
  WrapObject.prototype.toString = function() {
    return this.rawItem.toString();
  };

  /**
   * Get the value representation of the raw object held in the wrap
   * @return {Object}
   */
  WrapObject.prototype.valueOf = function() {
    return this.rawItem.valueOf();
  };

  /**
   * Get the value representation of the raw object held in the wrap
   * @return {Object}
   */
  WrapObject.prototype.updateProp = function() {
    if (!this.prop) return;
    return this.target[this.prop] = this.valueOf();
  };

  /**
   * ================================================
   * String-specific utilities
   * ================================================
   */

  /**
   * In-place: Reverse the raw object, if it is a string
   * @return {Object}
   */
  WrapObject.prototype.reverse = function() {
    if (isString(this.rawItem)) {
      this.rawItem = this.rawItem.split('').reverse().join('');
    }
    if (isArray(this.rawItem)) {
      this.rawItem = this.rawItem.reverse();
    }
    this.updateProp();
    return this;
  };

  /**
   * In-place: Ensure suffix is present
   * @return {Object}
   */
  WrapObject.prototype.ensureSuffix = function(str) {
    if (!isString(this.rawItem)) {
      return this;
    }
    this.rawItem = this.rawItem.replace(new RegExp(str + '$', 'i'), '').concat(str);
    this.updateProp();
    return this;
  };

  /**
   * In-place: Ensure prefix is present
   * @return {Object}
   */
  WrapObject.prototype.ensurePrefix = function(str) {
    if (!isString(this.rawItem)) {
      return this;
    }
    this.rawItem = str.concat(this.rawItem.replace(new RegExp('^' + str, 'i'), ''));
    this.updateProp();
    return this;
  };

  /**
   * In-place: Pluralize the string
   * @return {Object}
   */
  WrapObject.prototype.pluralize = function(str) {
    if (!isString(this.rawItem)) {
      return this;
    }

    var isSimple = ['a', 'e', 'i', 'u'].indexOf(this.rawItem.substr(-1, 1)) !== -1;
    if (isSimple) {
      this.rawItem = this.rawItem + 's';
      this.updateProp();
      return this;
    }

    var isY = ['y'].indexOf(this.rawItem.substr(-1, 1)) !== -1;
    if (isY) {
      this.rawItem = this.rawItem.replace(/.$/, 'ies');
      this.updateProp();
      return this;
    }

    var isO = ['o'].indexOf(this.rawItem.substr(-1, 1)) !== -1;
    if (isO) {
      this.rawItem = this.rawItem.replace(/.$/, 'oes');
      this.updateProp();
      return this;
    }

    this.rawItem = this.rawItem + 's';
    this.updateProp();

    return this;
  };

  /**
   * In-place: singularize the string
   * @return {Object}
   */
  WrapObject.prototype.singularize = function(str) {
    if (!isString(this.rawItem)) {
      return this;
    }

    var isY = ['ies'].indexOf(this.rawItem.substr(-3)) !== -1;
    if (isY) {
      this.rawItem = this.rawItem.replace(/ies$/, 'y');
      this.updateProp();
      return this;
    }

    this.rawItem = this.rawItem.replace(/s$/, '');
    this.updateProp();

    return this;
  };

  /**
   * Add spaces between each letter
   * @param  {Number} len
   * @param  {String} char
   * @return {Object}
   */
  WrapObject.prototype.spaceOut = function(len, char) {
    len = len || 1;
    var str = (new Array(len + 1)).join(char || ' ');
    if (!isString(this.rawItem)) return this;
    this.rawItem = this.rawItem.split('').join(str);
    this.updateProp();
    return this;
  };

  /**
   * ================================================
   * Function-specific utilities
   * ================================================
   */

  /**
   * Disable a function from ever running the function via the wrapper
   * @return {Object}
   */
  WrapObject.prototype.neverRun = function() {
    var fn = this.rawItem;
    if (!isFunction(fn)) return this;
    fn._wNoRun = true;
    return this;
  };

  /**
   * Run the function
   * @param  {Object} bind
   * @return {Object}
   */
  WrapObject.prototype.run = function(bind) {
    var fn = this.rawItem;
    if (!isFunction(fn)) return this;
    var fnArgs = this.initArgs;
    if (fn._wNoRun) return;
    fn.apply(bind || this.target || null, fnArgs);
    return this;
  };

  /**
   * Run all the functions
   * @param  {Object} bind
   * @return {Object}
   */
  WrapObject.prototype.runAll = function(bind) {
    var fnData = this.rawItem;
    var _this = this;
    if (!isArray(fnData)) return this;
    fnData.map(function(fnArgs) {
      var obj = Empower.apply(null || _this.target, [fnArgs]);
      obj.run(bind || _this.target);
    });
    return this;
  };

  

  /**
   * Run the function after a duration
   * @param  {Number} duration
   * @param  {Object} bind
   * @return {Object}
   */
  WrapObject.prototype.runAfter = function(duration, bind) {
    var _this = this;
    setTimeout(function() {
      _this.run(bind || _this.target);
    }, duration);
    return this;
  };

  /**
   * Run the function every specific interval
   * @param  {Number} duration
   * @param  {Object} bind
   * @return {Object}
   */
  WrapObject.prototype.runAfterEvery = function(duration, bind) {
    var _this = this;
    this.runIntervals.push(setInterval(function() {
      _this.run(bind || _this.target);
    }, duration));
    return this;
  };

  /**
   * Run all functions after a duration
   * @param  {Number} duration
   * @param  {Object} bind
   * @return {Object}
   */
  WrapObject.prototype.runAllAfter = function(duration, bind) {
    var fnData = this.rawItem;
    var _this = this;
    if (!isArray(fnData)) return this;
    fnData.map(function(fnArgs) {
      var obj = Empower.apply(null || _this.target, [fnArgs]);
      obj.runAfter(duration, bind);
      _this.subWraps.push(obj);
    });
    return this;
  };

  /**
   * Run all functions after every specific interval
   * @param  {Number} duration
   * @param  {Object} bind
   * @return {Object}
   */
  WrapObject.prototype.runAllAfterEvery = function(duration, bind) {
    var fnData = this.rawItem;
    var _this = this;
    if (!isArray(fnData)) return this;
    fnData.map(function(fnArgs) {
      var obj = Empower.apply(null, fnArgs);
      obj.runAfterEvery(duration, bind || _this.target);
      _this.subWraps.push(obj);
    });
    return this;
  };

  /**
   * Run the function only once via the wrapper
   * @param  {Object} bind
   * @return {Object}
   */
  WrapObject.prototype.runOnce = function(bind) {
    var fn = this.rawItem;
    if (fn._wNoRun) return;
    this.run(bind || _this.target);
    fn._wNoRun = true;
    return this;
  };

  /**
   * Run all the functions only once via the wrapper
   * @param  {Object} bind
   * @return {Object}
   */
  WrapObject.prototype.runAllOnce = function(bind) {
    var fnData = this.rawItem;
    var _this = this;
    if (!isArray(fnData)) return this;
    fnData.map(function(fnArgs) {
      var obj = Empower.apply(null, fnArgs);
      obj.runOnce(bind || _this.target);
    });
    return this;
  };

  WrapObject.prototype.cancelRuns = function() {
    var intervals = this.runIntervals;
    var wraps = this.subWraps;
    intervals.map(function(interval) {
      clearInterval(interval);
    });
    wraps.map(function(wrap) {
      wrap.cancelRuns();
    });
    return this;
  };

  /**
   * ================================================
   * Object-specific utilities
   * ================================================
   */

  /**
   * Convert an object into an array, losing the keys to a local "keys" variable
   * @return {Object}
   */
  WrapObject.prototype.toArray = function() {
    var obj = this.rawItem;
    if (!isObject(obj)) return this;
    var arr = [];
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        arr.push(obj[i]);
      }
    }
    this.keys = Object.keys(obj);
    this.rawItem = arr;
    this.updateProp();
    return this;
  };

  /**
   * Exclude properties of the passed object, from the current object (object subtraction)
   * @param  {Object} obj2
   * @return {Object}
   */
  WrapObject.prototype.exclude = function(obj2) {
    var obj = this.rawItem;
    for (var i in obj2) {
      if (obj.hasOwnProperty(i)) {
        delete obj[i];
      }
    }
    this.rawItem = obj;
    this.updateProp();
    return this;
  };

  /**
   * Exclude properties of the passed object, from the current object (object subtraction)
   * @param  {Object} obj2
   * @return {Object}
   */
  WrapObject.prototype.keep = function(properties) {
    var obj = this.rawItem;
    var props = Object.keys(obj);
    for (var i in props) {
      if (properties.indexOf(props[i]) === -1) {
        delete obj[props[i]];
      }
    }
    this.rawItem = obj;
    this.updateProp();
    return this;
  };

  /**
   * Exclude properties of the passed object, from the current object (object subtraction)
   * @param  {Object} obj2
   * @return {Object}
   */
  WrapObject.prototype.remove = function(properties) {
    var obj = this.rawItem;
    for (var i in properties) {
      delete obj[properties[i]];
    }
    this.rawItem = obj;
    this.updateProp();
    return this;
  };

  /**
   * Wipe an object clean, removing all its properties
   * @return {Object}
   */
  WrapObject.prototype.wipe = function() {
    var obj = this.rawItem;
    if (!isObject(obj) && !isArray(obj)) return this;
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        delete obj[i];
      }
    }
    this.updateProp();
    return this;
  };

  /**
   * Safely extend from another object, only if properties do not exist in the current obj
   * @param  {Object} obj2
   * @return {Object}
   */
  WrapObject.prototype.extendSafely = function(obj2) {
    var obj = this.rawItem;
    if (!isObject(obj)) return this;
    if (!isObject(obj2)) return this;
    for (var i in obj2) {
      if (obj[i] === undefined) {
        obj[i] = obj2[i];
      }
    }
    this.updateProp();
    return this;
  };

  /**
   * Delete all null properties
   * @return {Object}
   */
  WrapObject.prototype.cleanNulls = function() {
    var obj = this.rawItem;
    for (var i in obj) {
      if (obj[i] === null) delete obj[i];
    }
    this.updateProp();
    return this;
  };

  /**
   * Delete all undefined properties
   * @return {Object}
   */
  WrapObject.prototype.cleanUndefined = function() {
    var obj = this.rawItem;
    for (var i in obj) {
      if (obj[i] === undefined) delete obj[i];
    }
    this.updateProp();
    return this;
  };

  /**
   * Delete all undefined and null properties
   * @return {Object}
   */
  WrapObject.prototype.clean = function() {
    this.cleanNulls();
    this.cleanUndefined();
    return this;
  };

  /**
   * ================================================
   * Array-specific utilities
   * ================================================
   */

  /**
   * Convert an array to an object, with the index being its keys
   * @return {Object}
   */
  WrapObject.prototype.toObject = function() {
    var arr = this.rawItem;
    if (!isArray(arr)) return this;
    var obj = {};
    for (var i in arr) {
      obj[i] = arr[i];
    }
    this.rawItem = obj;
    this.updateProp();
    return this;
  };

  WrapObject.prototype.setFactory = function(prop) {
    return function(value) {
      this.rawItem[prop] = value;
    }
  };

  WrapObject.prototype.getFactory = function(prop) {
    return function() {
      return this.rawItem[prop];
    }
  };



  /**
   * ================================================
   * Local helpers
   * ================================================
   */

  /**
   * Whether the param is a String or not
   * @param  {Object}  str
   * @return {Boolean}
   */
  function isString(str) {
    return str.constructor.name === 'String'
  }

  /**
   * Whether the param is an Array or not
   * @param  {Object}  str
   * @return {Boolean}
   */
  function isArray(str) {
    return str.constructor.name === 'Array';
  }

  /**
   * Whether the param is a function or not
   * @param  {Function} fn
   * @return {Boolean}
   */
  function isFunction(fn) {
    return typeof fn === 'function';
  }

  /**
   * Whether the param is an object or not
   * @param  {Object}  arg
   * @return {Boolean}
   */
  function isObject(arg) {
    if (typeof arg == 'undefined' || arg == null) return false;
    return arg.constructor.name === 'Object';
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Empower;
  } else {
    if (typeof define === 'function' && define.amd) {
      define([], function() {
        return Empower;
      });
    }
    else {
      window.Empower = Empower;
    }
  }
})();