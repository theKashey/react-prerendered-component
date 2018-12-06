import * as React from "react";
import {PrerenderedComponent} from "./PrerenderedComponent";
import hoistStat from "hoist-react-statics";

export interface ComponentProps {
  className?: string;
  style?: React.CSSProperties
}

export const ServerSideComponent: React.SFC<ComponentProps> = (props) => (
  <PrerenderedComponent {...props} live={false} strict/>
);

export function serverSideComponent<K, T extends React.ComponentType<K>>(Component: T): T {
  const C: any = Component;
  return hoistStat(
    (props: K) => <ServerSideComponent><C {...props}/></ServerSideComponent>,
    Component
  );
}