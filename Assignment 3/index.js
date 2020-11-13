const express = require('express');
var app = express();
const bodyParser = require("body-parser");
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const crypto = require("crypto");
const XRegExp = require('xregexp');

app.use(express.static('public'));
app.use(bodyParser.json());

var users = [];
var log = [];
var loglength = 200;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    

    socket.on('set', function (status, callback) {
        let id = crypto.randomBytes(3).toString("hex");
        let single = {
            username: id,
            online: true,
            color: "#000000" // default color: black
        };
        users.push(single);
        console.log(status);
        console.log(users);

        socket.nickname = String(id);




        let d = new Date();
        let h = d.getHours();
        let m = d.getMinutes();
        let ts = h + ":" + m + " ";
        let mes = "has joined the chat! ";


        const index = users.findIndex(x => x.username === socket.nickname);
        log.push({
            ts: ts,
            mes: mes,
            userdata: users[index]
        });
        if(log.length > loglength)
        {
            log.shift();
        }


        //io.emit('chat message', mes);
        let using = {user: users}
        io.emit('user update', JSON.stringify(using));

        callback(JSON.stringify(single));

        //giving last 200 entries
        io.emit('chat message', JSON.stringify(log))
        
    });


    socket.on('chat message', (msg) => {
        let recieve = JSON.parse(msg);
        if(recieve.message !== "")
        {
            console.log('message: ' + msg);

            let command = recieve.message.split(" ")[0];
            let value = recieve.message.split(" ")[1];
            let d = new Date();
            let h = d.getHours();
            let m = d.getMinutes();
            let ts = h + ":" + m + " ";
            let mes = "";
            //console.log(command + " " + value);
            //console.log(users);
            if(command === "/name")
            {

                //if it is also blank catch
                //console.log(users.findIndex(x => x.username === value));
                if(!value)
                {
                    mes = " User name change invalid, cannot be blank ";
                }
                else if(users.findIndex(x => x.username === value) !== -1)
                {
                    mes =  " User " + value + " already exists, cannot change user name";
                    console.log("already");
                }
                else
                {
                    const index = users.findIndex(x => x.username === socket.nickname);
                    console.log(users[index].username);
                    //console.log(value);
                    users[index].username = ''+value;
                    socket.nickname = value;
                    mes =  recieve.userName + " change user name to " + value;
                    //console.log(users[index]);
                    let using = {user: users}
                    io.emit('user update', JSON.stringify(using));
                }     
            }
            else if(command === "/color")
            {
                
                let match = XRegExp('^[0-9A-F]{6}');
                if(!value)
                {
                    mes = " User name change invalid, cannot be blank ";
                }
                else if(match.exec(value) === null)
                {
                    mes = value + " not valid hex (no #, 0-9 or A-F)";
                    const index = users.findIndex(x => x.username === socket.nickname);
                    users[index].color = ''+value;
                    console.log(users[index]);
                }
            }
            else 
            {
                mes =  ": " + recieve.message;

            }

            const index = users.findIndex(x => x.username === socket.nickname);
            log.push({
                ts: ts,
                mes: mes,
                userdata: users[index]
            });
            if(log.length > loglength)
            {
                log.shift();
            }

            socket.emit('user name', socket.nickname);
            io.emit('chat message', JSON.stringify(log))

        }
    });

    socket.on('disconnect', () => {
        console.log(socket.nickname)
        const index = users.findIndex(x => x.username === socket.nickname);
        if (index !== undefined) users.splice(index, 1);

        let using = {user: users}
        io.emit('user update', JSON.stringify(using));

        console.log('user disconnected');
    });
  });

http.listen(3000, () => {
    console.log('listening on *:3000');
});