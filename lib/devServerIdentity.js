import {createHash} from 'node:crypto';
import path from 'node:path';

export function devServerIdentity(root){
  const normalized=path.resolve(root);
  return {app:'9workforce-dev',workspace:createHash('sha256').update(process.platform==='win32'?normalized.toLowerCase():normalized).digest('hex')};
}
