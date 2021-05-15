//const { ENOTEMPTY } = require("constants");
//const { createDiffieHellman } = require("crypto");
const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
//const { userInfo } = require("os");
//const { config } = require("process");
var sqlite3 = require('sqlite3').verbose();

//TODO: Refactor setup.js so that it uses the config file.
//TODO: check for existing channel/role to avoid duplicates.
//TODO: Make it always listen even after going offline.

const roleName = 'Looking for Friend';
const botStartMsg = "Friendship ;-; plz";
const botStartReaction = ['✅'];
var roleID;
var specificMsgID;
var specificChannelID;

botID = '670666579167412225';
roleIDAttribute = 'ffRoleID';
chIDAttribute = 'ffChannelID';
msgIDAttribute = 'ffMsgID';
var emote;

module.exports.run = async (bot, msg, args) => {
  if (!msg.member.hasPermission("MANAGE_SERVER")) return;
  if (!args[0] || args[0] === "help") return msg.reply("Usage: !friendfinder setup <time>[D|H|M|S]");

  if (args[0] == "setup") {
    var db = new sqlite3.Database(`./servers/${msg.guild.id}/${msg.guild.id}.db`);
    var fp = await `./servers/${msg.guild.id}/server_config.json`;

    await setupExists(fp, bot, msg, db);
    await listenFFReactions(bot, msg, db);

    const MILLISECONDS = 1000;
    var time = await args[0].substr(0, args[0].length - 1);
    var duration;

    if (args[0].match(/d/gi)) {
      duration = time * 86400 * MILLISECONDS;
    } else if (args[0].match(/h/gi)) {
      duration = time * 3600 * MILLISECONDS;
    } else if (args[0].match(/m/gi)) {
      duration = time * 60 * MILLISECONDS;
    } else {
      duration = time * MILLISECONDS;
    }

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
                  console.log(`${rows[i].userID} is matched with ${rows[i + 1].userID}`)
                  updateUsers(rows[i].userID, rows[i + 1].userID, 0, db)
                  addToHistory(rows[i].userID, rows[i + 1].userID, db)
                  sendPrivateMsg(rows[i].userID, rows[i + 1].userID, bot)
                } else {
                  updateUsers(rows[i].userID, rows[i + 1].userID, 2, db)
                  console.log(`${rows[i].userID} already mached with ${rows[i + 1].userID} send to priority queue`)
                }
              })
          } else {
            db.run(`UPDATE users 
                    SET    status = 2
                    WHERE  userID = '${rows[i].userID}'`)
            console.log(`${rows[i].userID} is ignored, send to priority queue`)
          }
        }
      });
    }, 500);

  }
}

const addReactions = (message, reactions) => {
  message.react(reactions[0]);
}

function sendPrivateMsg(user1, user2, bot){
  bot.users.fetch(user1, false).then((user) => {
    user.send(`<@${user2}> is your new best friend`);
  });

  bot.users.fetch(user2, false).then((user) => {
    user.send(`<@${user1}> is your new best friend`);
  });
}

//check if setup was already used and is still valid/not deleted
async function setupExists(filepath, bot, msg, db) {
  let configFile = await JSON.parse(fs.readFileSync(filepath, "utf8"));
  const checkRole = await msg.guild.roles.cache.find(role => role.id === configFile[roleIDAttribute]);
  var checkMsg = null;

  if (!configFile[chIDAttribute]) {
    db.run(`CREATE TABLE IF NOT EXISTS users(
                    userID TEXT PRIMARY KEY,
                    status TEXT);`, [], (err) => {
      if (err) console.log(err)
    });

    db.run(`CREATE TABLE IF NOT EXISTS histories(
                    historyID INTEGER PRIMARY KEY AUTOINCREMENT,
                    userID TEXT,
                    spokenToID TEXT);`, [], (err) => {
      if (err) console.log(err)
    });
  }

  if (checkRole == null) {
    await createFFRole(bot, msg, []);
  }

  const checkCh = await bot.guilds.cache.get(msg.guild.id).channels.cache.get(configFile[chIDAttribute]);

  if (checkCh != null) {
    checkMsg = await checkCh.messages.fetch(configFile[msgIDAttribute])
      .catch((checkMsg) => {
        return null;
      });
  }

  if (checkCh == null) {
    await createFFChannel(bot, msg);
    await createFFMessage(bot, msg);
  }
  else if (!checkMsg) {
    await createFFMessage(bot, msg);
  }
  else if (checkMsg) {
    const checkReact = await checkMsg.reactions.cache.find(react => react.name == botStartReaction[0]);
    if (checkReact == null) {
      await addReactions(checkMsg, botStartReaction);
    }

  }
}

