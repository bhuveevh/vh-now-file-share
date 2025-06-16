document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("fileInput");
  const startUpload = document.getElementById("startUpload");
  const uploadProgress = document.getElementById("uploadProgress");
  const codeDisplay = document.getElementById("codeDisplay");

  const codeInput = document.getElementById("codeInput");
  const startDownload = document.getElementById("startDownload");
  const downloadStatus = document.getElementById("downloadStatus");

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

  startUpload.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) return alert("Please select a file!");
    if (file.size > 5 * 1024 * 1024) return alert("File must be 5MB or less.");
    if (!allowedTypes.includes(file.type)) return alert("Only PDF, DOCX, JPG, JPEG, WEBP files allowed.");

    const reader = new FileReader();
    reader.readAsDataURL(file);

    uploadProgress.style.width = "0%";
    codeDisplay.textContent = "⬆ Uploading...";

    reader.onload = () => {
      const fileData = reader.result;
      const code = generateCode();

      // Simulate progress until Firebase finishes
      let progress = 0;
      const progressInterval = setInterval(() => {
        if (progress < 95) {
          progress += 5;
          uploadProgress.style.width = `${progress}%`;
        }
      }, 150); // slow fill to sync with db write

      db.ref("files/" + code).set({
        name: file.name,
        data: fileData,
        createdAt: Date.now()
      }).then(() => {
        clearInterval(progressInterval);
        uploadProgress.style.width = "100%";

        codeDisplay.textContent = code;

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

  startDownload.addEventListener("click", async () => {
    const code = codeInput.value.trim();
    if (!code || code.length !== 5) return alert("Please enter a 5-digit code.");

    startDownload.disabled = true;
    startDownload.textContent = "⬇ Downloading...";
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
