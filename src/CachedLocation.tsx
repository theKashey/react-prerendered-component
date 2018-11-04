import * as React from "react";
import {PrerenderedControls} from "./PrerenderedControl";

const Uncached: React.SFC<{ cacheId: number | string }> = ({cacheId, children}) => (
  React.createElement(`x-cached-store-${cacheId}`, null, children)
);

export interface CachedLocationProps {
  cacheKey: string;
  refresh?: boolean;
  ttl?: number;
  clientCache?: boolean;
  noCache?: boolean;
}

export const CachedLocation: React.SFC<CachedLocationProps> = ({
                                                                 cacheKey,
                                                                 noCache,
                                                                 clientCache,
                                                                 ttl = Infinity,
                                                                 refresh,
                                                                 children
                                                               }) => (
  <PrerenderedControls>
    {({control, isServer}) => {
      if (!isServer && !clientCache || noCache || !control || !control.cache) {
        return children;
      }

      const cached = control.cache.get(cacheKey);
      if (cached && !refresh) {
        return React.createElement(`x-cached-restore-${control.store(cacheKey, cached)}`);
      } else {
        return <Uncached cacheId={control.assign(cacheKey, ttl)}>{children}</Uncached>;
      }
    }}
  </PrerenderedControls>
);