var Botkit = require('botkit');
require('dotenv').config();
var request = require('request');           // http request support
var admin = require("firebase-admin");      // firebase


// set up firebase
var serviceAccount = require("./awesomebot-90293-firebase-adminsdk-01fir-190f78694c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://awesomebot-90293.firebaseio.com"
});

// initialize database
var database = admin.database();

var a;
database.ref('/survey').once('value').then(function(snapshot){
    a = snapshot.val()
    console.log('SNAPSHOT SNAPSHOT: ', a);
});


//   ref.push(data);

var controller = Botkit.slackbot({
    require_delivery: true
});

// GLOBAL VARIABLES
//-----------------
    var weather_city = '';
    var survey_name = "";
    var question_type = "";
    var question = "";
    var choices = [];
    


// WEATHER FUNCTION
//-----------------
function weather_in(city, callback) {
    url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=8d579adcdd567ec7b0fb936c1864fd89&units=imperial`;
    request.get(url, function(error, response, body) {
        if(error) {console.log('error: \n', error); return}
        parsedBody = JSON.parse(body);
        var weather_main_temp = '';
        weather_main_temp += ` There's ` + parsedBody.weather[0].main;
        weather_main_temp += ` and the temperature is ` + parsedBody.main.temp + ` F`;
        callback(weather_main_temp);
    });
}



// ROUTING
//--------------------
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
                    // Add survey name to database
                    database.ref('survey/' + survey_name).set({
                        name: survey_name,
                        question: null,
                        choices: [null]
                    });
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
        
        //GET THE QUESTION TYPE
        convo.addQuestion( 'What type of question do you want to ask? Free response or multiple choice?', [
            {
                pattern: 'free',
                callback: function (response, convo) {
                    convo.setVar("type" , "free");
                    convo.gotoThread('get_question');
                }
            },
            {
                pattern: 'multi',
                callback: function (response, convo) {
                    question_type = "multi";
                    convo.setVar("type" , "multi");
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
        
        //GET THE QUESTION
        convo.addQuestion('What question would you like to ask?',[
            {
                pattern: '(.*)',
                callback: function (response, convo) {
                    question = response.text;
                    convo.setVar('question', response.text);
                    // STORE QUESTION IN DB TODO
                    database.ref('survey/' + survey_name).set({                     // add 
                        question: question,
                    });
                    convo.say("Got it.");
                    if(convo.vars.type == "free") {
                        convo.gotoThread("display_survey")
                    }
                    else {
                        convo.setVar("choice", []);
                        convo.gotoThread('get_first_choice');
                    }
                }
            }
        ],{}, 'get_question');
        
        //GET THE MULTIPLE CHOICES
        convo.addQuestion('What is the first choice for the answers?',[
            {
                pattern: '(.*)',
                callback: function (response, convo) {
                    database.ref('/survey').once('value').then(function(snapshot){      // db ref
                        a = snapshot.val();                                             // store in a
                        console.log('SNAPSHOT SNAPSHOT: ', a);                          // log value of a
                        choices.push(response.text);                                    // push to choices
                        //database.ref('/survey').update({leaf: a.push(response.text)});
                        database.ref('survey/' + survey_name).set({                     // add 
                            question: question,
                            choices: choices,
                            type: question_type
                        });
                    });
                    convo.gotoThread('get_other_choices');
                    
                    
                }
            }
        ], {}, 'get_first_choice');

        convo.addQuestion('What\'s the next choice?', [
            {
                pattern: 'don',
                callback: function (response, convo) {
                    convo.gotoThread('display_survey');
                }
            },
            {
                pattern: bot.utterances.no,
                callback: function (response, convo) {
                    convo.gotoThread('display_survey');
                }
            },
            {
                pattern: '(.*)',
                callback: function (response, convo) {
                    database.ref('/survey').once('value').then(function(snapshot){
                        a = snapshot.val().survey_name.choices;
                        choices.push(response.text);
                        console.log('SNAPSHOT SNAPSHOTAAAA: ', a);
                        database.ref('/survey').update({leaf: a.push(response.text)});   
                    });
                    //convo.vars.choices.push(response.text);
                    //console.log(convo.vars.choices);
                    convo.repeat();
                    convo.next();
                }
            }
        ], {}, 'get_other_choices');
        //GET THE QUESTION
        convo.addQuestion('What question would you like to ask?',[
            {
                pattern: '(.*)',
                callback: function (response, convo) {
                    question = response.text;
                    convo.say("Got it.");
                    if(question_type == "free") {
                        convo.gotoThread("display_survey")
                    }
                    convo.gotoThread('get_first_choice');
                }
            }
        ],{}, 'get_question');
        console.log(`VARS QUESTION: `,'{{vars.question}}');
        convo.addQuestion('question: {{vars.question}}', function(response, convo) {console.log(`VARS QUESTION: `,'{{vars.question}}'); console.log(message); convo.stop(); convo.next();}, {}, 'display_survey');
        
    //END OF CONVERSATION
    })
});

// weather
controller.hears('weather','direct_mention, direct_message', function(bot, message) {
    bot.startConversation(message, function(err, convo) {
        convo.say('I think you want to know the weather!');
        convo.ask('What city do you want to know the weather of?', function(answer, convo) {
            
            var city = answer.text;
            weather_in(city, function(response){
                // do something with this answer!
                // storeTacoType(convo.context.user, taco_type);
                convo.say(response); // add another reply
                convo.next(); // continue with conversation    
            });
            
        });
    });
});

var bot = controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM(function(err, bot, payload) {
    if(err) {
        console.log(err);
        console.log(process.env.SLACK_TOKEN);
    }
});

