define(['express'], function(express, cons){

  var app = express();

  // configuration
  app.configure(function(){
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(express.session({ secret: 'filos cat' }));
    app.use(express.session({ cookie: { maxAge: 60000 }}));
    //app.use(flash());
  });

  // static files
  app.use(express.static('./public'));

  // template engine
  app.set("view engine", "jade");
  app.set('views', './app/views');
  app.engine('jade', require('jade').__express);

  // locals no globals
  app.use(function(req, res, next) {
    res.locals.title  = 'Registrarse en los foros';
    next();
  });

  // routes
  app.get('/', function(req, res){
    res.render('index');
  });

  return app;

});