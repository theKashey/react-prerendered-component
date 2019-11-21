import * as React from "react";
import hoistStat from 'hoist-react-statics';
import {PrerenderedControls} from "./PrerenderedControl";

export const ClientSideComponent: React.SFC = ({children}) => (
  <PrerenderedControls>
    {({isServer, hydrated}) => (
      (isServer || !hydrated)
        ? null
        : <React.Fragment>{children}</React.Fragment>
    )}
  </PrerenderedControls>
);

export function clientSideComponent<K, T extends React.ComponentType<K>>(Component: T): T {
  const C: any = Component;
  return hoistStat(
    (props: K) => <ClientSideComponent><C {...props}/></ClientSideComponent>,
    Component
  );
}