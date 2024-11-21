const AppError = require("../utils/appError");
const conn = require("../services/db");

exports.getAllComments = (req, res, next) => {
    conn.query("SELECT * FROM comments", function (err, data, fields) {
      if(err) return next(new AppError(err))
      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data,
      });
    });
   };

exports.createComment = (req, res, next) => {
    if (!req.body) return next(new AppError("No form data found", 404));

    const { idUser, idRecipe, text} = req.body;

    conn.query(
    "INSERT INTO comments (idUser, idRecipe, text) VALUES (?, ?, ?)",
    [idUser, idRecipe, text],
    function (err, data, fields) {
        if (err) return next(new AppError(err, 500));
        res.status(201).json({
        status: "success",
        message: "Comment created!",
        });
    }
    );
};

/* Get all the comments of the recipe using the idRecipe */
exports.getAllCommentsByRecipeId = (req, res, next) => {
    if (!req.params.id) {
      return next(new AppError("No recipe id found", 404));
    }
    conn.query(
      "SELECT * FROM comments WHERE idRecipe = ?",
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

/* Update the comment by Id*/
exports.updateComment = (req, res, next) => {
    const { id } = req.params;
    const { idUser, idRecipe, text} = req.body;

    if (!req.params.id) {
        return next(new AppError("No comment id found", 404));
    }

    conn.query(
    "UPDATE comments SET idUser = ?, idRecipe = ?, text = ? WHERE id = ?",
    [idUser, idRecipe, text, id],
    function (err, data, fields) {
        if (err) return next(new AppError(err, 500));
        
        res.status(201).json({
        status: "success",
        message: "comment updated!",
        });
    }
    );
};

exports.deleteComment = (req, res, next) => {
    if (!req.params.id) {
      return next(new AppError("No comment id found", 404));
    }
    conn.query(
      "DELETE FROM comments WHERE id=?",
      [req.params.id],
      function (err, fields) {
        if (err) return next(new AppError(err, 500));
        res.status(201).json({
          status: "success",
          message: "comment deleted!",
        });
      }
    );
   }