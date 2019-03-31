import * as React from "react";
import {PrerenderedControls, PrerenderedContext} from "./PrerenderedControl";
import hoistStat from "hoist-react-statics";

export const NotCacheable: React.SFC = ({children}) => (
  <PrerenderedControls>
    {state => (
      state.control
        ? (
          <PrerenderedContext.Provider value={{...state, control: null} as any}>
            {React.createElement(`x-cached${state.control.seed}-do-not-cache`, null, children)}
          </PrerenderedContext.Provider>
        )
        : children
    )}
  </PrerenderedControls>
);

export function notCacheable<K, T extends React.ComponentType<K>>(Component: T): T {
  const C: any = Component;
  return hoistStat(
    (props: K) => <NotCacheable><C {...props}/></NotCacheable>,
    Component
  );
}