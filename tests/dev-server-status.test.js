import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {devServerStatus} from '../scripts/dev-server-status.mjs';

async function withServer(handler,run){
  const server=http.createServer(handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{await run(`http://127.0.0.1:${server.address().port}`);}
  finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}

test('reads identity from the local server',async()=>{
  await withServer((req,res)=>{
    assert.equal(req.url,'/api/dev/status');
    res.end(JSON.stringify({app:'9workforce-dev',workspace:'test'}));
  },async url=>{
    const {response,status}=await devServerStatus(url);
    assert.equal(response.status,200);
    assert.equal(status.workspace,'test');
  });
});

test('retries a temporarily unresponsive server',async()=>{
  let requests=0;
  await withServer((req,res)=>{
    if(++requests===1)return;
    res.end('{"app":"9workforce-dev"}');
  },async url=>{
    const {status}=await devServerStatus(url,{timeout:100});
    assert.equal(status.app,'9workforce-dev');
    assert.equal(requests,2);
  });
});

test('bounds retries even when response headers arrive without a body',async()=>{
  let requests=0;
  await withServer((req,res)=>{requests++;res.writeHead(200);res.flushHeaders();},async url=>{
    await assert.rejects(devServerStatus(url,{attempts:2,timeout:100}),{name:'TimeoutError'});
    assert.equal(requests,2);
  });
});

test('keeps an unrelated HTTP server distinguishable from a free port',async()=>{
  await withServer((req,res)=>{res.writeHead(404);res.end('Other app');},async url=>{
    const {response,status}=await devServerStatus(url);
    assert.equal(response.status,404);
    assert.equal(status,undefined);
  });
});

test('allows startup when no server is listening',async()=>{
  let url;
  await withServer((req,res)=>res.end(),async address=>{url=address;});
  assert.deepEqual(await devServerStatus(url),{});
});
