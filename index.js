var Botkit = require('botkit');

var controller = Botkit.slackbot({
    require_delivery: true,
});

controller.hears(['hello', 'hi', 'hey'],['direct_message', 'direct_message', 'mention'], function (bot, message) {
    bot.reply(message, "Hello yourself.");
});

var bot = controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM();

