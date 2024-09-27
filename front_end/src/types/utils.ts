export type Require<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
