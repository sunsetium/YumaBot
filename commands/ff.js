const Discord = require("discord.js");
const fs = require("fs");
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('ff');

module.exports.run = async (bot, msg, args) => {
    db.serialize(function() {
        db.run("CREATE TABLE [IF NOT EXISTS] users "
              + "userID INTEGER PRIMARY KEY,"
              + "status INTEGER,"
              + "blockID INTEGER");
      });
      
      db.close();
}

module.exports.help = {
    name: "ff"
}