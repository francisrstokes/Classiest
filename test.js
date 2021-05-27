const test = require('tape');
const {
  Classiest,
  tcomb
} = require('./src');

const setX = tag => function (x) {
  this.x = x;
  this.tag = tag;
};

const setXY = tag => function (x, y) {
  this.x = x;
  this.y = y;
  this.tag = tag;
};

const setNum = setX('num');
const setStr = setX('str');

test('Empty Class', t => {
  const C = Classiest('C', () => ({}));
  t.ok(new C());
  t.end();
});

test('Class Name Validity', t => {
  t.throws(() => Classiest('2sg', () => ({})), /Invalid/);
  t.end();
});

test('Single Constructor', t => {
  t.plan(1);
  const C = Classiest('C', () => ({
    constructors: [
      {
        args: [],
        fn: function() {
          this.x = 1;
        }
      }
    ]
  }));
  const c = new C();
  t.same(c.x, 1);
});

test('Single Constructor (1 argument)', t => {
  const C = Classiest('C', () => ({
    constructors: [
      { args: [tcomb.Number], fn: setNum }
    ]
  }));
  const c = new C(5);

  t.same(c.x, 5);
  t.throws(() => new C());
  t.end();
});

test('Multiple dynamic dispatch', t => {
  const C = Classiest('C', () => ({
    constructors: [
      { args: [tcomb.Number], fn: setNum },
      { args: [tcomb.String], fn: setStr },
    ]
  }));
  const c = new C(5);
  t.same(c.x, 5);
  t.same(c.tag, 'num');

  const c2 = new C('hey');
  t.same(c2.x, 'hey');
  t.same(c2.tag, 'str');

  t.end();
});

test('Multiple dynamic dispatch 2', t => {
  const C = Classiest('C', () => ({
    constructors: [
      { args: [tcomb.Number], fn: setNum },
      { args: [tcomb.String, tcomb.Number], fn: setXY('strNum') },
    ]
  }));
  const c = new C(5);
  t.same(c.x, 5);
  t.same(c.tag, 'num');

  const c2 = new C('hey', 4);
  t.same(c2.x, 'hey');
  t.same(c2.y, 4);
  t.same(c2.tag, 'strNum');

  t.end();
});

test('Class reference and type', t => {
  let typeRef;
  let classRef;

  const C = Classiest('C', (ClassRef, TypeRef) => {
    typeRef = TypeRef;
    classRef = ClassRef;
    return {};
  });
  const c = new C();

  t.true(C === classRef);
  t.true(typeRef.is(c));

  t.end();
});

test('Non-overloaded methods', t => {
  const C = Classiest('C', () => ({
    methods: {
      blerg: setX('num')
    }
  }));
  const c = new C();

  c.blerg();
  t.same(c.x, undefined);
  t.same(c.tag, 'num');

  c.blerg(42);
  t.same(c.x, 42);

  t.end();
});

test('Overloaded methods', t => {
  const C = Classiest('C', () => ({
    methods: {
      blerg: [
        { args: [tcomb.Number], fn: setX('num') },
        { args: [tcomb.String], fn: setX('str') },
      ]
    }
  }));

  const c = new C();
  t.throws(() => c.blerg());
  t.throws(() => c.blerg(true));
  t.doesNotThrow(() => c.blerg(42));
  t.doesNotThrow(() => c.blerg('hey'));

  t.end();
});

test('Getters', t => {
  const C = Classiest('C', () => ({
    getters: {
      x: function () { return 42; },
      y: function () { return this.x + 58; }
    }
  }));
  const c = new C();

  t.same(c.x, 42);
  t.same(c.y, 100);
  t.end();
});

test('Setters', t => {
  let o1Called = false;
  let o2Called = false;

  const C = Classiest('C', () => ({
    getters: {
      val: function () { return this._val; },
      valType: function () { return this._valType; }
    },

    setters: {
      val: function (v) {
        this._val = v;
        this._valType = typeof v;
        return v;
      },
      example: [
        { args: [tcomb.Boolean], fn: function() { o1Called = true; } },
        { args: [tcomb.Any], fn: function() { o2Called = true; } },
      ]
    },
  }));
  const c = new C();

  t.same(c.val, undefined);
  t.same(c.valType, undefined);

  c.val = 42;
  t.same(c.val, 42);
  t.same(c.valType, 'number');

  c.val = 'hello';
  t.same(c.val, 'hello');
  t.same(c.valType, 'string');

  t.false(o1Called);
  t.false(o2Called);

  c.example = false;
  t.true(o1Called);
  t.false(o2Called);

  c.example = null;
  t.true(o1Called);
  t.true(o2Called);

  t.end();
});

test('Statics', t => {
  let o1Called = false;
  let o2Called = false;
  let o3Called = false;
  let o4Called = false;

  const C = Classiest('C', () => ({
    statics: {
      hello: [
        { args: [tcomb.Number], fn: function () { o1Called = true; } },
        { args: [tcomb.String, tcomb.Boolean], fn: function () { o2Called = true; } },
        { args: [], fn: function () { o3Called = true; } },
      ],
      world: function () { o4Called = true; }
    }
  }));

  t.false(o1Called);
  t.false(o2Called);
  t.false(o3Called);
  t.false(o4Called);

  C.hello(1);
  t.true(o1Called);
  t.false(o2Called);
  t.false(o3Called);
  t.false(o4Called);

  C.hello('a', false);
  t.true(o2Called);
  t.false(o3Called);
  t.false(o4Called);

  C.hello();
  t.true(o3Called);
  t.false(o4Called);

  C.world();
  t.true(o4Called);

  t.end();
});