function jsonFileUpdate(filepath, attribute, newVal, msg) {
  let configFile = JSON.parse(fs.readFileSync(filepath, "utf8"));
  configFile[attribute] = newVal;
  fs.writeFileSync(`./servers/${msg.guild.id}/server_config.json`, JSON.stringify(configFile));
}

function jsonFileReader(filepath) {
  let configFile = JSON.parse(fs.readFileSync(filepath, "utf8"));
  return configFile;
}

function jsonFileAddServerID(filepath, attribute, newVal, msg) {
  let configFile = JSON.parse(fs.readFileSync(filepath, "utf8"));
  configFile[attribute] = newVal;
  fs.writeFileSync(`./servers/${msg.guild.id}/server_config.json`, JSON.stringify(configFile));
}

async function createFFChannel(bot, msg) {
  const createdCh = await msg.guild.channels.create('friend-finding')
    .then((createdCh) => {
      jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, chIDAttribute, createdCh.id, msg);
    })
}


function createFFMessage(bot, msg) {
  configFile = jsonFileReader(`./servers/${msg.guild.id}/server_config.json`);

  const channel = bot.guilds.cache.get(msg.guild.id).channels.cache.get(configFile[chIDAttribute]);
  //const checkChID = bot.channels.cache.get(configFile[chIDAttribute]);
  //let checkCh = msg.guild.channels.cache.find(channel => channel.id === checkChID);
  let newMsg = channel.send(botStartMsg)
    .then(async (newMsg) => {
      await jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, msgIDAttribute, newMsg.id, msg);
      await addReactions(newMsg, botStartReaction);
    })
}

function createFFRole(bot, msg) {
  var roleCreated = msg.guild.roles.create({
    data: {
      name: roleName,
    },
    reason: 'We need a role for those that want to participate.'
  })
    .then(async (roleCreated) => {
      await jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, roleIDAttribute, roleCreated.id, msg);
    })
}

function listenFFReactions(bot, msg, db) {
  const handleReaction = (reaction, user, add) => {
    if (user.id === botID) {
      return;
    }
    const emoji = reaction._emoji.name;
    const { guild } = reaction.message
    configFile = jsonFileReader(`./servers/${msg.guild.id}/server_config.json`);

    const role = guild.roles.cache.find(role => role.id === configFile[roleIDAttribute])
    const member = guild.members.cache.find(member => member.id === user.id);

    if (role == null) {
      console.log('role does not exist');
    }
    if (add) {
      member.roles.add(role);
      db.all(`SELECT userID 
              FROM   users 
              WHERE  userID=${user.id}`, [], (err, rows) => {
        if (rows.length == 0) {
          db.run(`INSERT INTO users VALUES(${user.id}, 1)`)
        } else {
          db.run(`UPDATE users 
                        SET    status = 1 
                        WHERE  userID=${user.id}`)
        }
      })
    }
    else {
      member.roles.remove(role);
      db.all(`SELECT userID 
                FROM   users 
                WHERE  userID='${user.id}'`, [], (err, rows) => {
        if (rows.length != 0) {
          db.run(`UPDATE users 
                        SET    status = 0 
                        WHERE  userID='${user.id}'`)
        }
      })
    }

  }

  configFile = jsonFileReader(`./servers/${msg.guild.id}/server_config.json`);

  bot.on('messageReactionAdd', (reaction, user) => {
    if (configFile[chIDAttribute] == reaction.message.channel.id) {
      handleReaction(reaction, user, true);
    }
  })

  bot.on('messageReactionRemove', (reaction, user) => {
    if (configFile[chIDAttribute] == reaction.message.channel.id) {
      handleReaction(reaction, user, false);
    }
  })
}

// Checks if a user as already spoken to another user
function checkHistory(user1, user2, db) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT       users.userid,
                         histories.spokentoid
              FROM       users
              INNER JOIN histories
              ON         users.userid = histories.userid
              WHERE      (
                                     users.userid = '${user1}'
                         OR          histories.spokentoid = '${user1}')
              AND        (
                                     users.userid = '${user2}'
                          OR         histories.spokentoid = '${user2}');`, [], (err, rows) => {
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
                        WHEN '${user1}' THEN ${status} 
                        WHEN '${user2}' THEN ${status} 
                  END 
          WHERE   userID IN ('${user1}','${user2}');`)
}

// Adds the users to the histories table
function addToHistory(user1, user2, db) {
  db.run(`INSERT INTO histories (userID, spokentoID)
          VALUES ('${user1}', '${user2}');`);
}

module.exports.help = {
  name: "friendfinder"
}
