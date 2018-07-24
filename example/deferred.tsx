import * as React from 'react';
import * as moment from 'moment';

export default () => <div>I am loaded asynchronously at {moment().format('MMMM Do YYYY, h:mm:ss a')}</div>