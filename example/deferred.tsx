import * as React from 'react';
import * as moment from 'moment';
import {CachedLocation} from "../src";

export default () => (
  <div>
    I am loaded asynchronously at {moment().format('MMMM Do YYYY, h:mm:ss a')}
    <CachedLocation cacheKey="1" clientCache as="div">
      inner cache
    </CachedLocation>
  </div>
);
