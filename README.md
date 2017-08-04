# webtask-chatbot
A [webtask](webtask.io)-based chatbot  that responds to custom terms. Chatbot uses Webtask, MongoDB, and ExpressJs to run completely serverless. With a GroupMe account, you can join the group at [https://app.groupme.com/join_group/32749479/KMdibJ](https://app.groupme.com/join_group/32749479/KMdibJ) for a demonstration.

Webtask is made by Auth0. For more information about webtask and Auth0, visit [Auth0.com](https://auth0.com).

Commands:
```
/bot add [singleword] [phrase or URL to capture]

/bot update [singleword] [phrase or URL to capture]

/bot delete [singleword]
```
Once terms are added with `/bot add`, when these terms appear in chat from anyone, the chatbot will respond with the provided phrase.

## Recreation Steps
Complete these steps to setup a new instance of webtask-chatbot.
1. Create a Webtask with wt-cli or [https://webtask.io/make](https://webtask.io/make)
2. Copy the contents of bot.js into the Webtask
3. Take note of the task's webhook

4. Go to [https://web.groupme.com/](https://web.groupme.com/) and create an account. 
5. Create a group.
6. Create a bot at [https://dev.groupme.com/bots](https://dev.groupme.com/bots), using the chat you just created
7. Set the callback url to the webtask's webhook from step 3
8. Create the secret variables GROUPME_GROUP_ID and GROUPME_BOT_ID in the webtask using bot's Id and Group Id. These are found in the bot information page
9. Create an empty MongoDB instance at [MongoLabs](https://mlab.com/home) or another service
10. Create one last secret variable in the webtask called MONGO_URL and use the url for the MongoDB instance you created

## Blacklisting the Bot User
I ran out of time to finish up some of the bot features, so one of the manual steps to get the chatbot running is to find out the GroupMe Bot's user Id and replace the Id in bot.js.
The fastest way to do this is to complete these steps:
1. Complete the recreation steps above
2. Go to [https://webtask.io/make](https://webtask.io/make)
3. Open the webtask you created before
4. Turn on logs (Ctrl + L)
5. In the GroupMe chat, add a command to the chatbot
6. Review the logs after the chatbot responds
7. There should be the contents of a POST from the GroupMe callback webhook in the logs. Find the user_id property and copy its value
8. On line 100 (currently) of the webtask (or bot.js), there should be this code:

   ```javascript
   if (req.body.sender_id === '518316') res.status(200).send('');
   ```
9. In the webtask, replace the comparison value (`518316`) with your bot's user_id value.
10. Save your webtask

The chatbot will no longer respond to triggers in its own comments.


## Next Steps
Chatbot can be used in a variety of ways, beyond simple key recognition. The commands processing can be extended to interface with any API with a personal access token. For example, Chatbot could be used witg OpenWeather's APIs to provide a forecast or with an IAM-restricted AWS access key to provide descriptive account information.On the same note, Chatbot can be outfitted with a notification/comment interface, in order to switch the report target (slack, discord, etc). Chatbot can also be modified to relay notifications from any webhooks configured to post to the webtask endpoint. Chatbot is just a start. Thanks for reading!
