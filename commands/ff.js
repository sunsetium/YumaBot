const Discord = require("discord.js");
const fs = require("fs");
const { resolve } = require("path");
var sqlite3 = require('sqlite3').verbose();
let stuff = true;

module.exports.run = async (bot, msg, args) => {
    if(!msg.member.hasPermission("MANAGE_SERVER")) return;
    var db = new sqlite3.Database(`ff.db`);
    let hasFF = JSON.parse(fs.readFileSync(`./servers/${msg.guild.id}/server_config.json`, "utf8"));

    if (!hasFF.ffChannelID) {
        db.run(`CREATE TABLE IF NOT EXISTS users(
                    userID INTEGER PRIMARY KEY,
                    status INTEGER);`, [], (err) => {
            if (err) console.log(err)
        });

        db.run(`CREATE TABLE IF NOT EXISTS histories(
                    historyID INTEGER PRIMARY KEY AUTOINCREMENT,
                    userID INTEGER,
                    spokenToID INTEGER);`, [], (err) => {
            if (err) console.log(err)
        });
    }

    /*if (REACTED WITH EMOJI) {
        db.all(`SELECT userID 
                FROM   users 
                WHERE  userID=${userID}`, [], (err, rows) => {
            if (rows.length == 0) {
                db.run(`INSERT INTO users VALUES(${userID}, 1)`)
            } else {
                db.run(`UPDATE users 
                        SET    status = 1 
                        WHERE  userID=${userID}`)
            }
        })
    } else{
        db.all(`SELECT userID 
                FROM   users 
                WHERE  userID=${userID}`, [], (err, rows) => {
            if (rows.length != 0) {
                db.run(`UPDATE users 
                        SET    status = 0 
                        WHERE  userID=${userID}`)
            }
        })
    }*/

    //let duration = GET FROM ARGUMENTS
    setTimeout(() => {
        db.all(`SELECT * 
                FROM   users 
                WHERE  status != 0 
                ORDER  BY status DESC,
                          random()`, [], (err, rows) => {
            if (err) throw err;

            for (let i = 0; i < rows.length; i += 2) {
                if (rows[i + 1]) {
                    Promise.all([checkHistory(rows[i].userID, rows[i + 1].userID, db)])
                        .then((talkedTo) => {
                            if (!talkedTo[0]) {
                                updateUsers(rows[i].userID, rows[i + 1].userID, 0, db)
                                addToHistory(rows[i].userID, rows[i + 1].userID, db)
                                console.log(`${rows[i].userID} is matched with ${rows[i + 1].userID}`)
                            } else {
                                updateUsers(rows[i].userID, rows[i + 1].userID, 2, db)
                                console.log(`${rows[i].userID} already mached with ${rows[i + 1].userID} send to priority queue`)
                            }
                        })
                } else {
                    db.run(`UPDATE users 
                            SET    status = 2
                            WHERE  userID = ${rows[i].userID}`)
                    console.log(`${rows[i].userID} is ignored, send to priority queue`)
                }
            }
        });
        db.close();
    }, duration);
}

// Checks if a user as already spoken to another user
function checkHistory(user1, user2, db) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT     users.userid,
                           histories.spokentoid
                FROM       users
                INNER JOIN histories
                ON         users.userid = histories.userid
                WHERE      (
                                       users.userid = ${user1}
                           OR          histories.spokentoid = ${user1})
                AND        (
                                       users.userid = ${user2}
                            OR         histories.spokentoid = ${user2});`, [], (err, rows) => {
            if (err) throw err;

            if (rows.length == 0) {
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}

// Updates the users statuts when they are matched
function updateUsers(user1, user2, status, db) {
    db.run(`UPDATE users 
            SET    status = 
                   CASE userID 
                          WHEN ${user1} THEN ${status} 
                          WHEN ${user2} THEN ${status} 
                    END 
            WHERE   userID IN (${user1},${user2});`)
}

// Adds the users to the histories table
function addToHistory(user1, user2, db) {
    db.run(`INSERT INTO histories (userID, spokentoID)
            VALUES (${user1}, ${user2});`);
}

module.exports.help = {
    name: "ff"
}