import {PrerenderedComponent} from "./PrerenderedComponent";
import {ClientSideComponent, clientSideComponent} from "./ClientSideComponent";
import {ServerSideComponent, serverSideComponent} from "./ServerSideComponent";
import {thisIsServer, isThisServer} from "./utils";
import {CachedLocation} from "./CachedLocation";
import {NotCacheable, notCacheable} from './NotCacheable';
import {PrerenderedControler, cacheControler} from "./PrerenderedControl";
import {cacheRenderedToString, createCacheStream} from "./stream";
import {Placeholder, WithPlaceholder} from "./Placeholder";

export {
  PrerenderedComponent,
  ClientSideComponent,
  ServerSideComponent,
  clientSideComponent,
  serverSideComponent,

  notCacheable,

  // waiting for the suspense
  CachedLocation,
  NotCacheable,
  PrerenderedControler,
  Placeholder,
  WithPlaceholder,

  cacheControler,
  cacheRenderedToString,
  createCacheStream,

  thisIsServer,
  isThisServer,
};