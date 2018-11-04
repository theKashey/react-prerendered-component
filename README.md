<div align="center">
  <h1>React Prerendered Component</h1>
  <br/>
  Partial Hydration in pre-suspense era. 
  <br/>
  <br/>
  
  <a href="https://www.npmjs.com/package/react-prerendered-component">
    <img src="https://img.shields.io/npm/v/react-prerendered-component.svg?style=flat-square" />
  </a>
</div>

__!! EXPERIMENTAL !!__
 
## Idea
In short: dont try to __run__ js code, and produce a react tree matching pre-rendered one,
but __use__ pre-rendered html until js code will be ready to replace it. Make it live.

- Server side render data 
  - call `thisIsServer` somewhere, to let it know.
  - React-prerendered-component `will leave trails`, wrapping each block with _known_ id.
- Hydrate the client side 
  - React-prerendered-component will search their for ids, and `read rendered HTML` back from a page.
- You site is ready!
  - React-prerendered-components are ready. They are rendering pre-rendered HTML you send from a server.
- Once any component ready to be replaced - replace it
  - But not before. That's the point :)
  
Bonus - you can store and restore component state.

More detauls - https://twitter.com/theKashey/status/1021739948536295424

## Usage

1. Restore data from HTML
```js
<PrerenderedComponent
  // restore - access DIV and get "counter" from HTML
  restore={(el) => this.setState({counter: +el.querySelector('i').innerHTML})}
  // once we read anything - go live!
  live={!!this.state.counter}
>
  <p>Am I alive?</p>
  <i>{this.props.counter}</i>
</PrerenderedComponent>
```    

2. Restore state from JSON stored among.
```js
<PrerenderedComponent
  // restore - access DIV and get "counter" from HTML
  restore={(_,state) => this.setState(state)}
  store={ this.state }
  // once we read anything - go live!
  live={!!this.state.counter}  
>
  <p>Am I alive?</p>
  <i>{this.props.counter}</i>
</PrerenderedComponent>
```    

3. Just do a partial hydrate
```js
const AsyncLoadedComponent = loadable(() => import('deferredComponent'));
const p = AsyncLoadedComponent.preload();

<PrerenderedComponent
  live={p} // then Promise got resolve - component will go live  
>
  <AsyncLoadedComponent />
</PrerenderedComponent>
```

## Caching
Prerendered component could also work as a component-level cache.
Component caching is completely safe, compatible with any React version, but - absolutely
synchronous, thus no Memcache or Redis are possible.
 
```js
import {renderToString, renderToNodeStream} from 'react-dom/server';
import {
  PrerenderedControler, 
  cacheControler, 
  CachedLocation, 
  cacheRenderedToString, 
  createCacheStream
} from "react-prerendered-component";

const controller = cacheControler(cache);

const result = renderToString(
  <PrerenderedControler control={control}>
     <CachedLocation cacheKey="the-key">
        any content
     </CachedLocation>
  </PrerenderedControler>
)

// DO NOT USE result! It contains some system information  
result === <x-cached-store-1>any content</x-cached-store-1>

// actual caching performed in another place
const theRealResult = cacheRenderedToString(result);


// Better use streams

renderToNodeStream(
  <PrerenderedControler control={control}>
     <CachedLocation cacheKey="the-key">
        any content
     </CachedLocation>
  </PrerenderedControler>
)
.pipe(createCacheStream(control)) // magic here
.pipe(res)
```
Stream API is completely _stream_ and would not delay Time-To-First-Byte

- `PrerenderedControler` - top level controller for a cache. Requires `controler` to be set
- `CachedLocation` - location to be cached. 
  - `cacheKey` - string - they key
  - `ttl` - number - time to live
  - `refresh` - boolean - flag to ignore cache
  - `clientCache` - boolean - flag to enable cache on clientSide (disabled by default)
  - `noChange` - boolean - disables cache at all
  
- `cacheControler(cache)` - a cache controller factor, requires object with `cache` interface to work.
  - cache interface is `{ get(key): string, set(key, ttl):void }`
  - cache implimentation is NOT provided by this library.
  
#### Sharing cache between multiple process
Any network based caches are not supported, the best cache you can use - LRU, is bound to single
process, while you probably want multi-threaded(workers) rendering, but dont want to maintain 
per-instance cache.

You may use nodejs shared-memory libraries (not supported by nodejs itself), like:
 - https://github.com/allenluce/mmap-object 

#### Cache speed
Results from rendering a single page 1000 times. All tests executed twice to mitigate possible v8 optimizations.
```text
dry      1013 - dry render to kick off HOT
base     868  - the __real__ rendering speed, about 1.1ms per page
cache    805  - with `cacheRenderedToString` used on uncachable appp
cache    801  - second run (probably this is the "real" speed)
partial  889  - with `cacheRenderedToString` used lightly cached app (the cost of caching)
partial  876  - second run
half     169  - page content cached
half     153  - second run
full     22   - full page caching
full     19   - second run
```
- full page cache is 42x faster. 0.02ms per page render
- half page render is 5x faster.
- partial page render is 1.1x slower.

#### Prerendered support
It is __safe__ to have `prerendered` component inside a cached location.


### Additional API
1. `ServerSideComponent` - component to be rendered only on server. Basically this is PrerenderedComponent with `live=false`
2. `ClientSideComponent` - component to be rendered only on client. Some things are not subject for SSR.
3. `thisIsServer(flag)` - override server/client flag
4. `isThisServer()` - get current environment.

## Automatically goes live
Prerendered component is work only once. Once it mounted for a first time. 

Next time another UID will be generated, and it will not find component to match.
If prerendered-component could not find corresponding component - it goes live automatically.

## Testing
Idea about PrerenderedComponent is to render something, and rehydrate it back. You should be able to 
render the same, using rehydrated data.
- render
- restore
- render
- compare. If result is equal - you did it right.

## While area is not "live" - it's dead
Until component go live - it's dead HTML code. You may be make it more alive by
transforming HTML to React, using [html-to-react](https://github.com/aknuds1/html-to-react),
and go live in a few steps.

## Licence
MIT
