import * as React from "react";
import {PrerenderedControls} from "./PrerenderedControl";

const Uncached: React.SFC<{cacheId: number | string}> = ({cacheId, children}) => (
  React.createElement(`x-cached-store-${cacheId}`, null, children)
);

export const CachedLocation: React.SFC<{cacheKey: string}> = ({cacheKey, children}) => (
  <PrerenderedControls>
    {({cache}) => {
      const cached = cache.get(cacheKey);
      if(cached) {
        return React.createElement(`x-cached-restore-${cacheKey}`);
      } else {
        return <Uncached cacheId={cache.assign(cacheKey)}>{cacheKey}+{children}</Uncached>;
      }
    }}
  </PrerenderedControls>
);