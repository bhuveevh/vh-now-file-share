document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const fileInput = document.getElementById("fileInput");
  const startUpload = document.getElementById("startUpload");
  const uploadProgress = document.getElementById("uploadProgress");
  const codeDisplay = document.getElementById("codeDisplay");

  const codeInput = document.getElementById("codeInput");
  const startDownload = document.getElementById("startDownload");
  const downloadStatus = document.getElementById("downloadStatus");

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
  const db = firebase.database();

  // Allowed MIME types
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ];

  function generateCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  // Upload
  startUpload.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) return alert("Please select a file!");
    if (file.size > 5 * 1024 * 1024) return alert("File size must be <= 5MB");
    if (!allowedTypes.includes(file.type)) return alert("Unsupported file type!");

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const fileData = reader.result;
      const code = generateCode();

      // Progress Simulation
      let progress = 0;
      uploadProgress.style.width = "0%";

      const progressInterval = setInterval(() => {
        progress += 10;
        uploadProgress.style.width = progress + "%";
        if (progress >= 100) clearInterval(progressInterval);
      }, 100);

      db.ref("files/" + code).set({
        name: file.name,
        data: fileData,
        createdAt: Date.now()
      });

      // Auto-delete in 5 min
      setTimeout(() => {
        db.ref("files/" + code).remove();
      }, 5 * 60 * 1000);

      codeDisplay.textContent = code;
    };
  });

  // Download
  startDownload.addEventListener("click", async () => {
    const code = codeInput.value.trim();
    if (!code) return alert("Enter 5-digit code");

    startDownload.disabled = true;
    startDownload.textContent = "⏳ Downloading...";

    try {
      const snapshot = await db.ref("files/" + code).once("value");
      const file = snapshot.val();

      if (!file) {
        downloadStatus.textContent = "❌ File not found or expired.";
      } else {
        const a = document.createElement("a");
        a.href = file.data;
        a.download = file.name;
        a.click();
        downloadStatus.textContent = "✅ Download complete.";
      }
    } catch (err) {
      downloadStatus.textContent = "❌ Download failed: " + err.message;
    }

    startDownload.disabled = false;
    startDownload.textContent = "Download";
  });
});
