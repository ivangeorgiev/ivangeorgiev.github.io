(function (context) {
    var $s = selectJs;
    
    describe('selectJs.shiftField', function() {
        it('should shift fields forward', function() {
            var data = [{ i:1, k:'a' }, {i:2, k:'b'}, {i:3, k:'c'}],
                expected = [{ i:2, k:'a' }, {i:3, k:'b'}];
                
            expect($s.shiftField).to.be.a(Function);
            expect($s.shiftField(data, 'k', 1)).to.eql(expected);
        });
        it('should shift fields backward', function() {
            var data = [{ i:1, k:'a' }, {i:2, k:'b'}, {i:3, k:'c'}],
                expected = [{ i:1, k:'b' }, {i:2, k:'c'}];
                
            expect($s.shiftField).to.be.a(Function);
            expect($s.shiftField(data, 'k', -1)).to.eql(expected);
        });
    });
})(window);
