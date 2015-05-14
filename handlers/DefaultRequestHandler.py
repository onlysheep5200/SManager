''' handle rest request to controller'''
from __future__ import unicode_literals
from config import APIS, BASEURL, DRIVER, ARG_TO_STR
from warnning import * 
from decorators import *
import json
class DefaultRequestHandler(object):
    def __init__(self):
        module = __import__('drivers.%s'%(DRIVER),globals(),locals(),[DRIVER])
        self.driver = getattr(module, DRIVER)()
        self.apis = APIS
    def _invoke(self, url, method, api, arg):
        try:
            result = getattr(self.driver,method)(url, arg) 
            if type(result)!= type('s'): 
                return self._success(result)
            else:
                cols = result.split(':')
                if(cols[0] == '200'):
                    return self._success('operation success')
                else:
                    return self._failure(cols[0],cols[1],cols[2])
        except Exception,e:
            raise e

    def _success(self,result):
        return dict(status="success",content=result)

    def _failure(self,status_code,reason,raw):
        return dict(status="falure",status_code = status_code,reason=reason,raw=raw)

    def request(self,api, arg=None):
	print 'arg is %s'%str(arg)
        if api in self.apis : 
            method = self.apis[api]['method']
            default = self.apis[api].get('default')
            url = self.apis[api]['url']
            if not arg : 
                arg = default
            if default :
                if type(arg) != type(default):
		    return self._failure(500, ARG_ILLEGAL, ARG_ILLEGAL)
			
                if type(arg) != type({}):
                    url = url%(BASEURL, arg)
                    arg = None
                else:
                    url = url%(BASEURL,)
            else:
                url = url%(BASEURL,)
            try:
                return self._invoke(url, method, api, arg)
            except Exception,e:
                return self._failure(500,NO_SUCH_METHOD,'')
            
        else:
            return self._failure(500,NO_SUCH_API,'')
