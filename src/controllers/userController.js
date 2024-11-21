const AppError = require("../utils/appError");
const conn = require("../services/db");
const util = require("util"); // Para usar promisify no MySQL

exports.getAllUsers = (req, res, next) => {
    conn.query("SELECT * FROM users", function (err, data, fields) {
      if(err) return next(new AppError(err))
      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data,
      });
    });
   };

exports.createUser = async (req, res, next) => {
    if (!req.body) return next(new AppError("No form data found", 404));

    const { name, nickname, email, password } = req.body;

    const query = util.promisify(conn.query).bind(conn);

    // Verify if email is already registered 
    try {
      const results = await query("SELECT email FROM users WHERE email = ?", [email]);
      
      if (results.length > 0) {
          // E-mail already registered
          return res.status(400).json({
              status: 400,
              message: "E-mail já cadastrado. Tente outro.",
          });
      }

      // If not, create the user 
      const data = await query("INSERT INTO users (name, nickname, email, password) VALUES (?, ?, ?, ?)", 
          [name, nickname, email, password]);
      
      res.status(201).json({
          status: "success",
          message: "User created!",
          data: {
              id: data.insertId, // ID do usuário criado
          },
      });
    
  }catch (err) {
    console.error("Error while creating user:", err);
    return next(new AppError("Failed to create user", 500));
}
};

exports.getUser = (req, res, next) => {
    if (!req.params.id) {
      return next(new AppError("No user id found", 404));
    }
    conn.query(
      "SELECT * FROM users WHERE id = ?",
      [req.params.id],
      function (err, data, fields) {
        if (err) return next(new AppError(err, 500));
        res.status(200).json({
          status: "success",
          length: data?.length,
          data: data,
        });
      }
    );
   };

exports.updateUser = (req, res, next) => {
    const { id } = req.params;
    const { name, nickname, email, password } = req.body;

    if (!req.params.id) {
        return next(new AppError("No user id found", 404));
    }
    conn.query(
    "UPDATE users SET name = ?, nickname = ?, email = ?, password = ? WHERE id = ?",
    [name, nickname, email, password, id],
    function (err, data, fields) {
        if (err) return next(new AppError(err, 500));
        
        res.status(201).json({
        status: "success",
        message: "user updated!",
        });
    }
    );
};

exports.deleteUser = (req, res, next) => {
    if (!req.params.id) {
      return next(new AppError("No user id found", 404));
    }
    conn.query(
      "DELETE FROM users WHERE id=?",
      [req.params.id],
      function (err, fields) {
        if (err) return next(new AppError(err, 500));
        res.status(201).json({
          status: "success",
          message: "User deleted!",
        });
      }
    );
   }