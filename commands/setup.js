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
botStartReaction = ['😄'];
var roleID;
var specificMsgID;
var specificChannelID;
emoteName = '😄';

botID = '670666579167412225';
roleIDAttribute = 'ffRoleID';
chIDAttribute = 'ffChannelID';
msgIDAttribute = 'ffMsgID';

const addReactions = (message, reactions) => {
  message.react(reactions[0])
  reactions.shift()
  if (reactions.length > 0) {
    setTimeout(() => addReactions(message, reactions), 750)
  }
}

//check if setup was already used and is still valid/not deleted
function setupExists(filepath, bot, msg) {
  var functionalCh;

  let configFile = JSON.parse(fs.readFileSync(filepath, "utf8"));

  if (configFile[roleIDAttribute] != null) {
    //console.log("checking for role id: " + configFile[roleIDAttribute]);
    const checkRole = msg.guild.roles.cache.find(role => role.id === configFile[roleIDAttribute]);
    //console.log("checking for checkRole " + checkRole);
    if (checkRole == null) {
      console.log("role does not exist");
      return false;

    }
  }
  else
  {
    console.log("role does not exist");
    return false;
  }

  if (configFile[chIDAttribute] != null) {
    //console.log("checking for channel id: " + configFile[chIDAttribute]);
    const checkCh = bot.channels.cache.get(configFile[chIDAttribute]);
    //console.log("checking for checkCh " + checkCh);
    functionalCh = checkCh;
    if (checkCh == null) {
      console.log("channel does not exist");
      return false;
    }
  }
  else
  {
    console.log("channel does not exist");
    return false;
  }


  if (configFile[msgIDAttribute] != null) {
    //console.log("checking for msg id: " + configFile[msgIDAttribute]);
    return functionalCh.messages.fetch(configFile[msgIDAttribute])
      .then((msgFound) => {
        if (msgFound.id == null) {
          console.log("message not found");
          return false;
        }
        else {
          return true;
        }
      })
    return true;
  }
  else
  {
    console.log("Message does not exist");
    return false;
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

module.exports.run = async (bot, msg, args) => {
  var fp = `./servers/${msg.guild.id}/server_config.json`;

  if (setupExists(fp, bot, msg)) {
    console.log("Bot was already setup");
    return;
  }

  else{
    //Promise.all([createFFChannel(bot,msg,args), createFFMessage(bot, msg, args), createFFRole(bot, msg, args), listenFFReactions(bot, msg, args)])
    await createFFChannel(bot, msg, args);
    await createFFMessage(bot, msg, args);
    await createFFRole(bot, msg, args);
    await listenFFReactions(bot, msg, args);
  }
}

async function createFFChannel(bot, msg, args) {
    await console.log("Started FF hcannel function");
    const createdCh = await msg.guild.channels.create('friend-finding')
    .then((createdCh) => {
      jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, chIDAttribute, createdCh.id, msg);
    })
}


 function createFFMessage(bot, msg, args) {
   console.log("Started createFFMessage function");
  configFile = jsonFileReader(`./servers/${msg.guild.id}/server_config.json`);

  const channel = bot.guilds.cache.get(msg.guild.id).channels.cache.get(configFile[chIDAttribute]);
  //const checkChID = bot.channels.cache.get(configFile[chIDAttribute]);
  //let checkCh = msg.guild.channels.cache.find(channel => channel.id === checkChID);
  let newMsg = channel.send(botStartMsg)
  .then(async (newMsg) => {
    await jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`,msgIDAttribute, newMsg.id, msg);
    await addReactions(newMsg, botStartReaction);
  })
}

function createFFRole(bot, msg, args) {
    console.log("Started createFFRole function");
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

function listenFFReactions(bot, msg, args) {
  console.log("Started listenFFReactions function");
    const handleReaction = (reaction, user, add) => {
      if (user.id === botID) {
        return;
      }

      const emoji = reaction._emoji.name;
      const { guild } = reaction.message

      console.log("TEST 1");
      configFile = jsonFileReader(`./servers/${msg.guild.id}/server_config.json`);
      
      console.log(configFile[roleIDAttribute]);
      console.log("TEST 2");
      const role = guild.roles.cache.find(role => role.id === configFile[roleIDAttribute])
      const member = guild.members.cache.find(member => member.id === user.id);

      if (role == null) {
        console.log('role does not exist');
      }
      else {
        // console.log(role);
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
      if (configFile[chIDAttribute]== reaction.message.channel.id) {
        console.log(configFile[chIDAttribute].id + " " + reaction.message.channel.id);
        handleReaction(reaction, user, true);
        console.log("handle reaction add");

      }
      else{
        console.log(configFile[chIDAttribute].id + " " + reaction.message.channel.id);
        console.log("channel id is no juud add");
      }
    })

    bot.on('messageReactionRemove', (reaction, user) => {
      if (configFile[chIDAttribute] == reaction.message.channel.id) {
        console.log("handle reaction remove");
        console.log(configFile[chIDAttribute] + " " + reaction.message.channel.id);
        handleReaction(reaction, user, false);
      }
      else{
        console.log(configFile[chIDAttribute].id + " " + reaction.message.channel.id);
        console.log("channel id is no juud remove");
      }
    })
}

module.exports.help = {
  name: "setup"
}
