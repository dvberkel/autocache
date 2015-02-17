var Cache = (function (root) {
  'use strict';

  var storeSignature = '-store-signature';

  function MemoryStore() {
    this.data = {};
  }

  MemoryStore.prototype = {
    get: function (key, callback) {
      // setTimeout(function () {
      callback(null, this.data[key]);
      // }.bind(this));
    },
    set: function (key, value, callback) {
      this.data[key] = value;
      if (callback) {
        callback(null, null);
      }
    },
    destroy: function (key, callback) {
      delete this.data[key];
      if (callback) {
        callback();
      }
    }
  };

  function Cache(options) {
    if (!this || this === global) {
      return new Cache(options);
    }

    // TODO self invoke
    if (options === undefined) {
      options = {};
    }

    this.store = options.store;
    if (!this.store) {
      this.store = new MemoryStore();
    }

    return this;
  }

  function define(key, callback) {
    this.store.set(key + storeSignature, callback.toString());
  }

  function update(key, callback) {
    var cache = this;
    cache.store.get(key + storeSignature, function (error, code) {
      if (error) {
        return callback(error)
      }

      if (!code) {
        return callback(new Error('No definition found'));
      }

      try {
        var fn = eval('(' + code + ')');
        if (fn.length) {
          fn(function (result) {
            cache.store.set(key, result, function () {
              callback(null, result);
            });
          });
        } else {
          var result = fn();
          cache.store.set(key, result, function () {
            callback(null, result);
          });
        }
      } catch (e) {
        callback(e);
      }
    });
  }

  function get(key, callback) {
    this.store.get(key, function (error, result) {
      if (error) {
        return callback(error);
      }

      if (!error && result === undefined) {
        // update
        return this.update(key, callback);
      }

      callback(null, result);
    }.bind(this));
  }

  function clear(key, callback) {
    this.store.destroy(key, callback);
  }

  function destroy(key, callback) {
    var cache = this;
    cache.store.destroy(key + storeSignature, function () {
      cache.store.destroy(key, callback);
    });
  }

  Cache.prototype = {
    clear: clear,
    define: define,
    destroy: destroy,
    get: get,
    update: update // internal function
  };

  return Cache;
})(this);

if (typeof exports !== 'undefined') {
  module.exports = Cache;
}