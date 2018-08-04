import * as React from 'react';
import {UIDFork, UIDConsumer} from "react-uid";

let isServerSide = false;

export const thisIsServer = () => isServerSide = true;

export interface ComponentProps {
  restore?: (element: HTMLElement, store?: any) => Promise<any> | any;
  store?: any;
  live: boolean;

  className?: string;
  style?: React.CSSProperties
}

export interface WrapperProps {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  live: boolean;

  dehydrate: (element: HTMLElement) => void;
}

export interface ComponentState {
  live: boolean;
  hydrated: boolean;
  state: any;
}

const getInnerHTML = (id: string): string | null => {
  const element = document && document.getElementById(id);
  return element ? element.innerHTML : null;
};

class PrerenderedWrapper extends React.Component<WrapperProps> {
  state = {
    html: getInnerHTML(this.props.id)
  };

  componentDidMount() {
    const {live, dehydrate, id} = this.props;
    if (!live) {
      const element = document.getElementById(id);
      if (element) {
        dehydrate(element);
      }
    }
  }

  render() {
    const {children, live, id, className, style} = this.props;
    const {html} = this.state;
    const props = {id, className, style, 'data-prerendered-border': true};
    return (live || !html)
      ? <div {...props}>{children}</div>
      : <div {...props} dangerouslySetInnerHTML={{__html: html || ''}}/>
  }
}

export class PrerenderedComponent extends React.Component<ComponentProps, ComponentState> {

  state: ComponentState = {
    hydrated: false,
    state: null,
    live: false,
  };

  componentDidMount() {
    if (this.props.live && this.props.live !== true) {
      Promise
        .resolve(this.props.live)
        .then(live => this.setState({live: !!live}))
    }
  }

  dehydrate = (el: HTMLElement) => {
    if (this.props.restore) {
      const store = el.querySelector(`script[type="text/store-${el.id}"]`);
      Promise
        .resolve(this.props.restore(el, JSON.parse((store ? store.textContent : '') || '{}')))
        .then((state: any) => this.setState({live: true, state}))
    }
  };

  render() {
    const {className, style, children, live, store} = this.props;
    return (
      <UIDFork>
        <UIDConsumer>
          {uid => (
            <PrerenderedWrapper
              id={"prc-" + uid}
              className={className}
              style={style}
              live={live || this.state.live || isServerSide}
              dehydrate={this.dehydrate}
            >
              {store && <script type={`text/store-prc-${uid}`}>{JSON.stringify(store)}</script>}
              {children}
            </PrerenderedWrapper>
          )}
        </UIDConsumer>
      </UIDFork>
    );
  }
}