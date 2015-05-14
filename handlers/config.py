from werkzeug.contrib.cache import FileSystemCache 
ARG_TO_STR = True
REQUEST_CACHE = FileSystemCache('cache_dir')
ROOT = "http://127.0.0.1"
PORT = 8080
BASEURL = "%s:%d"%(ROOT, PORT)
DRIVER = "PyRequestsDriver"
APIS = {}
APIS["switchlist"] = dict(method="GET", url="%s/stats/switches")
APIS["switchdesc"] = dict(method="GET", url="%s/stats/desc/%d", default=1)
APIS["switchflow"] = dict(method="GET", url="%s/stats/flow/%d", default=1)
APIS["switchports"] = dict(method="GET", url="%s/stats/port/%d", default=1)
APIS["switchportsdesc"] = dict(method="GET", url="%s/stats/portdesc/%d", default=1)
APIS["switchgroup"] = dict(method = "GET", url="%s/stats/group/%d", default=1)
APIS["switchgroupdesc"]  = dict(method="GET",url="%s/stats/groupdesc/%d",default=1)
APIS["switchgroupfeatures"] = dict(method="GET", url="%s/stats/groupfeatures/%d",default=1)
APIS["switchmeter"] = dict(method="GET", url="%s/stats/meter/%d", default=1)
APIS["switchmeterconfig"] = dict(method="GET", url="%s/stats/meterconfig/%d", default=1)
APIS["switchmeterfeatures"] = dict(method="GET", url="%s/stats/meterfeatures/%d", default=1)
APIS["aggregateflow"] = dict(method="GET", url="%s/stats/aggregateflow/%d", default=1)
APIS["addflowentry"] = dict(method = "POST", url="%s/stats/flowentry/add", default={},direct=True,delete_key="switchflow")
APIS["modifyflowentry"] = dict(method='POST', url="%s/stats/flowentry/modify", default={},direct=True,delete_key='switchflow')
APIS["deleteflowentry"] = dict(method="POST", url="%s/stats/flowentry/delete", default={},delete_key='switchflow',direct=True)
APIS["clearflowentry"] = dict(method="DELETE", url="%s/stats/flowentry/clear/%d",default=1,direct=True,delete_key='switchflow')
APIS['topo_switches'] = dict(method="GET",url="%s/v1.0/topology/switches")
APIS['topo_links'] = dict(method="GET",url="%s/v1.0/topology/links")
ARG_ILLEGAL="ARG_ILLEGAL"
NO_SUCH_API = "NO_SUCH_API"
BAD_REQUEST = "BAD_REQUEST"




