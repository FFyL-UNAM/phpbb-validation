var requirejs = require('requirejs')
  , flatiron  = require('flatiron')
  , app       = flatiron.app;

requirejs.config({
    nodeRequire: require
  , baseUrl: 'app'
});

requirejs([
      'config'
    , 'underscore'
    , 'progressbar'
    , 'mysql'
    , 'squel'
    , 'request'
    , 'phpbb-password'
    , 'password-generator'
  ], 
  function(
      config
    , _
    , progressbar
    , mysql
    , squel
    , request
    , phpbb
    , password_generator
  ) {

    // config mysql connection
    var connection = mysql.createConnection({
        host      : config.mysql.host
      , user      : config.mysql.user
      , password  : config.mysql.pass
      , database  : config.mysql.db
    });

    // config flatiron
    app.use(flatiron.plugins.cli, {
        usage : [
            ''
          , 'ADMINISTRAR FOROS DE PHPBB3'
          , ''
          , 'users      Sincroniza usuarios según su vigencia'
          , ''
          , '-a   --all   Sincroniza profesores y estudiantes según su vigencia'
          , '-s   --students  Sincroniza sólo estudiantes según su vigencia'
          , '-f   --faculty   Sincroniza sólo profesores según su vigencia'
          , '-c   --college   Definir el colegio de adscripción'
          , '-d   --division   Definir la división de estudios'
          , '-g   --group   Definir el nombre del grupo de usuario'
          , ''
        ]
      , argv: {
          students: {
            alias: 's'
          }
        , faculty: {
            alias: 'f'
          }
        , all: {
            alias: 'a'
          }
        , college: {
            alias: 'c'
          }
        , division: {
            alias: 'd'
          }
        , group: {
            alias: 'g'
          }
      }
    });

    // start server
    app.cmd('start',function () {
      var app = requirejs('app');
      app.listen(process.env.PORT || config.server.port);
      console.log('Server listening on port ' + config.server.port);
    });

    // $ node phpbb users -s -c 'GEOGRAFIA (ESC)'
    app.cmd('users', function(){

      var sql
        , table = config.mysql.table;

      // sync students
      if( true === app.argv.s && app.argv.c && app.argv.g ) {

        var sync = function(err, res, docs){
          if(err) throw err;

          // parse json
          docs = JSON.parse(docs);

          // students per college
          docs = _.where(docs, { colegio: app.argv.c });

          // remove duplicate students (♥_underscore_♥)
          docs = _.uniq(docs, function(item){
            return item.correo;
          });

          if( docs.length > 1 ) {

            // change all users to inactives (user_type = 1) 
            connection.query(
              squel.update()
                    .table(table.fields_data, 'f')
                    .table(table.users, 'u')
                    .set('u.user_type', 1)
                    .where(squel.expr()
                                .and('f.pf_cuenta IS NOT NULL')
                                .and('u.user_type = 0')
                                .and('f.user_id = u.user_id'))
                    .toString()
            ).on('end', function() {

              // set progress bar
              var bar = progressbar(docs.length);

              // for each student from json
              _.each(docs, function(item, i){
                
                var user = {
                    username  : item.correo.substring(0, item.correo.indexOf('@')).toLowerCase()
                  , email     : item.correo
                  , cuenta    : item.cuenta
                };

                // select each student for insert or validate user type
                sql = squel.select()
                            .from(table.fields_data, 'f')
                            .right_join(table.users, 'u', "f.user_id = u.user_id")
                            .where('u.username = "' + user.username + '"')
                            .toString();

                connection.query(sql, function(err, result){

                            if(result.length > 0) {

                              var user_id = result[0].user_id;

                              sql = squel.update()
                                          .table(table.fields_data, 'f')
                                          .table(table.users, 'u')
                                          .set('u.user_type', 0)
                                          .where(squel.expr()
                                                      .and('f.user_id = u.user_id')
                                                      .and('u.user_id = "' + user_id + '"'));

                              // if already is professor
                              if(result[0].pf_rfc) {
                                sql.set('f.pf_cuenta', user.cuenta);

                                connection.query(
                                    squel.select()
                                          .from(table.groups)
                                          .where('group_name = "Estudiantes"')
                                          .toString()
                                  , function(err, result){

                                      if(result.length > 0) {
                                        connection.query(
                                          squel.insert()
                                                .into(table.user_groups)
                                                .set('group_id', result[0].group_id)
                                                .set('user_id', user_id)
                                                .toString()
                                        );
                                      }

                                    }
                                );

                              }

                              // change user type to normal (user_type = 0)
                              connection.query(sql.toString())
                                        .on('end', function(){
                                          bar.tick();
          
                                          if (bar.complete) {
                                            connection.end();
                                            console.log("\n  Finalizado.");
                                          }
                                        });
                            } else {

                              sql = squel.select()
                                          .from(table.groups)
                                          .where('group_name = "' + app.argv.g + '"')
                                          .toString();

                              connection.query(sql, function(err, result){

                                if(result.length > 0 && user.username) {

                                  var group_id = result[0].group_id;

                                  sql = squel.insert()
                                              .into(table.users)
                                              .set('username', user.username)
                                              .set('username_clean', user.username)
                                              .set('user_email', user.email)
                                              .set('group_id', group_id)
                                              .set('user_timezone', 0)
                                              .set('user_dst', 1)
                                              .set('user_lang', 'es_x_tu')
                                              .set('user_type', 0)
                                              .set('user_actkey', '')
                                              .set('user_dateformat', 'D M d, Y g:i a')
                                              .set('user_style', 1)
                                              .set('user_regdate', Math.round( new Date().getTime() / 1000 ) )
                                              .set('user_new', 1)
                                              .toString();

                                  // insert new user
                                  connection.query(sql)
                                            .on('result', function(saved) {

                                              sql = squel.insert()
                                                          .into(table.fields_data)
                                                          .set('user_id', saved.insertId)
                                                          .set('pf_cuenta', user.cuenta)
                                                          .toString();

                                              connection.query(sql)
                                                        .on('end', function(){

                                                          sql = squel.insert()
                                                                      .into(table.user_groups)
                                                                      .set('group_id', group_id)
                                                                      .set('user_id', saved.insertId)
                                                                      .toString();

                                                          connection.query(sql)
                                                                    .on('end', function(){

                                                                      sql = squel.select()
                                                                                  .from(table.groups)
                                                                                  .where('group_name = "Estudiantes"')
                                                                                  .toString();

                                                                      connection.query(sql, function(err, result){
                                                                        if (result.length > 0) {
                                                                          sql = squel.insert()
                                                                                      .into(table.user_groups)
                                                                                      .set('group_id', result[0].group_id)
                                                                                      .set('user_id', saved.insertId)
                                                                                      .toString();

                                                                          connection.query(sql)
                                                                                    .on('end', function(){
                                                                                      bar.tick();
                                                      
                                                                                      if (bar.complete) {
                                                                                        connection.end();
                                                                                        console.log("\n  Finalizado.");
                                                                                      }
                                                                                    });
                                                                        }
                                                                      });

                                                                    });
                                                        });
                                            });

                                } else {
                                  // no group_id
                                  bar.tick();
                
                                  if (bar.complete) {
                                    connection.end();
                                    console.log("\n  Finalizado.");
                                    console.log("\n  ¡NO SE HA CREADO EL GRUPO!");
                                  }
                                }

                              });
                              
                            }

                          });

              }); // foreach

            });

          } else { // if docs > 0
            console.log('  No se encontraron datos para sincronizar.');
          }

        }

        // request to "sync" callback
        console.log('  Descargando base de datos para sincronizar...');
        request(config.json.students, sync);

      }

      // sync faculty
      if( true === app.argv.f && app.argv.c && app.argv.d && app.argv.g ) {

        var sync = function(err, res, docs){
          if(err) throw err;

          // parse json
          docs = JSON.parse(docs);

          // faculty by college
          docs = _.where(docs, { colegio: app.argv.c });

          // faculty by division
          docs = _.where(docs, { division: app.argv.d });

          // remove duplicate professor
          docs = _.uniq(docs, function(item){
            return item.rfc;
          });

          if( docs.length > 1 ) {

            // change all users to inactives (user_type = 1) 
            connection.query(
              squel.update()
                    .table(table.fields_data, 'f')
                    .table(table.users, 'u')
                    .set('u.user_type', 1)
                    .where(squel.expr()
                                .and('f.pf_rfc IS NOT NULL')
                                .and('u.user_type = 0')
                                .and('f.user_id = u.user_id'))
                    .toString()
            ).on('end', function() {

              // set progress bar
              var bar = progressbar(docs.length);

              // for each professor from json
              docs.forEach(function(item, i){
                
                item.correo = item.correoa || item.correob;

                var user = {
                    username  : item.correo.substring(0, item.correo.indexOf('@')).toLowerCase()
                  , email     : item.correo
                  , rfc       : item.rfc
                };
                
                if(user.username && user.email) {

                  // select each professor for insert or validate user type
                  sql = squel.select()
                              .from(table.fields_data, 'f')
                              .join(table.users, 'u', "f.user_id = u.user_id")
                              .where('f.pf_rfc = "' + user.rfc + '"')
                              .toString();

                  connection.query(sql, function(err, result){

                    if(result.length > 0) {
                      // change user type to normal (user_type = 0)
                      connection.query(
                                  squel.update()
                                        .table(table.fields_data, 'f')
                                        .table(table.users, 'u')
                                        .set('u.user_type', 0)
                                        .where(squel.expr()
                                                    .and('f.pf_rfc = "' + user.rfc + '"')
                                                    .and('u.user_type = 1')
                                                    .and('f.user_id = u.user_id'))
                                        .toString()
                                )
                                .on('end', function(){
                                  bar.tick();
  
                                  if (bar.complete) {
                                    connection.end();
                                    console.log("\n  Finalizado.");
                                  }
                                });
                    } else {

                      sql = squel.select()
                                  .from(table.groups)
                                  .where('group_name = "' + app.argv.g + '"')
                                  .toString();

                      connection.query(sql, function(err, result){

                        if(result.length > 0) {

                          var group_id = result[0].group_id;

                          sql = squel.insert()
                                      .into(table.users)
                                      .set('username', user.username)
                                      .set('username_clean', user.username)
                                      .set('user_email', user.email)
                                      .set('group_id', group_id)
                                      .set('user_timezone', 0)
                                      .set('user_dst', 1)
                                      .set('user_lang', 'es_x_tu')
                                      .set('user_type', 0)
                                      .set('user_actkey', '')
                                      .set('user_dateformat', 'D M d, Y g:i a')
                                      .set('user_style', 1)
                                      .set('user_regdate', Math.round( new Date().getTime() / 1000 ) )
                                      .set('user_new', 1)
                                      .toString();

                          // insert new user
                          connection.query(sql)
                                    .on('result', function(saved) {

                                      sql = squel.insert()
                                                  .into(table.fields_data)
                                                  .set('user_id', saved.insertId)
                                                  .set('pf_rfc', user.rfc)
                                                  .toString();

                                      connection.query(sql)
                                                .on('end', function(){

                                                  sql = squel.insert()
                                                              .into(table.user_groups)
                                                              .set('group_id', group_id)
                                                              .set('user_id', saved.insertId)
                                                              .toString();

                                                  connection.query(sql)
                                                            .on('end', function(){

                                                              sql = squel.select()
                                                                          .from(table.groups)
                                                                          .where('group_name = "Profesores"')
                                                                          .toString();

                                                              connection.query(sql, function(err, result){
                                                                if (result.length > 0) {
                                                                  sql = squel.insert()
                                                                              .into(table.user_groups)
                                                                              .set('group_id', result[0].group_id)
                                                                              .set('user_id', saved.insertId)
                                                                              .toString();

                                                                  connection.query(sql)
                                                                            .on('end', function(){
                                                                              bar.tick();
                                              
                                                                              if (bar.complete) {
                                                                                connection.end();
                                                                                console.log("\n  Finalizado.");
                                                                              }
                                                                            });
                                                                }
                                                              });

                                                            });
                                                });
                                    });

                        } else {
                          // no group_id
                          bar.tick();
        
                          if (bar.complete) {
                            connection.end();
                            console.log("\n  Finalizado.");
                            console.log("\n  ¡NO SE HA CREADO EL GRUPO!");
                          }
                        }

                      });
                    }

                  });

                } else {
                  bar.tick();
        
                  if (bar.complete) {
                    connection.end();
                    console.log("\n  Finalizado.");
                    console.log("\n  ¡NO SE HA CREADO EL GRUPO!");
                  }
                }

              });

            });

          } else { // if docs > 0
            console.log('  No se encontraron datos para sincronizar.');
          }

        }

        // request to "sync" callback
        console.log('  Descargando base de datos para sincronizar...');
        request(config.json.faculty, sync);
      }

    });

  
    // node phpbb create -g 'GEOGRAFIA (ESC)'
    app.cmd('create', function(){

      var sql
        , table = config.mysql.table;
      
      // create group
      if(app.argv.g) {

        sql = squel.select()
                    .from(table.groups)
                    .where('group_name = "' + app.argv.g + '"')
                    .toString();

        connection.query(sql, function(err, result){
          if(err) throw err;

          if(result.length > 0) {
            console.log('Ya existe el grupo de usuario ' + app.argv.g);
            connection.end();
          } else {
            sql = squel.insert()
                        .into(table.groups)
                        .set('group_name', app.argv.g)
                        .set('group_type', 0)
                        .toString();

            connection.query(sql, function(err, result){

              if(err) {
                console.log('Ha ocurrido un error al crear el grupo');
                return;
              }
              
              console.log('Se ha creado el grupo de usuario correctamente');

            }).on('end', function(){ connection.end(); });
          }
        });

      }

    });


    if(!app.argv._.length && !app.argv.help)
      app.argv._ = ["start"];


    app.start();


  }
);