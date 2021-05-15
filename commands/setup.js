const { ENOTEMPTY } = require("constants");
const { createDiffieHellman } = require("crypto");
const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const { userInfo } = require("os");
const { config } = require("process");
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
  var fp = await `./servers/${msg.guild.id}/server_config.json`;
  await setupExists(fp, bot, msg);
  await listenFFReactions(bot, msg);
}

const addReactions = (message, reactions) => {
  message.react(reactions[0]);
}

//check if setup was already used and is still valid/not deleted
async function setupExists(filepath, bot, msg) {
  let configFile = await JSON.parse(fs.readFileSync(filepath, "utf8"));
  const checkRole = await msg.guild.roles.cache.find(role => role.id === configFile[roleIDAttribute]);
  var checkMsg = null;

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
      await console.log(botStartReaction);
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

function listenFFReactions(bot, msg) {
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
    }
    else {
      member.roles.remove(role);
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

module.exports.help = {
  name: "setup"
}
