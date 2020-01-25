module.exports = {
	name: 'friendfinder',
    description: 'LF>Friend!',
    
	async execute(message, args) {
        if(args[0] == null)
            message.channel.send('React to this message with the :slight_smile:.');
        else
        {
            message.channel.send('This command does not have any arguments.')
        }
	}
};