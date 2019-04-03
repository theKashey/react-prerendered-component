import * as React from "react";
import {TemplateControl} from "./PrerenderedControl";

export const Placeholder: React.SFC<{ name: string }> = ({name}) => (
  <TemplateControl.Consumer>
    {({variables, isServer, seed}) => (
      isServer
        ? React.createElement(`x-cached${seed}-placeholder-${name}`)
        : (variables[name] || '{empty}')
    )}
  </TemplateControl.Consumer>
);

type RenderChildren = (arg: (name: string) => string) => React.ReactNode;

export const WithPlaceholder: React.SFC<{ children: RenderChildren }> = ({children}) => (
  <TemplateControl.Consumer>
    {({variables, isServer, seed}) => (
      children(name => (
        isServer
          ? `<x-cached${seed}-placeholder-${name}/>`
          : String((variables[name] || '{empty}'))
      ))
    )}
  </TemplateControl.Consumer>
);