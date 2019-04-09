const stampit = require('@stamp/it');

const Decorator = stampit({
  name: 'Decorator',
  statics: {
    decorateMethods(descriptors = {}) {
      const decoratedMethodsControl = {};

      return Object.keys(descriptors || {}).reduce((acc, name) => {
        const decorator = descriptors[name];

        return acc.composers(({ stamp }) => {
          const { [name]: decoratee } = stamp.compose.methods || {};

          if (!decoratee || decoratedMethodsControl[name]) return;

          decoratedMethodsControl[name] = true;

          function decoratedMethod(...args) {
            const detachedDecoratee = decoratee.bind(this);
            return decorator.apply(this, [
              {
                decoratee: detachedDecoratee,
                stamp,
              },
              ...args,
            ]);
          }

          const decoratorName = decorator.name || '<anonymous>';
          const decorateeName = decoratee.name || '<anonymous>';

          Object.defineProperties(decoratedMethod, {
            name: {
              value: `${decoratorName}(${decorateeName})`,
            },
          });

          Object.assign(stamp.compose.methods, {
            [name]: decoratedMethod,
          });
        });
      }, this);
    },
    decorateMethod(name, decorator) {
      return this.decorateMethods({ [name]: decorator });
    },
  },
});

module.exports = Decorator;
