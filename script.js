// Firebase Config
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
const database = firebase.database();

// DOM Elements
const fileInput = document.getElementById("fileInput");
const startUpload = document.getElementById("startUpload");
const uploadProgress = document.getElementById("uploadProgress");
const codeDisplay = document.getElementById("codeDisplay");

const codeInput = document.getElementById("codeInput");
const startDownload = document.getElementById("startDownload");

// Valid Extensions
const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/webp'];

function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Upload Handler
startUpload.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file.");
    return;
  }

  if (!allowedTypes.includes(file.type)) {
    alert("Only PDF, DOCX, JPG, JPEG, and WEBP files are allowed.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;
    const code = generateCode();

    database.ref("files/" + code).set({
      name: file.name,
      type: file.type,
      data: dataUrl,
      timestamp: Date.now()
    });

    uploadProgress.textContent = "Uploaded!";
    codeDisplay.textContent = code;

    // Set timeout to auto-delete after 5 mins
    setTimeout(() => {
      database.ref("files/" + code).remove();
    }, 5 * 60 * 1000);
  };
  reader.readAsDataURL(file);
});

// Download Handler
startDownload.addEventListener("click", () => {
  const code = codeInput.value.trim();
  if (!code) {
    alert("Please enter the code.");
    return;
  }

  database.ref("files/" + code).once("value").then(snapshot => {
    const data = snapshot.val();
    if (!data) {
      alert("Invalid or expired code.");
      return;
    }

    const link = document.createElement("a");
    link.href = data.data;
    link.download = data.name;
    link.click();
  });
});
