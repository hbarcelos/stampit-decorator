const stampit = require('@stamp/it')

const Decorator = stampit({
  name: 'Decorator',
  statics: {
    decorateMethods(descriptors = {}) {
      const decoratedMethodsControl = {}

      return Object.keys(descriptors || {}).reduce((acc, methodName) => {
        const decorator = descriptors[methodName]

        return acc.composers(({ stamp }) => {
          const { [methodName]: decoratee } = stamp.compose.methods || {}

          if (!decoratee || decoratedMethodsControl[methodName]) return

          decoratedMethodsControl[methodName] = true

          function decoratedMethod(...args) {
            const detachedDecoratee = decoratee.bind(this)

            return decorator.apply(this, [
              {
                decoratee: detachedDecoratee,
                stamp,
              },
              ...args,
            ])
          }

          const decoratorName = decorator.name || '<anonymous>'
          const decorateeName = decoratee.name || '<anonymous>'

          Object.defineProperties(decoratedMethod, {
            name: {
              value: `${decoratorName}(${decorateeName})`,
            },
          })

          Object.assign(stamp.compose.methods, {
            [methodName]: decoratedMethod,
          })
        })
      }, this)
    },

    decorateMethod(name, decorator) {
      return this.decorateMethods({ [name]: decorator })
    },
  },
})

module.exports = Decorator
