module.exports = {
	name: 'ping',
    description: 'Ping!',
    
	async execute(message, args) {
        if(args[0] != null)
            message.channel.send('Pong. ' + args[0]);
        else
        {
            message.channel.send('Pong');
        }
	},
};