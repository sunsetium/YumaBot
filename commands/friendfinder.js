const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
var sqlite3 = require('sqlite3').verbose();
var jsonManip = require('../tools/json_manipulation.js');

const roleName = 'Looking for Friend';
const botStartReaction = ['✅'];
var defaultTimer = '5';
const botStartMsg =
`>>> Friendfinder will match you with someone that has opted-in for the service in this server and direct message you the randomly matched person's discord handle.

If you have already matched with a specific person, don't worry as you won't be matched with them again in this server.

React with :white_check_mark: to get the Looking for friend role. This would be an opt-in for our friend finding service.

You'll be receiving a direct message from the bot with the discord handle of the person you are paired with`;

const botSetupMsg =
`>>> Welcome to the Friendship Finding feature:

[prefix]friendfinder setup <timer>

This feature allows users within your discord community to connect with each other. Once a user opts-in, they get randomly matched with another user from your Discord Community.
Yuma keeps a history of users matched, so they do not end up matching with the same person more than once.

Yuma bot has now created a channel named #friend-finding and a Looking for Friend role, and it has sent a message to the newly created channel with a reaction.
Users that react to this message will be opting-in to be paired with another user that has reacted to the message.
Every given time (timer can only be set in hours), users that are paired will receive a direct message with the other individuals Discord handle.
Yuma has created a role to users that are currently opted-in for the service.
Timer default is currently set to ${defaultTimer} hour 
This will hopefully allow users to create meaningful friendships.

You may rename the friend-finding channel name and the Looking for Friend role name. However, please refrain from deleting the channels manually.

You may end the friendfinder feature by typing

[prefix]friendfinder end

This will delete the message created by the bot, the role, and the channel. However, it will keep the history of the users that have been matched in the past.
You may enable the feature once again by using the: [prefix]friendfinder setup <timer> command.`;

botID = '670666579167412225';
roleIDAttribute = 'ffRoleID';
chIDAttribute = 'ffChannelID';
msgIDAttribute = 'ffMsgID';
isUsingFFAttribute = 'isUsingFF';

// Main function that will run
module.exports.run = async (bot, msg, args) => {
  if (!msg.member.hasPermission("MANAGE_SERVER")) return;
  if (!args[0] || args[0] === "help") return msg.reply("Usage: !friendfinder setup <time (In hours)>");

  if (args[0] == "setup") {

    if (!msg.author.bot) {
      await msg.channel.send(botSetupMsg);
    }

    var db = new sqlite3.Database(`./servers/${msg.guild.id}/${msg.guild.id}.db`);
    var fp = await `./servers/${msg.guild.id}/server_config.json`;
    jsonManip.jsonFileUpdate(fp, isUsingFFAttribute, true);

    await setupExists(fp, bot, msg, db);
    await listenFFReactions(bot, msg, db);
    await updateTimer(args, db)
    timerstuff(msg, bot, args)
  }
  if (args[0] == 'timer') {
    var db = new sqlite3.Database(`./servers/${msg.guild.id}/${msg.guild.id}.db`);
    await updateTimer(args, db);
  }
  if (args[0] == 'end') {
    var fp = await `./servers/${msg.guild.id}/server_config.json`;
    var db = new sqlite3.Database(`./servers/${msg.guild.id}/${msg.guild.id}.db`);
    await jsonManip.jsonFileUpdate(fp, isUsingFFAttribute, false);
    var configFile = await jsonManip.jsonFileReader(fp);
    const channel = await bot.guilds.cache.get(msg.guild.id).channels.cache.get(configFile[chIDAttribute]);
    var role = await msg.guild.roles.cache.find(role => role.id === configFile[roleIDAttribute]);
    channel.delete();
    role.delete();
    await jsonManip.jsonFileUpdate(fp, chIDAttribute, null);
    await jsonManip.jsonFileUpdate(fp, msgIDAttribute, null);
    await jsonManip.jsonFileUpdate(fp, roleIDAttribute, null);
    db.run(`UPDATE users SET status = 0 WHERE userID >= 1`);
    db.close();
  }
}

// Adds reaction to the main message
const addReactions = (message, reactions) => {
  message.react(reactions[0]);
}

// Sends a private message to both users who were matched
function sendPrivateMsg(user1, user2, bot, guild) {
  bot.users.fetch(user1, false).then((user) => {
    user.send(
`>>> You have been matched with <@${user2}>, from ${guild.name}
In order to speak with them you must send them a message.
If you would like to continue using this service, please re-react to the message in ${guild.name}`);
  });

  bot.users.fetch(user2, false).then((user) => {
    user.send(
`>>> You have been matched with <@${user1}>, from ${guild.name}
In order to speak with them you must send them a message.
If you would like to continue using this service, please re-react to the message in ${guild.name}`);
  });
}

// Will keep checking if its time to match every 1 hour
async function timerstuff(msg, bot) {
  var interval = setInterval(() => {
    var db = new sqlite3.Database(`./servers/${msg.guild.id}/${msg.guild.id}.db`);
    var fp = `./servers/${msg.guild.id}/server_config.json`;
    if(fs.existsSync(fp)){
      var json = jsonManip.jsonFileReader(fp);
      if (!json[isUsingFFAttribute]) {
        clearInterval(interval);
      }
    }else{
      clearInterval(interval);
    }
    let currentTime = Date.now();
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

// Updates the time for when the server should match users
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

// Matches users that have a status of 1 or 2
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

// Creates the friend finding channel
async function createFFChannel(bot, msg) {
  const createdCh = await msg.guild.channels.create('friend-finding')
    .then((createdCh) => {
      jsonManip.jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, chIDAttribute, createdCh.id);
    })
}

// Creates the friend finding message to react to 
function createFFMessage(bot, msg) {
  configFile = jsonManip.jsonFileReader(`./servers/${msg.guild.id}/server_config.json`);

  const channel = bot.guilds.cache.get(msg.guild.id).channels.cache.get(configFile[chIDAttribute]);
  //const checkChID = bot.channels.cache.get(configFile[chIDAttribute]);
  //let checkCh = msg.guild.channels.cache.find(channel => channel.id === checkChID);
  let newMsg = channel.send(botStartMsg)
    .then(async (newMsg) => {
      await jsonManip.jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, msgIDAttribute, newMsg.id);
      await addReactions(newMsg, botStartReaction);
    })
}

// Creates the friend finding role for easy mentioning of users
function createFFRole(bot, msg) {
  var roleCreated = msg.guild.roles.create({
    data: {
      name: roleName,
    },
    reason: 'We need a role for those that want to participate.'
  })
    .then(async (roleCreated) => {
      await jsonManip.jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, roleIDAttribute, roleCreated.id);
    })
}
/**
 * Listens to when a user reacts to the friend finding message, it will add them to 
 * the friend finding role and to the database with a status of 1.
 * If they un-react, they will be set to a status of 0 in the database and removed from
 * the role.
 */
async function listenFFReactions(bot, msg, db) {
  console.log(`${msg.guild.id}::::::::are you is here`);
  const handleReaction = async (reaction, user, add) => {
    if (user.id === botID) {
      return;
    }
    const emoji = await reaction._emoji.name;
    const { guild } = await reaction.message
    let configFile = await jsonManip.jsonFileReader(`./servers/${msg.guild.id}/server_config.json`);

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

  let configFile = await jsonManip.jsonFileReader(`./servers/${msg.guild.id}/server_config.json`);

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
