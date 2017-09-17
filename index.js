var Botkit = require('botkit');
require('dotenv').config();

var controller = Botkit.slackbot({
    require_delivery: true
});

controller.hears(['hello', 'hi', 'hey'],['direct_message', 'direct_message', 'mention'], function (bot, message) {
    bot.reply(message, "Hello yourself.");
});

var bot = controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM(function(err, bot, payload) {
    if(err) {
        console.log(err);
        console.log(process.env.SLACK_TOKEN);
    }
});

