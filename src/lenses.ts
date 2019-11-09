export function of<A, B>(path: string): Lens<A, B> {
    return path
        .split(".")
        .map(prop => new PropertyLens(prop))
        .reduce((acc, li) => acc.compose(li)) as Lens<A, B>
}

export function composition<A, B>(lens0: Lens<A, any>, lens1: Lens<any, any>, ...otherLenses: Lens<any, any>[]) {
    return [lens0, lens1, ...otherLenses]
        .reduce((acc, li) => new CompositeLens(acc, li))
}

export function projection<A>(...innerLenses: Lens<A, any>[]): Lens<any, any> {
    return new ProjectorLens((innerLenses as any)
        .flatMap(li => li.constructor == ProjectorLens
            ? (li as ProjectorLens<A, any>).lenses
            : li
        )
    )
}

export abstract class Lens<A, B> {
    protected constructor(
        public readonly arity: number,
        public readonly roots: string[],
        public readonly get: (A) => B | undefined,
        public readonly set: (A, ...args) => A) {
    }

    public compose<C>(other: Lens<B, C>) {
        return composition(this, other)
    }

    public focus<C>(path: string): Lens<A, C> {
        return composition(this, of(path))
    }

    public project(...innerLenses: Lens<B, any>[]) {
        return composition(this, projection(...innerLenses))
    }
}

class PropertyLens<A, B> extends Lens<A, B> {
    constructor(propName: string) {
        super(
            1,
            [propName],
            (a: A) => a[propName],
            (a: A, b: B) => {
                const a1 = {...a}
                a1[propName] = b
                return a1
            })
    }
}

class CompositeLens<A, B, C> extends Lens<A, C> {
    constructor(abLens: Lens<A, B>, bcLens: Lens<B, C>) {
        super(
            bcLens.arity,
            abLens.roots,
            (a: A): C => {
                const b = abLens.get(a)
                return b && bcLens.get(b)
            },
            (a: A, ...args: B[]): A => {
                const b0 = abLens.get(a) || {}
                const b1 = bcLens.set(b0, ...args)
                return abLens.set(a, b1)
            })
    }
}

class ProjectorLens<A, X> extends Lens<A, X[]> {
    private readonly offsets: number[]

    constructor(public readonly lenses: Lens<A, X>[]) {
        super(
            lenses.reduce((arity, li) => arity + li.arity, 0),
            (lenses as any).flatMap(li => li.rootProps),
            (a: A) =>
                a && lenses.reduce((res, li, i) => {
                    if (li.arity == 1) res[this.offsets[i]] = li.get(a)
                    else res.splice(this.offsets[i], li.arity, ...(li.get(a) as any))
                    return res
                },
                new Array<X>(this.arity)),
            (a: A, ...args: X[]) => {
                const x1s = lenses.map((li, i) => {
                    const ai = (Object as any).fromEntries(li.roots.map(p => [p, a[p] || {}]))
                    const xs = args.slice(this.offsets[i], this.offsets[i] + li.arity)
                    return li.set(ai, ...xs)
                })
                return Object.assign({...a} as any, ...x1s)
            })

        this.offsets = this.lenses
            .slice(0, this.lenses.length - 1)
            .reduce(
                (acc, li, i) => {
                    acc[i + 1] = acc[i] + li.arity
                    return acc
                },
                new Array<number>(this.lenses.length).fill(0, 0, 1)
            )
    }
}
