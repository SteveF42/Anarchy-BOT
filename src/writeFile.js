// handles the reading and writing to file
//THIS NEEDS TO BE CHANGED TO ACCOMADATE FOR THE NEW FILE FORMAT
const fs = require('fs')
const path = require('path')
const FILENAME = "userList.json"


function read_file() {
    let json = fs.readFileSync(path.join(__dirname, FILENAME), 'utf-8', (err, jsonString) => {
        if (err) {
            console.log("error reading file", err)
            return
        }
        return jsonString
    })

    return JSON.parse(json)
}
function write_file(json) {
    let jsonString = JSON.stringify(json)
    fs.writeFile(path.join(__dirname, FILENAME), jsonString, (err) => {
        if (err) {
            console.log('error writing to disk')
        }
    })
}


function add_dictator_to_json(name, id) {
    const file_obj = read_file()
    for (x in file_obj) {
        if (x == id || file_obj[x] == id) return;
    }
    file_obj[name] = id

    write_file(file_obj)
}

function remove_dictator_from_json(user_id) {
    const json = read_file()
    const member = Bot.guilds.cache.get(Alfies_server_id).members.cache.find(member => member.user.id === user_id)
    for (x in json) {
        if (x == user_id || json[x] == user_id) {
            delete json[x]
            break;
        }
    }

    console.log(json)
    write_file(json)
}

//adds serer id anc specific channel ID to json file
function addServer(message){
    
}

module.exports = {read_file,write_file, add_dictator_to_json, remove_dictator_from_json,addServer}