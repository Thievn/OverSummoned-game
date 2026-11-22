import os,json,base64,io,time,urllib.request,urllib.error
from PIL import Image
K=os.environ['PIXELLAB_API_KEY']; API='https://api.pixellab.ai/v2'
def req(method,path,body=None,raw=False):
    data=json.dumps(body).encode() if body is not None else None
    r=urllib.request.Request(API+path,data=data,method=method,headers={'Authorization':'Bearer '+K,'Content-Type':'application/json'})
    for attempt in range(6):
        try:
            res=urllib.request.urlopen(r,timeout=300).read()
            return res if raw else json.loads(res)
        except urllib.error.HTTPError as e:
            msg=e.read()[:600]
            if e.code in (429,529,503,502): time.sleep(20*(attempt+1)); continue
            raise RuntimeError(f'{e.code} {path} {msg}')
    raise RuntimeError('retries exhausted '+path)
def b64(im):
    if isinstance(im,str): im=Image.open(im)
    buf=io.BytesIO(); im.save(buf,'PNG'); return {'type':'base64','base64':base64.b64encode(buf.getvalue()).decode(),'format':'png'}
def unb64(x):
    s=x['base64'] if isinstance(x,dict) else x
    s=s.split(',')[-1]; return Image.open(io.BytesIO(base64.b64decode(s))).convert('RGBA')
def balance(): return req('GET','/balance')['subscription']['generations']
def job(jid,every=6,timeout=900):
    t=time.time()
    while time.time()-t<timeout:
        j=req('GET',f'/background-jobs/{jid}')
        if j.get('status')=='completed': return j
        if j.get('status')=='failed': raise RuntimeError('job failed '+json.dumps(j)[:800])
        time.sleep(every)
    raise RuntimeError('timeout '+jid)
