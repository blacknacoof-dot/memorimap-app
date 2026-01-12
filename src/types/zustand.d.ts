declare module 'zustand' {
    export type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
    export type StoreApi<T> = {
        setState: SetState<T>;
        getState: () => T;
        subscribe: (listener: (state: T, prevState: T) => void) => () => void;
    };
    export type UseBoundStore<T> = {
        (): T;
        <U>(selector: (state: T) => U): U;
    } & StoreApi<T>;

    export function create<T>(initializer: (set: SetState<T>) => T): UseBoundStore<T>;
    export default create;
}
