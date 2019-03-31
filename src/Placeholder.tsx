import * as React from "react";
import {TemplateControl} from "./PrerenderedControl";

export const Placeholder: React.SFC<{ name: string, children: never }> = ({name}) => (
  <TemplateControl.Consumer>
    {({variables, isServer}) => (
      isServer
        ? `{##${name}##}`
        : (variables[name] || '{empty}')
    )}
  </TemplateControl.Consumer>
);