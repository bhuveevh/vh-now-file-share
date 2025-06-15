// ✅ Firebase config (same as you provided)
const firebaseConfig = {
  apiKey: "AIzaSyAbOFkjLoMWsjvXtAZNulO2LrAX1uDjHfk",
  authDomain: "vh-temp-share.firebaseapp.com",
  databaseURL: "https://vh-temp-share-default-rtdb.firebaseio.com",
  projectId: "vh-temp-share",
  storageBucket: "vh-temp-share.appspot.com",
  messagingSenderId: "1080355432679",
  appId: "1:1080355432679:web:b7fe270d290346c448da42"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// DOM Elements
const fileInput = document.getElementById("fileInput");
const startUpload = document.getElementById("startUpload");
const uploadProgressBar = document.getElementById("uploadProgressBar");
const progressFill = document.getElementById("progressFill");
const codeDisplayBox = document.getElementById("codeDisplayBox");
const codeInput = document.getElementById("codeInput");
const startDownload = document.getElementById("startDownload");

// Generate 5-digit unique code
function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Convert file to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload Handler
startUpload.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select a file");

  if (file.size > 5 * 1024 * 1024) {
    alert("File size must be under 5MB");
    return;
  }

  const code = generateCode();
  codeDisplayBox.textContent = code;

  progressFill.style.width = "0%";
  uploadProgressBar.style.display = "block";

  const base64 = await fileToBase64(file);

  let progress = 0;
  const fakeInterval = setInterval(() => {
    progress += 10;
    progressFill.style.width = `${progress}%`;
    if (progress >= 100) clearInterval(fakeInterval);
  }, 100);

  const data = {
    file: base64,
    filename: file.name,
    mime: file.type,
    timestamp: Date.now()
  };

  await db.ref("files/" + code).set(data);
});

// Download Handler
startDownload.addEventListener("click", async () => {
  const code = codeInput.value.trim();
  if (!code || code.length !== 5) return alert("Enter a valid 5-digit code");

  startDownload.classList.add("pulse");

  const snapshot = await db.ref("files/" + code).get();
  const data = snapshot.val();

  if (!data) {
    startDownload.classList.remove("pulse");
    return alert("File not found or expired");
  }

  const age = (Date.now() - data.timestamp) / 1000;
  if (age > 300) {
    await db.ref("files/" + code).remove(); // Auto-delete
    startDownload.classList.remove("pulse");
    return alert("Code expired");
  }

  const a = document.createElement("a");
  a.href = data.file;
  a.download = data.filename || "file";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  startDownload.classList.remove("pulse");
});
