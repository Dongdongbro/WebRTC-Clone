import http from "http";
import SocketIO from "socket.io";
// import {instrument} from "@socket.io/admin-ui";
import express from "express";  // npm i express 설치

const app = express();  // app이라는 변수에 express 가져와서 사용

app.set('view engine', 'pug');  // 뷰 엔진을 pug로 하겠다.
app.set("views", __dirname + '/views'); // 디렉토리 설정
app.use("/public", express.static(__dirname + '/public'));  // public 폴더를 유저에게 공개(유저가 볼 수 있는 폴더를 지정)
app.get("/", (req, res) => res.render("home")); // 홈페이지로 이동할 떄 사용할 템플릿을 렌더
app.get("/*", (req, res) => res.redirect("/")); // 홈페이지 내 어느 페이지로 접근해도 홈으로 연결되도록 리다이렉트(다른 url 사용 안하기에 설정)

const httpServer = http.createServer(app);  //app은 express application으로부터 서버 생성
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    });
    // app.js(브라우저) 에서 보낸 offer를 받았을 때,
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });
});

const handleListen = () => console.log('Listening on http://localhost:3000');
httpServer.listen(3000, handleListen);  // 서버는 ws, http 프로토콜 모두 이해할 수 있게 됨.
// const wsServer = new Server(httpServer, {
//     cors: {
//       origin: ["https://admin.socket.io"],
//       credentials: true
//     }
//   });

//   instrument(wsServer, {
//     auth: false
//   });

// function publicRooms(){
//     const {
//         sockets: {
//             adapter: { sids, rooms },
//         },
//     } = wsServer;
//     const publicRooms = [];
//     rooms.forEach((_,key) => {
//         if(sids.get(key) == undefined) {
//             publicRooms.push(key);
//         }
//     });
//     return publicRooms;
// }
// function countRoom(roomName){
//     return wsServer.sockets.adapter.rooms.get(roomName)?.size;
// }

// // back에서 소켓을 받을 준비가 되었다.
// wsServer.on('connection', socket => {
//     socket["nickname"] = "Anon";
//     socket.onAny((event) => {
//         console.log(wsServer.sockets.adapter);
//         console.log(`Socket Event: ${event}`);
//     });
//     socket.on("enter_room", (roomName, done) => {
//         socket.join(roomName);
//         done();
//         socket.to(roomName).emit("Welcome", socket.nickname, countRoom(roomName));
//         wsServer.sockets.emit("room_change", publicRooms());
//     });
//     socket.on("disconnecting", () => {
//         socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1));
//     });
//     socket.on("disconnect", () => {
//         wsServer.sockets.emit("room_change", publicRooms());
//     })
//     socket.on("new_message", (msg, room, done) => {
//         socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
//         done();
//     })
//     socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
// });

// const wss = new WebSocket.Server({ server });   //http서버위에  webSocket서버 생성, 위의 http로 만든 server는 필수x , 이렇게 하면 http/ws서버 모두 같은 3000번 포트 이용

// const sockets = [];

// // on method에서는 event가 발동되는 것을 기다린다.
// // event가 connection 뒤에 오는 함수에서 작동한다.
// // 그리고 on method는 backend에 연결된 사람의 정보를 제공한다. (소켓으로부터)
// // 익명함수로 바꾸기
// wss.on("connection", (socket) => {  // socket은 매개변수로서 새로운 브라우저를 뜻함. (wss는 전체서버, socket은 하나의 연결)
//     sockets.push(socket);
//     socket["nickname"] = "Anon";
//     console.log("Connected to Browser");
//     socket.on("close", () => console.log("Disconnected from Browser❌"));
//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg);
//         switch (message.type) {
//             case "new_message":
//                 sockets.forEach((aSocket) =>
//                     aSocket.send(`${socket.nickname}: ${message.payload}`)
//                 );
//             case "nickname":
//                 socket["nickname"] = message.payload;
//         }
//     });
// });


// {
//     type:"message";
//     payload:"hello, everyone!";
// }

// {
//     type:"nickname";
//     payload:"Donghee";
// }