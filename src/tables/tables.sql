/*
    Arquivo para criação das tabelas da aplicação, as tabelas 
    devem ser criadas em um database "tastefolio_database"
*/

/* TABELA DE USUARIOS*/
CREATE TABLE users(id int NOT NULL AUTO_INCREMENT,
name varchar(50) NOT NULL, 
nickname varchar(50), 
email varchar(320) NOT NULL,
password varchar(50) NOT NULL,
PRIMARY KEY (id));

/* TABELA DE RECEITAS*/
CREATE TABLE recipes(id int NOT NULL AUTO_INCREMENT,
idUser int NOT NULL,
recipeName varchar(50) NOT NULL, 
ingredients varchar(500), 
method varchar(2500) NOT NULL,
foodType varchar(50) NOT NULL,
prepTime varchar(20) NOT NULL,
difficulty varchar(20),
imageURL varchar(500) NOT NULL,
PRIMARY KEY (id),
FOREIGN KEY (idUser) REFERENCES users(id));

/* TABELA DE COMENTARIOS*/
CREATE TABLE comments(id int NOT NULL AUTO_INCREMENT,
idUser int NOT NULL,
idRecipe int NOT NULL,
text varchar(200) NOT NULL,
createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (id),
FOREIGN KEY (idUser) REFERENCES users(id),
FOREIGN KEY (idRecipe) REFERENCES recipes(id));

/* TABELA DE FAVORITOS*/
CREATE TABLE user_favorite_recipe(
idUser int NOT NULL,
idRecipe int NOT NULL,
FOREIGN KEY (idUser) REFERENCES users(id),
FOREIGN KEY (idRecipe) REFERENCES recipes(id),
CONSTRAINT unique_user_recipe UNIQUE (idUser, idRecipe));