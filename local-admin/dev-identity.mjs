import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const panelRoot=path.dirname(fileURLToPath(import.meta.url));
export const panelIdentity={
  app:'9workforce-local-panels',
  workspace:createHash('sha256').update(process.platform==='win32'?panelRoot.toLowerCase():panelRoot).digest('hex'),
};
