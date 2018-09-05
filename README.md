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
