import * as assert from 'assert'
import * as lens from '../src/lenses'

describe('Lenses', () => {
    describe('of()', () => {
        it('should create a property lens', () => {
            let fooLens = lens.of("foo")

            assert.deepEqual(fooLens.set({}, 42), {foo: 42})
            assert.deepEqual(fooLens.set({a: 1}, 42), {a: 1, foo: 42})
            assert.deepEqual(fooLens.set({a: 1, foo: {b: 2}}, 42), {a: 1, foo: 42})

            assert.equal(fooLens.get({}), undefined)
            assert.equal(fooLens.get({a: 1, foo: 42}), 42)
        })

        it('should create a path lens', () => {
            let fooBarLens = lens.of("foo.bar")

            assert.deepEqual(fooBarLens.set({}, 42), {foo: {bar: 42}})
            assert.deepEqual(fooBarLens.set({a: 1}, 42), {a: 1, foo: {bar: 42}})
            assert.deepEqual(fooBarLens.set({a: 1, foo: {b: 2}}, 42), {a: 1, foo: {b: 2, bar: 42}})

            assert.equal(fooBarLens.get({}), undefined)
            assert.equal(fooBarLens.get({a: 1, foo: {b: 2, bar: 42}}), 42)
        })

        it('should create a composite lens', () => {
            let fbbqLens = lens.of("foo.bar").compose(lens.of("baz.qux"))
            assert.deepEqual(fbbqLens.set({}, 42), {foo: {bar: {baz: {qux: 42}}}})
            assert.deepEqual(fbbqLens.set({
                    a: 1, foo: {
                        b: 2, bar: {
                            c: 3, baz: {
                                d: 4
                            }
                        }
                    }
                }, 42),
                {
                    a: 1, foo: {
                        b: 2, bar: {
                            c: 3, baz: {
                                d: 4, qux: 42
                            }
                        }
                    }
                })

            assert.equal(fbbqLens.get({}), undefined)
            assert.equal(fbbqLens.get({
                a: 1, foo: {
                    b: 2, bar: {
                        c: 3, baz: {
                            d: 4, qux: 42
                        }
                    }
                }
            }), 42)
        })

        it('should focus on an inner property', () => {
            const fbbqLens = lens.of("foo").focus("bar.baz").focus("qux")
            assert.deepEqual(fbbqLens.set({}, 42), {foo: {bar: {baz: {qux: 42}}}})
            assert.equal(fbbqLens.get({
                a: 1, foo: {
                    b: 2, bar: {
                        c: 3, baz: {
                            d: 4, qux: 42
                        }
                    }
                }
            }), 42)
        })
    })

    describe('projection()', () => {
        it('should support simple projections', () => {
            const projection1 = lens.projection(
                lens.of("foo"),
                lens.of("bar.baz")
            )
            assert.deepEqual(projection1.set({}, 42, 777), {foo: 42, bar: {baz: 777}})
            assert.deepEqual(projection1.get({foo: 42, bar: {baz: 777}}), [42, 777])

            const projection2 = lens.of("base").project(projection1)
            assert.deepEqual(projection2.get({base: {foo: 42, bar: {baz: 777}}}), [42, 777])
            assert.deepEqual(projection2.set({z: 0, base: {a: 1, bar: {b: 2}}}, 42, 777),
                {
                    z: 0,
                    base: {
                        a: 1,
                        foo: 42,
                        bar: {
                            b: 2,
                            baz: 777
                        }
                    }
                })

            const projection3 = lens.projection(
                lens.of("x1"),
                lens.projection(
                    lens.of("x2"),
                    lens.projection(
                        lens.of("x3"),
                        lens.of("x4"),
                    )
                ),
            )
            assert.deepEqual(projection3.set({}, 1, 2, [31, 32], 4), {x1: 1, x2: 2, x3: [31, 32], x4: 4})
            assert.deepEqual(projection3.get({x1: 1, x2: 2, x3: [31, 32], x4: 4}), [1, 2, [31, 32], 4])
        })

        it('should support complex projections', () => {
            const crazyLens = lens.projection(
                lens.of("a").project(
                    lens.of("b.placeholder"),
                    lens.of("c.d").project(
                        lens.of("e.placeholder"),
                        lens.of("f.placeholder"),
                    ),
                    lens.of("g.placeholder"),
                ),
                lens.of("i").project(
                    lens.of("j.k.placeholder"),
                    lens.of("l").project(
                        lens.of("placeholder"),
                        lens.of("m.placeholder"),
                    ),
                    lens.of("n.o.placeholder"),
                ),
            )

            const inputJson = {
                id: 1,
                a: {
                    id: 2,
                    b: {
                        id: 3,
                        placeholder: "(1)"
                    },
                    c: {
                        id: 3,
                        d: {
                            id: 4,
                            e: {
                                id: 5,
                                placeholder: "(2)"
                            },
                            f: {
                                id: 6,
                                placeholder: "(3)"
                            }
                        }
                    },
                    g: {
                        id: 7,
                        placeholder: "(4)"
                    },
                },
                i: {
                    id: 8,
                    j: {
                        id: 9,
                        k: {
                            id: 10,
                            placeholder: "(5)"
                        }
                    },
                    l: {
                        id: 11,
                        placeholder: "(6)",
                        m: {
                            id: 12,
                            placeholder: "(7)"
                        }
                    },
                    n: {
                        id: 13,
                        o: {
                            id: 14,
                            placeholder: "(8)"
                        }
                    }
                }
            }

            const expectedJson = {
                id: 1,
                a: {
                    id: 2,
                    b: {
                        id: 3,
                        placeholder: "quick"
                    },
                    c: {
                        id: 3,
                        d: {
                            id: 4,
                            e: {
                                id: 5,
                                placeholder: "brown"
                            },
                            f: {
                                id: 6,
                                placeholder: "fox"
                            }
                        }
                    },
                    g: {
                        id: 7,
                        placeholder: "jumps"
                    },
                },
                i: {
                    id: 8,
                    j: {
                        id: 9,
                        k: {
                            id: 10,
                            placeholder: "over"
                        }
                    },
                    l: {
                        id: 11,
                        placeholder: "the",
                        m: {
                            id: 12,
                            placeholder: "lazy"
                        }
                    },
                    n: {
                        id: 13,
                        o: {
                            id: 14,
                            placeholder: "dog"
                        }
                    }
                }
            }

            assert.deepEqual(crazyLens.get(expectedJson), ["quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"])
            const updatedJson = crazyLens.set(inputJson, "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog")
            assert.notEqual(updatedJson, expectedJson)
            assert.deepEqual(updatedJson, expectedJson)
        })
    })

    describe('composition()', () => {
        it('should compose lenses', () => {
            const compositeLens = lens.composition(
                lens.of("a"),
                lens.of("b"),
                lens.of("c"),
            )
            assert.deepEqual(compositeLens.set({}, 42), {a: {b: {c: 42}}})
            assert.equal(compositeLens.get({a: {b: {c: 42}}}), 42)
        })
    })
})