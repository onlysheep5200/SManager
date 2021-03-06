
var switches_addr = "/v1.0/topology/switches";
var links_addr = "/v1.0/topology/links";
var routerSvgUrl = './router.svg';
var cloudSvgUrl = '/static/js/Cartoon_cloud.svg'
var flowUrl = '/stats/flow';
var containerQuery = '#topoContainer';
var initDelayUrl = 'static/js/delay_info.json?'+Math.random();
var networkDelays = {};
var netInfo = {};

function parseDelay(data){
	var delays = {};
	for (var i in data)
	{
		var portInfo = data[i];
		for (var port in portInfo)
		{
			var other = portInfo[port][0];
			var delay = portInfo[port][1].toFixed(2);
			delays[i+'-'+other] = delay;
			delays[other+'-'+i] = delay;
		}
	}
	console.log(delays);
	return delays;
}

var CONF = {
    image: {
        width: 50,
        height: 40
    },
    imageN:
    {
        width:151,
        height:98
    },
    force: {
        width: $(containerQuery).width(),
        height: $(containerQuery).height(),
        dist: 200,
        charge: -600
    }
};
function initWsClient(wsUrl){
var ws = new WebSocket(wsUrl);
ws.onmessage = function(event) {
    var data = JSON.parse(event.data);
    console.log(data);

    var result = rpc[data.method](data.params);

    var ret = {"id": data.id, "jsonrpc": "2.0", "result": result};
    this.send(JSON.stringify(ret));
}
}

function trim_zero(obj) {
    return String(obj).replace(/^0+/, "");
}

function dpid_to_int(dpid) {
    return Number("0x" + dpid);
}

var elem = {
    force: d3.layout.force()
        .size([CONF.force.width, CONF.force.height])
        .charge(CONF.force.charge)
        .linkDistance(CONF.force.dist)
        .on("tick", _tick),
    svg: d3.select(containerQuery).append("svg")
        .attr("id", "topology")
        .attr("width", CONF.force.width)
        .attr("height", CONF.force.height),
    console: console
};
function _tick() {
    elem.link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    elem.node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    elem.network.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    elem.port.attr("transform", function(d) {
        var p = topo.get_port_point(d);
        return "translate(" + p.x + "," + p.y + ")";
    });

}
elem.drag = elem.force.drag().on("dragstart", _dragstart);
function _dragstart(d) {
    var dpid = dpid_to_int(d.dpid)
    d3.json(flowUrl + dpid, function(e, data) {
        flows = data[dpid];
        console.log(flows);
        //li.data(flows).enter().append("li")
          //  .text(function (d) { return JSON.stringify(d, null, " "); });
    });
    d3.select(this).classed("fixed", d.fixed = true);
}
elem.node = elem.svg.selectAll(".node");
elem.network = elem.svg.selectAll('.network');
elem.link = elem.svg.selectAll(".link");
elem.port = elem.svg.selectAll(".port");
elem.delay = elem.svg.selectAll('.delay');
elem.update = function () {
    this.force
        .nodes(topo.allnodes)
        .links(topo.links)
        .start();

    this.link = this.link.data(topo.links);
    this.link.exit().remove();
    this.link.enter().append('line')
        .attr("class", "link")
		.attr("id",function(d){console.log(d);return d.source.index+"to"+d.target.index;})	
		.append('title').text('100ms');	

    this.node = this.node.data(_.filter(topo.allnodes,function(d){return typeof(d.dpid)!="undefined";}));
    this.node.exit().remove();
    var nodeEnter = this.node.enter().append("g")
        .attr("class", "node")
        .on("dblclick", function(d) { d3.select(this).classed("fixed", d.fixed = false); })
        .call(this.drag);
    nodeEnter.append("image")
        .attr("xlink:href", routerSvgUrl)
        .attr("x", -CONF.image.width/2)
        .attr("y", -CONF.image.height/2)
        .attr("width", CONF.image.width)
        .attr("height", CONF.image.height);
    nodeEnter.append("text")
        .attr("dx", -CONF.image.width/2)
        .attr("dy", CONF.image.height-10)
        .text(function(d) { return "dpid: " + trim_zero(d.dpid); });
    
    this.network = this.network.data(_.filter(topo.allnodes,function(d){return typeof(d.dpid) == "undefined";}));
    this.network.exit().remove();
    var networkEnter = this.network.enter().append('g')
        .attr('class','network')
        .on("dblclick", function(d) { d3.select(this).classed("fixed", d.fixed = false); })
        .call(this.drag);

    networkEnter.append("image")
        .attr("xlink:href", cloudSvgUrl)
        .attr("x", -CONF.imageN.width/2)
        .attr("y", -CONF.imageN.height/2)
        .attr("width", CONF.imageN.width)
        .attr("height", CONF.imageN.height);
    networkEnter.append("text")
        .attr("dx", -CONF.imageN.width/2+20)
        .attr("dy", CONF.imageN.height-20)
        .text(function(d) { return d['type']+' Network' });

	networkEnter.append('text')
		.attr('dy',10)
		.attr('dx',-15)
		.attr('class',function(d){
			return d.source+'-'+d.target+' '+d.target+'-'+d.source;
		})
		.text(function(d){
			var index = d.source + '-' + d.target;
			return networkDelays[index]+'ms';
		});


    var ports = topo.get_ports();
    this.port.remove();
    this.port = this.svg.selectAll(".port").data(ports);
    var portEnter = this.port.enter().append("g")
        .attr("class", "port");
    portEnter.append("circle")
        .attr("r", 8);
    portEnter.append("text")
        .attr("dx", -3)
        .attr("dy", 3)
        .text(function(d) { return trim_zero(d.port_no); });
	
	/*
	portEnter.append('text')
	.attr('dx',function(d){
		if(d.link_dir == 'source' )
			return 80;
		else 
			return -80;
	})
	.attr('dy',3)
	.text(function(d){
		return d.link_delay+'ms';
	});*/
/*
	this.delay.remove();
	this.delay = this.svg.selectAll('.delay').data(ports);
	var delayEnter = this.port.enter().append("g")
		.attr('class','delay');
	delayEnter.append('rect')
	.attr('width','80px')
	.attr('height','20px')
	.attr('dx',-30);
	delayEnter.append('text')
	.attr('dx',-70)
	.attr('dy',3)
	.text(function(d){
		return d.link_delay+"ms";
	});
	*/
};

