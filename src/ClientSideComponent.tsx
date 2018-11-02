import * as React from "react";
import {PrerenderedControls} from "./PrerenderedControl";

export const ClientSideComponent: React.SFC = ({children}) => (
  <PrerenderedControls>
    {({isServer}) => (
      isServer
        ? null
        : <React.Fragment>{children}</React.Fragment>
    )}
  </PrerenderedControls>
);