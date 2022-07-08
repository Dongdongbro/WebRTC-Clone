const socket = io();    // io 함수는 알아서 socket Io를 실행하고 있는 서버를 찾을 것이다.

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const cameraSelect = document.getElementById('cameras');
const call = document.getElementById('call');

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
                if (currentCamera.label == camera.label) {
                    option.selected = true;
            }
            cameraSelect.appendChild(option);
        });
    } catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId){
    const initialConstrains = {
        audio: true,
        video: { facingMode: "user" },
    };
    const cameraConstrains = {
        audio: true,
        video: { deviceId: { exact: deviceId } },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstrains : initialConstrains
            );
            myFace.srcObject = myStream;
            if (!deviceId) {
                await getCameras();
            }
    } catch(e) {
        console.log(e);
    }
}


function handlemuteBtnClick() {
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!muted){
        muteBtn.innerText = 'Unmuted';
        muted = true;
    } else {
        muteBtn.innerText = 'Mute';
        muted = false;
    }
}
function handlecameraBtnClick() {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    if(cameraOff){
        cameraBtn.innerText = 'Turn camera off';
        cameraOff = false;
    } else {
        cameraBtn.innerText = 'Turn camera on';
        cameraOff = true;
    }
}

async function handlecameraChange() {
    await getMedia(cameraSelect.value);
    if(myPeerConnection){
        const videoTrack = myStream.getAudioTracks()[0];
        const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handlemuteBtnClick);
cameraBtn.addEventListener("click", handlecameraBtnClick);
cameraSelect.addEventListener("click", handlecameraChange);


// Welcome Form(join a room)

const welcome = document.getElementById('welcome');
welcomeForm = welcome.querySelector("form");

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// SOcket code

// Peer A offer를 생성하고 Peer B로 그 offer를 보낼 것이다.
socket.on("welcome", async ()=> {
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", (event)=> console.log(event.data) );
    console.log("made data channel");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

// Peer B에서 오퍼를 받으면 오퍼를 처리
socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (event)=> console.log(event.data) );
    });
    console.log("received offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent answer");
});

socket.on("answer", answer => {
    console.log("received answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", ice => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
});

// RTC Code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls : [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ],
            },
        ],
    }); // peer to peer connection
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data){
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data){
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}

// const welcome =  document.getElementById('welcome');
// const form = welcome.querySelector('form');
// const room = document.getElementById('room');

// room.hidden = true;

// let roomName = "";

// function addMessage(message) {
//     const ul = room.querySelector("ul");
//     const li = document.createElement("li");
//     li.innerText = `${message}`;
//     ul.appendChild(li);
// }

// function handleMessageSubmit(event) {
//     event.preventDefault();
//     const input = room.querySelector("#msg input");
//     const value = input.value;
//     socket.emit("new_message", input.value, roomName, () => {
//         addMessage(`You : ${value}`);
//     });
//     input.value = "";
// }

// function handleNicknameSubmit(event){
//     event.preventDefault();
//     const input = room.querySelector("#name input");
//     socket.emit("nickname", input.value);
//     input.value = ""
// }

// function showRoom() {
//     welcome.hidden = true;
//     room.hidden = false;
//     const h3 = room.querySelector('h3');
//     h3.innerText = `Room ${roomName}`;
//     const msgForm = room.querySelector('#msg');
//     const nameForm = room.querySelector('#name');
//     msgForm.addEventListener('submit', handleMessageSubmit);
//     nameForm.addEventListener('submit', handleNicknameSubmit);
// }

// function handleRoomSubmit(event) {
//     event.preventDefault();
//     const input = form.querySelector('input');
//     // send 말고 emit을 사용해서 어떤 정보든 back으로 보낼 수 있다. string만 보냈던 방식에서 무엇이든 보낼 수 있다.
//     // 만약 끝날때 실행되는 function을 넣고 싶으면 가장 마지막에 적어야한다.
//     socket.emit(
//         "enter_room",
//         input.value,
//         showRoom
//     );
//     roomName = input.value;
//     input.value = "";
// }

// form.addEventListener('submit', handleRoomSubmit);


// socket.on("Welcome", (user, newCount) => {
//     const h3 = room.querySelector('h3');
//     h3.innerText = `Room ${roomName} (${newCount})`;
//     addMessage(`${user} joined!^^`);
// });
// socket.on("bye", (left, newCount) => {
//     const h3 = room.querySelector('h3');
//     h3.innerText = `Room ${roomName} (${newCount})`;
//     addMessage(`${left} left!ㅠㅠ`);
// });
// socket.on("new_message", addMessage);
// socket.on("room_change", (rooms) => {
//     const roomList = welcome.querySelector("ul");
//     if(rooms.length === 0){
//         roomList.innerHTML = "";
//         return;
//     }
//     rooms.forEach((room) => {
//         const li = document.createElement("li");
//         li.innerText = room;
//         roomList.append(li);
//     });
// });