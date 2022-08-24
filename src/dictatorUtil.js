const { MessageEmbed } = require('discord.js')
const { JsonDB } = require("node-json-db");
const file = require("./writeFile")

const COMMANDS = [
    "commands",
    "overthrow",
    "get",
    "remove_user",
    "rotate",
    "dictator",
    "play",
    "leave",
    "deploy" //deploys dictator bot into server reading the 
]

const DICTATOR_ROLE = "Dictator"


async function deploy(message) {
    //when deployed into server, grab guildID and channelID so bot knows what channel to reply to
    console.log(message.channel.id)
    const channelID = message.channel.id;
    const guildID = message.guild.id
    const format = {}
    format[guildID] = {
        channelID: channelID,
        dictatorRoll: DICTATOR_ROLE,
        overthrowList: [],
        users: {},
    }

    const dbInfo = DB.getData("/")
    if (guildID in dbInfo) {
        message.reply("already deployed in this server")
    } else {
        message.reply("Your server is now in dictator rotation! \nuse !updateRoll to change dictator roll name. Default(Dictator)")
        DB.push("/", format)

        //create dictator roll if it doesnt exist
        const roleExists = message.guild.roles.cache.find(role => role.name === DICTATOR_ROLE)
        if (roleExists === undefined) {
            message.guild.roles.create(DICTATOR_ROLE)
        }
    }

}

function commands(message) {

    const commands = `
                !deploy   
                !dictator (join the dictator pool)
                !overthrow (all people need to vote to overthrow)
                !rotate (owner ONLY)
                !updateRoll (Change the dictator name)
                !get [dictator,...]
                !remove_user (owner ONLY)
                !play (play tic tac toe)
                !leave (leave tic tac toe)
            `

    const embed = new MessageEmbed()
        .setTitle('All Commands')
        .setColor('#2a80f7')
        .setDescription(commands)

    message.channel.send(embed)

}

function dictator(message) {
    //get the guildID
    //get user ID
    //if guild already has dictator position then add it to that if not push the guild onto DB
    const guildID = message.guild.id
    const userID = message.author.id
    const username = message.author.username
    try {
        const db = DB.getData(`/${guildID}`)

        if (userID in db.users) {
            message.reply('you\'re already in the dictator pool!')
            return
        }
        db.users[userID] = username
        DB.push(`/${guildID}`, db)
        message.reply("You have been added to dictator pool!")
    } catch (e) {
        console.log(e)
        message.reply("Your server is not in the dictator pool!")
    }

}

//helper function which rotates the dictator
function rotate(serverID, dbData) {


    const guild = Bot.guilds.cache.get(serverID)
    const memberList = dbData.users
    const channelID = dbData.channelID
    const dictatorName = dbData.dictatorRoll
    const channel = guild.channels.cache.get(channelID);
    const dictatorRoleID = guild.roles.cache.find(role => role.name === dictatorName)

    if (dictatorRoleID === undefined) {
        channel.send("Server does not have a dictator role chosen")
        console.log("server does not have a dictator role chosen")
        return;
    }

    // console.log(channels.find(channel => channel.id === channelID))
    const keys = Object.keys(memberList)
    if (keys.length <= 1) {
        channel.send("No other people to rotate with")
        console.log("No other dictators to rotate out with")
        return;
    }


    const potentialDictators = []
    let pastDictators = 0
    for (id in memberList) {
        // goes through each server to rotate dictators
        // gets members from server that are saved in the db and checks if they have dictator role
        const guildMember = guild.members.cache.get(id)
        const isDictator = guildMember.roles.cache.find(role => role.name === dictatorName)


        if (isDictator) {
            guildMember.roles.remove(dictatorRoleID)
            pastDictators++
            console.log(`<${guildMember.id}> has been dethrowned!`)
            // channel.send(`<${guildMember.id}> has been dethrowned!`)
        } else {
            potentialDictators.push(guildMember)
        }
    }
    //after getting all people with dictator roll, remove it and give random persin in dictator pool the roll
    if (pastDictators === 0) {
        //just choses the first person in the database to be dictator if one doesnt exist
        console.log("No existing dictators")
        console.log(`<@${potentialDictators[0]}> has been crowned!`)
        // channel.send(`<${users[0]}> has been crowned!`)
        potentialDictators[0].roles.add(dictatorRoleID)
        return
    }

    //picks a random user from potentialDictator list
    let randNum = Math.floor(Math.random() * potentialDictators.length);
    const newDictator = potentialDictators[randNum]
    newDictator.roles.add(dictatorRoleID)
    console.log(`<${newDictator.id}> has been crowned!`)
    // channel.send(`<${newDictator.id}> has been crowned!`)
    // when a rotate happens clear the overthrow list
    dbData.overthrowList = []
    DB.push(`/${serverID}`, dbData)
}

