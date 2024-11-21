const express = require("express");
const userController = require("../controllers/userController");
const recipeController = require("../controllers/recipeController");
const commentController = require("../controllers/commentController");
const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: 'uploads/' }); // Configuração do multer com pasta temporária

/* User Routes (CRUD) */
router.route("/users").get(userController.getAllUsers).post(userController.createUser);
router
 .route("/users/:id")
 .get(userController.getUser)
 .put(userController.updateUser)
 .delete(userController.deleteUser);


/* Recipe Routes (CRUD) */
router.route("/recipes")
    .get(recipeController.getAllRecipes)
    .post(upload.single("image"), recipeController.createRecipe);  // Adding multer to recipe creation (manipulate image)
router
    .route("/recipes/:id")
    .get(recipeController.getRecipe)
    .put(upload.single("image"), recipeController.updateRecipe)  // Adding multer on recipe update
    .delete(recipeController.deleteRecipe);

/* Favorite Recipes */
router.route("/favorites")
    .post(recipeController.addFavorite)
    .put(recipeController.removeFavorite);
router.route("/favorites/:id").get(recipeController.getAllFavoritesRecipes)

 /* Comment Routes (CRUD) */
router.route("/comments").get(commentController.getAllComments).post(commentController.createComment);
router
 .route("/comments/:id")
 .get(commentController.getAllCommentsByRecipeId)
 .put(commentController.updateComment)
 .delete(commentController.deleteComment);


 module.exports = router;