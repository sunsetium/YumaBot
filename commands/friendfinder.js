module.exports = {
	name: 'friendfinder',
    description: 'Looking for a friend inital command to write to channel.',
    
    
	async execute(message, args) {
        if (message.content === '!friendFinder'  || message.content ==='Please react to the message with :slight_smile:') {
            message.react('👍').then(() => message.react('👎'));
          
            message.channel.send('Please react to the message with :slight_smile:').then(sentMessage => {
                sentMessage.react('👍')
            })
        }
    }
};