from __future__ import unicode_literals
from flask import Flask, jsonify, request, render_template,url_for
from handlers import DefaultRequestHandler 
from handlers import config
import json
import copy
app = Flask(__name__)
requestHandler = DefaultRequestHandler.DefaultRequestHandler()
matchtypes = ['in_port','in_phy_port','metadata','dl_dst','dl_src','eth_dst','eth_src','dl_type','eth_type','dl_vlan',\
        'vlan_vid','vlan_pcp','ip_dscp','ip_ecn','nw_proto','ip_proto','tp_src','tp_dst','nw_src','nw_dst','ipv4_src',\
        'ipv4_dst','tcp_src','tcp_dst','upd_src','udp_dst','sctp_src','sctp_dst','icmpv4_type','icmpv4_code','arp_op',\
        'arp_spa','arp_tpa','arp_sha','arp_tha','ipv6_src','ipv6_dst','ipv6_fiabel','icmpv6_type','icmpv6_code','ipv6_nd_target',\
        'ipv6_nd_sll','ipv6_nd_tll','mpls_label','mpls_bos','pbb_isid','tunnel_id','ipv6_exthdr']

actionmapping = {'OUTPUT':'port','COPY_TTL_OUT':None,'COPY_TTL_IN':None,'SET_MPLS_TTL':'mpls_tll','DEC_MPLS_TTL':None,\
        'PUSH_VLAN':'ethertype','POP_VLAN':None,'PUSH_MPLS':'ethertype','POP_MPOLS':'ethertype','SET_QUEUE':'queue_id',\
        'GROUP':'group_id','SET_NW_TTL':'nw_ttl','DEC_NW_TTL':None,'SET_FIELD':['field','value'],'PUSH_PBB':'ethertype',\
        'POP_PBB':None,'GOTO_TABLE':'table_id','WRITE_METADATA':['metadata','metadata_mask'],'METER':'meter_id'}

def actionParse(actions):
    '''
    parse actions from string to array
    '''
    results = []
    strs = actions.split(';')
    for x in strs : 
        if x.find(':') < 0:
            results.append(dict(type=x))
        else:
            fields = x.split(':')
            fields = [fields[0],':'.join(fields[1:])]
            t = fields[0] 
            print fields
            if type(actionmapping[t.upper()]) == type('s'):
                action = dict(type=t)
                action[actionmapping[t.upper()]] = fields[1]
                results.append(action)
            elif t.upper() == 'SET_FIELD':
                #tmp = json.loads(fields[1].strip())
                fields[1] = fields[1].strip().replace('{','{"')
                fields[1] = fields[1].replace(':','":')
                tmp = json.loads(fields[1])
                action = dict(type=t.upper(),field=tmp.keys()[0],value=tmp.values()[0])
                results.append(action)
            elif t.upper() == 'WRITE_METADATA':
                results.append(dict(type=t,metadata=fields[1].split('/')[0],metadata_mask=fields[1].split('/')[1]))
            else:
                return None
        return results

def actionStringify(actions):
    actionText = {}
    for action in actions:
        mapping = actionmapping[action['type']]
        t = action['type']
        if mapping==None:
            actionText[t] = ''
        elif type(mapping) == type('s'):
            actionText[t] ='%s:%s'%(str(action.keys()[1]),str(action.values()[1]))
        elif action == 'SET_FIELD':
            actionText[t] = "%s:%s,%s:%s"%('field', action['field'], 'value', str(action['value']))
        elif action == 'WRITE_METADATA':
            actionText[t] = "%s:%s,%s:%s"%('metadata',str(action['metadata']),'metadata_mask',str(action['metadata_mask']))
        return actionText

#abour pages
@app.route("/index")
def index() : 
    if(request.args.get('type') == 'router'):
        return render_template('smrouterindex.html',wsServerAddr= 'ws://127.0.0.1:8080/v1.0/topology/ws',currentSlide='router')
    return render_template('smindex.html',wsServerAddr= 'ws://127.0.0.1:8080/v1.0/topology/ws',currentSlide='index',actiontypes=actionmapping)

@app.route("/add",methods=['GET','POST'])
def add():
    if(request.method == 'GET') :
        dps = requestHandler.request('switchlist')['content']
        return render_template('smadd.html', actiontypes=actionmapping.keys(), matchtypes=matchtypes,dps=dps)
    else : 
        arg = request.form.get('arg');
        arg = json.loads(arg);
        print arg
        return jsonify(requestHandler.request('addflowentry',arg))

@app.route("/update",methods=['GET','POST'])
def update():
    if request.method == 'GET':
        rawEntry = request.args.get('arg')
        if rawEntry:
            rawEntry = json.loads(rawEntry)
            rawEntry['actions'] = actionParse(rawEntry['actions'])
            entry = copy.deepcopy(rawEntry) 
            entry['actions'] = actionStringify(entry['actions'])
            return render_template('smupdate.html',rawEntry=rawEntry,actiontypes=actionmapping.keys(),matchtypes = matchtypes,entry=entry)
        else : 
            return "Invalid Flow Entry !"
    elif request.method == 'POST':
        arg = request.form.get('arg')
        raw = request.form.get('raw')
        if arg : 
            raw = json.loads(raw)
            arg = json.loads(arg)
            r = requestHandler.request('deleteflowentry',raw)
            if r['status'] == 'success':
                return jsonify(requestHandler.request('addflowentry',arg))
            else:
                return jsonify(r)

#for ajax
@app.route("/getSwitchList")
def switchList() : 
    return jsonify(requestHandler.request('switchlist'))

@app.route('/aggregateflow/<int:id>')
def aggregateflow(id):
	return jsonify(requestHandler.request('aggregateflow',id))

@app.route("/getSwitchInfo/<int:id>")
def switchInfo(id):
    result = requestHandler.request('switchdesc',id)
    return jsonify(result)

@app.route("/flow/<id>")
def flow(id):
    print 'flow for switch : %s'%id
    result = requestHandler.request('switchflow',int(id))
    print result
    return jsonify(result)

@app.route("/flowentry",methods=["GET","POST"])
def flowentry() :
    ''' 
    if get , show flowentry for dpip
    if pos , add a flow entry for dpip
    '''
    if request.method == 'GET' : 
        return "get flow entry"
    else : 
        return "post a flow entry"

@app.route("/entriesnum")
def entrynum():
    switches = requestHandler.request('switchlist')
    total = 0
    if switches.get('status') == 'success' : 
        switches = switches['content']
        for s in switches : 
            flowents = requestHandler.request('switchflow',s)
            print flowents
            if flowents['status'] == 'success' : 
				flowents = flowents['content'].get("%d"%s)
				if flowents!=None : 
					total += len(flowents)
	return jsonify(dict(status='success',content=total))

@app.route('/deleteentry',methods=['POST','GET'])
def deleteentry():
    arg = request.form.get('arg')
    arg = json.loads(arg)    
    arg["actions"] = actionParse(arg["actions"])
    return jsonify(requestHandler.request('deleteflowentry',arg))

@app.route("/topoSwitches")
def topoSwitches():
    #return jsonify(requestHandler.request('topo_switches'))
    result = requestHandler.request('topo_switches')
    return jsonify(result)

@app.route("/topoLinks")
def topoLinks():
    result = requestHandler.request('topo_links')
    return jsonify(result)

@app.route("/clearcache")
def clearcache():
	config.REQUEST_CACHE.clear()	
	return 'success'


if __name__ == '__main__' : 
    app.debug = True
    app.run(host="0.0.0.0")
