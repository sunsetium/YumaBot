const { match } = require("assert");
const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
var sqlite3 = require('sqlite3').verbose();

//TODO: Refactor setup.js so that it uses the config file.
//TODO: check for existing channel/role to avoid duplicates.
//TODO: Make it always listen even after going offline.

const roleName = 'Looking for Friend';
const botStartReaction = ['✅'];
const botStartMsg = `Friendfinder will match you with someone that has opted-in for the service in this server and direct message you the randomly matched person's discord handle.
\nIf you have already matched with a specific person, don't worry as you won't be matched with them again in this server.
\nReact with ${botStartReaction[0]} to get the Looking for friend role. This would be an opt-in for our friend finding service.
\nYou'll be receiving a direct message from the bot with the discord handle of the person you are paired with.`;

const botSetupMsg =     
`Welcome to the Friendship Finding feature:

[prefix]friendfinder setup <timer>

Yuma bot has now created a channel named #friend-finding and sent a message to the newly created channel with a reaction.
Users that react to this message will be opting-in to be paired with another user that has reacted to the message.
Every given time (timer can only be set in hours), users that are paired will receive a direct message with the other individuals Discord handle.
Yuma has created a role to users that are currently opted-in for the service.
Timer default is currently set to ${defaultTimer} seconds 
This will hopefully allow users to create meaningful friendships.`;

var roleID;
var specificMsgID;
var specificChannelID;
var interval;
var defaultTimer = "5";

botID = '670666579167412225';
roleIDAttribute = 'ffRoleID';
chIDAttribute = 'ffChannelID';
msgIDAttribute = 'ffMsgID';
var emote;

module.exports.run = async (bot, msg, args) => {
  if (!msg.member.hasPermission("MANAGE_SERVER")) return;
  if (!args[0] || args[0] === "help") return msg.reply("Usage: !friendfinder setup <time (In hours)>");

  if (args[0] == "setup") {

    if(!msg.author.bot)
    {
      await msg.channel.send(botSetupMsg);
    }

    var db = new sqlite3.Database(`./servers/${msg.guild.id}/${msg.guild.id}.db`);
    var fp = await `./servers/${msg.guild.id}/server_config.json`;

    await setupExists(fp, bot, msg, db);
    await listenFFReactions(bot, msg, db);
    await updateTimer(args, db)
    timerstuff(msg, bot)
  }

  if (args[0] == 'timer') {
    var db = new sqlite3.Database(`./servers/${msg.guild.id}/${msg.guild.id}.db`);
    defaultTimer = await updateTimer(args, db);
    timerstuff(msg, bot)
  }
}

const addReactions = (message, reactions) => {
  message.react(reactions[0]);
}

function sendPrivateMsg(user1, user2, bot, guild) {
  bot.users.fetch(user1, false).then((user) => {
    user.send(
`You have been matched with <@${user2}>, from ${guild.name}
If you would like to continue using this service, please re-react to the message in ${guild.name}`);
  });

  bot.users.fetch(user2, false).then((user) => {
    user.send(
`You have been matched with <@${user1}>, from ${guild.name}
If you would like to continue using this service, please re-react to the message in ${guild.name}`);
  });
}

async function timerstuff(msg, bot) {
  setInterval(() => {
    let currentTime = Date.now();
    var db = new sqlite3.Database(`./servers/${msg.guild.id}/${msg.guild.id}.db`);
    db.all(`SELECT timestamp, timerMillis
              FROM   timers`, [], (err, rows) => {
      if (err) throw err;
      console.log(Math.floor((currentTime - rows[0].timestamp)))
      if (Math.floor((currentTime - rows[0].timestamp)) >= rows[0].timerMillis) {
        db.run(`UPDATE timers SET timestamp = ${currentTime} WHERE timerID = 1`);
        matching(msg, db, bot)
      }
    })
  }, 1000);
}

async function updateTimer(args, db) {
  if (args[1] == null) {
    args[1] = defaultTimer;
  }
  args[1] = args[1] /** 3600*/ * 1000;
  db.all(`SELECT * FROM timers`, [], (err, rows) => {
    if (rows == null || rows.length == 0 && args[0] != 'timer') {
      db.run(`INSERT INTO timers (timestamp, timerMIllis)
              VALUES (${Date.now()}, ${args[1]})`)
    } else if (args[0] == 'timer') {
      db.run(`UPDATE timers
              SET timerMillis = ${args[1]},
                  timestamp = ${Date.now()}
              WHERE timerID = 1`)
    }
  })
}

async function matching(msg, db, bot) {
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
              console.log(`${msg.guild.id}::::::::${rows[i].userID} is matched with ${rows[i + 1].userID}`)
              updateUsers(rows[i].userID, rows[i + 1].userID, 0, db)
              addToHistory(rows[i].userID, rows[i + 1].userID, db)
              sendPrivateMsg(rows[i].userID, rows[i + 1].userID, bot, msg.guild)
            } else {
              updateUsers(rows[i].userID, rows[i + 1].userID, 2, db)
              console.log(`${msg.guild.id}::::::::${rows[i].userID} already mached with ${rows[i + 1].userID} send to priority queue`)
            }
          })
      } else {
        db.run(`UPDATE users 
                    SET    status = 2
                    WHERE  userID = '${rows[i].userID}'`)
        console.log(`${msg.guild.id}::::::::${rows[i].userID} is ignored, send to priority queue`)
      }
    }
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

    db.run(`CREATE TABLE IF NOT EXISTS timers(
                    timerID INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    timerMillis TEXT);`, [], (err) => {
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

function jsonFileUpdate(filepath, attribute, newVal) {
  let configFile = JSON.parse(fs.readFileSync(filepath, "utf8"));
  configFile[attribute] = newVal;
  fs.writeFileSync(filepath, JSON.stringify(configFile));
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
      jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, chIDAttribute, createdCh.id);
    })
}


function createFFMessage(bot, msg) {
  configFile = jsonFileReader(`./servers/${msg.guild.id}/server_config.json`);

  const channel = bot.guilds.cache.get(msg.guild.id).channels.cache.get(configFile[chIDAttribute]);
  //const checkChID = bot.channels.cache.get(configFile[chIDAttribute]);
  //let checkCh = msg.guild.channels.cache.find(channel => channel.id === checkChID);
  let newMsg = channel.send(botStartMsg)
    .then(async (newMsg) => {
      await jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, msgIDAttribute, newMsg.id);
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
      await jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, roleIDAttribute, roleCreated.id);
    })
}

async function listenFFReactions(bot, msg, db) {
  console.log(`${msg.guild.id}::::::::are you is here`);
  const handleReaction = async (reaction, user, add) => {
    if (user.id === botID) {
      return;
    }
    const emoji = await reaction._emoji.name;
    const { guild } = await reaction.message
    let configFile = await jsonFileReader(`./servers/${msg.guild.id}/server_config.json`);

    var role = await msg.guild.roles.cache.find(role => role.id === configFile[roleIDAttribute]);
    var member = await msg.guild.members.fetch(user.id);

    if (role == null) {
      console.log(`${msg.guild.id} role does not exist`);
    } else {
      if (add) {
        await member.roles.add(role)
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
        await member.roles.remove(role)
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

  }

  let configFile = await jsonFileReader(`./servers/${msg.guild.id}/server_config.json`);

  bot.on('messageReactionAdd', async (reaction, user) => {
    if (configFile[chIDAttribute] == reaction.message.channel.id) {
      handleReaction(reaction, user, true);
    }
  })

  bot.on('messageReactionRemove', async (reaction, user) => {
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
