function Agent(id, nodeId, state, memory) {
    this.id = id;
    this.nodeId = nodeId;
    this.state = state; 
    this.memory = memory; 
}

function Whiteboard(nodeId, context) {
    this.nodeId = nodeId;
    this.context = context;
}

function draw(agents, whiteboards) {
    // draw whiteboards
    network.on("afterDrawing", function (context) {
        for (var i = 0; i < whiteboards.length; i++) {
            var wb = whiteboards[i];
            var nodeId = wb.nodeId;
            var nodePosition = network.getPositions([nodeId]);
            var x = nodePosition[nodeId].x;
            var y = nodePosition[nodeId].y;
            var width = 40;
            var height = 20;
            context.strokeStyle = 'gray';
            context.fillStyle = 'white';
            context.rect(x - (width / 2), y + 15, width, height);
            context.fill();
            context.stroke();
        }
    });

    // draw context of whiteboards
    network.on("afterDrawing", function (context) {
        for (var i = 0; i < whiteboards.length; i++) {
            var wb = whiteboards[i];
            var nodeId = wb.nodeId;
            var nodePosition = network.getPositions([nodeId]);
            var x = nodePosition[nodeId].x;
            var y = nodePosition[nodeId].y;
            var width = 40;
            var height = 20;

            context.fillStyle = 'black';
            context.font = 'bold 18px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            if (wb.context != undefined) {
                context.fillText(wb.context, x, y + 15 + (height / 2));
            }
        }
    });

    
    // drawing agents
    network.on("afterDrawing", function (context) {
        var added = [];
        for (var i = 0; i < agents.length; i++) {
            var agent = agents[i];

            var sameNodeAgents = 0;
            for (var j = 0; j < added.length; j++) {
                if (added[j] == agent.nodeId)
                    sameNodeAgents++;
            }
            added.push(agent.nodeId);

            var nodeId = agent.nodeId;
            var nodePosition = network.getPositions([nodeId]);

            context.strokeStyle = 'black';
            if (agent.state == 'active')
                context.fillStyle = '#FF6F00';
            else if (agent.state == 'inactive')
                context.fillStyle = 'gray';
            else if (agent.state == 'leader')
                context.fillStyle = 'red';

            var x = nodePosition[nodeId].x + sameNodeAgents * 10;
            var y = nodePosition[nodeId].y - 8 + sameNodeAgents * 3;
            var r = 13;

            // draw a triangle (agent body)
            context.beginPath();
            context.moveTo(x, y - 1.8 * r);
            context.lineTo(x + r, y + r);
            context.lineTo(x - r, y + r);
            context.closePath();
            context.fill();
            context.stroke();

            // draw a circle (agent head) 
            context.circle(x, y - r, r);
            context.fill();
            context.stroke();

            // draw agent id
            context.fillStyle = 'black';
            context.font = 'bold 18px Arial';
            context.fillText(agent.id, x + r, y - r * 2.7);
        }
    });

    network.redraw();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
