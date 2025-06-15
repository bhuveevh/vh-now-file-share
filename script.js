// Initialize Firebase
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

// Utility: Generate 5-digit code
function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// DOM Elements
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("startUpload");
const downloadBtn = document.getElementById("startDownload");
const codeDisplay = document.getElementById("codeDisplay");
const codeInput = document.getElementById("codeInput");
const progressBar = document.getElementById("uploadProgress");

// Upload Handler
uploadBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select a file.");

  const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return alert("Only PDF, PNG, DOCX, JPG, JPEG, and WEBP files are allowed.");
  }

  if (file.size > 5 * 1024 * 1024) {
    return alert("File size must be less than 5MB.");
  }

  const reader = new FileReader();
  const code = generateCode();

  reader.onload = function (e) {
    const fileData = {
      name: file.name,
      type: file.type,
      content: e.target.result,
      timestamp: Date.now()
    };

    const uploadTask = db.ref("files/" + code).set(fileData, (error) => {
      if (error) {
        alert("Upload failed.");
      } else {
        codeDisplay.textContent = code;
        progressBar.style.width = "100%";
        progressBar.style.backgroundColor = "#e91e63";

        // Auto-delete after 5 minutes
        setTimeout(() => {
          db.ref("files/" + code).remove();
        }, 300000);
      }
    });
  };

  // Reset progress bar
  progressBar.style.transition = "none";
  progressBar.style.width = "0";
  progressBar.offsetHeight; // Trigger reflow
  progressBar.style.transition = "width 1.5s ease";

  // Simulate smooth progress fill
  let percent = 0;
  const interval = setInterval(() => {
    percent += 10;
    progressBar.style.width = percent + "%";
    if (percent >= 90) clearInterval(interval);
  }, 150);

  reader.readAsDataURL(file);
});

// Download Handler
downloadBtn.addEventListener("click", async () => {
  const code = codeInput.value.trim();
  if (code.length !== 5) return alert("Please enter a valid 5-digit code.");

  downloadBtn.textContent = "⌛ Downloading...";
  downloadBtn.disabled = true;

  try {
    const snapshot = await db.ref("files/" + code).once("value");

    if (!snapshot.exists()) throw new Error("Code expired or not found.");

    const fileData = snapshot.val();
    const currentTime = Date.now();

    if (currentTime > fileData.timestamp + 300000) {
      await db.ref("files/" + code).remove();
      throw new Error("Code expired.");
    }

    const a = document.createElement("a");
    a.href = fileData.content;
    a.download = fileData.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    alert(err.message);
  } finally {
    downloadBtn.textContent = "Download";
    downloadBtn.disabled = false;
  }
});
