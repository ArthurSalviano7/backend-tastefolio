const AppError = require("../utils/appError");
const conn = require("../services/db");
const fs = require('fs');
const { google } = require('googleapis');
const multer = require('multer');
const util = require("util"); // Para usar promisify no MySQL
require("dotenv").config()

const SCOPE = ['https://www.googleapis.com/auth/drive'];

// A Function that can provide access to google drive api
async function authorize() {
    const jwtClient = new google.auth.JWT(
        process.env.CLIENT_EMAIL,
        null,
        process.env.PRIVATE_KEY,
        SCOPE
    );
    await jwtClient.authorize();
    return jwtClient;
}

async function uploadFileToDrive(authClient, file) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const fileMetaData = {
        name: file.originalname,
        parents: [process.env.FOLDER_ID] // The folder ID on google drive
    };
    const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path)
    };

    const response = await drive.files.create({
        resource: fileMetaData,
        media: media,
        fields: 'id'
    });
    
    const fileId = response.data.id;
    
    // Modifying public permission of the image
    await drive.permissions.create({
      fileId: fileId,
      resource: {
          role: 'reader', // Define reading permission
          type: 'anyone', // Anyone can view the file
      },
    });
    fs.unlinkSync(file.path); // Remove the temporary file after upload
    
    return fileId;
}

exports.getAllRecipes = (req, res, next) => {
    conn.query("SELECT * FROM recipes", function (err, data, fields) {
      if(err) return next(new AppError(err))
      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data,
      });
    });
   };

exports.addFavorite = (req, res, next) => {
  const { idUser, idRecipe } = req.body;

  conn.query("INSERT INTO user_favorite_recipe (idUser, idRecipe) VALUES (?, ?)",
    [idUser, idRecipe], 
    function (err, data, fields) {
    if (err) return next(new AppError(err))
    res.status(200).json({
      status: "success",
      length: data?.length,
      data: data,
    });
  });
};

exports.removeFavorite = (req, res, next) => {
  const { idUser, idRecipe } = req.body;

  conn.query(
    "DELETE FROM user_favorite_recipe WHERE idUser = ? AND idRecipe = ?",
    [idUser, idRecipe],
    (err, result) => {
      if (err) {
        return next(new AppError(err.message, 500));
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: "fail",
          message: "Favorito não encontrado.",
        });
      }

      res.status(200).json({
        status: "success",
        message: "Favorito removido com sucesso.",
      });
    }
  );
};

exports.getAllFavoritesRecipes = (req, res, next) => {
  if (!req.params.id) {
    return next(new AppError("No user id found", 404));
  }

  conn.query("SELECT * FROM user_favorite_recipe WHERE idUser=?",
    [req.params.id], 
    function (err, data, fields) {
    if (err) return next(new AppError(err))
    res.status(200).json({
      status: "success",
      length: data?.length,
      data: data,
    });
  });
};

exports.createRecipe = async (req, res, next) => {
    console.log("Arquivo recebido:", req.file); // Log da imagem recebida
    console.log("Dados recebidos:", req.body);
    if (!req.body) return next(new AppError("No form data found", 404));
    if (!req.file) return next(new AppError("No image file uploaded", 400));

    const { idUser, recipeName, ingredients, method, foodType,
        prepTime, difficulty} = req.body;

    try{
      const authClient = await authorize();
        const fileId = await uploadFileToDrive(authClient, req.file);
        const imageURL = `https://drive.google.com/uc?export=view&id=${fileId}`;
        
        // Insere os dados da receita no banco
        conn.query(
            "INSERT INTO recipes (idUser, recipeName, ingredients, method, foodType, prepTime, difficulty, imageURL) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [idUser, recipeName, ingredients, method, foodType, prepTime, difficulty, imageURL],
            function (err, data) {
                if (err) return next(new AppError(err, 500));
                res.status(201).json({
                    status: "success",
                    message: "Recipe created!",
                    imageURL: imageURL
                });
            }
        );
    }catch (error) {
      next(new AppError(error.message, 500));
  }
    
};

