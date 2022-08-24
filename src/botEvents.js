const dictatorCommands = require('./dictatorCommands')
const Credentials = require('../Credentials.json')
const prefix = '!';

Bot.login(Credentials.BOT_TOKEN);

Bot.on('ready', async () => {
    console.log(`${Bot.user.username} has logged in!`);
})

// Bot.on('debug', console.log)

Bot.on('message', message => {
    if (message.author.bot) return;

    if(message.content.startsWith(prefix)){

        const [CMD_NAME, ...other] = message.content
        .toLowerCase()
        .trim()
        .substr(prefix.length)
        .split(' ')
        console.log(CMD_NAME);
        
        dictatorCommands.execCommand(CMD_NAME,message)
    }
})
