const Discord = require("discord.js");
const fs = require("fs");
var sqlite3 = require('sqlite3').verbose();

module.exports.run = async (bot, msg, args) => {
    var db = new sqlite3.Database('ff.db');

    db.run("CREATE TABLE IF NOT EXISTS users("
            + "userID INTEGER PRIMARY KEY,"
            + "status INTEGER,"
            + "blockID INTEGER);");
            
    var userID = 2;
    var status = 2;
    var blockID = 3;
    db.run(`INSERT INTO users VALUES(${userID}, ${status}, ${blockID})`, function(err){
        if (err){
            return console.log(err.message);
        }
    });
    
    db.all("Select * from users",[], (err, rows) => {
        if (err){
            throw err
        }

        rows.forEach((row) => {
            console.log(row)
        })
    });

    db.close();
}

module.exports.help = {
    name: "ff"
}