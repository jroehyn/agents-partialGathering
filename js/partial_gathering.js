var n; // size of nodes
var k; // size of agents
var g; // g-gathering problem

var agents;
var whiteboards;

start();

function start() {
    _n = Number(document.getElementById('n').value);
    _k = Number(document.getElementById('k').value);
    _g = Number(document.getElementById('g').value);
    if (_k > _n) {
        alert('k must be less than n.');
        return;
    }
    if (n == _n && k == _k && g == _g) return;
    n = _n;
    k = _k;
    g = _g;

    // reset all
    whiteboards = [];
    agents = [];
    phaseLimit = Math.ceil(Math.log2(g));
    phase = 0;
    round = 0;

    // initialize nodes and whiteboards.
    var nodes = new vis.DataSet();
    for (var i = 0; i < n; i++) {
        nodes.add({ id: i });
        whiteboards.push(new Whiteboard(i, undefined));
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
            dragNodes: true,
            dragView: true,
        }
    };

    network = new vis.Network(container, data, options);
    {
        var added = [];
        var id = 0;
        while (added.length != k) {
            var nodeId = getRandomInt(0, n - 1);
            if (added.indexOf(nodeId) >= 0) continue; // if already exists
            added.push(nodeId);
            agents.push(new Agent(id, nodeId, 'active', []));
            id++;
        }
    }

    for (var i = 0; i < agents.length; i++) {
        var agent = agents[i];
        var nodeId = agent.nodeId;
        var wb = whiteboards[nodeId];
        wb.context = agent.id;// write to board
        agent.memory.push(agent.id);    // save own id
    }
    draw(agents, whiteboards);
}

function action() {
    leaderElection();
}

function leaderElection() {
    var isPhaseEnd = true;
    for (var i = 0; i < agents.length; i++) {
        var agent = agents[i];
        if (agent.state != 'active') continue;
        if (agent.memory.length != 3)
            isPhaseEnd = false;
    }

    if (!isPhaseEnd) {
        // move agents
        for (var i = 0; i < agents.length; i++) {
            var agent = agents[i];
            if (agent.state == 'inactive') continue;

            var onNodeId = getNextNode(agent.nodeId);
            agent.nodeId = onNodeId;

            if (agent.memory.length == 3) continue;
            var wb = whiteboards[onNodeId];
            if (wb.context != undefined)
                agent.memory.push(wb.context);

            if (agent.memory.length == 3) {
                // finish reading 3 IDs
                if (agent.memory[1] < agent.memory[0]
                    && agent.memory[1] < agent.memory[2]) {
                    agent.state = 'active' // keep active.
                } else {
                    agent.state = 'inactive'
                }
            }
        }
        round++;
        console.log(phase + ":" + round);
        draw(agents, whiteboards);
    } else { 
        // turn to the next phase
        if (phase == phaseLimit) {
            console.log("FINISH!");
            return;
        }
        phase++;
        // console.log("START PHASE:" + phase);

        for (var i = 0; i < whiteboards.length; i++) {
            whiteboards[i].context = undefined;
        }

        for (var i = 0; i < agents.length; i++) {
            var agent = agents[i];
            if (agent.state != 'active') continue;
            var newId = agent.memory[1];
            agent.id = newId;
            agent.memory = [];
            whiteboards[agent.nodeId].context = newId;
        }
        draw(agents, whiteboards);
    }
}

function getNextNode(nodeId) {
    return (nodeId + 1) % n;
}