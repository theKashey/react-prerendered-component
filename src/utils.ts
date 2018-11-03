// @ts-ignore
import * as isNode from 'detect-node';

let isServerSide = isNode;

export const thisIsServer = () => isServerSide = true;
export const isThisServer = () => isServerSide;