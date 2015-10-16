/**
 * More staff from Ivan Georgiev
 *
 * Group and Aggregation Plugin for selectJs.
 *
 * Tests in test/ directory
 */
(function(exports) {
    var selectJs = (exports.selectJs === undefined) ? {} : exports.selectJs,
        $s = (exports.$s === undefined) ? selectJs : exports.$s
        $a = {},
        selectJs.agg = $a;
    
    exports.$s = $s;
    exports.selectJs = selectJs;
    
    // ----------------------- Interface -------------------------
    $a.groupBy = groupBy;
    $a.func = func;
    $a.aggregate = aggregate;
    $a.agg = aggregate;
    $a.count = count;
    $a.sum = sum;
    $a.min = min;
    $a.max = max;
    $a.group = group;

    // ----------------------- Implementation -------------------------

    function func(name, func) {
        func = _.iteratee(func);
        return function(inRow, memo, groupContext) { return func(name, inRow, memo, groupContext); }
    }
    
    /**
     * groupBy(list, iteratee, [context]) 
     */
    function groupBy(list, key, context) { return _.groupBy(list, key, context); }
    
    /**
     * groupBy(groupedList, { 'outField': aggregateFunction});
     * aggregateFunction(memory, subject, index_in_group, group, ctx);
     */
    function aggregate(groups, aggregates) {
        var res = [],
            ctx = {};
        _.each(groups, function(group, key, all) {
            var outRow = Object.create(null);
            group.forEach(function(inRow, index) {
                ctx.group = key;
                _.each(aggregates, function(cb, field) {
                    outRow[field] = cb(outRow[field], inRow, index, group, ctx);
                });
            });
            res.push(outRow);
        });
        return res;
        
    }
    
    function fieldAggregator(fld, func) {
        return function(memory, subject, index, group, ctx) {
            return func(fld, memory, subject, index, group, ctx);
        }
    }
    
    function sum(key, memory, row) {
        var value = (key === undefined) || (key === false) || (key === null) 
                    ? row : row[key];
        if ( memory === undefined ) return value;
        else return memory + value;
    }
    sum.field = function(fld) { return fieldAggregator(fld, sum); };

    function min(key, memory, row) {
        var value = (key === undefined) || (key === false) || (key === null) 
                    ? row : row[key];
        if ( memory === undefined ) return value;
        else return memory > value ? value : memory;
    }
    min.field = function(fld) { return fieldAggregator(fld, min); };

    function max(key, memory, row) {
        var value = (key === undefined) || (key === false) || (key === null) 
                    ? row : row[key];
        if ( memory === undefined ) return value;
        else return memory < value ? value : memory;
    }
    max.field = function(fld) { return fieldAggregator(fld, max); };

    function count(key, memory, row) {
        if ( memory === undefined ) return 1;
        else return memory + 1;
    }
    count.field = function(fld) { return fieldAggregator(fld, count); };

    function group(memory, row, index, group, ctx) {
        return ctx.group;
    }
    
})(window);