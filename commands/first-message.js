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
  
  module.exports = async (client, id, text, reactions = []) => {
    const channel = await client.channels.fetch(id)
  
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
module.exports.help = {
    name: "first-message"
}