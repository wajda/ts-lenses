A simple utility library that implements functional Lenses - 
composable _setter_ and _getter_ pairs that focuses on particular
nested properties of an object. 

---

# Usage

```typescript
// Import lenses library
import * as lens from 'lenses'

// Define your lens
const myLens = lens.of("a.b.c")

// Use the lens to get or set a nested value
myLens.get( {a: {b: {c: 42}}} )     // returns 42
myLens.set( {a: {b: {c: 42}}}, 777) // returns {a: {b: {c: 777}}}

// missing properties are created
myLens.set({}, 777) // still returns {a: {b: {c: 777}}}
```
_set()_ method is a pure function. It creates shallow copies of objects along the path. 

## Lens compositions
```typescript
const fooBarBazLens = lens.composition(lens.of("foo"), lens.of("bar"), lens.of("baz"))  // or...
const fooBarBazLens = lens.of("foo.bar").compose(lens.of("baz"))

// lens compositions are associative:
const fooBarBazLens = lens.of("foo").compose(lens.of("bar.baz"))                        // is the same as...
const fooBarBazLens = lens.of("foo").compose(lens.of("bar").compose(lens.of("baz")))    // is the same as...
const fooBarBazLens = (lens.of("foo").compose(lens.of("bar"))).compose(lens.of("baz"))  // is the same as...
const fooBarBazLens = lens.of("foo").focus("bar").focus("baz")                          // is the same as...
const fooBarBazLens = lens.of("foo").focus("bar.baz")                                   // is the same as...
const fooBarBazLens = lens.of("foo.bar.baz")
```

## Lens projections
Projections are lenses with arity > 1, defined as complex lenses.
Projections point to multiple properties of an object at any levels of nesting. 
Projections can be nested.
```typescript
const shortContactInfoProjection = 
    lens.projection(
        lens.of("name"),
        lens.of("surname"),
        lens.of("contacts").project(
            lens.of("tel"),
            lens.of("email")))

const personInfo = {
    name: "John",
    surname: "Smith",
    age: 30,
    sex: "male",
    otherPrivateInfo: {...},
    contacts: {
        tel: 111222333444,
        email: "jsmith@example.com",
        address: "Earth"
    },
    otherInfo: {...}
}

shortContactInfoProjection.get(personInfo) // returns ["John", "Smith", 111222333444, "jsmith@example.com"]
shortContactInfoProjection.set(personInfo, "John", "Smith", 111222333444, "jsmith@example.com") // returns updated copy
```

# Todo
1. Associative projection composition.
    Currently a Projection can only be a terminal element in a Lens composition chain.

1. [Optimization] Do not copy an object if the current value is equal to the updating value.

1. Performance testing

1. Typing