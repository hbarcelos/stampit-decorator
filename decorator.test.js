import test from 'ava';
import td from 'testdouble';
import stampit from '@stamp/it';
import Decorator from './decorator';

test('Composability', t => {
  const actual = typeof stampit.compose(Decorator).compose;
  const expected = 'function';

  t.is(actual, expected, 'should be composable');
});

test('[decorateMethods] exists', t => {
  const actual = typeof Decorator.decorateMethods;
  const expected = 'function';

  t.is(actual, expected, 'should implement the decoreateMethods method');
});

test('[decorateMethods] is chainable', t => {
  const actual = typeof Decorator.decorateMethods().decorateMethods;
  const expected = 'function';

  t.is(actual, expected, 'decorateMethods should be chainable');
});

test('[decorateMethod] exists', t => {
  const actual = typeof Decorator.decorateMethod;
  const expected = 'function';

  t.is(actual, expected, 'should implement the decoreateMethod method');
});

test('[decorateMethod] is chainable', t => {
  const actual = typeof Decorator.decorateMethod(
    'dummyMethod',
    function newDummyMethod() {}
  ).decorateMethod;
  const expected = 'function';

  t.is(actual, expected, 'decorateMethod should be chainable');
});

test('[decorateMethod] unexistent decoratee method', t => {
  const Stamp = stampit
    .compose(Decorator)
    .decorateMethod('dummyMethod', function newDummyMethod() {});

  const actual = Stamp().dummyMethod;
  const expected = undefined;

  t.is(actual, expected, 'should not create the decorated method');
});

test('[decorateMethod] decorated method type', t => {
  const Stamp = stampit
    .methods({ dummyMethod() {} })
    .compose(Decorator)
    .decorateMethod('dummyMethod', function newDummyMethod() {});

  const actual = typeof Stamp().dummyMethod;
  const expected = 'function';

  t.is(actual, expected, 'decorated method should still be a function');
});

test('[decorateMethod] decorated method arity', t => {
  function dummyMethod() {}

  const Stamp = stampit
    .methods({ dummyMethod })
    .compose(Decorator)
    .decorateMethod('dummyMethod', function newDummyMethod() {});

  const actual = Stamp().dummyMethod.length;
  const expected = dummyMethod.length;

  t.is(actual, expected, 'should have the same arity as the decoratee method');
});

test('[decorateMethod] decorator function has access to the decoratee method', t => {
  const methodDecorator = td.function();
  const base = { dummyMethod() {} };

  const Stamp = stampit
    .methods(base)
    .compose(Decorator)
    .decorateMethod('dummyMethod', methodDecorator);

  Stamp().dummyMethod();

  td.verify(
    methodDecorator(
      td.matchers.contains({
        decoratee: td.matchers.isA(Function),
      })
    ),
    { ignoreExtraArgs: true },
    'should call the decorator function with an object containing the decoratee function as the first parameter'
  );
  t.pass();
});

test('[decorateMethod] decorator param .decoratee binding', t => {
  const Stamp = stampit
    .compose(
      Decorator,
      {
        props: { foo: 'bar' },
        methods: {
          dummyMethod() {
            return this.foo;
          },
        },
      }
    )
    .decorateMethod('dummyMethod', function decorator({ decoratee }) {
      return decoratee();
    });

  const actual = Stamp().dummyMethod();
  const expected = 'bar';

  t.deepEqual(
    actual,
    expected,
    'decoratee function should be bound to the instance'
  );
});

test('[decorateMethod] decorator changes decoratee result', t => {
  const Stamp = stampit
    .compose(
      Decorator,
      {
        props: { a: 1 },
        methods: {
          getA() {
            return this.a;
          },
        },
      }
    )
    .decorateMethod('getA', function plusOne({ decoratee }) {
      return decoratee() + 1;
    });

  const actual = Stamp().getA();
  const expected = 2;

  t.deepEqual(actual, expected);
});

test('[decorateMethod] decorator changes decoratee arguments', t => {
  const Stamp = stampit
    .compose(
      Decorator,
      {
        methods: {
          echo(x) {
            return x;
          },
        },
      }
    )
    .decorateMethod('echo', function plusTwo({ decoratee }, x) {
      return decoratee(x + 2);
    });

  const actual = Stamp().echo(1);
  const expected = 3;

  t.deepEqual(actual, expected);
});

test('[decorateMethod] chained multiple decorators changes decoratee result', t => {
  const Stamp = stampit
    .compose(
      Decorator,
      {
        props: { a: 1 },
        methods: {
          getA() {
            return this.a;
          },
        },
      }
    )
    .decorateMethod('getA', function plusTwo({ decoratee }) {
      return decoratee() + 2;
    })
    .decorateMethod('getA', function plusThree({ decoratee }) {
      return decoratee() + 3;
    });

  const actual = Stamp().getA();
  const expected = 6;

  t.deepEqual(actual, expected);
});

