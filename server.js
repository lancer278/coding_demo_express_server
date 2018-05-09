var express = require('express');
var _ = require('underscore-node');
var uniqid = require("uniqid");

var app = express();
var port = process.env.PORT || 5000;

var hierarchy = [{"nodeID":"rootNode", "text":"root", "left":1, "right":2, "gen":0}];

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/api/hello', (req, res) => {
	  res.send({ express: 'Hello From Express' });
	});

app.get('/api/insert/:id/:txt', (req, res) => {
	try{
	  if(!req.params.id){
		  res.status(400).send({express:'missing ID'});
	  }else if(!req.params.txt){
		  res.status(400).send({express:"must supply text for the node"});
	  }else{
		  var parentNode = _.findWhere(hierarchy, {nodeID:req.params.id});
		  var newText = htmlEscape(req.params.txt);
		  var newID = uniqid();
		  hierarchy =  _.chain(hierarchy).map(function(item,index,list){
							  if(item.left > parentNode.left){
								return {nodeID: item.nodeID, text: item.text, left: item.left + 2, right: item.right + 2, gen:item.gen}
							  }else if(item.left <= parentNode.left){
								return {nodeID: item.nodeID, text: item.text, left: item.left, right: item.right + 2, gen:item.gen}
							  }
						}).union({nodeID: newID, text: newText, left: parentNode.left + 1, right: parentNode.left + 2, gen:parentNode.gen + 1})
						.sortBy(function(a){return a.left})
						.value();
		  res.send({ express: 'insert node below: ' + req.params.id, hierarchy:hierarchy});
	  }
	}catch(e){
		  res.status(400).send({express:e});
	}
	});

app.get('/api/delete/:id?', (req, res) => {
	  if(!req.params.id){
		  res.status(400).send({express:'missing ID'});
	  }else if(req.params.id == 'rootNode'){
		  res.status(400).send({express:"cant't delete root node"});
	  }else{
		  var deleteNode = _.findWhere(hierarchy, {nodeID:req.params.id});
		  if(deleteNode !== undefined){
			hierarchy =  _.chain(hierarchy)
							.map(function(item,index,list){
								if(item.left >= deleteNode.left && item.right <= deleteNode.right ) {
									return false
								}else{
									if(item.left > deleteNode.left){
										return {nodeID: item.nodeID, text: item.text, left: item.left - 2, right: item.right - 2, gen:item.gen};
									}else if(item.left <= deleteNode.left){
										return {nodeID: item.nodeID, text: item.text, left: item.left, right: item.right - 2, gen:item.gen};
									}
								}
							})
							.reject(function(a) {return !a})
							.sortBy(function(a){if(a) return a.left})
							.value();
		  res.send({ express: 'delete node: ' + req.params.id, hierarchy:hierarchy});
		}else{
			res.status(400).send({express:"nodeID does not exist"});
		}
	  }
	});

app.get('/api/hierarchy', (req, res) => {
		  res.send({ express: 'current hierarchy', hierarchy:hierarchy});
	});

app.listen(port, () => console.log(`Listening on port ${port}`));


function htmlEscape(text) {
   return text.replace(/&/g, '&amp;').
     replace(/</g, '&lt;').  // it's not neccessary to escape >
     replace(/"/g, '&quot;').
     replace(/'/g, '&#039;');
}