define(['progress'], function(ProgressBar) {

  return function(length){

    var bar = new ProgressBar("  Sincronizando [:bar] :percent :etas", {
        complete: '='
      , incomplete: ' '
      , width: 30
      , total: length
    });

    bar.tick(); // first

    return bar;
  }

});