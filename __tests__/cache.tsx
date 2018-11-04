import * as React from 'react';
import {renderToStaticMarkup, renderToStaticNodeStream} from 'react-dom/server';
import {mount} from 'enzyme';
import {
  PrerenderedControler,
  cacheControler,
  CachedLocation,
  cacheRenderedToString,
  createCacheStream,
  PrerenderedComponent
} from "../src";
import {UIDReset} from "react-uid";

describe('Cache', () => {
  const createCache = (values: any) => {
    const cache = {...values};
    return {
      set(key: string, value: string) {
        cache[key] = value;
      },
      get(key: string) {
        return cache[key]
      }
    }
  };

  it('SimpleCache', () => {
    const cache = createCache({});
    const control = cacheControler(cache);
    const wrapper1 = mount(
      <div>
        <PrerenderedControler control={control}>
          pre
          <CachedLocation cacheKey="test">
            this is cached
          </CachedLocation>
          post
        </PrerenderedControler>
      </div>
    );
    expect(wrapper1.html()).toEqual('<div>pre<x-cached-store-1>this is cached</x-cached-store-1>post</div>');

    const wrapper2 = mount(
      <div>
        <PrerenderedControler control={control}>
          pre
          <CachedLocation cacheKey="test">
            this is cached
          </CachedLocation>
          post
        </PrerenderedControler>
      </div>
    );
    expect(wrapper2.html()).toEqual('<div>pre<x-cached-store-2>this is cached</x-cached-store-2>post</div>');

    expect(cacheRenderedToString(wrapper2.html(), control)).toEqual('<div>prethis is cachedpost</div>');

    const wrapper3 = mount(
      <div>
        <PrerenderedControler control={control}>
          pre
          <CachedLocation cacheKey="test">
            this is cached
          </CachedLocation>
          post
        </PrerenderedControler>
      </div>
    );
    expect(wrapper3.html()).toEqual('<div>pre<x-cached-restore-3></x-cached-restore-3>post</div>');

    expect(cacheRenderedToString(wrapper3.html(), control)).toEqual('<div>prethis is cachedpost</div>');
  });

  it('React.renderToString', () => {
    const cache = createCache({});
    const control = cacheControler(cache);
    const output = renderToStaticMarkup(
      <div>
        <PrerenderedControler control={control}>
          pre
          <CachedLocation cacheKey="test">
            this is cached
          </CachedLocation>
          post
        </PrerenderedControler>
      </div>
    );
    expect(output).toEqual('<div>pre<x-cached-store-1>this is cached</x-cached-store-1>post</div>');
    expect(cacheRenderedToString(output, control)).toEqual('<div>prethis is cachedpost</div>');
  });

  it('React.renderToStream', async () => {
    const cache = createCache({});
    const control = cacheControler(cache);
    const cacheStream = createCacheStream(control);
    const output = renderToStaticNodeStream(
      <div>
        <PrerenderedControler control={control}>
          pre
          <CachedLocation cacheKey="test">
            this is cached
          </CachedLocation>
          post
        </PrerenderedControler>
      </div>
    );
    const streamString = async (readStream: any) => {
      const result = [];
      for await (const chunk of readStream) {
        result.push(chunk);
      }
      return result.join('')
    };

    const [tr, base] = await Promise.all([
      streamString(output.pipe(cacheStream)),
      streamString(output)
    ]);

    expect(base).toEqual('<div>pre<x-cached-store-1>this is cached</x-cached-store-1>post</div>');
    expect(tr).toEqual('<div>prethis is cachedpost</div>');
  })

  it('cached+prerendered', () => {
    const cache = createCache({});
    const control = cacheControler(cache);

    const App = () => (
      <div>
        <UIDReset>
          <PrerenderedControler control={control}>
            pre
            <CachedLocation cacheKey="test">
              <PrerenderedComponent live={true}>
                cached1
              </PrerenderedComponent>
              <PrerenderedComponent live={true}>
                cached2
              </PrerenderedComponent>
            </CachedLocation>
            post
            <PrerenderedComponent live={true}>
              cached3
            </PrerenderedComponent>
          </PrerenderedControler>
        </UIDReset>
      </div>
    );

    const expectedOutput = '<div>pre<div id="prc-1-1-1" data-prerendered-border="true">cached1</div><div id="prc-1-2-1" data-prerendered-border="true">cached2</div>post<div id="prc-2-1" data-prerendered-border="true">cached3</div></div>';

    const rawOutput = renderToStaticMarkup(<App/>);
    expect(rawOutput).toEqual('<div>pre<x-cached-store-1><div id="prc-1-1-1" data-prerendered-border="true">cached1</div><div id="prc-1-2-1" data-prerendered-border="true">cached2</div></x-cached-store-1>post<div id="prc-2-1" data-prerendered-border="true">cached3</div></div>');
    expect(cacheRenderedToString(rawOutput, control)).toEqual(expectedOutput);

    const cachedOutput = renderToStaticMarkup(<App/>);
    expect(cachedOutput).toEqual('<div>pre<x-cached-restore-2></x-cached-restore-2>post<div id="prc-2-1" data-prerendered-border="true">cached3</div></div>');
    expect(cacheRenderedToString(cachedOutput, control)).toEqual(expectedOutput);
  });
});
