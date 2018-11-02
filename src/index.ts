import {PrerenderedComponent} from "./PrerenderedComponent";
import {ClientSideComponent} from "./ClientSideComponent";
import {ServerSideComponent} from "./ServerSideComponent";
import {thisIsServer, isThisServer} from "./utils";
import {CachedLocation} from "./CachedLocation";
import {PrerenderedControler} from "./PrerenderedControl";

export {
  PrerenderedComponent,
  ClientSideComponent,
  ServerSideComponent,

  // waiting for the suspense
  CachedLocation,
  PrerenderedControler,

  thisIsServer,
  isThisServer,
};