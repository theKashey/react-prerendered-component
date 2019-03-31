import * as React from 'react';
import {Component} from 'react';
import * as moment from 'moment';
import {
  PrerenderedComponent,
  CachedLocation,
  ServerSideComponent,
  ClientSideComponent,
  clientSideComponent,
  serverSideComponent, cacheControler, PrerenderedControler,

} from "../src/index";
import * as Loadable from 'react-loadable';
import imported from 'react-imported-component';
import {mount} from "enzyme";
import * as moment from "./deferred";

class Counter extends React.Component<{ counter: number, c2: number, onChange?: (s: any) => void }, { c: number }> {

  state = {
    c: this.props.c2 || 0
  };

  componentDidMount() {
    setInterval(() => this.setState({c: this.state.c + 1}), 1000);
  }

  componentDidUpdate(props, state) {
    if (this.props.counter != props.counter || this.state.c !== state.c) {
      this.props.onChange && this.props.onChange({counter: this.props.counter, c2: this.state.c});
    }
  }

  render() {
    return <span className="counter">
      counter: <i>{this.props.counter}</i>/<i>{this.state.c}</i>
    </span>
  }
}

export interface AppState {
  counter: number;
  c2: number;
  live: boolean;
  s: any;
  loaded: boolean;
}

const AsyncComponent1 = Loadable({
  loader: () => new Promise(resolve => setTimeout(() => resolve(import(/* webpackChunkName:'deferred' */ './deferred')), 1000 + Math.random() * 5000)),
  loading: () => <div> loading async </div>
});

const AsyncComponent2 = Loadable({
  loader: () => new Promise(resolve => setTimeout(() => resolve(import(/* webpackChunkName:'deferred' */ './deferred')), 1000 + Math.random() * 5000)),
  loading: () => <div> loading async </div>
});

const AsyncComponent3 = imported(
  () => new Promise(resolve => setTimeout(() => resolve(import(/* webpackChunkName:'deferred' */ './deferred')), 1000 + Math.random() * 3000))
);

const Deferred = React.lazy(() => import(/* webpackChunkName:'deferred' */ './deferred'));

const PrefetchMap = new WeakMap();
const PrefetchLazy = lazy => {
  let value = PrefetchMap.get(lazy) || lazy._ctor();
  PrefetchMap.set(lazy, value);
  return value;
);

console.log(PrefetchLazy(Deferred), PrefetchLazy(Deferred) == PrefetchLazy(Deferred));

const p = AsyncComponent2.preload();

const ClientSideOnly = clientSideComponent(({prop}: any) => <div>render 42: {prop}</div>);

const ServerSideOnly = serverSideComponent(() => <div>should not be visible</div>);

const createCache = (values: any) => {
  const cache = {...values};
  return {
    set(key: string, value: string) {
      cache[key] = value;
    },
    get(key: string) {
      return cache[key]
    }
  }
};

const cache = createCache({});
const control = cacheControler(cache);

export default class App extends Component <{}, AppState> {
  state: AppState = {
    counter: 0,
    c2: 0,
    live: false,
    s: {
      counter: 0,
      c2: 1
    },
    loaded: false
  };

  componentDidMount() {
    AsyncComponent1.preload().then(() => this.setState({loaded: true}));
  }

  restore = (div: HTMLElement) => {
    this.setState({
      counter: +div.querySelector(".counter>i").innerHTML,
      c2: +div.querySelector(".counter>i:nth-child(2)").innerHTML,
    })
  };

  restoreJSON = (div, state) => {
    state && this.setState({s: state});
  }

  setS = (state) => {
    this.setState({s: state});
  }

  render() {
    return (
      <div>
        1
        <CachedLocation cacheKey="1" clientCache>
          test test
        </CachedLocation>
        2
        <CachedLocation cacheKey="2" className="class42">
          test test
        </CachedLocation>
        3
        <ClientSideComponent>
          [[
          <PrerenderedControler control={control}>
            !!
            <CachedLocation cacheKey="1" clientCache as="div">
              cache1 test test {moment().format('MMMM Do YYYY, h:mm:ss a')}
            </CachedLocation>
            -
            <CachedLocation cacheKey="2" as="span">
              cache2 test test {moment().format('MMMM Do YYYY, h:mm:ss a')}
            </CachedLocation>
            -
            <CachedLocation cacheKey="2" clientCache rehydrate>
              cache3 test test {moment().format('MMMM Do YYYY, h:mm:ss a')}
            </CachedLocation>
            !!
          </PrerenderedControler>
          ]]
        </ClientSideComponent>
        <ServerSideComponent>
          Server-side rendered
        </ServerSideComponent>
        4
        <ClientSideComponent>
          Client-side rendered
        </ClientSideComponent>
        5
        <PrerenderedComponent
          restore={this.restore}
          live={!!this.state.counter}
        >
          <p>Dom stored</p>
          <Counter counter={this.state.counter} c2={this.state.c2}/>
        </PrerenderedComponent>
        6
        <PrerenderedComponent
          restore={this.restoreJSON}
          live={!!this.state.s.counter}
          store={this.state.s}
        >
          <p>JSON stored</p>
          <Counter counter={this.state.s.counter} c2={this.state.s.c2} onChange={this.setS}/>
        </PrerenderedComponent>
        7
        <PrerenderedControler control={control}>
          <PrerenderedComponent
            live={this.state.loaded}
          >
            <AsyncComponent1/>
          </PrerenderedComponent>
        </PrerenderedControler>
        8
        <PrerenderedComponent
          live={p}
        >
          <AsyncComponent2/>
        </PrerenderedComponent>
        9
        <PrerenderedComponent
          live={AsyncComponent3.preload()}
        >
          <AsyncComponent3/>
        </PrerenderedComponent>
        <ClientSideOnly prop={42}/>
        <ServerSideOnly/>

        <PrerenderedComponent
          live={false}
        >
          I am lost, but still rendered
        </PrerenderedComponent>
      </div>
    )
  }
}