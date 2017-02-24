function Agent() {

}

function Whiteboard() {

}

function draw(agents, whiteboards) {
    network.on("afterDrawing", function (context) {
        {
            // draw whiteboards 
            for (var i = 0; i < whiteboards.length; i++) {
                var wb = whiteboards[i];
                var nodeId = wb.nodeId;
                var nodePosition = network.getPositions([nodeId]);
                var x = nodePosition[nodeId].x;
                var y = nodePosition[nodeId].y;

                var width = 40;
                var height = 20;
                context.fillStyle = 'white';
                context.strokeStyle = 'gray';
                context.rect(x - (width / 2), y + 15, width, height);
            }
            context.fill();
            context.stroke();
        }

        // draw content of whiteboards
        for (var i = 0; i < whiteboards.length; i++) {
            var wb = whiteboards[i];
            var nodeId = wb.nodeId;
            var nodePosition = network.getPositions([nodeId]);
            var x = nodePosition[nodeId].x;
            var y = nodePosition[nodeId].y;

            if (wb.isGather == 'T')
                context.fillStyle = '#C72C00'; // leader color
            else
                context.fillStyle = 'black';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.font = '18px Arial';
            var id = (wb.agentId != undefined) ? " id" + wb.agentId : "";
            var phase = (wb.phase != undefined) ? "p" + wb.phase : "";
            context.fillText(phase + id , x, y + 15 + (height / 2));
        }

        // drawing agents
        var added = [];
        for (var i = 0; i < agents.length; i++) {
            var agent = agents[i];
            drawAgentBody(agent, context, added, function (x, y, r) {
                context.beginPath();
                context.moveTo(x, y - 1.8 * r);
                context.lineTo(x + r, y + r);
                context.lineTo(x - r, y + r);
                context.closePath();
            });
            context.fill();
            context.stroke();
        }

        // draw a circle (agent head) 
        var added = [];
        for (var i = 0; i < agents.length; i++) {
            var agent = agents[i];
            drawAgentBody(agent, context, added, function (x, y, r) {
                context.circle(x, y - r, r);
            });
            context.fill();
            context.stroke();
        }
        // draw agent id
        var added = [];
        for (var i = 0; i < agents.length; i++) {
            var agent = agents[i];
            drawAgentBody(agent, context, added, function (x, y, r) {
                context.fillStyle = 'black';
                context.font = '13px Arial';
                context.fillText("id" + agent.id, x + r, y - r * 2.7);
                context.fillText("p" + agent.phase, x - r, y - r * 2.7);
            });
        }
    });
    network.redraw();

    function drawAgentBody(agent, context, added, f) {
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
        else if (agent.state == 'wait')
            context.fillStyle = '#9B59B6';
        else if (agent.state == 'inactive')
            context.fillStyle = 'gray';
        else if (agent.state == 'leader')
            context.fillStyle = '#C72C00';
        else if (agent.state == 'moving')
            context.fillStyle = '#35A201';
        else if (agent.state == 'waitLeader')
            context.fillStyle = '#5973B6';
        var x = nodePosition[nodeId].x + sameNodeAgents * 10;
        var y = nodePosition[nodeId].y - 8 + sameNodeAgents * 3;
        var r = 13;
        f(x, y, r);
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomIntList(min, max) {
    var ret = [];
    for (var i = min; i <= max; i++) {
        if (Math.random() > 0.3)
            ret.push(i);
    }
    return ret;
}

function getRandomIntNList(min, max, length){
    var list = [];
    while (list.length < length){
        var r = getRandomInt(min,max);
        if (list.indexOf(r) >= 0) continue;
        list.push(r);
    }
    return list;
}