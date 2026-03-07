import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('@babel/register', pathToFileURL('./'));
import('./src/index.jsx');
