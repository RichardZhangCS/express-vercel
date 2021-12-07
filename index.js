const express = require("express");
const app = express();
const product = require("./api/product");
const path = require("path");
const convertRouter = require("./routes/convert-routes");

app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: true }));
app.use("/convert", convertRouter);

app.use("/api/product", product);

app.use(express.static(path.join(__dirname, "public")));

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
