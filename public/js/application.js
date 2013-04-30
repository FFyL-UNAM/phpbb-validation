$(function(){

  var form_students = $('#signup_students .form-signup')
    , form_faculty  = $('#signup_faculty .form-signup')
    , common_rules  = {
          rules: {
              ref: { required: true }
            , username: { required: true }
            , email: {
                required: true
              , email: true
              }
            , email2: {
                required: true
              , equalTo: "#email"
              , email: true
              }
            , password: { required: true }
            , password2: {
                required: true
              , equalTo: "#password"
              }
          }
        , highlight: function(label) {
            $(label).closest('.control-group').addClass('error');
          }
        , success: function(label) {
            label.closest('.control-group').addClass('success');
          }
      };


  if(form_students)
    form_students.validate(common_rules);

  if(form_faculty)
    form_faculty.validate(common_rules);


});

jQuery.extend(jQuery.validator.messages, {
  required: "Este campo es requerido.",
  remote: "Por favor corrige este campo.",
  email: "Por favor añade una dirección de correo válida.",
  url: "Por favor añade una URL válida.",
  number: "Por favor añade un número válido.",
  digits: "Por favor añade sólo digitos.",
  equalTo: "Por favor añade el mismo valor otra vez.",
  accept: "Por favor añade un valor con una extensión válida.",
  maxlength: jQuery.validator.format("Por favor añade no más de {0} caracteres."),
  minlength: jQuery.validator.format("Por favor añade al menos {0} caracteres."),
  range: jQuery.validator.format("Por favor añade un valor entre {0} y {1}."),
  max: jQuery.validator.format("Por favor añade un valor menor o igual a {0}."),
  min: jQuery.validator.format("Por favor añade un valor mayor o igual a {0}.")
});