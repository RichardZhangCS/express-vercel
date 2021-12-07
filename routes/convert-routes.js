var express = require("express");
var router = express.Router();
var multer = require("multer");
var path = require("path");
const fs = require("fs");
const { fromPath } = require("pdf2pic");
const pdf = require("pdf-poppler");
const csvToJson = require("convert-csv-to-json");
var { zip } = require("zip-a-folder");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    var fileExtension = file.originalname.split(".").pop();
    cb(null, file.fieldname + "." + fileExtension);
  },
});

var upload = multer({
  storage: storage,
  limits: { fieldSize: 10 * 1024 * 1024 },
});

const PDFDocument = require("pdfkit");

router.post("/img/pdf", upload.single("file"), async (req, res, next) => {
  console.log("reached /img/pdf");
  var pdfDocument = new PDFDocument({
    autoFirstPage: false,
  });

  if (!req.file) {
    res.status(400).send("No file attached to request");
    return;
  }
  pdfDocument.pipe(res);
  console.log(req.file.path);
  res.contentType("application/pdf");
  var img = pdfDocument.openImage(req.file.path);
  pdfDocument.addPage({ size: [img.width, img.height] });
  pdfDocument.image(img, 0, 0);
  pdfDocument.end();
});

/*router.post("/pdf/img/jpg", (req, res) => {
  res.send("yay");
});*/

router.post(
  "/pdf/img/:imgtype",
  upload.single("file"),
  async (req, res, next) => {
    var splitArray = req.file.originalname.split(".");
    splitArray.pop();
    var originalName = splitArray.join("");
    if (!req.file) {
      res.status(400).send("No file attached to request");
      return;
    }

    if (!["png", "jpg", "jpeg"].includes(req.params.imgtype)) {
      res.status(400).send("Invalid image file extension");
      return;
    }

    let inputFile = path.join(__dirname, "..", "/uploads/file.pdf");
    console.log(inputFile);

    fs.rmdirSync("downloads", { recursive: true });
    fs.mkdirSync("downloads");

    let opts = {
      format: req.params.imgtype,
      out_dir: path.join(__dirname, "..", "/downloads"),
      out_prefix: originalName,
      page: null,
    };
    try {
      await pdf.convert(inputFile, opts);
      await zipDirectory("downloads", "downloads.zip");
    } catch (e) {
      console.error(e);
    } finally {
      console.log(path.join(__dirname, "..", "/downloads.zip"));
      res.sendFile(path.join(__dirname, "..", "/downloads.zip"));
    }
  }
);
//csv to json route
const csv = require("csv-parser");

router.post("/csv/json", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).send("No file attached to request");
    return;
  }
  console.log(req.file.filename);
  let inputFile = req.file.path;
  let list = req.file.filename.split(".");
  let fileOutputName = list[0] + ".json";
  let newJson = csvToJson.getJsonFromCsv(inputFile);
  res.header("Content-Type", "application/json");
  res.status(200).json(newJson);
  //fs.unlinkSync(req.file.path);
});
router.get("/hi", async (req, res) => {
  console.log("test");
  return res.status(200).send("success");
});
const archiver = require("archiver");

function zipDirectory(source, out) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on("error", (err) => reject(err))
      .pipe(stream);

    stream.on("close", () => resolve());
    archive.finalize();
  });
}

const Jimp = require("jimp");

router.post("/png/jpg", upload.single("file"), async (req, res) => {
  var image = await Jimp.read("uploads/file.png");
  await image.write("new-image.jpg");
  res.sendFile(path.join(__dirname, "..", "/new-image.jpg"));
});

router.post("/jpg/png", upload.single("file"), async (req, res) => {
  console.log("test");
  try {
    var image = await Jimp.read("uploads/file.jpg");

    await image.write("new-image.png");
  } catch (e) {
    console.log(e);
  }

  res.sendFile(path.join(__dirname, "..", "/new-image.png"));
});

module.exports = router;
