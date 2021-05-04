const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
var sqlite3 = require('sqlite3').verbose();

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
      .then(console.log()).then((ch) => {msg.reply(`Friend finding channel has now been created ${ch}`);
    }).then(function(result) {

      const specificChannel = msg.guild.channels.cache.find(channel => channel.name === 'friend-finding');
      specificChannel.send("it works!");
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