test('[decorateMethod] chained multiple decorators changes decoratee arguments', t => {
  const Stamp = stampit
    .compose(
      Decorator,
      {
        methods: {
          echo(x) {
            return x;
          },
        },
      }
    )
    .decorateMethod('echo', function plusTwo({ decoratee }, x) {
      return decoratee(x + 2);
    })
    .decorateMethod('echo', function plusThree({ decoratee }, x) {
      return decoratee(x + 3);
    });

  const actual = Stamp().echo(1);
  const expected = 6;

  t.deepEqual(actual, expected);
});

test('[decorateMethods] behaves like chained .decorateMethod calls', t => {
  function plusTwo({ decoratee }) {
    return decoratee() + 2;
  }

  const BaseStamp = stampit.compose(
    Decorator,
    {
      props: {
        a: 1,
        b: 2,
      },
      methods: {
        getA() {
          return this.a;
        },
        getB() {
          return this.b;
        },
      },
    }
  );

  const MultipleDecorators = BaseStamp.decorateMethods({
    getA: plusTwo,
    getB: plusTwo,
  });

  const ChainedDecorators = BaseStamp.decorateMethod(
    'getA',
    plusTwo
  ).decorateMethod('getB', plusTwo);

  const multipleDecoratorsInstance = MultipleDecorators();
  const chainedDecoratorsInstance = ChainedDecorators();

  const actual = {
    a: multipleDecoratorsInstance.getA(),
    b: multipleDecoratorsInstance.getB(),
  };
  const expected = {
    a: chainedDecoratorsInstance.getA(),
    b: chainedDecoratorsInstance.getB(),
  };

  t.deepEqual(actual, expected);
});

test('[decorateMethods] chained behaves like doubly-chained .decorateMethod calls', t => {
  function plusTwo({ decoratee }) {
    return decoratee() + 2;
  }

  function plusThree({ decoratee }) {
    return decoratee() + 3;
  }

  const BaseStamp = stampit.compose(
    Decorator,
    {
      props: {
        a: 1,
        b: 2,
      },
      methods: {
        getA() {
          return this.a;
        },
        getB() {
          return this.b;
        },
      },
    }
  );

  const MultipleDecorators = BaseStamp.decorateMethods({
    getA: plusTwo,
    getB: plusTwo,
  }).decorateMethods({
    getA: plusThree,
    getB: plusThree,
  });

  const ChainedDecorators = BaseStamp.decorateMethod('getA', plusTwo)
    .decorateMethod('getA', plusThree)
    .decorateMethod('getB', plusTwo)
    .decorateMethod('getB', plusThree);

  const multipleDecoratorsInstance = MultipleDecorators();
  const chainedDecoratorsInstance = ChainedDecorators();

  const actual = {
    a: multipleDecoratorsInstance.getA(),
    b: multipleDecoratorsInstance.getB(),
  };
  const expected = {
    a: chainedDecoratorsInstance.getA(),
    b: chainedDecoratorsInstance.getB(),
  };

  t.deepEqual(actual, expected);
});

test('[decorateMethod] decoratee method with side-effects', t => {
  function runTwiceSideEffet({ decoratee }) {
    decoratee();
    decoratee();
  }

  const Stamp = stampit
    .compose(
      Decorator,
      {
        props: { a: 1 },
        methods: {
          increment() {
            this.a = this.a + 1;
          },
        },
      }
    )
    .decorateMethod('increment', runTwiceSideEffet)
    .decorateMethod('increment', runTwiceSideEffet)
    .decorateMethod('increment', runTwiceSideEffet);

  const instance = Stamp();
  instance.increment();

  const actual = instance.a;
  const expected = 9;

  t.is(actual, expected, 'should have incremented initial value by 2**3 = 8');
});

test('[decorateMethod] decorated method name overriding', t => {
  function plusTwo({ decoratee }, x) {
    return decoratee(x + 2);
  }
  const Stamp = stampit
    .compose(
      Decorator,
      {
        methods: {
          echo(x) {
            return x;
          },
        },
      }
    )
    .decorateMethod('echo', plusTwo);

  const actual = Stamp().echo.name;
  const expected = 'plusTwo(echo)';

  t.is(actual, expected);
});

test('[decorateMethod] decorated method name overriding with anonymous decorator function', t => {
  const Stamp = stampit
    .compose(
      Decorator,
      {
        methods: {
          echo(x) {
            return x;
          },
        },
      }
    )
    .decorateMethod('echo', ({ decoratee }, x) => {
      return decoratee(x + 2);
    });

  const actual = Stamp().echo.name;
  const expected = '<anonymous>(echo)';

  t.is(actual, expected);
});

test('[decorateMethod] chained decorated method name overriding', t => {
  function plusTwo({ decoratee }, x) {
    return decoratee(x + 2);
  }

  function plusThree({ decoratee }, x) {
    return decoratee(x + 3);
  }

  const Stamp = stampit
    .compose(
      Decorator,
      {
        methods: {
          echo(x) {
            return x;
          },
        },
      }
    )
    .decorateMethod('echo', plusTwo)
    .decorateMethod('echo', plusThree);

  const actual = Stamp().echo.name;
  const expected = 'plusThree(plusTwo(echo))';

  t.is(actual, expected);
});
