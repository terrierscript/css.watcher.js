var http = require("http");
var fs = require('fs');
var url = require('url');
var less = require('less');
var server = null;
exports.config = {};

exports.setConfig = function(config){
  exports.config = config;
}

//server起動
exports.startServer = function(port){
  console.log("start server");
  server = http.createServer(function(req, res){
    try{
      var router = {
        '\/(le|c)ss\/(.*)' : exports.cssView,
        '\/sample' : exports.sampleView,
        '\/?$' : exports.indexView
      };
      //routing
      //express使ったほうがいいかどうか
      var parsed = url.parse(req.url);
      var view = undefined;
      var params = [];
      for(var rule in router){
        var regex = new RegExp("^"+rule+"$");
        if(regex.test(parsed.pathname)){
          view = router[rule];
          params = parsed.pathname.toString().match(regex);
          break;
        }
      }
      
      if(view === undefined){
        //view = exports.errorView;
      }
      req.params = params;
      //渡す値はオブジェクト化したい
      view(req,res);
    }catch(e){
      exports.errorView(req,res,e);
    }
  }).listen(port);
  exports.initSocket(server);
};

//index page
exports.indexView = function(req,res){
  var tpl = fs.readFileSync("server/index.html");
  res.end(tpl);
};

exports.sampleView = function(req,res){
  var tpl = fs.readFileSync("server/sample.html");
  res.end(tpl);
};

/**
 *  lessをcssにする
 *  @param {http.ClientRequest} req 
 *  @param {http.ClientResponse} res 
 */
exports.cssView = function(req,res){
  res.setHeader('Content-Type', 'text/css');
  var name = req.params[2];
  var parser = new(less.Parser)({
    paths : [exports.config.directory]
  })
  var data = fs.readFileSync(exports.config.directory + name);
  parser.parse(data.toString(),function(error,tree){
    var css = tree.toCSS({});
    res.end(css);
  })
};

//error page
exports.errorView = function(req,res,e){
  var util = require('util');
  var error = "error";
  console.log(req.url);
  console.error(e);
  if(e){
    error = util.inspect(e) ;
  }
  return res.end(error);
};


//socket
var socket_io = require('socket.io');
var io;


exports.lessChange = function(){
  console.error("this function is not already prepare");
};
exports.initSocket = function(server){
  io = socket_io.listen(server);
  io.set("origin","*");
  io.sockets.on('connection', function (socket) {
    socket.broadcast.emit('init', { hello: 'world' });
    //add lessChange function
    exports.lessChange = function(file){
      socket.emit('less_refresh', { file : file });
    }
  });
}


