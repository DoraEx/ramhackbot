var Botkit = require('botkit');
require('dotenv').config();

var controller = Botkit.slackbot({
    require_delivery: true
});

    var survey_name = "";
    var question_type = "";
    var question = "";
    var choices = [];
    


controller.hears(['hello', 'hi', 'hey'],['direct_mention', 'mention'], function (bot, message) {
    bot.reply(message, 'Hello <@'+message.user+'> please send me a direct message to get started.');
});

controller.hears(['hello', 'hi', 'hey'],['direct_message'], function (bot, message) {
    bot.reply(message, 'Hi <@'+message.user+'> what can I help you with?');
});

controller.hears(['start', 'new', 'create', 'make'],['direct_message'], function (bot, message) {
    bot.startConversation(message, function(err, convo){
        //END THE CONVERSATION
        convo.addMessage({
            text: 'Ok...'
        }, 'end_convo');

        //CONFIRM START
        convo.addQuestion('Would you like to make a new survey?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.gotoThread('get_name');
                },
            },
            {
                pattern: bot.utterances.no,
                callback: function(response, convo) {
                    convo.gotoThread('end_convo');
                },
            },
            {
                pattern: bot.utterances.quit,
                callback: function(response, convo) {
                    convo.gotoThread('end_convo');
                }
            },
            {
                default: true,
                callback: function(response, convo) {
                    convo.repeat();
                    convo.next();
                }
            }
        ], {}, 'default');
        
        //GET THE NAME FROM THE USER
        convo.addQuestion("What is the name of the survey?", [
            {
                pattern: '.*',
                callback: function(response, convo) {
                    convo.setVar('name', response.text);
                    console.log(bot.utterances.yes);
                    convo.gotoThread('confirm_name');
                }
            }
        ], {}, 'get_name');
        
        //CONFIRM THE NAME
        convo.addQuestion("Ok, the survey name will be {{vars.name}}. Ok?", [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say("Alright!");
                    survey_name = convo.vars.name;
                    convo.gotoThread('get_question_type');
                }
            },
            {
                pattern: bot.utterances.no,
                callback: function(response, convo) {
                    convo.say('Ok, then...');
                    convo.gotoThread('get_name');
                }
            },
            {
                pattern: bot.utterances.quit,
                callback: function(response, convo) {
                    convo.gotoThread('end_convo');
                }
            },
            {
                default: true,
                callback: function(response, convo) {
                    convo.gotoThread('end_convo');
                }
            }
        ], {}, 'confirm_name');
        
        //GET THE QUESTION
        convo.addQuestion('What question would you like to ask?',[
            {
                pattern: '(.*)',
                callback: function(response, convo) {
                    convo.gotoThread('confirm_question');
                }
            }
        ],{}, 'get_question');
        
        //GET THE QUESTION TYPE
        convo.addQuestion( 'What type of question do you want to ask? Free response or multiple choice?', [
            {
                pattern: 'free',
                callback: function (response, convo) {
                    convo.gotoThread('get_question');
                }
            },
            {
                pattern: 'multi',
                callback: function (response, convo) {
                    convo.gotoThread('get_question');
                }
            },
            {
                default: true,
                callback: function (response, convo) {
                    convo.say("huh?")
                    convo.repeat();
                    convo.next();
                }
            }
        ], {}, 'get_question_type');
    //END OF CONVERSATION
    })
});

var bot = controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM(function(err, bot, payload) {
    if(err) {
        console.log(err);
        console.log(process.env.SLACK_TOKEN);
    }
});

