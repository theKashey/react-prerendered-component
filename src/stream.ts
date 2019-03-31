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
  buffer: string;
  noCache: boolean;
  variables: Record<string, string>;
}

interface CacheLine {
  cache: { [key: string]: CacheTrack }
  scopes: TrackItem[];
  doNoCache: number;
  tail: string;
}

export const sequenceParser = (html: string, markers: Record<any, string>) => {
  let position = Object.keys(markers).map(key => ({key, value: markers[key]}));
  let index: number;
  for (index = 0; index < html.length; index++) {
    const c = html[index];
    position = position.filter(position => position.value[index] === c);
    if (position.length === 0) {
      return false;
    }
    if (position.length === 1 && index === (position[0].value.length - 1)) {
      break
    }
  }

  const blocks = [];
  let lastIndex = index + 1;
  let isOpen = '';
  let isBraceOpen = false;

  for (; index < html.length; index++) {
    const c = html[index];
    if (!isBraceOpen) {
      if (isOpen && c === '\\') {
        isBraceOpen = true;
      }
      if (c === '"' && !isOpen) {
        isOpen = c;
      } else if (c === isOpen && isOpen) {
        isOpen = '';
      } else if ((c === ' ' || c === '>') && !isOpen) {
        blocks.push(html.substring(lastIndex, index));
        lastIndex = index + 1;
      }
    } else {
      isBraceOpen = false;
    }
  }

  return {
    key: position[0].key,
    blocks
  };
};

export const toTemplateVariables = (variables): Record<string, string> => {
  return {};
}

export const process = (chunk: string, line: CacheLine, cache: CacheControl) => {
  const data: string = line.tail + chunk;
  let result = '';

  const tracking = line.scopes;

  let indexOpen = 0;
  let indexClose = 0;
  let isOpen = true;
  let isQuoteOpen = false;
  let phase = 0;

  for (let index = 0; index < data.length; index++) {
    const c = data[index];
    let push: string = c;
    if (c === '<' && !isQuoteOpen) {
      phase = 1;
      indexOpen = index;
      indexClose = 0;
      isOpen = false;
    } else if (c === '>' && !isQuoteOpen) {
      phase = 0;
      indexClose = index;

      push = data.substring(indexOpen, indexClose + 1);
      const tag = push;

      indexOpen = indexClose = 0;
      isOpen = true;

      if (tag[1] === 'x' || tag[2] === 'x') {

        //sequenceParser(tag)

        const isStoreOpen = tag.match(/^<x-cached-store-([^>]*)>/i);
        const isStoreClose = tag.match(/^<\/x-cached-store-([^>]*)>/i);

        const isRestore = tag.match(/^<x-cached-restore-([^>]*)\/>/i);
        const isRestoreOpen = tag.match(/^<x-cached-restore-([^>]*)>/i);
        const isRestoreClose = tag.match(/^<\/x-cached-restore-([^>]*)>/i);

        const isNotCacheOpen = tag.match(/^<x-cached-do-not-cache>/i);
        const isNotCacheClose = tag.match(/^<\/x-cached-do-not-cache>/i);

        if (!isStoreOpen && !isStoreClose && !isRestore && !isRestoreOpen && !isRestoreClose && !isNotCacheOpen && !isNotCacheClose) {
          // nope
        } else {
          push = "";

          /// RESTORE
          if (isRestore) {
            const str = cache.get(+isRestore[1].trim()) || 'broken-cache';
            push = String(str);
          } else if (isRestoreOpen) {
          } else if (isRestoreClose) {
            const str = cache.get(+isRestoreClose[1].trim()) || 'broken-cache';
            push = String(str);

            /// STORE
          } else if (isStoreOpen) {
            const variables = isStoreOpen[1].split(' ');
            const key: string = variables[0];
            line.cache[key] = {
              buffer: "",
              variables: toTemplateVariables(variables),
              noCache: false
            };
          } else if (isStoreClose) {
            const key = +isStoreClose[1].trim();

            // store cache only if allowed
            if (!line.doNoCache && !line.cache[key].noCache) {
              cache.set(key, line.cache[key].buffer);
            }
            delete line.cache[key];

            /// CACHE
          } else if (isNotCacheOpen) {
            Object
              .keys(line.cache)
              .forEach(key => line.cache[key].noCache = true);

            line.doNoCache++;
          } else if (isNotCacheClose) {
            line.doNoCache--;
          }
        }
      }
    } else {
      const nextIndex = (phase === 0
          ? data.indexOf('<', index)
          : data.indexOf('>', index)
      );

      if (nextIndex > index) {
        push = data.substring(index, nextIndex);
        index = nextIndex - 1;
      }
    }

    if (isOpen) {
      result += push;
      Object
        .keys(line.cache)
        .forEach(key => {
          line.cache[key].buffer += push;
        });
    }
  }
  if (!isOpen) {
    line.tail = data.substring(indexOpen, data.length);
  }
  line.scopes = tracking;
  return result;
};

const createLine = (): CacheLine => ({
  cache: {},
  scopes: [],
  tail: '',
  doNoCache: 0,
});

export const cacheRenderedToString = (str: string, cache: CacheControl) => (
  str.indexOf('x-cached') > 0
    ? process(str, createLine(), cache)
    : str
);

export const createCacheStream = (cache: CacheControl) => {

  const line = createLine();

  return new Transform({
    // transform() is called with each chunk of data
    transform(chunk: any, _: string, callback: TransformCallback) {
      callback(undefined, Buffer.from(process(chunk.toString('utf-8'), line, cache), 'utf-8'));
    },

    flush(cb) {
      cb(undefined, line.tail);
    }
  });
};