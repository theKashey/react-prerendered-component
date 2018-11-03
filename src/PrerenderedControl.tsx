import * as React from 'react';
import {isThisServer} from "./utils";

export interface PrerenderedCache {
  get(key: string): string | false | null;

  set(key: string, value: string, ttl: number): void;
}

export interface CacheControl {
  cache: PrerenderedCache;

  get(key: number): string;

  set(key: number, value: string): void;

  store(key: string, value: string): void;

  assign(key: string, ttl: number): number;
}

interface PrerenderControls {
  isServer?: boolean,
  control: CacheControl,
}

export const cacheControler = (cache: PrerenderedCache): CacheControl => {
  let counter = 0;
  const cachedValues: any = {};
  const cached: any = {};
  return {
    cache,
    get(key) {
      return cachedValues[cached[key].key];
    },
    set(id, value) {
      const {key, ttl} = cached[id];
      cache.set(key, value, ttl)
    },
    store(key: string, value: string) {
      cachedValues[key] = value;
      return this.assign(key, 0);
    },
    assign(key: string, ttl: number) {
      counter++;
      cached[counter] = {key, ttl};
      return counter;
    }
  }
};

const context = React.createContext<PrerenderControls>({
  isServer: isThisServer(),
} as any);

export const PrerenderedControler: React.SFC<PrerenderControls> = ({children, ...props}) => (
  <context.Provider value={{
    isServer: isThisServer(),
    ...props
  }}>
    {children}
  </context.Provider>
);

export const PrerenderedControls = context.Consumer;