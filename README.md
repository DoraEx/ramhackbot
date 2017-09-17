#H1 slacksurveybot
--------------------

This is a slack bot that lets a channel member anonymously poll the members of their channel and receive their feedback.

To run this bot you need to do the following:

-Set an environment variable with your slack bot's api token like ethis (SLACK_TOKEN=<YOUR_TOKEN_HERE>
-Setup firebase-admin for node.js and download the configuration json file
-Run the app with node index.js

## Functionality:

-Upon mentioning the word start or anything similart, the chatbot will ask if you want to create a survey and will follow up on the details
-Upon mentioning hello or hi you will be greeted.
-Upon mentioning the word weather, the bot will ask you what city you want to get the weather for.


## TBD in the near future:
-Once the survey is finished, the chatbot will automatically provide it to all the users in the channel, and will make the results available.
-Chatbot will automatically create surveys for passed calendar events (chatbot will have access to a shared team calendar)