exports.getRecipe = (req, res, next) => {
    if (!req.params.id) {
      return next(new AppError("No recipe id found", 404));
    }
    conn.query(
      "SELECT * FROM recipes WHERE id = ?",
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

exports.updateRecipe = async (req, res, next) => {
    console.log("Arquivo recebido:", req.file);  
    console.log("Dados recebidos:", req.body);

    const { idUser, recipeName, ingredients, method, foodType, prepTime, difficulty, imageURL } = req.body;
    const { id } = req.params;

    if (!idUser) return next(new AppError("idUser is required", 400));

    try {    
        let newImageURL = null;    
        // Se houver um arquivo, exclui a antiga e envie a nova imagem para o Google Drive
        if (req.file) {
            const fileId = extractFileIdFromURL(imageURL); // Função para extrair o ID do arquivo do URL (Google Drive)
                  
            if (fileId) {
                await deleteFileFromDrive(fileId); // Função para excluir o arquivo do Google Drive
            }

            const authClient = await authorize();
            const newFileId = await uploadFileToDrive(authClient, req.file);
            newImageURL = `https://drive.google.com/uc?export=view&id=${newFileId}`;
        }

        // Atualize os dados da receita no banco de dados
        const query = `
            UPDATE recipes
            SET idUser = ?, recipeName = ?, ingredients = ?, method = ?, foodType = ?, prepTime = ?, difficulty = ?, imageURL = ?
            WHERE id = ?
        `;
        const params = [idUser, recipeName, ingredients, method, foodType, prepTime, difficulty, newImageURL || null, id];

        conn.query(query, params, (err, result) => {
            if (err) return next(new AppError(err.message, 500));

            if (result.affectedRows === 0) {
                return next(new AppError("Recipe not found", 404));
            }

            res.status(200).json({
                status: "success",
                message: "Recipe updated successfully!",
                data: { id, idUser, recipeName, ingredients, method, foodType, prepTime, difficulty, newImageURL }
            });
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

exports.deleteRecipe = async (req, res, next) => {
    if (!req.params.id) {
      return next(new AppError("No recipe id found", 404));
    }
    const query = util.promisify(conn.query).bind(conn);

    /* Query to get imageURL and delete the image from drive folder */
    try{
      const result = await query("SELECT imageURL FROM recipes WHERE id=?", [req.params.id]);
      if (result.length === 0) {
        return next(new AppError("Recipe not found", 404));
      }
  
      const imageURL = result[0]?.imageURL;
  
      if (imageURL) {
        try {
          const fileId = extractFileIdFromURL(imageURL);
          if (fileId) {
            await deleteFileFromDrive(fileId);
          }
        } catch (err) {
          console.error("Error during file deletion:", err);
          return next(new AppError("Failed to delete file from Drive", 500));
        }
      }


      /* Query to delete recipe from database */
      await query("DELETE FROM recipes WHERE id=?", [req.params.id]);

      res.status(201).json({
      status: "success",
      message: "Recipe deleted!",
    });

    }catch (err) {
      console.error("Error while deleting recipe:", err);
      return next(new AppError("Failed to delete recipe", 500));
  }
}
  
// Function to extract fileId from imageURL(Ex: https://drive.google.com/uc?export=view&id=A8NnEF   ==>  id=A8NnEF)
function extractFileIdFromURL(imageURL) {
  const regex = /id=([^&]+)/;
  const match = imageURL.match(regex);
  return match ? match[1] : null;
}

// Function to delete the file from the drive folder by id
async function deleteFileFromDrive(fileId) {
  try {
      const authClient = await authorize();
      const drive = google.drive({ version: 'v3', auth: authClient });
      await drive.files.delete({ fileId });
      console.log(`File with ID ${fileId} deleted from Google Drive`);
  } catch (error) {
      console.error("Error deleting file from Google Drive:", error);
  }
}