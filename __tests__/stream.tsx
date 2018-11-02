import {process} from '../src/stream';

describe('stream', () => {
  const createCacheLine = () => ({
    cache: {},
    scopes: [],
    tail: [],
  });

  it('extracts one tag without touching the cache', () => {
    expect(process('1<div>2</div>3', createCacheLine(), {
      get() {
        return "wrong"
      },
      set() {
      },
      assign() {
        return "42"
      }
    })).toBe('1<div>2</div>3')
  });

  it('inlines one cache', () => {
    expect(process('1<x-cached-restore-42/>3', createCacheLine(), {
      get(key) {
        return key === "42" ? "right" : "wrong"
      },
      set() {
      },
      assign() {
        return "42"
      }
    })).toBe('1right3')
  });

  it('inlines two cache', () => {
    expect(process('1<x-cached-restore-42/><x-cached-restore-24/>3', createCacheLine(), {
      get(key) {
        return key
      },
      set() {
      },
      assign() {
        return "42"
      }
    })).toBe('142243')
  });

  it('stores one cache', () => {
    const cache: any = {};
    expect(process('1<x-cached-store-42>2</x-cached-store-42>3', createCacheLine(), {
      get() {
        return "wrong"
      },
      set(key, value) {
        cache[key] = value;
      },
      assign() {
        return "42"
      }
    })).toBe('123');
    expect(cache).toEqual({"42": "2"});
  });

  it('stores one cache with restore inside', () => {
    const cache: any = {};
    expect(process('1<x-cached-store-42>2<x-cached-restore-test/></x-cached-store-42>3', createCacheLine(), {
      get(key) {
        return `cache${key}`
      },
      set(key, value) {
        cache[key] = value;
      },
      assign() {
        return "42"
      }
    })).toBe('12cachetest3');
    expect(cache).toEqual({"42": "2cachetest"});
  });

  it('splitted caching', () => {
    const cache: any = {};
    const line = createCacheLine();
    const cacher = {
      get(key) {
        return `cache${key}`
      },
      set(key, value) {
        cache[key] = value;
      },
      assign() {
        return "42"
      }
    };
    expect(process('pre<x-cached-store-42>mid', line, cacher)).toBe('premid');
    expect(cache).toEqual({});
    expect(process('next</x-cached-store-42>end', line, cacher)).toBe('nextend');
    expect(cache).toEqual({"42": "midnext"});
  });

  it('partial caching', () => {
    const cache: any = {};
    const line = createCacheLine();
    const cacher = {
      get(key) {
        return `cache${key}`
      },
      set(key, value) {
        cache[key] = value;
      },
      assign() {
        return "42"
      }
    };
    expect(process('pre<x-cached-store', line, cacher)).toBe('pre');
    expect(cache).toEqual({});

    expect(process('-42>midnext</x-cached-store-42>end', line, cacher)).toBe('midnextend');
    expect(cache).toEqual({"42": "midnext"});
  });
});