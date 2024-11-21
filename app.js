const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const router = require("./src/routes");
const AppError = require("./src/utils/appError");
const errorHandler = require("./src/utils/errorHandler");
require("dotenv").config()

const app = express();

app.use(cors());
app.use(express.json()); // Middleware para processar JSON no corpo da requisição
app.use(router);

app.all("*", (req, res, next) => {
 next(new AppError(`O URL ${req.originalUrl} não existe`, 404));
});
app.use(errorHandler);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: "error", message: err.message });
});


const PORT = 8080;
app.listen(PORT, () => {
    console.log("vaarivel teste =", process.env.TESTE)
});


module.exports = app;