//rotates dictators for ALL servers in db
function rotateDictator() {
    // console.log(Bot.guilds.cache)
    getDB('/', (dbData) => {
        for (serverID in dbData) {
            rotate(serverID, dbData[serverID])
        }
    })


}

function rotateServer(message) {
    const guildOwner = message.guild.ownerID;
    const sender = message.author.id
    if (guildOwner !== sender) {
        message.reply("Only the server owner can manually rotate!")
        return
    }

    getDB(`/${message.guild.id}`, (db, e) => {
        if (e) {
            message.reply("Your server has not deployed Dictator bot")
            return;
        }
        rotate(message.guild.id, db)
    })
}

function overthrow(message) {
    getDB(`/${message.guild.id}`, (db, e) => {
        console.log(db)
        if (e) {
            message.reply("Server not in dictator pool")
            return
        }

        if (db.overthrowList.find(usr => usr === message.author.id)) {
            message.reply("You can not vote more than once!")
        } else {
            //pushes user onto the overthrow list
            //if enough users voted then it rotates and empties the list
            //update the list at the end
            db.overthrowList.push(message.author.id)
            const keys = Object.keys(db.users)
            message.reply(`${db.overthrowList.length}/${keys.length} needed to overthrow`)

            if (db.overthrowList.length >= keys.length - 1) {
                rotate(message.guild.id, db)
                db.overthrowList = []
            }
            DB.push(`/${message.guild.id}`, db)
        }

    })
}

function updateRollName(message) {
    const [command, ...other] = message.content.trim().substr(1).split(' ')
    const newName = other.join(' ')
    getDB(`/${message.guild.id}`, (db, e) => {
        if (e) {
            console.log('error', e)
            return
        }
        const roll = message.guild.roles.cache.find(role => role.name === db.dictatorRoll)

        roll.edit({
            name: newName
        })

        db.dictatorRoll = newName
        DB.push(`/${message.guild.id}`, db)
        message.reply(`Dictator roll name updated to: ${newName}`)
    })
}

function removeUser(message) {
    const [command, ...other] = message.content.trim().substr(1).split(' ')
    const username = other.join(' ')

    if (message.guild.ownerID !== message.author.id) {
        message.reply("Server owner can only remove users")
        return
    }

    getDB(`/${message.guild.id}`, (db, e) => {
        if (e) {
            console.log(e)
            return
        }

        const member = message.guild.members.cache.find(member => member.nickname === username)
        if (member !== undefined) {
            const memberName = member.user.username
            const role = member.roles.cache.find(role => role.name === db.dictatorRoll)

            if (role !== undefined) {
                rotate(message.guild.id, db)
            }

            delete db.users[memberName]
            DB.push(`/${message.guild.id}`, db)
        }
    })
}

function getDictaorList(message) {
    const guildID = message.guild.id
    getDB(`/${guildID}`, (db, e) => {
        if (e) return;
        const dictatrList = db.users
        const dictatorNames = Object.values(dictatrList)
        const embed = new MessageEmbed()
            .setTitle('All potential dictators!')
            .setColor('#2a80f7')
        dictatorNames.forEach(i=>{
            embed.addField(i,"\u200B")
        })
        message.channel.send(embed)
    })
}

module.exports = { deploy, commands, dictator, rotateDictator, updateRollName, rotateServer, overthrow, removeUser, getDictaorList }

function getDB(data, cb) {
    let db = undefined;
    try {
        db = DB.getData(data)
    } catch (e) {
        cb(db, e)
        return
    }
    cb(db)
}