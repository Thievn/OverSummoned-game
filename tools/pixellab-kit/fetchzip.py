import sys,json,os,zipfile,io
from pl import *
def fetch(name,cid):
    raw=req('GET',f'/characters/{cid}/zip',raw=True)
    d=f'zips/{name}'; os.makedirs(d,exist_ok=True)
    zipfile.ZipFile(io.BytesIO(raw)).extractall(d)
    meta=json.load(open(f'{d}/metadata.json'))
    return d,meta
if __name__=='__main__':
    d,meta=fetch(sys.argv[1],sys.argv[2])
    st=meta['states'][0]['frames']['animations']
    for k,v in st.items(): print(k,{dd:len(f) for dd,f in v.items()})
