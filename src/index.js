const { Client, MessageEmbed } = require('discord.js')
const {JsonDB} = require('node-json-db');
const {Config} = require('node-json-db/dist/lib/JsonDBConfig')
const {rotateDictator} = require('./dictatorUtil')

const second = 1000
const min = second * 60
const hour = min * 60
const day = hour * 24

global.Bot = new Client({ disableMentions: "none" });
global.DB = new JsonDB(new Config("userList.json",true,false,'/'))

//checks if bot has logged in successfully

//every minute it'll check the hour
let rotated_today = false;
setInterval(() => {
    const date = new Date();
    const hour = date.getHours();

    if (hour == 1) {
        console.log("AVAILABLE ROTATION!");
        rotated_today = false;
    }

    if (hour == 0 && !rotated_today) {
        console.log('rotating dictator')
        rotated_today = true;
        rotateDictator()
    }

}, min * 30);

require('./botEvents')
