(function test_SelectJs_agg(context) {
    var $s = selectJs;
    
    describe('selectJs.agg', function() {
        it('should exist', function() {
            expect($s.agg).not.to.be(undefined);
        });
        var $a = $s.agg;
        
        describe('.groupBy', function() {
            it('should be Function', function() {
                expect($a.groupBy).not.to.be(undefined);
                expect($a.groupBy).to.be.a(Function);
            });
            
            it('shoiuld group by property', function() {
                var res = $a.groupBy(['one', 'two', 'three'], 'length');
                expect(res).to.be.eql({3: ["one", "two"], 5: ["three"]});
            });
            
            it('shoiuld group by function', function() {
                var res = $a.groupBy([1.3, 2.1, 2.4], function(num){ return Math.floor(num); });
                expect(res).to.be.eql({1: [1.3], 2: [2.1, 2.4]});
            });
        });
        
        
        describe('.func', function() {
            
            
            it('should be a Function', function() {
                expect($a.func).not.to.be(undefined);
                expect($a.func).to.be.a(Function);
            });
            
            it('should return a function', function() {
                var res = $a.func('name', myAgg);
                expect(res).to.be.a(Function);

                function myAgg(field, inRow, memo) {
                }
            });
            
            it('returned function calls passed function with argumens', function(done) {
                var rec = {'age': 32},
                    ctx = {},
                    f = $a.func('age', myAgg);
                f(rec, 0, ctx);
                
                function myAgg(field, inRow, memo, context) {
                    expect(field).to.eql('age');
                    expect(inRow).to.be(rec);
                    expect(memo).to.be(0);
                    expect(context).to.be(ctx);
                    done();
                }
            });
        });
        
        
        /* ---------------------- .aggregate --------------------------- */
        describe('.aggregate', function() {
        
            it('should be Function', function() {
                expect($a.aggregate).not.to.be(undefined);
                expect($a.aggregate).to.be.a(Function);
            });
            
            it('should be aliased as .agg', function() {
                expect($a.agg).to.be($a.aggregate);
            });
            
            it('should return array', function() {
                var res = $a.agg({3: ["one", "two"], 5: ["three"]});
                expect(res).to.be.an('array');
            });
            
            it('should call the function', function(done) {
                var data = {3: ["one", "two"], 5: ["three"]},
                    callIndex = 0,
                    expected = [
                        [undefined, "one", 0, data['3'], data, 3],
                        [1, "two", 1, data['3'], data, 3],
                        [undefined, "three", 0, data['5'], data, 5]
                    ];
                var res = $a.agg(data, {'fld': myAgg});
                expect(res).to.be.an('array');
                
                function myAgg(memo, subject, index, group, ctx) {
                    expect(memo).to.be(expected[callIndex][0]);
                    expect(subject).to.be(expected[callIndex][1]);
                    expect(index).to.be(expected[callIndex][2]);
                    expect(group).to.be(expected[callIndex][3]);
                    expect(ctx['group']).to.eql(expected[callIndex][5]); // Loose equal!!!

                    if (++callIndex === expected.length) done();
                    return callIndex;
                }
            });
            
            it('should return aggregate results', function() {
                var data = {3: ["one", "two"], 5: ["three"]};
                
                var res = $a.agg(data, {'k': myAgg});
                var expected = [{k:3},{k:5}];
                
                expect(res).to.eql(expected);
                
                function myAgg(memo, subject, index, group, ctx) {
                    return ctx.group;
                }
            });
        });
        
        
        /* ---------------------- .sum --------------------------- */
        describe('.sum', function() {
            it('should be defined', function() {
                expect($a.sum).not.to.be(undefined);
            });
            
            it('should return current value with no memory (undefined)', function() {
                var memory = undefined,
                    res = $a.sum(false, memory, 3);
                expect(res).to.be(3);
            });
            
            it('should return sum of current value and memory', function() {
                var memory = 3,
                    res = $a.sum(undefined, memory, 2);
                expect(res).to.be(5);
            });
            
            it('should return sum of current property value and memory', function() {
                var res = $a.sum('num', 3, {num:2});
                expect(res).to.be(5);
            });
            
            describe('.sum.field()', function() {
                it('should exist', function() {
                    expect($a.sum.field).not.to.be(undefined);
                });
                it('should return function', function() {
                    var res = $a.sum.field('age');
                    expect(res).to.be.a(Function);
                });
                it('should return function which sums properties', function() {
                    var func = $a.sum.field('age'),
                        record = {'age': 25},
                        res = func(5, record);
                    expect(res).to.equal(30);
                });
                it('should return function which sums values', function() {
                    var func = $a.sum.field(false),
                        res = func(5, 15);
                    expect(res).to.equal(20);
                });
            });
        });
        
        /* ---------------------- .count --------------------------- */
        describe('.count', function() {
            it('should be defined', function() {
                expect($a.count).not.to.be(undefined);
            });
            
            it('should return 1 with no memory (undefined)', function() {
                var memory = undefined,
                    res = $a.count(false, memory, 3);
                expect(res).to.be(1);
            });
            
            it('should return memory + 1', function() {
                var memory = 3,
                    res = $a.count(false, memory);
                expect(res).to.be(4);
            });
            
            
            describe('.count.field()', function() {
                it('should exist', function() {
                    expect($a.count.field).not.to.be(undefined);
                });
                it('should return function', function() {
                    var res = $a.count.field(false);
                    expect(res).to.be.a(Function);
                });
                it('should return function which counts records', function() {
                    var func = $a.count.field('age'),
                        record = {'age': 25},
                        res = func(3, record);
                    expect(res).to.equal(4);
                });
                it('should return function which counts values', function() {
                    var func = $a.count.field(false),
                        res = func(5, 15);
                    expect(res).to.equal(6);
                });
            });
        });


        /* ---------------------- .min --------------------------- */
        describe('.min', function() {
            it('should be defined', function() {
                expect($a.min).not.to.be(undefined);
            });

            it('should return value with no memory (undefined)', function() {
                var memory = undefined,
                    res = $a.min(false, memory, 3);
                expect(res).to.be(3);
            });
            
            it('should return property with no memory (undefined)', function() {
                var memory = undefined,
                    res = $a.min('age', memory, {'age': 16});
                expect(res).to.equal(16);
            });
            
            it('should return minimum between memory and value', function() {
                var memory = 3;
                expect($a.min(false, memory, 5)).to.be(3);
                expect($a.min(false, memory, 1)).to.be(1);
                expect($a.min(false, memory, 3)).to.be(3);
            });
            
            it('should return minimum between memory and field', function() {
                var memory = 20;
                expect($a.min('age', memory, {age:25})).to.be(20);
                expect($a.min('age', memory, {age:15})).to.be(15);
                expect($a.min('age', memory, {age:20})).to.be(20);
            });
            
            
            describe('.min.field()', function() {
                it('should return function which finds minium value', function() {
                    expect($a.min.field).to.be.a(Function);
                    
                    var func = $a.min.field(false);
                    
                    expect(func).to.be.a(Function);
                    expect(func(5, 3)).to.equal(3);
                });
                it('should return function which finds minium property', function() {
                    var func = $a.min.field('age'),
                        memory = 95;
                    expect(func(memory, {age: 26})).to.equal(26);
                });
            });

        });

        /* ---------------------- .max --------------------------- */
        describe('.max', function() {
            it('should return value with no memory (undefined)', function() {
                expect($a.min).to.be.a(Function);
                var memory = undefined,
                    res = $a.max(false, memory, 5);
                expect(res).to.be(5);
            });
            
            it('should return property with no memory (undefined)', function() {
                var memory = undefined,
                    res = $a.max('age', memory, {'age': 10});
                expect(res).to.equal(10);
            });
            
            it('should return maximum between memory and value', function() {
                var memory = 13;
                expect($a.max(false, memory, 15)).to.be(15);
                expect($a.max(false, memory, 11)).to.be(13);
                expect($a.max(false, memory, 13)).to.be(13);
            });
            
            it('should return maximum between memory and field', function() {
                var memory = 60;
                expect($a.max('age', memory, {age:65})).to.be(65);
                expect($a.max('age', memory, {age:55})).to.be(60);
                expect($a.max('age', memory, {age:60})).to.be(60);
            });
            
            
            describe('.max.field()', function() {
                it('should return function which finds maximum value', function() {
                    expect($a.max.field).to.be.a(Function);
                    
                    var func = $a.max.field(false);
                    
                    expect(func).to.be.a(Function);
                    expect(func(25, 33)).to.equal(33);
                });
                it('should return function which finds maximum property', function() {
                    var func = $a.max.field('age'),
                        memory = 95;
                    expect(func(memory, {age: 125})).to.equal(125);
                });
            });

        });

        /* ---------------------- .group --------------------------- */
        describe('.group', function() {
            it('should group from context', function() {
                expect($a.group).to.be.a(Function);
                expect($a.group(undefined, undefined, undefined, undefined, { group: 'name' })).to.eql('name');
            });
        });
        
    });
    
    
    it('should have methods that work in combination', function() {
        var group = $a.groupBy([1.3, 2.1, 2.4, 2.9, 2.0], function(num){ return Math.floor(num); });
        var rules = {
                group: $a.group,
                sum: $a.sum.field(),
                min: $a.min.field(),
                count: $a.count.field()
        };
        console.log(rules);
        var res = $a.aggregate(group, rules);
        expect(res).to.eql([
                { sum: 1.3, min: 1.3, count: 1, group: 1 },
                { sum: 9.4, min: 2.0, count: 4, group: 2 },
        ]);
    });
    
})(window);
