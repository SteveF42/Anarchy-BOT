// file: contains all of the dictator commands
const dictatorCmds = require("./dictatorUtil")



function execCommand(cmd,message){
    if(cmd === "deploy") dictatorCmds.deploy(message);

    if (cmd === "commands") dictatorCmds.commands(message);

    if (cmd === 'steve') {
        message.channel.send('https://www.youtube.com/watch?v=v7szH6ZWKkg')
    }

    if(cmd === 'dictator') dictatorCmds.dictator(message)
    if(cmd === "overthrow") dictatorCmds.overthrow(message)
    if(cmd === "rotate") dictatorCmds.rotateServer(message)
    if(cmd === "updateRoll") dictatorCmds.updateRollName(message)
    if(cmd === "remove") dictatorCmds.removeUser(message)
    if(cmd === 'get') dictatorCmds.getDictaorList(message)
    // add tic tac toe stuff
    // if(cmd === 'play')
}






module.exports = {execCommand}