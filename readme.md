# Classiest

## About

`Classiest` allows you to write classier classes by providing the **rich type-checking on arguments to methods** through tcomb and **overloadable constructors, methods, setters, and static methods**.

## Installation

```bash
npm i classiest
```

## Usage

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