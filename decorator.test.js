import test from 'ava';
import td from 'testdouble';
import stampit from '@stamp/it';
import subject from './decorator';

test('Composability', t => {
  const actual = typeof stampit.compose(subject).compose;
  const expected = 'function';

  t.is(actual, expected, 'should be composable');
});

test('[decorateMethods] exists', t => {
  const actual = typeof subject.decorateMethods;
  const expected = 'function';

  t.is(actual, expected, 'should implement the decoreateMethods method');
});

test('[decorateMethods] is chainable', t => {
  const actual = typeof subject.decorateMethods().decorateMethods;
  const expected = 'function';

  t.is(actual, expected, 'decorateMethods should be chainable');
});

test('[decorateMethod] exists', t => {
  const actual = typeof subject.decorateMethod;
  const expected = 'function';

  t.is(actual, expected, 'should implement the decoreateMethod method');
});

test('[decorateMethod] is chainable', t => {
  const actual = typeof subject.decorateMethod(
    'dummyMethod',
    function newDummyMethod() {}
  ).decorateMethod;
  const expected = 'function';

  t.is(actual, expected, 'decorateMethod should be chainable');
});

test('[decorateMethod] unexistent decoratee method', t => {
  const Stamp = stampit
    .compose(subject)
    .decorateMethod('dummyMethod', function newDummyMethod() {});

  const actual = Stamp().dummyMethod;
  const expected = undefined;

  t.is(actual, expected, 'should not create the decorated method');
});

test('[decorateMethod] decorated method type', t => {
  const Stamp = stampit
    .methods({ dummyMethod() {} })
    .compose(subject)
    .decorateMethod('dummyMethod', function newDummyMethod() {});

  const actual = typeof Stamp().dummyMethod;
  const expected = 'function';

  t.is(actual, expected, 'decorated method should still be a function');
});

test('[decorateMethod] decorated method arity', t => {
  function dummyMethod() {}

  const Stamp = stampit
    .methods({ dummyMethod })
    .compose(subject)
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
    .compose(subject)
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
      subject,
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
