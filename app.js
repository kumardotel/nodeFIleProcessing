const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const stream = require("stream");

const app = express();
const port = 8080;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Handle file upload and resolution processing
app.post("/process", upload.single("attachment"), (req, res) => {
  try {
    const resolution = req.body.resolution || "1280x720"; // Default resolution
    const filename = req.file.originalname;
    var base = path.parse(filename).name;
    const extension = path.parse(filename).ext;

    // Check if a file is uploaded
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // Create a readable stream from the buffer
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    // Determine file type based on MIME type
    const mimeType = req.file.mimetype;
    const isVideo = mimeType.startsWith("video");
    const isImage = mimeType.startsWith("image");

    if (isVideo) {
      // Video processing using ffmpeg
      ffmpeg()
        .input(bufferStream)
        .inputFormat("mp4")
        .videoCodec("libx264")
        .size(resolution)
        .on("progress", (progress) => {
          console.log(`Processing video, frames:`, progress.frames);
        })
        .on("end", () => {
          console.log("Processing finished.");
          res.send("Processing finished.");
        })
        .on("error", (err) => {
          res.status(500).send("Error processing the file.");
        })
        .save(`${base}-${resolution}.mp4`);
    } else if (isImage) {
      // Image processing using ffmpeg
      ffmpeg()
        .input(bufferStream)
        .inputFormat("image2pipe")
        .inputOptions(["-framerate", "1/5"])
        .size(resolution)
        .on("progress", (progress) => {
          console.log(`Processing image, frames:`, progress.frames);
        })
        .on("end", () => {
          console.log("Processing finished.");
          res.send("Processing finished.");
        })
        .on("error", (err) => {
          res.status(500).send("Error processing the file.");
        })
        .save(`${base}-${resolution}${extension}`);
    } else {
      throw new Error("Unsupported file type.");
    }
  } catch (error) {
    res.status(500).send("Error processing the file.");
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
