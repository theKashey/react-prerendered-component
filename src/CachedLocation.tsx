import * as React from "react";
import {UIDFork} from "react-uid";
import {CacheControl, TemplateControl, PrerenderedControls} from "./PrerenderedControl";

const Uncached: React.SFC<{
  cacheId: number | string;
  variables?: Record<any, any>;
  seed: string;
}> = ({cacheId, variables, seed, children}) => (
  React.createElement(`x-cached${seed}-store-${cacheId}`, variables, children)
);

export interface CachedLocationProps {
  cacheKey: string;
  refresh?: boolean;
  ttl?: number;
  noCache?: boolean;

  variables?: Record<string, string | number>
}

export interface ServerCachedLocationProps extends CachedLocationProps {
  control: CacheControl;
}

export interface ClientCachedLocationProps extends CachedLocationProps {
  clientCache?: boolean;
  className?: string;
  rehydrate?: boolean;
  as?: string | React.ComponentType;
}

export interface ClientState {
  value: string | false | null;
  hydrated: boolean;
}

export const ServedCachedLocation: React.SFC<ServerCachedLocationProps> = (
  {
    cacheKey,
    control,
    refresh,
    ttl = Infinity,
    children,
    variables,
  }
) => {
  const cached = control.cache.get(cacheKey);
  const {seed} = control;
  if (cached && !refresh) {
    return React.createElement(`x-cached${control.seed}-restore-${control.store(cacheKey, cached)}`, variables);
  } else {
    return <Uncached cacheId={control.assign(cacheKey, ttl)} variables={variables} seed={seed}>{children}</Uncached>;
  }
};

export class ClientCachedLocation extends React.Component<ClientCachedLocationProps & ServerCachedLocationProps, ClientState> {
  public readonly state: Readonly<ClientState> = {
    value: this.props.control.cache.get(this.props.cacheKey),
    hydrated: false
  };

  componentDidMount() {
    if (this.props.rehydrate) {
      // this should/could be a low priority update
      this.setState({
        hydrated: true,
      })
    }
  }

  private onSetRef = (ref: HTMLDivElement) => {
    if (ref) {
      const {control, cacheKey, ttl = 0} = this.props;
      const value = ref.innerHTML;
      control.cache.set(cacheKey, value, ttl);
      this.setState({
        value,
        hydrated: true
      });
    }
  };

  render() {
    const {hydrated, value} = this.state;
    const {className, children, as: Tag = 'div' as any, variables} = this.props;

    if (!hydrated && value) {
      return <Tag dangerouslySetInnerHTML={{__html: value}}/>
    }

    if (variables) {
      return (
        <Tag className={className}>
          <TemplateControl.Consumer>
            {oldState =>
              <TemplateControl.Provider value={{variables: {...oldState.variables, ...variables}, ...oldState}}>
                {children}
              </TemplateControl.Provider>
            }
          </TemplateControl.Consumer>
        </Tag>
      )
    }

    return (
      <Tag className={className} ref={this.onSetRef}>
        {children}
      </Tag>
    )
  }
}

export const CachedLocation: React.SFC<CachedLocationProps | ClientCachedLocationProps> = (
  {
    cacheKey,
    noCache,
    ttl = Infinity,
    refresh,
    children,
    variables,

    clientCache,
    className,
    as,
    rehydrate
  }: any
) => (
  <UIDFork>
    <PrerenderedControls>
      {({control, isServer}) => {
        if (!isServer && !clientCache || noCache || !control || !control.cache) {
          return children;
        }
        if (isServer) {
          return (
            <ServedCachedLocation
              control={control}
              cacheKey={cacheKey}
              refresh={refresh}
              ttl={ttl}
              variables={variables}
            >
              {children}
            </ServedCachedLocation>
          );
        }

        if (clientCache) {
          return (
            <ClientCachedLocation
              control={control}
              cacheKey={cacheKey}
              refresh={refresh}
              className={className}
              ttl={ttl}
              as={as}
              rehydrate={rehydrate}
              variables={variables}
            >
              {children}
            </ClientCachedLocation>
          );
        }

        return children;
      }}
    </PrerenderedControls>
  </UIDFork>
);