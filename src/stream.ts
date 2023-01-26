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
  stack: Array<string | number>;
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
      } else if ((c === ' ' || (c === '>' || c === '}')) && !isOpen) {
        blocks.push(html.substring(lastIndex, index));
        lastIndex = index + 1;
      } else if (c === '/' && (html[index + 1] === '>' || html[index + 1] === '}') && !isOpen) {
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

export const splitFirst = (str: string, needle: string) => {
  const position = str.indexOf(needle);
  return position >= 0
    ? [str.substr(0, position), str.substr(position + 1)]
    : [str];
};

export const nextIndexOf = (str: string, needles: string[], index: number) => {
  for (let i = index; i < str.length; ++i) {
    for (let j = 0; j < needles.length; ++j) {
      if (str[i] == needles[j]) {
        return i;
      }
    }
  }
  return -1;
}


export const toTemplateVariables = (variables: string[]) => {
  if (variables.length === 1) {
    return {};
  }
  const result: Record<string, string | boolean> = {};
  variables.forEach((str, index) => {
    if (index > 0) {
      const [key, value] = splitFirst(str, '=');
      result[key] = value ? value.substring(1, value.length - 1) : true;
    }
  });
  return result;
};

const lineVariables = (variables: any) => {
  const line = createLine();
  line.stack.push('*');
  line.cache['*'] = {
    variables,
    buffer: '',
  } as any;
  return line;
};

export const restore = (variables: any, chunk: string, cache: CacheControl) => {
  return process(chunk, lineVariables(variables), cache)
};

export const process = (chunk: string, line: CacheLine, cache: CacheControl) => {
  const data: string = line.tail + chunk;
  let result = '';

  const tracking = line.scopes;

  let indexOpen = 0;
  let indexClose = 0;
  let braceIndexOpen = 0;
  let braceIndexClose = 0;
  let isOpen = true;
  let isBraceOpen = true;
  let tagPhase = 0;
  let bracePhase = 0;

  let push: string;
  let templatePush: string = '';

  function parseTag(tag: string) {
    indexOpen = indexClose = 0;
    isOpen = true;

    const stind = tag.indexOf('x-cached');

    if (stind <= 0) {
      return
    } else if (stind === 1 || stind === 2) {
      const prefix = `x-cached${cache.seed || ''}`;

      const cmd = sequenceParser(tag, {
        isStoreOpen: `<${prefix}-store-`,
        isStoreClose: `</${prefix}-store-`,
        isRestoreOpen: `<${prefix}-restore-`,
        isRestoreClose: `</${prefix}-restore-`,
        isNotCacheOpen: `<${prefix}-do-not-cache`,
        isNotCacheClose: `</${prefix}-do-not-cache`,
        isPlaceholderOpen: `{${prefix}-placeholder-`,
      });

      if (!cmd || !cmd.key) {
        // nope
      } else {
        push = "";

        switch (cmd.key) {
          /// RESTORE
          case 'isRestoreOpen': {
            if (cmd.closing) {
              const str = cache.get(+cmd.blocks[0]) || 'broken-cache';
              push = restore(toTemplateVariables(cmd.blocks), String(str), cache);
            } else {
              line.cache[+cmd.blocks[0]] = {
                buffer: "",
                variables: toTemplateVariables(cmd.blocks),
                noCache: false
              }
            }
            break;
          }
          case 'isRestoreClose': {
            const str = cache.get(+cmd.blocks[0]) || 'broken-cache';
            push = restore(line.cache[+cmd.blocks[0]].variables, String(str), cache);
            break;
          }

          /// CACHE
          case 'isStoreOpen': {
            const key = +cmd.blocks[0];
            line.cache[key] = {
              buffer: "",
              variables: toTemplateVariables(cmd.blocks),
              noCache: false
            };

            line.stack.push(key);
            break;
          }

          case 'isStoreClose': {
            const key = +cmd.blocks[0];

            // store cache only if allowed
            if (!line.doNoCache && !line.cache[key].noCache) {
              cache.set(key, line.cache[key].buffer);
            }
            delete line.cache[key];
            line.stack.pop();
            break;
          }

          /// PLACEHOLDER
          case 'isPlaceholderOpen': {
            if (cmd.closing) {
              const key = cmd.blocks[0];
              push = line.cache[line.stack[line.stack.length - 1]].variables[key];
              templatePush = tag;
            }
            break;
          }
          case 'isPlaceholderClose': {
            const key = cmd.blocks[0];
            push = line.cache[line.stack[line.stack.length - 1]].variables[key];
            templatePush = tag;
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
    } else {
      templatePush = tag;
      push = tag[0] + process(
        tag.substring(1, tag.length - 2),
        lineVariables(line.stack.length>0 ? line.cache[line.stack[line.stack.length - 1]].variables : {}),
        cache,
      ) + tag.substring(tag.length - 2)
    }
  }

  for (let index = 0; index < data.length; index++) {
    const c = data[index];
    push = c;
    templatePush = '';

    if (c === '<') {
      tagPhase = 1;
      indexOpen = index;
      indexClose = 0;
      isOpen = false;
    } else if (c === '>') {
      tagPhase = 0;
      indexClose = index;

      push = data.substring(indexOpen, indexClose + 1);
      parseTag(push);
      isOpen = true;
    } else if (c === '{') {
      bracePhase = 1;
      braceIndexOpen = index;
      braceIndexClose = 0;
      isBraceOpen = false;
    } else if (c === '}') {
      bracePhase = 0;
      braceIndexClose = index;

      push = data.substring(braceIndexOpen, braceIndexClose + 1);
      parseTag(push);
      isBraceOpen = true;
    } else {
      const nextIndex = (
        tagPhase === 1
          ? data.indexOf('>', index)
          : (
            bracePhase === 1
              ? data.indexOf('}', index)
              : nextIndexOf(data, ['<', '{'], index)
          )
      );

      if (nextIndex > index) {
        push = data.substring(index, nextIndex);
        index = nextIndex - 1;
      }
    }

    if (isOpen && isBraceOpen) {
      result += push;
      Object
        .keys(line.cache)
        .forEach(key => {
          line.cache[key].buffer += templatePush || push;
        });
    }
  }
  if (!(isOpen && isBraceOpen)) {
    line.tail = data.substring(indexOpen, data.length);
  }
  line.scopes = tracking;
  return result;
};

const createLine = (): CacheLine => ({
  cache: {},
  scopes: [],
  stack: [],
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