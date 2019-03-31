import * as React from 'react';
import * as nanoid from 'nanoid';
import {isThisServer} from "./utils";

export interface PrerenderedCache {
  get(key: string): string | false | null;

  set(key: string, value: string, ttl: number): void;
}

export interface CacheControl {
  cache: PrerenderedCache;
  seed: string,

  get(key: number): string;

  set(key: number, value: string): void;

  store(key: string, value: string): void;

  assign(key: string, ttl: number): number;
}

interface PrerenderControls {
  isServer?: boolean,
  hydrated?: boolean,
  control?: CacheControl,
}

interface PrerenderState {
  hydrated?: boolean
}

export const cacheControler = (cache: PrerenderedCache): CacheControl => {
  let counter = 0;
  const cachedValues: any = {};
  const cached: any = {};
  return {
    cache,
    seed: nanoid(),
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
  hydrated: false,
  // control: undefined // its not defined by default
});

export class PrerenderedControler extends React.Component<PrerenderControls, PrerenderState> {
  state = {
    hydrated: this.props.hydrated || false,
  };

  componentDidMount() {
    if (this.props.hydrated) {
      this.setState({
        hydrated: false
      })
    }
  }

  render() {
    const {children, ...props} = this.props;
    return (
      <context.Provider value={{
        isServer: isThisServer(),
        hydrated: false,
        ...props,
        ...this.state,
      }}>
        {children}
      </context.Provider>
    )
  }
};

export const PrerenderedContext = context;
export const PrerenderedControls = context.Consumer;


interface TemplateControlState {
  variables: Record<string, string | number>;
  isServer: boolean,
}

export const TemplateControl = React.createContext<TemplateControlState>({
  variables: {},
  isServer: true,
});