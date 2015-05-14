from handlers import config
_cache = config.REQUEST_CACHE
_keys = config.APIS
def getkey(key,args):
    newargs = [str(x) for x in args]
    return "%s%s"%(key,tuple(newargs))


def cached(method):
    def handle_arg(self,key,*args,**kargs):
        if 'direct' in _keys[key] and  _keys[key].get('direct'):
            return method(self,key,*args,**kargs)
        cache_key = "%s%s"%(key,str(args))
        cacheresult = _cache.get(cache_key)
        if not cacheresult : 
            print 'fetch directly'
            cacheresult = method(self,key,*args,**kargs)
            _cache.set(cache_key,cacheresult)
        else : 
	    print 'from cached content for method : %s'%cache_key
        return cacheresult
    return handle_arg

def deletecache(keyindex):
    def handler(method):
        def handler_args(self,key,*args,**kargs):
                        if len(args)>0 : 
                            arg = args[0]
                        else:
                            arg = None
			print 'comming arg is %s'%str(arg)
			result = method(self,key,*args,**kargs)
			if not result.get('status') or 'delete_key' not in _keys[key]:
				pass
			else:
				deleteKey = _keys[key]['delete_key']
				if arg!= None and keyindex : 
					padding = (arg[keyindex],)
					deleteKey = "%s%s"%(deleteKey,str(padding))
                                        print 'delete %s'%deleteKey
				_cache.delete(deleteKey)
			return result
        return handler_args
    return handler
