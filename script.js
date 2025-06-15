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

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ✅ DOM Elements
const fileInput = document.getElementById("fileInput");
const startUpload = document.getElementById("startUpload");
const uploadProgress = document.getElementById("uploadProgress");
const codeDisplay = document.getElementById("codeDisplay");
const codeInput = document.getElementById("codeInput");
const startDownload = document.getElementById("startDownload");

// ✅ Limit file size to 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ✅ Generate 5-digit random code
function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// ✅ Upload handler
startUpload.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select a file.");
  if (file.size > MAX_FILE_SIZE) {
    alert("File size must be less than 5MB.");
    return;
  }

  const reader = new FileReader();
  const code = generateCode();

  reader.onload = function (e) {
    const fileData = e.target.result;

    uploadProgress.textContent = "Uploading...";
    database.ref("files/" + code).set({
      name: file.name,
      type: file.type,
      data: fileData,
      createdAt: Date.now()
    }).then(() => {
      uploadProgress.textContent = "Upload complete.";
      codeDisplay.textContent = code;
    }).catch((error) => {
      uploadProgress.textContent = "Upload failed.";
      console.error(error);
    });
  };

  reader.readAsDataURL(file);
});

// ✅ Download handler
startDownload.addEventListener("click", () => {
  const code = codeInput.value.trim();
  if (code.length !== 5) return alert("Enter a valid 5-digit code.");

  uploadProgress.textContent = "Fetching file...";
  database.ref("files/" + code).once("value").then((snapshot) => {
    const data = snapshot.val();
    if (!data) {
      uploadProgress.textContent = "No file found for this code.";
      return;
    }

    const a = document.createElement("a");
    a.href = data.data;
    a.download = data.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    uploadProgress.textContent = "Download started.";
  }).catch((error) => {
    uploadProgress.textContent = "Download failed.";
    console.error(error);
  });
});
