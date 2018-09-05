import * as React from "react";
import {isThisServer} from "./utils";

export const ClientSideComponent: React.SFC = ({children}) => (
  isThisServer()
    ? null
    : <React.Fragment>{children}</React.Fragment>
);