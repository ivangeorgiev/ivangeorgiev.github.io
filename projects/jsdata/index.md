---
title: JS Data - Data Analysis in JavaScript 
layout: default
---

## Resources:

* http://learnjsdata.com/


$q.SELECT('name', aggregation_function)
   .FROM(array,accesor)
   .WHERE(function(d) { d.age > 21; })
   .GROUPBY('name');

   
```javascript
/**
 * TODO: Make cols paramter optional.
 * Probably we can improve efficiency if instead of iterating over columns, generate a function. 
 */
function calcFreq(data, cols, access) {
    if (! Array.isArray(cols)) {
        cols = cols.split(',').filter(trim);
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
}
```
