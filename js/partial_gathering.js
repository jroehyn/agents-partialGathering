var n; // size of nodes
var k; // size of agents
var g; // g-gathering problem

var agents;
var whiteboards;
var phaseLimit;
var isLeaderElected;

var initialIdsLog;
var actAgentsIndicesLog;
var isReplayMode;
var steps;

reset();


function resetConfig(initAgentNodeIds) {
    whiteboards = [];
    agents = [];
    phaseLimit = Math.ceil(Math.log2(g));
    isLeaderElected = false;
    steps = 0;

    // initialize nodes and whiteboards.
    var nodes = new vis.DataSet();
    for (var i = 0; i < n; i++) {
        nodes.add({
            id: i
        });
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

    // "act" is a function which represents a agent action based on its state.
    var act = function () {
        switch (this.state) {
            case 'inactive':
                var wb = whiteboards[this.nodeId];
                if (wb.isGather == 'T' || wb.isGather == 'F')
                    this.state = 'moving';
                break;
            case 'leader':
                var onNodeId = getNextNode(this.nodeId);
                this.nodeId = onNodeId;
                var wb = whiteboards[onNodeId];

                if (wb.agentId != undefined && !wb.isInactive && wb.isGather == undefined) {
                    this.state = 'waitLeader';
                    return;
                }
                leaderAction(this, wb);
                break;
            case 'active':
                var onNodeId = getNextNode(this.nodeId);
                this.nodeId = onNodeId;
                var wb = whiteboards[onNodeId];

                if (!wb.isInactive && wb.phase < this.phase) {
                    this.state = 'wait';
                    return;
                }
                activeAction(this, wb);
                break;
            case 'moving':
                var wb = whiteboards[this.nodeId];
                if (wb.isGather == 'T') {
                    this.state = 'final'
                } else {
                    var onNodeId = getNextNode(this.nodeId);
                    var nwb = whiteboards[onNodeId];
                    if (nwb.agentId != undefined && nwb.isGather == undefined)
                        this.state = 'waitMoving';
                    else
                        this.nodeId = onNodeId;
                }
                break;
            case 'wait':
                var wb = whiteboards[this.nodeId];
                if (wb.isInactive || wb.phase == this.phase) {
                    this.state = 'active';
                    activeAction(this, wb);
                }
                break;
            case 'waitLeader':
                var wb = whiteboards[this.nodeId];
                if (wb.isInactive || wb.isGather != undefined) {
                    this.state = 'leader';
                    leaderAction(this, wb);
                }
                break;
            case 'waitMoving':
                var wb = whiteboards[this.nodeId];
                if (wb.isGather != undefined)
                    this.state = 'moving';
                break;
            default:
                break;
        } // end switch statement

        function leaderAction(agent, wb) {
            if (wb.isGather == 'F')
                agent.state = 'moving';
            if (wb.isInactive == true) {
                agent.count = agent.count + 1;
                if ((agent.count + 1) % g == 0)
                    wb.isGather = 'T';
                else
                    wb.isGather = 'F';
            }
            else {
                wb.isGather = 'F';  // to awake waitMoving agent.x
            }
        }

        function activeAction(agent, wb) {
            if (wb.agentId == undefined)
                return; // skip
            if (wb.isInactive && wb.phase != agent.phase)
                return; // skip 

            agent.ids.push(wb.agentId);
            // if only own id twice
            if (agent.ids.length == 2 && wb.phase == agent.phase && wb.agentId == agent.id) {
                agent.state = 'leader';
                wb.isGather = 'F';
                return;
            }
            if (agent.ids.length == 3) {
                if (agent.ids[1] < Math.min(agent.ids[0], agent.ids[2])) {
                    if (agent.phase == phaseLimit) {
                        agent.state = 'leader';
                        wb.isGather = 'F';
                        return;
                    }
                    agent.phase = agent.phase + 1; // next phase
                    agent.state = 'active';  // keep active
                    var newId = agent.ids[1];
                    agent.id = newId;
                    agent.ids = [];
                    agent.ids.push(newId);
                    whiteboards[agent.nodeId].agentId = newId;
                    whiteboards[agent.nodeId].phase = agent.phase;
                } else {
                    agent.state = 'inactive';
                    var wb = whiteboards[agent.nodeId];
                    wb.isInactive = true;
                }
            }
        }

    } // end act function.

    // initialize agents
    var id = 0;
    for (var i = 0; i < k; i++) {
        var agent = new Agent()
        agent.id = id;
        agent.state = 'active';
        agent.ids = [];
        agent.phase = 1;
        agent.count = 0;
        agent.act = act;
        agents.push(agent);
        agent.nodeId = initAgentNodeIds[i];
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
        wb.phase = agent.phase;
        wb.agentId = agent.id;
        agent.ids.push(agent.id);
    }
}

function moveAgents() {
    if (isReplayMode) return;
    var s = document.getElementById('s').value;
    var actAgents = [];
    if (s == 'sync') {
        actAgents = agents;
        // for logging 
        var indices = [];
        for (var i = 0; i < agents.length; i++) indices.push(i);
        actAgentsIndicesLog.push(indices);
    } else if (s == 'async') {
        var indices = getRandomIntList(0, agents.length - 1);
        for (var i = 0; i < indices.length; i++) {
            var index = indices[i];
            actAgents.push(agents[index]);
        }
        actAgentsIndicesLog.push(indices); // for logging
    }
    for (var i = 0; i < actAgents.length; i++) {
        actAgents[i].act();
    }
}

// for reset button
function reset() {
    isReplayMode = false;
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
    // set initial agents' position
    nodeIds = getRandomIntNList(0, n - 1, k);
    resetConfig(nodeIds);

    // for logging.
    initialIdsLog = nodeIds;
    actAgentsIndicesLog = [];

    draw(agents, whiteboards);
}

// for auto button
function auto() {
    actionButton();
}


// for action button
function actionButton() {
    if (isFinished()) return;
    moveAgents();
    steps++;
    draw(agents, whiteboards);
    document.getElementById('count').innerHTML = 'STEPS:' + steps;
}


// for replay button
var round;
function replay() {
    isReplayMode = true;
    round = -1;
    resetConfig(initialIdsLog);
    draw(agents, whiteboards);
    document.getElementById('count').innerHTML = 'STEPS:' + steps;
}

// for -> button
function redo() {
    if (!isReplayMode) return;
    if (round == actAgentsIndicesLog.length - 1) return;

    round++;
    var indices = actAgentsIndicesLog[round];
    for (var i = 0; i < agents.length; i++) {
        if (indices.indexOf(i) >= 0)
            agents[i].act();
    }
    steps++;
    draw(agents, whiteboards);
    document.getElementById('count').innerHTML = 'STEPS:' + steps;
}

// for skip button
function skip() {
    steps = 0;
    while (!isFinished() && steps <= 10000) {
        moveAgents();
        steps++;
    }
    draw(agents, whiteboards);
    document.getElementById('count').innerHTML = 'STEPS:' + steps;
}

function isFinished() {
    var isFinished = true;
    for (var i = 0; i < agents.length; i++) {
        if (agents[i].state != 'final') {
            isFinished = false;
            break;
        }
    }
    return isFinished;
}

function getNextNode(nodeId) {
    return (nodeId + 1) % n;
}
