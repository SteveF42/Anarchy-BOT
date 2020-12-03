const { Client, Message } = require('discord.js')
const Credentials = require('../Credentials.json')
const TicTacToe = require('./Game').Game
const fs = require('fs')
const user_list = require('./user_list.json')
const path = require('path')

const min = 1000 * 60
const hour = min * 60
const day = hour * 24

const Bot = new Client({disableMentions : "none"});
const prefix = '!';
const CHANNEL_ID = '650870669281591355';
const Alfies_server_id = '741527362960883724';
var games = {}
var players = {}

const potential_dictators = []


var gameKey = -1;
Bot.login(Credentials.BOT_TOKEN);


Bot.on('ready', async () => {
    console.log(`${Bot.user.username} has logged in!`);
    let json = read_file()

    //reads all names from file and adds it to the potential dictator list
    for (i in json) {
        potential_dictators.push(json[i])
    }
    console.log(potential_dictators)
});

let timer = setInterval(function(){rotate_dictator()},hour)

function check_for_dictator(){
    let guild = Bot.guilds.cache.get(Alfies_server_id)
    //filters through each member and finds each member with a dictator tag
    const dictator_role_id = guild.roles.cache.find(role => role.name == "Horny Dictator")
    const members = guild.members.cache.filter(member => member.roles.cache.find(role => role.name == dictator_role_id.name)).map(member => member.user.id);
    console.log(members)
    if(members.length >= 1) return true
    return false;
}

async function rotate_dictator() {
    console.log('Rotating Dictator!');
    let valid_dictator = await check_for_dictator()
    const guild = Bot.guilds.cache.get(Alfies_server_id)

    if (valid_dictator) {
            //filters through each member and finds each member with a dictator tag
            const members = guild.members.cache;
            const dictator_role_id = guild.roles.cache.find(role => role.name == "Horny Dictator");
            const dictator_list = members
                    .filter(member => member.roles.cache
                    .find(role => role.name === "Horny Dictator"))
                    .map(member=>member.user.id)

            //removes the dictator roll
            let previous_dictator = dictator_list[0]
            members.forEach(dictator => dictator.roles.remove(dictator_role_id));

            //sends a message saying whos getting de throned 
            let channel = guild.channels.cache.find(channel => channel.name === 'ticy-toe');
            // dictator_list.forEach(id=> {channel.send(`<${id}> HAS BEEN DE-THRONED`)});
            console.log(members.get(previous_dictator).user.username + " Has been de throned")
            
            
            //finds user and crowns them the new dictator
            while(true){
                //gets a random person from the list of potential dictators
                const randInt = Math.floor(Math.random() * Math.floor(potential_dictators.length));
                const new_dictator = potential_dictators[randInt];
                console.log('hello')
                
                if(new_dictator===previous_dictator) continue;
                const member = guild.members.cache.get(new_dictator)

                member.roles.add(dictator_role_id)
                // channel.send(`<${new_dictator}> IS CROWNED`)
                console.log(members.get(new_dictator).user.username + " Has been CROWNED")

                break;
            }    

    }else{
        //if theres no dictator just get a random one 
        const randInt = Math.floor(Math.random() * Math.floor(potential_dictators.length));
        const new_dictator = potential_dictators[randInt];
        
        let member = Bot.guilds.cache.get(Alfies_server_id).members.cache.get(new_dictator)

        console.log(`No current Dictator found, ${member.user.username} is crowned dictator`)
        const dictator_role_id = guild.roles.cache.find(role => role.name == "Horny Dictator");

        member.roles.add(dictator_role_id)
        
    }


}

function read_file() {
    let json = fs.readFileSync(path.join(__dirname, './user_list.json'), 'utf-8', (err, jsonString) => {
        if (err) {
            console.log("error reading file", err)
            return
        }
        return jsonString
    })

    return JSON.parse(json)
}

function add_dictator_to_json(name, id) {
    const file_obj = read_file()
    file_obj[name] = id
    const jsonString = JSON.stringify(file_obj)

    fs.writeFile(path.join(__dirname, './user_list.json'), jsonString, (err) => {
        if (err) {
            console.log('error writing to disk')
        }
    })
}


