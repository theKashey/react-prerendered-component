import {Transform, TransformCallback} from 'stream';
import {CacheControl} from "./PrerenderedControl";

interface TrackItem {
  index: number;
  open: boolean;
  close: boolean;
  closing: boolean;
  position: 0;
}

interface CacheTrack {
  buffer: any[];
}

interface CacheLine {
  cache: { [key: string]: CacheTrack }
  scopes: TrackItem[];
  tail: any;
}

export const process = (chunk: any, line: CacheLine, cache: CacheControl) => {
  const data = [...line.tail, ...chunk.split('')];
  const result: any[] = [];

  let tracking = line.scopes;

  let indexOpen = 0;
  let indexClose = 0;
  let isOpen = true;

  data.forEach((c, index) => {
    let push = [c];
    if (c === '<') {
      indexOpen = index;
      indexClose = 0;
      isOpen = false;
    } else if (c === '>') {
      indexClose = index;

      push = data.slice(indexOpen, indexClose + 1);
      const tag = push.join('');

      indexOpen = indexClose = 0;
      isOpen = true;

      if (tag[1] === 'x' || tag[2] === 'x') {
        const isStoreOpen = tag.match(/^<x-cached-store-([^>]*)>/i);
        const isStoreClose = tag.match(/^<\/x-cached-store-([^>]*)>/i);
        const isReStore = tag.match(/^<x-cached-restore-([^>]*)\/>/i);

        const isReStoreOpen = tag.match(/^<x-cached-restore-([^>]*)>/i);
        const isReStoreClose = tag.match(/^<\/x-cached-restore-([^>]*)>/i);

        if (!isStoreOpen && !isStoreClose && !isReStore && !isReStoreOpen && !isReStoreClose) {
          // nope
        } else {
          if (isReStore) {
            const str = cache.get(+isReStore[1].trim()) || 'broken-cache';
            push = String(str).split('');
          } else if (isReStoreOpen) {
            push = [];
          } else if (isReStoreClose) {
            const str = cache.get(+isReStoreClose[1].trim()) || 'broken-cache';
            push = String(str).split('');
          } else if (isStoreOpen) {
            const key = isStoreOpen[1].trim();
            line.cache[key] = {buffer: []};
            push = [];
          } else if (isStoreClose) {
            const key = +isStoreClose[1].trim();

            cache.set(key, line.cache[key].buffer.join(''));
            delete line.cache[key];
            push = [];
          }
        }
      }
    }

    if (isOpen) {

      result.push(...push);
      Object
        .keys(line.cache)
        .forEach(key => line.cache[key].buffer.push(...push));
    }

  });
  if (!isOpen) {
    line.tail = data.slice(indexOpen, data.length);
  }
  line.scopes = tracking;
  return result.join('');
};

const createLine = (): CacheLine => ({
  cache: {},
  scopes: [],
  tail: [],
});

export const cacheRenderedToString = (str: string, cache: CacheControl) => (
  process(str, createLine(), cache)
);

export const createCacheStream = (cache: CacheControl) => {

  const line = createLine();

  return new Transform({
    // transform() is called with each chunk of data
    transform(chunk: any, encoding: string, callback: TransformCallback) {
      callback(undefined, Buffer.from(process(chunk.toString('utf-8'), line, cache), 'utf-8'));
    },

    flush(cb) {
      cb();
    }
  });
};