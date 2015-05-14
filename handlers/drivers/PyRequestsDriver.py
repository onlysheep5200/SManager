from __future__ import unicode_literals
from RestDriver import * 
import requests
import json
class PyRequestsDriver(RestDriver):
    def __init__(self):
        pass
    def _req(self, url, method, arg):
        print 'url is %s',url
        print 'method is %s',method
        r = None
        if not arg : 
            r = getattr(requests,method)(url)
        else :
            if method == 'get':
                r = requests.get(url, params=arg)
            elif method == 'post':
                r = requests.post(url,data=json.dumps(arg))
        try:
            result = r.json()
        except:
            result = "%d:%s:[%s]"%(r.status_code,r.reason,r.text)
        return result
    def GET(self, url, arg=None):
        return self._req(url,'get',arg)
    def POST(self,url,arg=None):
        return self._req(url,'post',arg)
    def DELETE(self,url,arg=None):
        return self._req(url,'delete',arg)