//helper function that inserts data into dictionaries so games can be played between two people
const InsertGame = function (authorID, channel) {
    if (authorID in players) return channel.send("You're already in a game!");

    let GameID = Math.round(gameKey / 2);
    gameKey++;

    if (gameKey % 2 == 0) {
        //create a new game here
        let Game = new TicTacToe();
        games[GameID] = Game;
        players[authorID] = GameID;
        Game.SetPlayer1(authorID);
        channel.send('Need one more player...');
    } else {
        //start the game
        channel.send("BEGIN!")
        games[GameID].SetPlayer2(authorID);
        let board = games[GameID].PrintBoard();
        channel.send(board);
        players[authorID] = GameID;
    }

}

const leaveGame = function (userID, message) {
    let gameID = players[userID]
    let game = games[gameID]
    if (userID in players && game.InPlay()) {
        try {
            let player1 = game.GetPlayer1()
            let player2 = game.GetPlayer2()

            Bot.users.fetch(player1).then(username1 => {
                Bot.users.fetch(player2).then(username2 => {
                    message.channel.send(`THE MATCH WITH ${username1} AND ${username2} HAS BEEN CANCELLED`)
                });
            });

            delete games[gameID]
            delete players[player1]
            delete players[player2]
        } catch {
            console.log('error')
        }
    }
    else if (userID in players && !game.InPlay()) {
        message.channel.send(`${message.author.username} HAS LEFT THE MATCH!`)
        delete players[userID]
        delete games[gameID]
        gameKey--;
    }
}


//message event
Bot.on('message', message => {
    if (message.author.bot) return;

    const authorID = message.author.id;

    //checks if a message in the server started with a command
    if (message.content.startsWith(prefix)) {
        //parses the answer
        const [CMD_NAME, ...other] = message.content
            .trim()
            .substr(prefix.length)
            .split(' ');
        console.log(CMD_NAME);

        if (CMD_NAME == "play") {
            InsertGame(authorID, message.channel)
        }
        if (CMD_NAME == "leave") {
            leaveGame(authorID, message)
        }
        // allows others to join the dictator rotation
        if (CMD_NAME == "dictator") {
            const user_id = message.author.id;
            const username = message.author.username
            if (!potential_dictators.includes(user_id)) {
                potential_dictators.push(user_id);
                add_dictator_to_json(username, user_id)
                const reply_msg = `You now have the chance to become dictator!`;
                message.reply(reply_msg)
                console.log("Potential_dictator list updated, new list: ", potential_dictators)
            } else {
                message.reply("You're already entered")
            }
        }
        //rotates dictators only allows owner as of now
        if (CMD_NAME == "rotate") {
            let server_owner = message.guild.ownerID;
            let user_id = message.author.id
            if (user_id == server_owner) {
                rotate_dictator()
            } else {
                message.channel.send('Only the server owner can manually rotate Dictators!')
            }
        }

        //checks if someone requested a game and that game is in play
        if (authorID in players && games[players[authorID]].GameInPlay()) {
            let num_choice = parseInt(CMD_NAME)

            //checks for valid input
            if (!isNaN(num_choice)) {
                let temp_game = games[players[authorID]];
                temp_game.MakeMove(authorID, num_choice);
                let board = temp_game.PrintBoard();
                message.channel.send(board);

                let potential_winner = temp_game.TestWinner()
                let is_tie = temp_game.TestTie()

                //checks if someone has won 
                if (potential_winner) {
                    Bot.users.fetch(potential_winner).then(username => {
                        message.channel.send(`${username} WINS!`)

                        let player1 = temp_game.GetPlayer1()
                        let player2 = temp_game.GetPlayer2()

                        let gameKey = games[players[player1]]

                        delete games[gameKey]
                        delete players[player1]
                        delete players[player2]
                    }).catch(err => console.log(err))
                } else if (is_tie) {
                    message.channel.send(`YOU GUYS SUCK! THERE'S A TIE`)

                    let player1 = temp_game.GetPlayer1()
                    let player2 = temp_game.GetPlayer2()

                    let gameKey = games[players[player1]]

                    delete games[gameKey]
                    delete players[player1]
                    delete players[player2]
                }
                else {
                    let playerID = temp_game.GetTurn();
                    Bot.users.fetch(playerID).then(username => {
                        message.channel.send(`${username}, it is your turn!`).catch(err => console.log(err))
                    });
                }
            }
        }

        //back door in case someone wants to leave the queue
        if (CMD_NAME == 'leave') {
            //clean up the game stuff
        }
    }
})


// setTimeout(dictator_rotator(),day_in_ms*2)
Bot.on('messageReactionAdd', Reaction => {
    console.log(Reaction.emoji.name)

})