function is_valid_link(link) {
    return (link.src.dpid < link.dst.dpid)&&(link.src.port_no<=3)&&(link.dst.port_no<=3);
}

var topo = {
    nodes: [],
    allnodes : [],
    links: [],
    networks:[],
	delays : [],
    node_index: {}, // dpid -> index of nodes array
    initialize: function (data) {
        this.add_nodes(data.switches);
        this.add_links(data.links);
    },
    add_nodes: function (nodes) {
        console.log('add nodes' + JSON.stringify(nodes));
        for (var i = 0; i < nodes.length; i++) {
            this.nodes.push(nodes[i]);
        }
        this.allnodes = this.nodes.concat(this.networks);
        this.refresh_node_index();
    },
    add_links: function (links) {
        for (var i = 0; i < links.length; i++) {
            if (!is_valid_link(links[i])) continue;
            console.log("add link: " + JSON.stringify(links[i]));

            var src_dpid = links[i].src.dpid;
            var dst_dpid = links[i].dst.dpid;
            var src_index = this.node_index[src_dpid];
            var dst_index = this.node_index[dst_dpid];
            var newNetwork = 
            {
                source : parseInt(src_dpid,16),
                source_index : src_index,
                target : parseInt(dst_dpid,16),
                target_index : dst_index,
                type : netInfo[parseInt(src_dpid,16)+'-'+parseInt(dst_dpid,16)]
            };
            this.networks.push(newNetwork);
            this.refresh_all_nodes();
            // var link = {
            //     source: src_index,
            //     target: dst_index,
            //     port: {
            //         src: links[i].src,
            //         dst: links[i].dst
            //     }
            // }
            var link1 = {
                source: src_index,
                target: this.nodes.length+this.networks.length-1,
                port: {
                    src: links[i].src,
                    dst: null
                }
            };
            var link2 = {
                source: this.nodes.length+this.networks.length-1,
                target: dst_index,
                port: {
                    src: null,
                    dst: links[i].dst
                }
            }
			var delay = {};
			var delay2 = {};
			delay["key"] = src_index+'to'+(this.nodes.length+this.networks.length-1);
			delay["value"] = 100;
			delay2["key"]= (this.nodes.length+this.networks.length-1)+"to"+dst_index;
			delay2["value"] = 100;
            this.links.push(link1);
            this.links.push(link2);
			this.delays.push(delay);
			this.delays.push(delay2);
        }
    },
    delete_nodes: function (nodes) {
        for (var i = 0; i < nodes.length; i++) {
            console.log("delete switch: " + JSON.stringify(nodes[i]));

            node_index = this.get_node_index(nodes[i]);
            this.nodes.splice(node_index, 1);
        }
        this.refresh_node_index();
    },
    delete_links: function (links) {
        for (var i = 0; i < links.length; i++) {
            if (!is_valid_link(links[i])) continue;
            console.log("delete link: " + JSON.stringify(links[i]));

            link_index = this.get_link_index(links[i]);
            this.links.splice(link_index, 1);
        }
    },
    get_node_index: function (node) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (node.dpid == this.nodes[i].dpid) {
                return i;
            }
        }
        return null;
    },
    get_link_index: function (link) {
        for (var i = 0; i < this.links.length; i++) {
            if (link.src.dpid == this.links[i].port.src.dpid &&
                    link.src.port_no == this.links[i].port.src.port_no &&
                    link.dst.dpid == this.links[i].port.dst.dpid &&
                    link.dst.port_no == this.links[i].port.dst.port_no) {
                return i;
            }
        }
        return null;
    },
    get_ports: function () {
        var ports = [];
        var pushed = {};
        for (var i = 0; i < this.links.length; i++) {
			var that = this;
            function _push(p, dir) {
                key = p.dpid + ":" + p.port_no;
                if (key in pushed) {
                    return 0;
                }

                pushed[key] = true;
                p.link_idx = i;
                p.link_dir = dir;
				p.link_delay = that.get_link_delay(that.links[i]);
                return ports.push(p);
            }
            if (this.links[i].port.src) 
                _push(this.links[i].port.src, "source");
            if (this.links[i].port.dst)
                _push(this.links[i].port.dst, "target");
        }

        return ports;
    },
    get_port_point: function (d) {
        var weight = 0.88;

        var link = this.links[d.link_idx];
        var x1 = link.source.x;
        var y1 = link.source.y;
        var x2 = link.target.x;
        var y2 = link.target.y;

        if (d.link_dir == "target") weight = 1.0 - weight;

        var x = x1 * weight + x2 * (1.0 - weight);
        var y = y1 * weight + y2 * (1.0 - weight);

        return {x: x, y: y};
    },
	get_link_delay : function(link){
			//TODO:return the link delay 
			return 100;
	},
    refresh_node_index: function(){
        this.node_index = {};
        for (var i = 0; i < this.nodes.length; i++) {
            this.node_index[this.nodes[i].dpid] = i;
        }
    },
    refresh_all_nodes : function()
    {
        this.allnodes = this.nodes.concat(this.networks);
    }
}

