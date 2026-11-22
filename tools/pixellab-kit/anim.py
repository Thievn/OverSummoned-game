import sys,json
from pl import *
def animate(cid, name, direction='east', **kw):
    body={'character_id':cid,'animation_name':name,'directions':[direction]}; body.update(kw)
    r=req('POST','/animate-character',body)
    ids=r.get('background_job_ids') or [r.get('background_job_id')]
    res=[job(i,every=8,timeout=1500) for i in ids if i]
    return r,res
if __name__=='__main__':
    cid,name,direction,kw=sys.argv[1],sys.argv[2],sys.argv[3],json.loads(sys.argv[4])
    r,res=animate(cid,name,direction,**kw)
    print(name,'ok',[x.get('usage') for x in res], json.dumps(r)[:200])
