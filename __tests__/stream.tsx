import {process, sequenceParser} from '../src/stream';

describe('utils', () => {
  it('smoke bad', () => {
    const result = sequenceParser('<input-42 test value="42" value2="43>" end>', {
      wrong: '<button',
      alsoWrong: '<input-24',
    });
    expect(result).toBe(false);
  });

  it('sequenceParser', () => {
    const result = sequenceParser('<input-42 test value="42 \\\"42" value2="43>" end>', {
      wrong: '<button',
      right: '<input-',
    });
    expect(result).not.toBe(false);
    expect(result.key).toEqual('right');
    expect(result.blocks).toEqual(['42', 'test', 'value="42 \\\"42"', 'value2="43>"', 'end']);
  })

});

describe('stream', () => {
  const cacheControler = cache => cache as any;
  const createCacheLine = () => ({
    cache: {},
    scopes: [],
    tail: [],
  });

  it('extracts one tag without touching the cache', () => {
    expect(process('1<div>2</div>3', createCacheLine(), cacheControler({
      get() {
        return "wrong"
      },
      set() {
      }
    }))).toBe('1<div>2</div>3')
  });

  it('inlines one cache', () => {
    expect(process('1<x-cached-restore-42/>3', createCacheLine(), cacheControler({
      get(key) {
        return key === 42 ? "right" : `wrong${key}`;
      },
      set() {
      },
    }))).toBe('1right3')
  });
  it('inlines one cache in verbose form', () => {
    expect(process('1<x-cached-restore-42></x-cached-restore-42>3', createCacheLine(), cacheControler({
      get(key) {
        return key === 42 ? "right" : "wrong"
      },
      set() {
      },
    }))).toBe('1right3')
  });

  it('inlines two cache', () => {
    expect(process('1<x-cached-restore-42/><x-cached-restore-24/>3', createCacheLine(), cacheControler({
      get(key) {
        return key
      },
      set() {
      },
    }))).toBe('142243')
  });

  it('stores one cache', () => {
    const cache: any = {};
    expect(process('1<x-cached-store-42>2</x-cached-store-42>3', createCacheLine(), cacheControler({
      get() {
        return "wrong"
      },
      set(key, value) {
        cache[key] = value;
      },
    }))).toBe('123');
    expect(cache).toEqual({"42": "2"});
  });

  it('stores one cache with restore inside', () => {
    const cache: any = {};
    expect(process('1<x-cached-store-42>2<x-cached-restore-1/></x-cached-store-42>3', createCacheLine(), cacheControler({
      get(key) {
        return `cache${key}`
      },
      set(key, value) {
        cache[key] = value;
      },
    }))).toBe('12cache13');
    expect(cache).toEqual({"42": "2cache1"});
  });

  it('splitted caching', () => {
    const cache: any = {};
    const line = createCacheLine();
    const cacher = cacheControler({
      get(key) {
        return `cache${key}`
      },
      set(key, value) {
        cache[key] = value;
      }
    });
    expect(process('pre<x-cached-store-42>mid', line, cacher)).toBe('premid');
    expect(cache).toEqual({});
    expect(process('next</x-cached-store-42>end', line, cacher)).toBe('nextend');
    expect(cache).toEqual({"42": "midnext"});
  });

  it('partial caching', () => {
    const cache: any = {};
    const line = createCacheLine();
    const cacher = cacheControler({
      get(key) {
        return `cache${key}`
      },
      set(key, value) {
        cache[key] = value;
      }
    });
    expect(process('pre<x-cached-store', line, cacher)).toBe('pre');
    expect(cache).toEqual({});

    expect(process('-42>midnext</x-cached-store-42>end', line, cacher)).toBe('midnextend');
    expect(cache).toEqual({"42": "midnext"});
  });
});