var rpc = {
    event_switch_enter: function (params) {
        var switches = [];
        for(var i=0; i < params.length; i++){
            switches.push({"dpid":params[i].dpid,"ports":params[i].ports});
        }
        topo.add_nodes(switches);
        elem.update();
        return "";
    },
    event_switch_leave: function (params) {
        var switches = [];
        for(var i=0; i < params.length; i++){
            switches.push({"dpid":params[i].dpid,"ports":params[i].ports});
        }
        topo.delete_nodes(switches);
        elem.update();
        return "";
    },
    event_link_add: function (links) {
        topo.add_links(links);
        elem.update();
        return "";
    },
    event_link_delete: function (links) {
        topo.delete_links(links);
        elem.update();
        return "";
    },
}

function initialize_topology() {
    d3.json(switches_addr, function(error, switches) {
	if(switches['status'] == 'success')
    	{
        d3.json(links_addr, function(error, links) {
	    if(links['status'] == 'success'){
                console.log('start initialize');
            	topo.initialize({switches: switches['content'], links: links['content']});
            	elem.update();
                console.log(topo);
	    }
        });
	}
    	else
    	{
		alert('loading data error');
	}
    });
}

function updateDelay()
{
	d3.json(initDelayUrl+Math.random(),function(err,delays){
		if(!err)
		{
			var newdelays = parseDelay(delays);
			for(var key in newdelays){
				if(newdelays[key] != networkDelays[key])
				{
					networkDelays = newdelays;
					$('svg .network text').each(function(){
						if($(this).attr('class'))
						{
							var index = $(this).attr('class').split(' ')[0];
							$(this).text(networkDelays[index]+'ms');
						}
					})
				}
			}
		}
		
	});
}

function topo_main() {
d3.json('/static/js/net_info.json',function(err,data){
	if(data)
	{
		for(var x in data)
		{
			var item = data[x];
			var key1 = item[0]+'-'+item[1];
			var key2 = item[1]+'-'+item[0];
			netInfo[key1] = item[2];
			netInfo[key2] = item[2];
		}
		console.log('netinfo is ');
		console.log(netInfo);
	}
	else
	{
		console.log('can not load net info data');
		console.log(err);
	}
	d3.json(initDelayUrl,function(err,delays){
		if(!err)
		{
			console.log('delays is ');
			console.log(delays);
			networkDelays = parseDelay(delays);
    		initialize_topology();
			setInterval("updateDelay()",10000);
		}
		else{
			console.log(err);
		}

	})
});
}

