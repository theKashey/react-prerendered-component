import * as React from 'react';
import {PrerenderedComponent} from "../src";

const prefetchMap = new WeakMap();
const prefetchLazy = (LazyComponent:any) => {
  if (!prefetchMap.has(LazyComponent)) {
    prefetchMap.set(LazyComponent, LazyComponent._ctor());
  }
  return prefetchMap.get(LazyComponent);
};

const prerenderedLazy = dynamicImport => {
  const LazyComponent = React.lazy(dynamicImport);
  const live = () => prefetchLazy(dynamicImport)
  return React.memo(props => (
    <PrerenderedComponent live={live}>
      <LazyComponent {...props} />
    </PrerenderedComponent>
  ));
};