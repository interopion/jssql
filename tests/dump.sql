-- This file creates the database for testing
-- and inserts data into it
-- -----------------------------------------------------------------------------

-- Create database 
DROP DATABASE IF NOT EXISTS test ;

CREATE DATABASE test DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;

USE test;

-- Create table "users" 
DROP TABLE IF EXISTS users;
CREATE TABLE users (
	id   INTEGER AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR NOT NULL UNIQUE,
	type VARCHAR NULL DEFAULT "co-worker"
);

-- Create table "notes" 
DROP TABLE IF EXISTS notes;
CREATE TABLE notes (
	id int(11) NOT NULL AUTO_INCREMENT,
	user_id INTEGER NULL,
	date    DATE DEFAULT 0,
	txt     VARCHAR NOT NULL
);

-- Insert data into the "users" table
INSERT INTO users (name, type) VALUES
	("Vladimir", "author"   ),
	("Nikolai" , "boss"     ),
	("Vasil"   , "co-worker"),
	("Iva"     , "co-worker"),
	("Ilia"                 );

-- Insert data into the "notes" table
INSERT INTO notes (id, user_id, date, txt) VALUES
	(1, 1, 1401449039338, "This is a test note from Vladimir 1"),
	(2, 1, 1401449039338, "This is a test note from Vladimir 2"),
	(3, 2, 1401449039338, "This is a test note from Nikolai 1" ),
	(4, 2, 0            , "This is a test note from Nikolai 2" ),
	(5, 3, 333          , "This is a test note from Vasil 1"   ),
	(6, 3, 0            , "This is a test note from Vasil 2"   ),
	(7, 3, 0            , "This is a test note from Vasil 3"   ),
	(8, 9, 0            , "This is a test note from Jonh Doe"  );
