'use strict';

/**
 * Load Prerequisites
 */
var should = require('chai').should();
var empower = require('../empower');

var man = {
  name: 'superman',
  age: 0,
  fatness: 0,
  canFly: false,
  intellect: 100,
  hobby: null,
  height: undefined,
  history: ['born', 'migrated to earth'],
  jumped: false,
  father: {
    name: 'Zor-El'
  },
  grow: function() {
    this.age++;
  },
  jump: function() {
    this.jumped = true;
  },
  mature: function() {
    this.intellect++;
  },
  eat: function() {
    this.fatness++;
  },
  die: function() {
    this.age = 0;
    this.fatness = 0;
  },
  fly: function() {
    this.canFly = true;
  }
};

describe('System', function() {
  describe('Plugins', function() {
    beforeEach(function(done) {
      done();
    });

    describe('Wrap', function() {
      this.slow(300);

      it('should be a correct Wrap function', function() {
        empower.should.be.a('function');
      });

      it('should be a correct WrapObject', function() {
        empower('superman').should.be.an('object');
      });

      it('should return the raw value', function() {
        empower('superman').value().should.equal('superman');
      });

      it('should return the toString of the raw value', function() {
        empower('superman').toString().should.equal('superman'.toString());
      });

      it('should return the valueOf of the raw value', function() {
        empower('superman').valueOf().should.equal('superman'.valueOf());
      });

      it('should wrap a wrap object correctly', function() {
        var $man = empower(man);
        empower($man).value().name.should.equal('superman');
      });

      it('should wrap nested objects', function() {
        var $man = empower(man);
        $man.father.name.should.equal(man.father.name);
        $man.$father.name.should.equal(man.father.name);
        $man.$father.$name.valueOf().should.equal(man.father.name);
        $man.$father.$name.reverse().valueOf().should.equal(man.father.name);
      });

      it('should reverse a string', function() {
        empower('superman').reverse().value().should.equal('namrepus');
      });

      it('should reverse an array', function() {
        empower([1, 2]).reverse().value()[0].should.equal(2);
        empower([1, 2]).reverse().value()[1].should.equal(1);
        empower(man.history).reverse().value()[1].should.equal('born');
      });

      it('should space out a string', function() {
        empower('superman').spaceOut().value().should.equal('s u p e r m a n');
        empower('superman').spaceOut(2).value().should.equal('s  u  p  e  r  m  a  n');
        empower('superman').spaceOut(1, '_').value().should.equal('s_u_p_e_r_m_a_n');
      });

      it('should ensure suffix exists', function() {
        empower('superman').ensureSuffix('.txt').value().should.equal('superman.txt');
        empower('superman.txt').ensureSuffix('.txt').value().should.equal('superman.txt');
        empower({age: 20}).ensureSuffix('.txt').value().should.have.property('age');
      });

      it('should ensure prefix exists', function() {
        empower('superman').ensurePrefix('the').value().should.equal('thesuperman');
        empower('thesuperman').ensurePrefix('the').value().should.equal('thesuperman');
        empower({age: 20}).ensurePrefix('the').value().should.have.property('age');
      });

      it('should pluralize simple strings', function() {
        empower('human').pluralize().value().should.equal('humans');
        empower('buddy').pluralize().value().should.equal('buddies');
        empower('smile').pluralize().value().should.equal('smiles');
      });

      it('should singularize simple strings', function() {
        empower('humans').singularize().value().should.equal('human');
        empower('buddies').singularize().value().should.equal('buddy');
        empower('smiles').singularize().value().should.equal('smile');
      });

      it('should not space out anything else, but not throw errors', function() {
        empower({num: 10}).spaceOut().value().num.should.equal(10);
      });

      it('should run a simple function', function() {
        empower(man.grow).run(man);
        empower(man).run(man); //should do nothing
        man.age.should.equal(1);
      });

      it('should run multiple simple functions', function() {
        empower([man.grow, man.jump]).runAll(man);
        man.age.should.equal(2);
        man.jumped.should.be.true;
      });

      it('should not run a simple function after disabling it', function() {
        empower(man.fly).neverRun();
        empower(man.fly).run(man);
        empower(man).neverRun(); //should do nothing
        man.canFly.should.equal(false);
      });

      it('should run a simple function after 10s', function(next) {
        var initAge = man.age;
        empower(man.grow).runAfter(10, man);
        setTimeout(function() {
          man.age.should.equal(initAge + 1);
          next();
        }, 11);
      });

      it('should run all functions after 10s', function(next) {
        var one = 0;
        var two = 0;
        var three = 0;

        var allWrap = empower([
          increaseOne,
          increaseTwo,
          increaseThree
        ]);

        allWrap.runAllAfter(10);

        empower(increaseOne).runAllAfter(2); //should do nothing

        setTimeout(function() {
          one.should.to.equal(1);
          two.should.to.equal(1);
          three.should.to.equal(1);
          next();
        }, 11);

        function increaseOne() { one++; one = Math.min(one, 10);}
        function increaseTwo() { two++; two = Math.min(two, 10); }
        function increaseThree() { three++; three = Math.min(three, 10); }
      });

      it('should run a simple function only once', function() {
        var initFatness = man.fatness;
        empower(man.eat).runOnce(man);
        empower(man.eat).runOnce(man);
        empower(man.eat).runOnce(man);
        man.fatness.should.equal(initFatness + 1);
        empower(man.eat).run(man);
        man.fatness.should.equal(initFatness + 1);
      });

      it('should run all functions only once', function() {
        var one = 0;
        var two = 0;
        var three = 0;
        empower([
          [increaseOne],
          [increaseTwo],
          [increaseThree]
        ]).runAllOnce();

        one.should.to.equal(1);
        two.should.to.equal(1);
        three.should.to.equal(1);

        empower(increaseOne, increaseTwo).runAllOnce(); //should do nothing

        function increaseOne() { one++; }
        function increaseTwo() { two++; }
        function increaseThree() { three++; }
      });

      it('should repeat a function periodically, and cancel when needed', function(next) {
        var initIntellect = man.intellect;
        var maxIntellect = 110;

        var manWrap = empower(man.mature);
        manWrap.runAfterEvery(1, man);

        setTimeout(function() {
          var newIntellect = Math.min(man.intellect, maxIntellect);
          if (newIntellect !== maxIntellect) {
            return next('error ' + newIntellect);
          } else {
            manWrap.cancelRuns();
            var newRealIntellect = man.intellect;
            
            setTimeout(function() {
              newRealIntellect.should.equal(man.intellect);
              if (newRealIntellect >= man.intellect-3) {
                next();
              } else {
                next(newRealIntellect);
              }
            }, 10);
          }

        }, 50);
      });

      it('should run all functions periodically, and cancel when needed', function(next) {
        var one = 0;
        var two = 0;
        var three = 0;

        var allWrap = empower([
          [increaseOne],
          [increaseTwo],
          [increaseThree]
        ]);

        allWrap.runAllAfterEvery(2);

        empower(increaseOne).runAllAfterEvery(2); //should do nothing

        setTimeout(function() {
          allWrap.cancelRuns();
          one.should.to.equal(10);
          two.should.to.equal(10);
          three.should.to.equal(10);
          next();
        }, 80);

        function increaseOne() { one++; one = Math.min(one, 10);}
        function increaseTwo() { two++; two = Math.min(two, 10); }
        function increaseThree() { three++; three = Math.min(three, 10); }
      });

      it('should convert an object to an array', function() {
        var manWrap = empower(man);
        manWrap.toArray();
        empower('incorrect').toArray(); //should do nothing
        manWrap.value().should.be.an('array');
        manWrap.value()[0].should.equal('superman');
      });

      it('should convert an array to an object', function() {
        var arrWrap = empower(['hello', 'world']);
        arrWrap.toObject();
        empower('incorrect').toObject(); //should do nothing
        arrWrap.value().should.be.an('object');
        arrWrap.value()[0].should.equal('hello');
      });

      it('should exclude properties of passed object', function() {
        var manWrap = empower(man);
        manWrap.exclude({
          canFly: false,
          fly: function() {}
        });
        manWrap.value().should.not.have.property('canFly');
        manWrap.value().should.not.have.property('fly');
      });

      it('should keep properties in passed array', function() {
        var obj = {name: 'michael', age: 20};
        empower(obj).keep(['name']).value().should.not.have.property('age');
      });

      it('should remove properties in passed array', function() {
        var obj = {name: 'michael', age: 20};
        empower(obj).remove(['name']).value().should.have.property('age');
      });

      it('should wipe clean the object', function() {
        var animal = {name: 'tommy', type: 'dog'};
        var dogWrap = empower(animal);
        dogWrap.wipe();
        empower('hello').wipe(); //should do nothing
        dogWrap.value().should.not.have.property('name');
        dogWrap.value().should.not.have.property('type');
      });

      it('should extend safely', function() {
        var animal = {name: 'tommy', type: 'dog'};
        var animal2 = {name: 'pup', type: 'dog', isAnimal: true};
        var dogWrap = empower(animal);
        dogWrap.extendSafely(animal2);
        empower('hello').extendSafely({a: 10}); //should do nothing
        empower({a: 11}).extendSafely('world'); //should do nothing
        dogWrap.value().name.should.equal('tommy');
        dogWrap.value().type.should.equal('dog');
        dogWrap.value().isAnimal.should.equal(true);
      });

      it('should delete all null properties', function() {
        empower(man).cleanNulls();
        Object.keys(man).indexOf('hobby').should.equal(-1);
        Object.keys(man).indexOf('height').should.not.equal(-1);
      });

      it('should delete all undefined properties', function() {
        empower(man).cleanUndefined();
        Object.keys(man).indexOf('height').should.equal(-1);
      });

      it('should clean all undefined and null properties', function() {
        var obj = {a: null, b: undefined};
        empower(obj).clean();
        Object.keys(obj).indexOf('a').should.equal(-1);
        Object.keys(obj).indexOf('b').should.equal(-1);
        empower('test').clean(); //should do nothing
      });

    });
  });
});