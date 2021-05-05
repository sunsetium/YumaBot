const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const { userInfo } = require("os");
var sqlite3 = require('sqlite3').verbose();


const roleName = 'Looking for Friend';
const botStartMsg = "Friendship ;-; plz";
botStartReaction = ['😄'];
var roleID;
var specificMsgID;
var specificChannelID;
emoteName = '😄';

 /*
  Add this commented section to the command that would create the new channel.
  
  // todo next step would be to make a new channel where the bot could start its processes.
  firstMessage(bot, '838496071029620756', 'Hello World lulw', ['😄'])
*/

const addReactions = (message, reactions) => {
    message.react(reactions[0])
    reactions.shift()
    if (reactions.length > 0) {
      setTimeout(() => addReactions(message, reactions), 750)
    }
  }


  module.exports.run = async (bot, msg, args) => {

    // Create a new text channel
    const createdCh = msg.guild.channels.create('friend-finding')
      .then((ch) => {msg.reply(`Friend finding channel has now been created ${ch}`);
      return ch
    })
    .then((channelID) => {
      const specificChannel = msg.guild.channels.cache.find(channel => channel.id === channelID.id);
      //specificChannel.send("React for friendship ;-;");
      specificChannelID = specificChannel.id;
      return specificChannel;
    })
    .then((specificChannel) =>{

//review bottom portions to always listen to reactions.
      var specificMsg = specificChannel.messages.fetch().then((messages) => {
        if (messages.size === 0) {
          // Send a new message
          specificChannel.send(botStartMsg).then((message) => {
            addReactions(message, botStartReaction)
          })
        } else {
          // Edit the existing message
          for (const message of messages) {
            message[1].edit(botStartMsg)
            addReactions(message[1], botStartReaction)
          }
        }
      })
      specificMsgID = specificMsg.id;
      console.log(specificMsg);

      return specificMsg;
      //return specificChannel;
    })
    .then((specificMsg) => {
        //role created.
        var roleCreated = msg.guild.roles.create({
          data: {
            name : roleName,
          },
          reason: 'We need a role for those that want to participate.'
        })
        roleID = roleCreated.id;
        return roleCreated;
    }).then((roleCreated) => {
      const handleReaction = (reaction, user, add) =>{
        if(user.id === '670666579167412225'){
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
          console.log(role);
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



  /*
module.exports = async (bot, id, text, reactions = []) => {
    const channel = await bot.channels.fetch(id)

    channel.messages.fetch().then((messages) => {
      if (messages.size === 0) {
        // Send a new message
        channel.send(text).then((message) => {
          addReactions(message, reactions)
        })
      } else {
        // Edit the existing message
        for (const message of messages) {
          message[1].edit(text)
          addReactions(message[1], reactions)
        }
      }
    })
  }

*/
