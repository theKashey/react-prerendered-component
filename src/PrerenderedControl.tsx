import * as React from 'react';
import {isThisServer} from "./utils";

export interface PrerenderedCache {
  get(key: string): string | false | null;

  set(key: string, value: string): void;

  assign(key: string): string | number;
}

interface PrerenderControls {
  isServer: boolean,
  cache: PrerenderedCache,
}

const defaultProps = {
  isServer: isThisServer(),
  cache: {
    counter: 0,
    get(): false {
      return false;
    },
    set(): false {
      return false;
    },
    assign(key: string) {
      return key;
    }
  }
};

const context = React.createContext<PrerenderControls>(defaultProps);

export const PrerenderedControler: React.SFC<Partial<PrerenderControls>> = ({children, ...props}) => (
  <context.Provider value={{...defaultProps, ...props}}>
    {children}
  </context.Provider>
);

export const PrerenderedControls = context.Consumer;