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

// DOM elements
const fileInput = document.getElementById("fileInput");
const startUpload = document.getElementById("startUpload");
const codeDisplay = document.getElementById("codeDisplay");
const uploadProgress = document.getElementById("uploadProgress");
const progressBar = document.createElement("div");

uploadProgress.appendChild(progressBar);
progressBar.style.height = "8px";
progressBar.style.width = "0%";
progressBar.style.background = "deeppink";
progressBar.style.borderRadius = "5px";
progressBar.style.transition = "width 0.3s ease";

// Allowed file types
const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/jpg", "image/png", "image/webp"];

startUpload.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select a file first.");

  // Validation
  if (file.size > 5 * 1024 * 1024) return alert("Max file size is 5 MB.");
  if (!allowedTypes.includes(file.type)) return alert("File type not supported.");

  const reader = new FileReader();
  reader.onload = function (e) {
    const fileData = e.target.result;
    const code = Math.floor(10000 + Math.random() * 90000).toString();

    const uploadRef = db.ref("files/" + code);
    const timestamp = Date.now();

    // Upload with progress simulation
    let progress = 0;
    const fakeProgress = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        progressBar.style.width = progress + "%";
      }
      if (progress >= 100) {
        clearInterval(fakeProgress);
      }
    }, 100);

    uploadRef.set({
      name: file.name,
      type: file.type,
      data: fileData,
      timestamp: timestamp
    }).then(() => {
      codeDisplay.textContent = code;
      // Auto-delete after 5 minutes
      setTimeout(() => {
        db.ref("files/" + code).remove();
      }, 5 * 60 * 1000);
    }).catch(() => {
      alert("Failed to upload file.");
    });
  };

  reader.readAsDataURL(file);
});


// Download Logic
document.getElementById("startDownload").addEventListener("click", () => {
  const code = document.getElementById("codeInput").value.trim();
  if (code.length !== 5) return alert("Enter a valid 5-digit code");

  const downloadButton = document.getElementById("startDownload");
  downloadButton.textContent = "Downloading...";
  downloadButton.disabled = true;

  db.ref("files/" + code).once("value")
    .then(snapshot => {
      const fileObj = snapshot.val();
      if (!fileObj) throw new Error("File expired or doesn't exist.");

      const link = document.createElement("a");
      link.href = fileObj.data;
      link.download = fileObj.name;
      document.body.appendChild(link);
      link.click();
      link.remove();

      downloadButton.textContent = "Download";
      downloadButton.disabled = false;
    })
    .catch(err => {
      alert("Download failed: " + err.message);
      downloadButton.textContent = "Download";
      downloadButton.disabled = false;
    });
});
