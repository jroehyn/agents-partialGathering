var n; // size of nodes
var k; // size of agents
var g; // g-gathering problem

var agents;
var whiteboards;
var phaseLimit;
var isLeaderElected;

reset();

function reset() {
    n = Number(document.getElementById('n').value);
    k = Number(document.getElementById('k').value);
    g = Number(document.getElementById('g').value);
    if (k > n) {
        alert('k must be less than n.');
        return;
    } else if (g > k) {
        alert('g must be less than k.');
        return;
    }

    // reset all
    whiteboards = [];
    agents = [];
    phaseLimit = Math.ceil(Math.log2(g));
    isLeaderElected = false;

    // initialize nodes and whiteboards.
    var nodes = new vis.DataSet();
    for (var i = 0; i < n; i++) {
        nodes.add({ id: i });
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
            if (wb.isGather == 'T' || wb.isGather == 'F')
                this.state = 'moving';
            return;
        }
        else if (this.state == 'leader') {
            var onNodeId = getNextNode(this.nodeId);
            this.nodeId = onNodeId;
            var wb = whiteboards[onNodeId];

            if (wb.isGather == 'F')
                this.state = 'moving';

            else if (wb.isInactive == true) {
                this.count = this.count + 1;
                if ((this.count + 1) % g != 0)
                    wb.isGather = 'F';
                else
                    wb.isGather = 'T';
            }
            return;
        }
        else if (this.state == 'active') {
            var onNodeId = getNextNode(this.nodeId);
            this.nodeId = onNodeId;
            var wb = whiteboards[onNodeId];

            if (!wb.isInactive && wb.phase < this.phase) {
                this.state = 'wait';
                return;
            }

            if (wb.agentId != undefined && !wb.isInactive)
                this.ids.push(wb.agentId);

            // if only own id twice
            if (this.ids.length == 2 && this.ids[0] == this.ids[1]) {
                this.state = 'leader';
                wb.isGather = 'F';
                return;
            }
            if (this.ids.length == 3) {
                if (this.ids[1] < Math.min(this.ids[0], this.ids[2])) {
                    if (this.phase == phaseLimit) {
                        this.state = 'leader';
                        wb.isGather = 'F';
                        return;
                    }
                    this.phase = this.phase + 1; // next phase
                    this.state = 'active';  // keep active
                    var newId = this.ids[1];
                    this.ids = [];
                    this.ids.push(newId);
                    whiteboards[this.nodeId].agentId = newId;
                    whiteboards[this.nodeId].phase = this.phase;
                } else {
                    this.state = 'inactive';
                    var wb = whiteboards[this.nodeId];
                    wb.isInactive = true;
                }
            }
            return;
        }
        else if (this.state == 'moving') {
            if (whiteboards[this.nodeId].isGather != 'T') {
                var onNodeId = getNextNode(this.nodeId);
                this.nodeId = onNodeId;
            }
            return;
        } else if (this.state == 'wait') {
            var wb = whiteboards[this.nodeId];
            if (wb.isInactive || wb.phase == this.phase) {
                this.state = 'active';
            }
            return;
        }

    }

    // initialize agents
    var added = [];
    var id = 0;
    while (added.length != k) {
        var nodeId = getRandomInt(0, n - 1);
        if (added.indexOf(nodeId) >= 0) continue; // if already exists
        added.push(nodeId);

        var agent = new Agent()
        agent.id = id;
        agent.nodeId = nodeId;
        agent.state = 'active';
        agent.ids = [];
        agent.phase = 1;
        agent.count = 0;
        agent.act = act;
        agents.push(agent);

        id++;
    }

    // initialize whiteboards
    for (var i = 0; i < n; i++) {
        var wb = new Whiteboard();
        wb.nodeId = i;
        wb.phase = undefined;
        wb.agentId = undefined;
        wb.isInactive = false;
        wb.isGather = undefined;
        whiteboards.push(wb);
    }

    for (var i = 0; i < agents.length; i++) {
        var agent = agents[i];
        var wb = whiteboards[agent.nodeId];
        wb.agentId = agent.id;
        wb.phase = agent.phase;
        agent.ids.push(agent.id);
    }
    draw(agents, whiteboards);
}

function action() {
    var s = document.getElementById('s').value;
    var actAgents = [];
    if (s == 'sync') {
        actAgents = agents;
    } else if (s == 'async') {
        var indices = getRandomIntList(0, agents.length - 1);
        for (var i = 0; i < indices.length; i++) {
            var index = indices[i];
            actAgents.push(agents[index]);
        }
    }
    for (var i = 0; i < actAgents.length; i++) {
        actAgents[i].act();
    }
    draw(agents, whiteboards);
}

function getNextNode(nodeId) {
    return (nodeId + 1) % n;
}