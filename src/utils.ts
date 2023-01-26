import {isNode} from 'detect-node-es';

let isServerSide = isNode;

export const thisIsServer = () => isServerSide = true;
export const isThisServer = () => isServerSide;