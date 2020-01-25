module.exports = {
	name: 'friendfinder',
    description: 'Looking for a friend inital command to write to channel.',
    
    
	async execute(message, args) {
        if (message.content === '!friendFinder') {
            message.channel.send('Please react to the message with :blush:').then(sentMessage => {
                sentMessage.react('😊')
            })
        }
    }
};