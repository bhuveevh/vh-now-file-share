const fileInput = document.getElementById("fileInput"); // example ID

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (file.size > 5 * 1024 * 1024) { // 5MB = 5 * 1024 * 1024 bytes
    alert("❌ File size exceeds 5MB limit. Please choose a smaller file.");
    fileInput.value = ""; // Clear the input
    return;
  }

// Replace with your Firebase config 👇
const firebaseConfig = {
   apiKey: "AIzaSyAbOFkjLoMWsjvXtAZNulO2LrAX1uDjHfk",
  authDomain: "vh-temp-share.firebaseapp.com",
  databaseURL: "https://vh-temp-share-default-rtdb.firebaseio.com",
  projectId: "vh-temp-share",
  storageBucket: "vh-temp-share.firebasestorage.app",
  messagingSenderId: "1080355432679",
  appId: "1:1080355432679:web:b7fe270d290346c448da42"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let localConnection, remoteConnection, fileReader;
let fileChunkQueue = [];
let dataChannel;
const CHUNK_SIZE = 16 * 1024; // 16KB
let generatedCode = "";

function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

document.getElementById("startUpload").onclick = async () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("Please choose a file.");

  generatedCode = generateCode();
  document.getElementById("codeDisplay").innerText = generatedCode;

  localConnection = new RTCPeerConnection();
  dataChannel = localConnection.createDataChannel("file");
  dataChannel.onopen = () => sendFile(file);
  dataChannel.onerror = (e) => console.error("Channel error", e);

  const offer = await localConnection.createOffer();
  await localConnection.setLocalDescription(offer);

  const ref = db.ref(`fileshare/${generatedCode}`);
  await ref.set({ offer: offer });

  ref.on("value", async (snap) => {
    const data = snap.val();
    if (data && data.answer && !localConnection.currentRemoteDescription) {
      const answer = new RTCSessionDescription(data.answer);
      await localConnection.setRemoteDescription(answer);
    }
  });
};

async function sendFile(file) {
  const reader = new FileReader();
  let offset = 0;

  reader.onload = (e) => {
    dataChannel.send(e.target.result);
    offset += e.target.result.byteLength;
    document.getElementById("uploadProgress").innerText = `Uploaded: ${Math.round((offset / file.size) * 100)}%`;

    if (offset < file.size) readSlice(offset);
    else dataChannel.send("EOF");
  };

  function readSlice(o) {
    const slice = file.slice(offset, o + CHUNK_SIZE);
    reader.readAsArrayBuffer(slice);
  }

  readSlice(0);
}

document.getElementById("startDownload").onclick = async () => {
  const code = document.getElementById("codeInput").value;
  if (!code) return alert("Enter valid code.");

  remoteConnection = new RTCPeerConnection();
  remoteConnection.ondatachannel = (event) => {
    const receiveChannel = event.channel;
    const receivedBuffers = [];

    receiveChannel.onmessage = (e) => {
      if (e.data === "EOF") {
        const blob = new Blob(receivedBuffers);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "downloaded_file";
        a.click();
      } else {
        receivedBuffers.push(e.data);
      }
    };
  };

  const ref = db.ref(`fileshare/${code}`);
  const snap = await ref.once("value");
  const data = snap.val();

  if (!data) return alert("Invalid or expired code.");

  const offerDesc = new RTCSessionDescription(data.offer);
  await remoteConnection.setRemoteDescription(offerDesc);
  const answer = await remoteConnection.createAnswer();
  await remoteConnection.setLocalDescription(answer);

  await ref.update({ answer: answer });
};
