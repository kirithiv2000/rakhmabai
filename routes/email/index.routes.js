const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { main } = require("../../utils/emailSender");

const DIR = path.join(__dirname, "../../images/");

let allFiles = { attachments: [], csv: [] };
let randomNum;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(" ").join("-");
    randomNum = Math.random().toString().split(".")[1];
    const fileExtn = fileName.split(".")[1];
    if (
      fileExtn === "pdf" ||
      fileExtn === "jpg" ||
      fileExtn === "jpeg" ||
      fileExtn === "png"
    ) {
      allFiles.attachments.push(randomNum + "-" + fileName);
    }
    if (fileExtn === "csv") {
      allFiles.csv.push(randomNum + "-" + fileName);
    }
    cb(null, randomNum + "-" + fileName);
  },
});

var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "application/pdf" ||
      file.mimetype === "text/csv"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
});

router.get("/clearUploads", (req, res) => {
  Object.keys(allFiles).forEach((key) => {
    allFiles[key].forEach((file) => {
      fs.unlinkSync(path.join(__dirname, "../../images/", file));
    });
  });
  allFiles = { attachments: [], csv: [] };
  res.sendStatus(200);
});

router.post("/upload", upload.array("imgCollection", 6), (req, res, next) => {
  const reqFiles = [];
  const url = req.protocol + "://" + req.get("host");
  for (var i = 0; i < req.files.length; i++) {
    reqFiles.push(url + "/images/" + req.files[i].filename);
  }
  res.sendStatus(200);
});

router.post("/sendEmail", async (req, res, next) => {
  let email = req.body.mailBody;
  email =
    "<p>" + email.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
  console.log(req.body);
  await main(
    allFiles.csv[0],
    allFiles.attachments,
    req.body.mailSubject,
    email,
    req.body.email,
    req.body.password
  );
  Object.keys(allFiles).forEach((key) => {
    allFiles[key].forEach((file) => {
      fs.unlinkSync(path.join(__dirname, "../../images/", file));
    });
  });

  allFiles = { attachments: [], csv: [] };
  res.sendStatus(200);
});

module.exports = router;
