CREATE DATABASE IF NOT EXISTS simworld;
CREATE USER IF NOT EXISTS 'simuser'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON simworld.* TO 'simuser'@'localhost';
FLUSH PRIVILEGES;
