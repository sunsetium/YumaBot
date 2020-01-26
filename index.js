const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const fs = require('fs');
const mysql = require('mysql');

const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

var dbExists = undefined;

client.once('ready', () => {
	var con = mysql.createConnection({
  		host: "localhost",
  		user: "sunny",
  		password: "admin"
	});

	con.connect(function(err) {
  		if (err) throw err;
		  
		console.log("Connected to DB!");

		var sql = "SELECT SCHEMA_NAME FROM information_schema.schemata WHERE SCHEMA_NAME = 'yumabot'";
		con.query(sql, function (err, result, fields){
			if(result[0] !== undefined){
				var {SCHEMA_NAME} = result[0];
				setDbExists(SCHEMA_NAME);
			}
			else
			{
				if(getDbExists() === null || getDbExists() === undefined){
					con.query("CREATE DATABASE yumabot", function (err, result) {
					  if (err) throw err;
				  
					  console.log("Database created");
					});

					var insert = "CREATE TABLE yumabot.friends (serverid varchar(255)," +
														"userid varchar(255)," +
														"status varchar(1))"
					con.query(insert, function(err, result){
						if(err) throw err
						console.log("Table Created");
					});
			  }
			}
		});
		
		

	});

	console.log('Ready!');
});


client.on('messageReactionAdd', async (reaction, user) => {
	// When we receive a reaction we check if the message is partial or not
	if (reaction.message.partial) {
		// If the message was removed the fetching might result in an API error, which we need to handle
		try {
			await reaction.message.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
		}
	}
	// Now the message has been cached and is fully available
	console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
	console.log(`${reaction.users.array()}`)
	// We can also check if the reaction is partial or not
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the reaction: ', error);
		}
	}
	// Now the reaction is fully available and the properties will be reflected accurately:
	console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();
	
	if (!client.commands.has(command)) return;

	try {
		client.commands.get(command).execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

function setDbExists(value){
	dbExists = value;
}

function getDbExists(){
	return dbExists;
}

client.login(token);
