let connections = new Map();

export const connectSSE = (userId, res, req) => {

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    connections.set(userId.toString(), res);

    res.write(`data: ${ JSON.stringify({ type: 'connected' }) }\n\n`);

    req.on('close', () => {
        connections.delete(userId.toString());
        console.log(`User ${ userId } disconnected!`);
    });

    req.on('error', (err) => {
        if (err.message === 'aborted') return;
        console.error(`SSE connection error for user ${ userId }`, err);
        connections.delete(userId.toString());
    });

};

export const pingUser = (userId, data) => {

    const connection = connections.get(userId.toString());

    if (connection && !connection.destroyed) {
        try {
            connection.write(`data: ${ JSON.stringify(data) }\n\n`);
            console.log(`Pinged user ${ userId }`);
        } catch (err) {
            console.error('sse.js utils pingUser function error: ', err);
            connections.delete(userId.toString());
            return false;
        }
    }
    
    return false;

};

export const isUserConnected = (userId) => connections.has(userId.toString());
