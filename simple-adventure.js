var express = require('express');
var bodyparser = require('body-parser');
var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

var story = require('./story.js');

app.use(function(req, res){
	console.log(req.body);
	var session = req.body.session;
	var intent = req.body.request.intent;
	var slots = req.body.request.slots;
	
	if(!session.attributes) session.attributes = {};
	if(session.new) return playScene("start", session, res);

	//Ok, so we have a session already. Let's grab the scene, then the "choice" and try and figure out where to go
	var scene = session.attributes.scene;
	var choiceResponse = intent.slots.choice.value;

	var nextScene = "";
	story[scene].choices.forEach(function(choice){
		if(choice.text.toLowerCase().indexOf(choiceResponse.toLowerCase()) != -1)
			nextScene = choice.goto;
	});
	playScene(nextScene, session, res);
});

var playScene = function playScene(sceneToPlay, session, res){
	var responseText = story[sceneToPlay].text;
	if(!story[sceneToPlay].end){
		responseText += "... What would you like to do? ...";
		story[sceneToPlay].choices.forEach(function(choice){
			responseText += choice.text + " ... ";
		});
		session.attributes.scene = sceneToPlay;
	}
	
	var response = {
		response: {
			outputSpeech: {
				type: "PlainText",
				text: responseText
			},
		},
		sessionAttributes: session.attributes
	};

	if(!story[sceneToPlay].end) response.response.shouldEndSession = false;
	else responseText += " The end.";

	res.send(response);
}

app.listen(9000);