const t = require('tcomb');

const D = {};
D.ValidClassName = t.refinement(t.String, x => /[A-Z][a-z0-9_]*/i.test(x));

D.ArgArray = t.list(t.Type);
D.OverloadDescription = t.interface({
  args: D.ArgArray,
  fn: t.Function
});
D.Overloads = t.list(D.OverloadDescription);
D.Method = t.union([t.Function, D.Overloads]);

D.Defintion = t.interface({
  constructors: t.maybe(D.Overloads),
  statics: t.maybe(t.dict(t.String, D.Method)),
  methods: t.maybe(t.dict(t.String, D.Method)),
  getters: t.maybe(t.dict(t.String, t.Function)),
  setters: t.maybe(t.dict(t.String, D.Method)),
});

const Instance = c => t.refinement(t.Any, x => x instanceof c);

const Classiest = (name, descriptorFn) => {
  if (!D.ValidClassName.is(name)) {
    throw new Error(`Invalid class name: ${name}`);
  }

  let dynamicConstructor;

  const {[name]: cstr} = {
    [name]: function (...cstrArguments) {
      dynamicConstructor.apply(this, cstrArguments);
    }
  };

  const descriptor = D.Defintion(descriptorFn(cstr, Instance(cstr)));

  const dynamicDispatch = function(methodName, methodImpls, ...methodArgs) {
    for (let {args, fn} of methodImpls) {
      const matches = args.every((typeArg, i) => typeArg.is(methodArgs[i]));
      if (matches) {
        return fn.apply(this, methodArgs);
      }
    }

    throw new Error(`No valid overload found for ${name}.${methodName}`);
  };

  // Constructor
  dynamicConstructor = function(...methodArgs) {
    if (!('constructors' in descriptor)) return;
    dynamicDispatch.call(this, 'constructor', descriptor.constructors, ...methodArgs);
  };

  // Methods
  if ('methods' in descriptor) {
    for (let [methodName, methodImpl] of Object.entries(descriptor.methods)) {
      if (typeof methodImpl === 'function') {
        cstr.prototype[methodName] = methodImpl;
      } else {
        cstr.prototype[methodName] = function (...methodArgs) {
          return dynamicDispatch.call(this, methodName, methodImpl, ...methodArgs);
        };
      }
    }
  }

  // Statics
  if ('statics' in descriptor) {
    for (let [staticName, staticImpl] of Object.entries(descriptor.statics)) {
      if (typeof staticImpl === 'function') {
        cstr[staticName] = staticImpl;
      } else {
        cstr[staticName] = function (...methodArgs) {
          return dynamicDispatch.call(this, staticName, staticImpl, ...methodArgs);
        };
      }
    }
  }

  // Getters and setters need to be paired up together
  const getters = descriptor.getters || {};
  const setters = descriptor.setters || {};

  // Get a unique list of get/set keys
  const allGetSetKeys = [...new Set([
    ...Object.keys(getters),
    ...Object.keys(setters)]
  ).values()];

  allGetSetKeys.forEach(key => {
    const propertyDefintion = {};
    if (key in getters) {
      propertyDefintion.get = getters[key];
    }
    if (key in setters) {
      propertyDefintion.set = function (value) {
        return dynamicDispatch.call(this, key, setters[key], value);
      };
    }
    Object.defineProperty(cstr.prototype, key, propertyDefintion);
  });

  return cstr;
};

module.exports = {
  Classiest,
  Instance,
  tcomb: t
};
