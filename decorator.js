const stampit = require('@stamp/it');

const Decorator = stampit({
  statics: {
    decorateMethods() {
      return this;
    },
    decorateMethod(name, fn) {
      return this.composers(({ stamp }) => {
        const { [name]: method } = stamp.compose.methods || {};

        if (!method) return;

        function methodDecorator(...args) {
          const detachedMethod = method.bind(this);
          return fn.apply(this, [{ decoratee: detachedMethod }, ...args]);
        }

        Object.defineProperties(methodDecorator, {
          name: {
            value: `decorated(${name})`,
          },
        });

        Object.assign(stamp.compose.methods, {
          [name]: methodDecorator,
        });
      });
    },
  },
});

module.exports = Decorator;
