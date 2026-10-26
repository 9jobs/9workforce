// Probe the same interface that the local website binds to. A slow response
// does not prove that another process owns the port, so retry before failing.
export async function devServerStatus(url,{attempts=3,timeout=2500}={}){
  for(let attempt=0;attempt<attempts;attempt++){
    try{
      const response=await fetch(`${url}/api/dev/status`,{
        signal:AbortSignal.timeout(timeout),redirect:'manual',
      });
      let status;
      try{status=await response.json();}catch(error){
        if(error.name==='TimeoutError'||error.name==='AbortError')throw error;
      }
      return {response,status};
    }catch(error){
      if(error.cause?.code==='ECONNREFUSED')return {};
      if(attempt===attempts-1)throw error;
    }
  }
}
