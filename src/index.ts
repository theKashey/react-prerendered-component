import {PrerenderedComponent} from "./PrerenderedComponent";
import {ClientSideComponent} from "./ClientSideComponent";
import {ServerSideComponent} from "./ServerSideComponent";
import {thisIsServer, isThisServer} from "./utils";
import {CachedLocation} from "./CachedLocation";
import {PrerenderedControler, cacheControler} from "./PrerenderedControl";
import {cacheRenderedToString, createCacheStream} from "./stream";

export {
  PrerenderedComponent,
  ClientSideComponent,
  ServerSideComponent,

  // waiting for the suspense
  CachedLocation,
  PrerenderedControler,
  cacheControler,
  cacheRenderedToString,
  createCacheStream,

  thisIsServer,
  isThisServer,
};