'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const accessToken = process.env.ACCESS_TOKEN
const validationToken = process.env.VALIDATION_TOKEN

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === validationToken) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text.toLowerCase()
            if (text.includes('hej') || text.includes('hallå')) {
                sendTextMessage(sender, "Hej! Vad vill du ha hjälp med?")
            } else if (text.includes('vab')) {
                sendVabButtonMessage(sender)
            } else if (text.includes('tack')) {
                sendTextMessage(sender, "Så lite så! Krya på er :)")
            } else {
                sendTextMessage(sender, "Jag förstår inte kan du förtydliga?")
            }
        }
    }
    res.sendStatus(200)
})

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    sendMessage(sender, messageData)
}

/*
 * Send a button message using the Send API.
 *
 */
function sendVabButtonMessage(sender) {
  let messageData = {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: "Ok, ditt barn är sjukt. Tråkigt. Du kan anmäla vab här. Glöm nu inte att ringa förskolan och meddela",
        buttons:[{
          type: "web_url",
          url: "https://www.forsakringskassan.se/privatpers/tjanster/anmalvaboinloggad/",
          title: "Anmäl vab"
        }]
      }
    }
  };
  sendMessage(sender, messageData)
}

function sendMessage(sender, messageData) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: accessToken},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}
