const Discord = require("discord.js");
const fs = require("fs");
var sqlite3 = require('sqlite3').verbose();

module.exports.run = async (bot, msg, args) => {
    var db = new sqlite3.Database('ff.db');

    db.run("CREATE TABLE IF NOT EXISTS users("
            + "userID INTEGER PRIMARY KEY,"
            + "status INTEGER,"
            + "blockID INTEGER);");
            
   /* Before adding someone to db, check if they are in it or not, add if not
      Every 1hour query all users with status (priority) and check blocked/history
      then match 2 users together, add users to history db
            Select users.userid, histories.spokenToID from users 
            inner join histories on users.userid = histories.userID 
            where (users.userid = 4 or histories.spokenToID = 4) and (users.userid = 10 or histories.spokenToID = 10);

    CREATE blocked table, history Table, query by status and random
    var userID = 4;
    var status = 0;
    
    db.run(`INSERT INTO users VALUES(${userID}, ${status})`, function(err){
        if (err){
            return console.log(err.message);
        }
    });*/
    var currentUser;
    var buddyUser;
    db.all("select * from users where status != 0 order by status desc, random()",[], (err, rows) => {
        if (err){
            throw err
        }

        rows.forEach((row) => {
            currentUser = row.userid;
            buddyUser = row
        })
    });
    
    db.all("Select users.userid, histories.spokenToID from users inner join histories on users.userid = histories.userID",[], (err, rows) => {
        if (err){
            throw err
        }

        rows.forEach((row) => {
            var user = row.userid;
            var spokenTo = row.spokenToID;
            

            
        })
    });

    db.close();
}

module.exports.help = {
    name: "ff"
}