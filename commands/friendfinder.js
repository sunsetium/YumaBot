module.exports = {
	name: 'friendfinder',
    description: 'Looking for a friend inital command to write to channel.',
    
    var: info_match = "To be matched with a friend, you must react to the text with a blushing emoji. " + 
                      "This would then sort you into a list with other users " +
                      "and the discord bot will exchange your contatct informations with " +
                      "the matched person through private messages, and set your status to busy.",
    
    var: info_unreact = "If the user were to unreact, they are removed " + 
                        "from the matchmaking list. This would then set "+
                        "your status to unavailabe.",

    var: info_busyStatus = "If your status is set to busy, then it means that " +
                           "you're engaged into a conversation with another person.",


	async execute(message, args) {
        if (message.content === '!friendFinder') {
            message.channel.send('Please react to the message with :blush:').then(sentMessage => {
                sentMessage.react('😊')
            })
        }
    }
};