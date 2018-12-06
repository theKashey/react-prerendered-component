import * as React from 'react';
import {UIDFork, UIDConsumer} from "react-uid";
import {PrerenderedControls} from "./PrerenderedControl";

export interface ComponentProps {
  restore?: (element: HTMLElement, store?: any) => Promise<any> | any;
  store?: any;
  live: boolean | Promise<any>;
  strict?: boolean;

  className?: string;
  style?: React.CSSProperties
}

export interface ComponentState {
  live: boolean;
  state: any;
}

export interface WrapperProps {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  live: boolean;
  strict: boolean;

  dehydrate: (element: HTMLElement) => void;
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
    const {children, live, strict, id, className, style} = this.props;
    const {html} = this.state;
    const props = {id, className, style, 'data-prerendered-border': true};
    return (live || (!html && !strict))
      ? <div {...props}>{children}</div>
      : <div {...props} dangerouslySetInnerHTML={{__html: html || ''}}/>
  }
}

const isBooleanFlag = (flag: boolean | Promise<any>): flag is boolean => (
  !flag || typeof flag === 'boolean' || !flag.then
);

export class PrerenderedComponent extends React.Component<ComponentProps, ComponentState> {

  state: ComponentState = {
    state: null,
    live: false,
  };

  awaitingFor: any = undefined;

  static getDerivedStateFromProps(props: ComponentProps, state: ComponentState) {
    if (isBooleanFlag(props.live) && props.live !== state.live) {
      return {
        live: props.live
      }
    }
    return null;
  }

  componentDidMount() {
    this.checkLive();
  }

  componentDidUpdate() {
    this.checkLive();
  }

  checkLive() {
    if (!isBooleanFlag(this.props.live)) {
      this.awaitForLive(this.props.live);
    }
  }

  awaitForLive(live: Promise<any>) {
    if (this.awaitingFor !== live) {
      this.awaitingFor = live;
      Promise
        .resolve(live)
        .then(value => this.props.live === live && this.setState({live: !!value}))
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
    const {className, style, children, store, strict = false} = this.props;
    const {live} = this.state;
    return (
      <PrerenderedControls>
        {({isServer}) => (
          <UIDFork>
            <UIDConsumer>
              {uid => (
                <PrerenderedWrapper
                  id={"prc-" + uid}
                  className={className}
                  style={style}
                  live={!!(live || isServer)}
                  strict={strict}
                  dehydrate={this.dehydrate}
                >
                  {store &&
                  <script type={`text/store-prc-${uid}`} dangerouslySetInnerHTML={{__html: JSON.stringify(store)}}/>}
                  {children}
                </PrerenderedWrapper>
              )}
            </UIDConsumer>
          </UIDFork>
        )}
      </PrerenderedControls>
    );
  }
}