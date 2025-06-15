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

const allowedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp'
];
const maxFileSize = 5 * 1024 * 1024;

function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Upload Handler
startUpload.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select a file.");

  if (!allowedTypes.includes(file.type))
    return alert("Only PDF, DOCX, JPG, JPEG, WEBP allowed.");

  if (file.size > maxFileSize)
    return alert("Maximum file size allowed is 5 MB.");

  const reader = new FileReader();

  // Simulated progress bar
  let percent = 0;
  uploadProgress.style.width = "0%";
  uploadProgress.style.backgroundColor = "#e91e63";
  uploadProgress.textContent = "Uploading...";

  const progressInterval = setInterval(() => {
    percent += 5;
    uploadProgress.style.width = percent + "%";
    if (percent >= 95) clearInterval(progressInterval);
  }, 100);

  reader.onload = function (e) {
    const dataUrl = e.target.result;
    const code = generateCode();

    database.ref("files/" + code).set({
      name: file.name,
      type: file.type,
      data: dataUrl,
      timestamp: Date.now()
    }).then(() => {
      clearInterval(progressInterval);
      uploadProgress.style.width = "100%";
      uploadProgress.textContent = "Uploaded!";
      codeDisplay.textContent = code;
    });
  };

  reader.readAsDataURL(file);
});

// Download Handler
startDownload.addEventListener("click", () => {
  const code = codeInput.value.trim();
  if (!code) return alert("Please enter the code.");

  database.ref("files/" + code).once("value").then(snapshot => {
    const data = snapshot.val();
    if (!data) return alert("Invalid or expired code.");

    const link = document.createElement("a");
    link.href = data.data;
    link.download = data.name;
    link.click();
  });
});
