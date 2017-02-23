var n; // size of nodes
var k; // size of agents
var g; // g-gathering problem

var agents;
var whiteboards;
var phaseLimit;
var isLeaderElected;

reset();

function reset() {
    _n = Number(document.getElementById('n').value);
    _k = Number(document.getElementById('k').value);
    _g = Number(document.getElementById('g').value);
    if (_k > _n) {
        alert('k must be less than n.');
        return;
    }
    //    if (n == _n && k == _k && g == _g) return;
    n = _n;
    k = _k;
    g = _g;

    // reset all
    whiteboards = [];
    agents = [];
    phaseLimit = Math.ceil(Math.log2(g));
    isLeaderElected = false;

    // initialize nodes and whiteboards.
    var nodes = new vis.DataSet();
    for (var i = 0; i < n; i++) {
        nodes.add({ id: i });
        var wb = new Whiteboard(i, undefined, false, false)
        wb.nodeId = i;
        wb.context = undefined;
        wb.isInactive = false;
        whiteboards.push(wb);
    }
    var edges = new vis.DataSet();
    for (var i = 0; i < n; i++) {
        edges.add({
            from: i,
            to: (i + 1) % n,
            arrows: 'to'
        });
    }

    var container = document.getElementById('mynetwork');
    var data = {
        nodes: nodes,
        edges: edges
    };

    var options = {
        nodes: {
            shape: 'dot',
            size: 20,
            borderWidth: 2,
            color: {
                background: "#DAF7A6",
                border: "gray",
                highlight: {
                    background: "#DAF7A6",
                    border: "black",
                }
            },
            chosen: false,
        },
        edges: {
            width: 2
        },
        physics: {
            barnesHut: {
                gravitationalConstant: -1000,
                centralGravity: 0.3,
                springLength: 95,
                springConstant: 0.04,
                damping: 0.09,
                avoidOverlap: 0
            }
        },
        interaction: {
            dragNodes: (k > 30) ? false : true,
            dragView: false,
        }
    };

    network = new vis.Network(container, data, options);

    var act = function () {
        if (this.state == 'inactive') {
            var wb = whiteboards[this.nodeId];
            if (wb.context == 'T' || wb.context == 'F')
                this.state = 'moving';
            
            return;
        } else if (this.state == 'leader') {
            var onNodeId = getNextNode(this.nodeId);
            this.nodeId = onNodeId;
            var wb = whiteboards[onNodeId];

            if (wb.context == 'F'){
                this.state = 'moving';
            }
            else  if (wb.isInactive == true){
                this.count = this.count + 1;
                if ((this.count + 1) % g != 0)
                    wb.context = 'F';
                else
                    wb.context = 'T';
            }

            return;
        } else if (this.state == 'active') {
            var onNodeId = getNextNode(this.nodeId);
            this.nodeId = onNodeId;
            var wb = whiteboards[onNodeId];

            if (wb.context != undefined && !wb.isInactive) {
                var memory = this.memory;
                if (wb.context == memory[memory.length - 1]) {
                    this.state = 'leader';
                    wb.isMarked = true;
                } else {
                    this.memory.push(wb.context);
                }
            }
            if (this.memory.length == 3) {
                if (this.memory[1] < this.memory[0] && this.memory[1] < this.memory[2]) {
                    this.state = 'active';  // keep active
                    var newId = this.memory[1];
                    this.id = newId;
                    this.memory = [];
                    this.memory.push(newId);
                    whiteboards[this.nodeId].context = newId;
                    this.phase = this.phase + 1; // done the phase.
                    if (this.phase == phaseLimit) {
                        this.state = 'leader';
                        wb.context = 'F'; // 0
                    }
                } else {
                    this.state = 'inactive';
                    var wb = whiteboards[this.nodeId];
                    wb.isInactive = true;
                }
            }

            return;
        } else if (this.state == 'moving') {
            if (whiteboards[this.nodeId].context == 'T'){

            } else {
                var onNodeId = getNextNode(this.nodeId);
                this.nodeId = onNodeId;
            }

            return;
        }

    }

    var added = [];
    var id = 0;
    while (added.length != k) {
        var nodeId = getRandomInt(0, n - 1);
        if (added.indexOf(nodeId) >= 0) continue; // if already exists
        added.push(nodeId);

        var agent = new Agent()
        // initialize agent
        agent.id = id;
        agent.nodeId = nodeId;
        agent.state = 'active';
        agent.memory = [];
        agent.phase = 0;
        agent.count = 0;
        agent.act = act;
        agents.push(agent);

        id++;
    }

    for (var i = 0; i < agents.length; i++) {
        var agent = agents[i];
        var wb = whiteboards[agent.nodeId];
        wb.context = agent.id; // write to board
        agent.memory.push(agent.id); // save own id
    }
    draw(agents, whiteboards);
}

function action() {
    for (var i = 0; i < agents.length; i++) {
        agents[i].act();
    }
    draw(agents, whiteboards);
}

function getNextNode(nodeId) {
    return (nodeId + 1) % n;
}