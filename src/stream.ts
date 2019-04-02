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
  let closing = false;
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
      } else if (c === '/' && html[index + 1] === '>' && !isOpen) {
        blocks.push(html.substring(lastIndex, index));
        lastIndex = index + 1;
        closing = true;
      }
    } else {
      isBraceOpen = false;
    }
  }

  return {
    key: position[0].key,
    blocks,
    closing,
  };
};

export const toTemplateVariables = (variables): Record<string, string> => {
  return {};
};

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
        const prefix = `x-cached${cache.seed || ''}`;

        const cmd = sequenceParser(tag, {
          isStoreOpen: `<${prefix}-store-`,
          isStoreClose: `</${prefix}-store-`,
          isRestoreOpen: `<${prefix}-restore-`,
          isRestoreClose: `</${prefix}-restore-`,
          isNotCacheOpen: `<${prefix}-do-not-cache`,
          isNotCacheClose: `</${prefix}-do-not-cache`,
        });

        console.log(tag, cmd, prefix);

        if (!cmd || !cmd.key) {
          // nope
        } else {
          push = "";

          switch (cmd.key) {
            /// RESTORE
            case 'isRestoreOpen': {
              if (cmd.closing) {
                const str = cache.get(+cmd.blocks[0]) || 'broken-cache';
                push = String(str);
              }
              break;
            }
            case 'isRestoreClose': {
              const str = cache.get(+cmd.blocks[0]) || 'broken-cache';
              push = String(str);
              break;
            }

            /// CACHE
            case 'isStoreOpen': {
              const key: string = cmd.blocks[0];
              line.cache[key] = {
                buffer: "",
                variables: toTemplateVariables(cmd.blocks),
                noCache: false
              };
              break;
            }

            case 'isStoreClose': {
              const key = +cmd.blocks[0];

              // store cache only if allowed
              if (!line.doNoCache && !line.cache[key].noCache) {
                cache.set(key, line.cache[key].buffer);
              }
              delete line.cache[key];
              break;
            }

            /// NO CACHE
            case 'isNotCacheOpen': {
              Object
                .keys(line.cache)
                .forEach(key => line.cache[key].noCache = true);

              line.doNoCache++;
              break;
            }

            case 'isNotCacheClose': {
              line.doNoCache--;
              break;
            }
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