import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './app';
import {renderToString} from "react-dom/server";
import {PrerenderedControler} from "../src";

//console.log(renderToString(<PrerenderedControler isServer><App /></PrerenderedControler>));
ReactDOM.hydrate(<PrerenderedControler hydrated><App /></PrerenderedControler>, document.getElementById('app'));
