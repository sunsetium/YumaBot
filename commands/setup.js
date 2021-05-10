const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const { userInfo } = require("os");
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
  /*
const checkMSGID = functionalCh.messages.cache.get('841385795709435934')
//console.log(functionalCh);
//const checkMSGID = functionalCh.messages.fetch(configFile[msgIDAttribute]);
//console.log("checking for checkMSGID " + checkMSGID);
if (checkMSGID == null) {
  console.log("message does not exist");
  return false;
}
}
return true;
*/
}


function jsonFileUpdate(filepath, attribute, newVal, msg) {
  let configFile = JSON.parse(fs.readFileSync(filepath, "utf8"));
  configFile[attribute] = newVal;
  fs.writeFileSync(`./servers/${msg.guild.id}/server_config.json`, JSON.stringify(configFile));

}

module.exports.run = async (bot, msg, args) => {
  var fp = `./servers/${msg.guild.id}/server_config.json`;

  if (setupExists(fp, bot, msg)) {
    console.log("Bot was already setup");
    return;
  }

  else{
    //add serverid
    jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, 'serverID', msg.guild.id, msg);

    // Create a new text channel
    const createdCh = msg.guild.channels.create('friend-finding')
      .then((ch) => {
        msg.reply(`Friend finding channel has now been created ${ch}`);
        return ch
      })
      .then((ch) => {
        jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, 'ffChannelID', ch.id, msg);

        const specificChannel = msg.guild.channels.cache.find(channel => channel.id === ch.id);
        //specificChannel.send("React for friendship ;-;");
        specificChannelID = specificChannel.id;
        return specificChannel;
      })
      .then((specificChannel) => {
        // Send a new message
        return specificChannel.send(botStartMsg);
      })
      .then((message) => {
        addReactions(message, botStartReaction)
        specificMsgID = message.id;
        return specificMsgID;
      })
      .then((specificMsg) => {
        //role created.
        jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, 'ffMsgID', specificMsg, msg);
        var roleCreated = msg.guild.roles.create({
          data: {
            name: roleName,
          },
          reason: 'We need a role for those that want to participate.'
        })
        roleID = roleCreated.id;
        return roleCreated;
      })
      .then((roleCreated) => {
        jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, 'ffRoleID', roleCreated.id, msg);

        const handleReaction = (reaction, user, add) => {
          if (user.id === botID) {
            return;
          }

          const emoji = reaction._emoji.name;

          const { guild } = reaction.message

          const role = guild.roles.cache.find(role => role.id === roleCreated.id)
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

        bot.on('messageReactionAdd', (reaction, user) => {
          if (specificChannelID === reaction.message.channel.id) {
            handleReaction(reaction, user, true);
          }

        })

        bot.on('messageReactionRemove', (reaction, user) => {
          if (specificChannelID === reaction.message.channel.id) {
            handleReaction(reaction, user, false);
          }
        })

      })
      .catch(console.error)
  }


}

module.exports.help = {
  name: "setup"
}
