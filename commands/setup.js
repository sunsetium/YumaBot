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

const addReactions = (message, reactions) => {
    message.react(reactions[0])
    reactions.shift()
    if (reactions.length > 0) {
      setTimeout(() => addReactions(message, reactions), 750)
    }
  }

function existingCheck()
{
  //check if setup was already used and is still valid/not deleted
}

function jsonFileUpdate(filepath, attribute, newVal, msg)
{
  let configFile = JSON.parse(fs.readFileSync(filepath, "utf8"))
  configFile[attribute] = newVal
  console.log(configFile);
  fs.writeFileSync(`./servers/${msg.guild.id}/server_config.json`, JSON.stringify(configFile));

}

  module.exports.run = async (bot, msg, args) => {
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
            name : roleName,
          },
          reason: 'We need a role for those that want to participate.'
        })
        roleID = roleCreated.id;
        return roleCreated;
    })
    .then((roleCreated) => {
      jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, 'ffRoleID', roleCreated.id, msg);
      const handleReaction = (reaction, user, add) =>{
        if(user.id === botID){
          return;
        }
        const emoji = reaction._emoji.name;
  
        const { guild } = reaction.message
  
        const role = guild.roles.cache.find(role => role.id === roleCreated.id)
        const member = guild.members.cache.find(member => member.id === user.id);


        if(role == null)
        {
          console.log('role does not exist');
        }
        else{
         // console.log(role);
        }
  
        if(add){
          member.roles.add(role);
        }
        else{
          member.roles.remove(role);
        }
  
      }
  
      bot.on('messageReactionAdd', (reaction, user) => {
        if(specificChannelID === reaction.message.channel.id)
        {
          handleReaction(reaction,user, true);
        }
  
      })
  
      bot.on('messageReactionRemove', (reaction, user) => {
        if(specificChannelID === reaction.message.channel.id)
        {
          handleReaction(reaction,user, false);
        }
      })
      
    })
    .catch(console.error)

}

module.exports.help = {
    name: "setup"
}
