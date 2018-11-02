import * as React from 'react';
import {Component} from 'react';
import {PrerenderedComponent, C, CachedLocation} from "../src/index";
import * as Loadable from 'react-loadable';

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

const AsyncComponent = Loadable({
  loader: () => new Promise(resolve => setTimeout( () => resolve(import(/* webpackChunkName:'deferred' */ './deferred')), 10000)),
  loading: () => <div> loading </div>
});

const p = AsyncComponent.preload();

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
    AsyncComponent.preload().then(() => this.setState({loaded: true}));
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
        <CachedLocation cacheKey="1">
          test test
        </CachedLocation>
        <CachedLocation cacheKey="2">
          test test
        </CachedLocation>
        {/*<PrerenderedComponent*/}
          {/*restore={this.restore}*/}
          {/*live={!!this.state.counter}*/}
        {/*>*/}
          {/*<p>Am I alive?</p>*/}
          {/*<Counter counter={this.state.counter} c2={this.state.c2}/>*/}
        {/*</PrerenderedComponent>*/}

        {/*<PrerenderedComponent*/}
          {/*restore={this.restoreJSON}*/}
          {/*live={!!this.state.s.counter}*/}
          {/*store={this.state.s}*/}
        {/*>*/}
          {/*<p>Am I alive?</p>*/}
          {/*<Counter counter={this.state.s.counter} c2={this.state.s.c2} onChange={this.setS}/>*/}
        {/*</PrerenderedComponent>*/}

        {/*<PrerenderedComponent*/}
          {/*live={this.state.loaded}*/}
        {/*>*/}
          {/*<AsyncComponent/>*/}
        {/*</PrerenderedComponent>*/}

        {/*<PrerenderedComponent*/}
          {/*live={p}*/}
        {/*>*/}
          {/*<AsyncComponent/>*/}
        {/*</PrerenderedComponent>*/}

      </div>
    )
  }
}