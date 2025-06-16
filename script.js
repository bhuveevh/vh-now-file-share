document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("fileInput");
  const startUpload = document.getElementById("startUpload");
  const uploadProgress = document.getElementById("uploadProgress");
  const codeDisplay = document.getElementById("codeDisplay");

  const codeInput = document.getElementById("codeInput");
  const startDownload = document.getElementById("startDownload");
  const downloadStatus = document.getElementById("downloadStatus");

  // ✅ Firebase config
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

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/webp'
  ];

  function generateCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  // 📤 Upload File
  startUpload.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) return alert("Please select a file!");
    if (file.size > 5 * 1024 * 1024) return alert("File must be 5MB or less.");
    if (!allowedTypes.includes(file.type)) return alert("Only PDF, DOCX, JPG, JPEG, WEBP files allowed.");

    const reader = new FileReader();
    reader.readAsDataURL(file);

    // UI Reset
    uploadProgress.style.width = "0%";
    codeDisplay.textContent = "⏳ Uploading...";

    reader.onload = () => {
      const fileData = reader.result;
      const code = generateCode();

      // Start progress fill after Firebase save starts
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        uploadProgress.style.width = `${progress}%`;
        if (progress >= 100) clearInterval(progressInterval);
      }, 100);

      db.ref("files/" + code).set({
        name: file.name,
        data: fileData,
        createdAt: Date.now()
      }).then(() => {
        // ✅ Show code after Firebase has saved it
        codeDisplay.textContent = code;

        // 🗑️ Auto delete after 5 min
        setTimeout(() => {
          db.ref("files/" + code).remove();
        }, 5 * 60 * 1000);
      }).catch(err => {
        clearInterval(progressInterval);
        uploadProgress.style.width = "0%";
        codeDisplay.textContent = "❌ Upload failed";
        alert("Upload error: " + err.message);
      });
    };
  });

  // ⬇️ Download File
  startDownload.addEventListener("click", async () => {
    const code = codeInput.value.trim();
    if (!code || code.length !== 5) return alert("Please enter a 5-digit code.");

    startDownload.disabled = true;
    startDownload.textContent = "⏳ Downloading...";
    downloadStatus.textContent = "";

    try {
      const snapshot = await db.ref("files/" + code).once("value");
      const file = snapshot.val();

      if (!file) {
        downloadStatus.textContent = "❌ File not found or expired.";
        return;
      }

      const a = document.createElement("a");
      a.href = file.data;
      a.download = file.name;
      a.click();

      downloadStatus.textContent = "✅ Download complete.";
    } catch (error) {
      downloadStatus.textContent = "❌ Download failed: " + error.message;
    } finally {
      startDownload.disabled = false;
      startDownload.textContent = "Download";
    }
  });
});
