# Classiest

- [About](#About)
- [Installation](#Installation)
- [FAQ](#FAQ)
- [Example Usage](#Example-Usage)

## About

`Classiest` allows you to write classier classes by providing the **rich type-checking on arguments to methods** through tcomb and **overloadable constructors, methods, setters, and static methods**.

## Installation

```bash
npm i classiest
```

## FAQ

### Why are you trying to make JS something it's not?

JavaScript is a dynamicly and weakly typed language. That means that the types aren't known until runtime, and that they can change during the execution of the program. So if this is the nature of the language, why would you try to add typing on top of it? Well the answer is that **you are already doing this all the time already,** just in an ad-hoc and potentially buggy manner. Let me explain.

It's common in JS that you want to write methods that can respond to various different kinds of inputs, but the language doesn't allow overloading, so you're forced to use one of a few different suboptimal approaches.

```javascript
class Vector3 {
  // ...

  add(vectorOrNumber) {
    if (vectorOrNumber instanceof Vector3) {
      return new Vector3(
        this.x + vectorOrNumber.x,
        this.y + vectorOrNumber.y,
        this.z + vectorOrNumber.z
      );
    } else if (typeof vectorOrNumber === 'number') {
      return new Vector3(
        this.x + vectorOrNumber,
        this.y + vectorOrNumber,
        this.z + vectorOrNumber
      );
    }

    throw new Error(`This methods requires either a Vector3 or a number, but got ${typeof vectorOrNumber}`);
  }
}
```

I'm sure you've seen this kind of code before - we're explicitly checking the types of the inputs and choosing a codepath accordingly. The logic of checking types is mixed together with the effects of the method, and it gets longer and harder to understand with the more cases we allow for. This just compounds when the method potentially takes more than one argument.

```javascript
class Vector3 {
  // ...

  addVector3(v) {
    return new Vector3(
      this.x + v.x,
      this.y + v.y,
      this.z + v.z
    );
  }

  addNumber(n) {
    return new Vector3(
      this.x + n,
      this.y + n,
      this.z + n
    );
  }
}
```

This is a little better, but there are still some issues. Firstly, this is basically ad-hoc overloading where we expect the user to maintain the type system in their mind while they code. Second, we've lost the `instanceof/typeof` checks, so if a user makes a quick refactoring of a `Vector3` to `number`, but forgets to change the method name, they're going to experience some weirdness (and not necessarily at the moment when the method is called!).

Let's be clear here: In both cases, we're already trying to enforce type checks, and dispatch behaviours based on those types!

### You should just be using TypeScript!

Well first of all that's not a question.

TypeScript is great - I love TypeScript! And what's more: It actually has overloading - which no doubt works in much the same way as Classiest when it's compiled down to JS (so discussions about performance would not be applicable here).

If you're starting a new project, and the rest of team is on board, then TS can be a great choice. But the reality is that many projects are ongoing. They may not have the luxury of switching, or even if they did it just might not add that much, or be worth the effort.

### Isn't this going to be bad for performance?

Classiest is an *abstraction*, and every abstraction has some cost associated with it. In this library there are three costs to think about:

#### Up-front cost

When we define a class with Classiest, the library needs to do some work to build up the class from it's definition. This is a one time cost, probably happening at application start up time, and honestly probably isn't even worth worrying about.

#### Runtime cost

When we call methods on a class built with Classiest, it must internally analyze the arguments provided and attempt to find a matching implementation. That means we need to iterate through at least some of the implementations, and run all the associated code that tcomb uses for type checking. We're also necessarily adding a deeper nesting to the call stack.

Thinking a little bit deeper about this, we need to realise that modern JS engines are almost always JIT compiled, and use a whole host of heuristics about the code to apply optimisations to the generated machine instructions that end up running on the CPU - all with the aim of producing faster and more efficient code. There is a risk that this layer of abstraction will make it harder for the JIT to do its job effectively.

#### Cognitive cost

Any time you include an abstraction in your code, you add something new you need to understand. The best abstractions are designed so you only need to understand the high level concept, and any knowledge about the underlying system should be irrelevant ([but that doesn't always happen](https://en.wikipedia.org/wiki/Leaky_abstraction)).

With Classiest, you need to learn that you create classes with a function instead of with the class keyword, you need to learn about the format of the description object, and you need to learn a little about tcomb - its built in types and maybe how to define your own types as well. That's about it.

#### Making the tradeoff

Everything in software (and perhaps life) is about tradeoffs. Making an informed decision about using this or any other library is basically assessing the costs described above, accounting for how your project will need to use the library and what performance characteristics you require.

And all of that said, performance is something you **measure**, not make assumptions about. Different JS engines have different performance characteristics, and so code that performs well in one engine may perform worse in another. People often say premature optimisation is the root of all evil - and while I'm not sure I'd go that far, I'd say you're doing yourself an intellectual disservice by not taking proper stock of reality.

## Example Usage

```javascript
const {Classiest, tcomb: t} = require('classiest');

// Classes are created with the Classiest function. Classiest injects both the
// final constructor and a tcomb type into the function you use for definition
const Vector3 = Classiest('Vector3', (Vector3, Vector3Type) => ({
  // You can provide one or more constructors
  constructors: [
    // Construct a Vector3 from an x, y, and z - all of which are numbers
    {
      args: [t.Number, t.Number, t.Number],
      fn: function (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    },
    // Construct a Vector3 from a single number
    {
      args: [t.Number],
      fn: function (n) {
        this.x = this.y = this.z = n;
      }
    },
    // Construct a Vector3 with no arguments, setting everything to zero
    {
      args: [],
      fn: function () {
        this.x = this.y = this.z = 0;
      }
    }
  ],

  // We can provide methods with one or more implementations
  methods: {
    add: [
      // You can add 2 vectors together, making use of the injected tcomb type
      {
        args: [Vector3Type],
        fn: function (v) {
          return new Vector3(
            this.x + v.x,
            this.y + v.y,
            this.z + v.z
          )
        }
      },
      // Or you could add a single number to every component
      {
        args: [t.Number],
        fn: function (n) {
          return new Vector3(
            this.x + n,
            this.y + n,
            this.z + n
          )
        }
      }
    ],

    // Some methods might only have one valid implementation, in which case you can just use a function
    // But you could still provide an array if you want to enforce type checking
    dot: function (v) {
      return this.x*v.x + this.y*v.x + this.z*v.z;
    }
  },

  // Getters can also be defined, though not overloaded (that wouldn't really make sense, would it?)
  getters: {
    length: function () {
      return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
    }
  },

  // Setters can be defined in the same way, though they can be overloaded!
  setters: {},

  // Finally, it's possible to create overloaded static methods too
  statics: {
    multiply: [
      // Multiply two vectors
      {
        args: [Vector3Type, Vector3Type],
        fn: function(v1, v2) {
          return new Vector3(
            v1.x * v2.x,
            v1.y * v2.y,
            v1.z * v2.z
          );
        }
      },
      // Or multiply one vector by a single number
      {
        args: [Vector3Type, t.Number],
        fn: function(v1, n) {
          return new Vector3(
            v1.x * n,
            v1.y * n,
            v1.z * n
          );
        }
      }
    ]
  }
}));

// Now Vector3 can be used just as any regular JS class would be

const v1 = new Vector3(1, 2, 3);
// -> Vector3(1, 2, 3)

const v2 = new Vector3(4);
// -> Vector3(4, 4, 4)

const v3 = v1.add(v2);
// -> Vector3(5, 6, 7)

const v4 = v1.add(1);
// -> Vector3(2, 3, 4)

const vLength = v1.length;
// -> 3.7416573867739413

const v5 = Vector3.multiply(v3, v4);
// -> Vector3(10, 18, 28)

const v6 = Vector3.multiply(v3, vLength);
// -> Vector3(18.708286933869708, 22.44994432064365, 26.19160170741759)
```