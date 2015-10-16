/**
 * Some useful piecesl from Ivan Georgiev
 */
(function(exports) {
    var selectJs = (exports.selectJs === undefined) ? {} : exports.selectJs,
        $s = (exports.$s === undefined) ? selectJs : exports.$s
    exports.$s = $s;
    exports.selectJs = selectJs;
    
    selectJs.freq = freq;
    selectJs.groupBy = groupBy;
    
    selectJs.identity = identity;
    selectJs.property = property;
    selectJs.each = selectJs.forEach = each;
    selectJs.keys = Object.keys;
    selectJs.shiftField = shiftField;
    
    ['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'].forEach(function(name) {
        selectJs['is' + name] = function(obj) {
          return toString.call(obj) === '[object ' + name + ']';
        };
    });

    function identity(v) { return v; }
    
    function freq(data, cols, access) {
        if (! Array.isArray(cols)) {
            cols = cols.split(',').filter(function(a) { return toString(a).trim; });
        }
        
        if ( access === undefined ) access = getProperty;
        var fr = {};
        cols.forEach(initColStats);
        data.forEach(processRow);
        return fr;
        
        function getProperty(obj, prop) { return obj[prop]; }
        
        function initColStats(c) {
            fr[c] = {
                v: Object.create(null),
                c: 0
            };
        }
        
        function processRow(r) {
            function processCol(c) {
                var val = access(r,c);
                if (val in fr[c].v) fr[c].v[val]++;
                else fr[c].v[val] = 1;
                fr[c].c++;
            }
            cols.forEach(processCol);
        }
    };

    // groupBy(values, function(r) { return r.tstart }, function(r, newRow, key) { newRow.count = (newRow.count === undefined) ? 1 : newRow.count + 1; newRow.key = key; return newRow; });
    function groupBy(data, groupExpr, makeRow, postGroup) {
        var grouped = {}, result = [];
        data.forEach(function(r) {
            var key = groupExpr(r),
                groupRow = grouped[key];
            if (groupRow == undefined) groupRow = {};
            grouped[key] = makeRow(r, groupRow, key);
        });
        var context = {};
        for (var key in grouped) {
            var r = grouped[key];
            if (postGroup !== undefined) r = postGroup(r, context);
            result.push(r);
        }
        return result;
    }
        
    function property(key) {
        return function(obj) {
            return obj == null ? void 0 : obj[key];
        };
    };

    
    function shiftField(data, field, step) {
        var shiftedData = [], i, j, rec,
            fields = field.split(',').map(function(f) { return f.trim(); });
        for (i = 0; i < data.length; i++) {
            j = i + step;
            if (j < 0 || j >= data.length) continue;
            rec = _.clone(data[j]);
            fields.forEach(shiftCurrent);
            shiftedData.push(rec);
        }
        return shiftedData;
        
        function shiftCurrent(f) {
            rec[f] = data[i][f];
        }
    };
    
    // Helper for collection methods to determine whether a collection
    // should be iterated as an array or as an object
    // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
    // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
    var getLength = property('length');
    var isArrayLike = function(collection) {
        var length = getLength(collection);
        return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };

    // Collection Functions
    // --------------------

    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles raw objects in addition to array-likes. Treats all
    // sparse array-likes as if they were dense.
    function each(obj, iteratee, context) {
        iteratee = optimizeCb(iteratee, context);
        var i, length;
        if (isArrayLike(obj)) {
          for (i = 0, length = obj.length; i < length; i++) {
            iteratee(obj[i], i, obj);
          }
        } else {
          var keys = Object.keys(obj);
          for (i = 0, length = keys.length; i < length; i++) {
            iteratee(obj[keys[i]], keys[i], obj);
          }
        }
        return obj;
    };
    

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };


})(window);