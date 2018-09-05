import * as React from "react";
import {PrerenderedComponent} from "./PrerenderedComponent";

export interface ComponentProps {
  className?: string;
  style?: React.CSSProperties
}

export const ServerSideComponent: React.SFC<ComponentProps> = (props) => (
  <PrerenderedComponent {...props} live={false}/>
);