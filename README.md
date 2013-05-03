# PHPBB3 External Validation

Customized user synchronization for PHPBB depending on current students and faculty of the Facultad de Filosofía y Letras, UNAM. 

# Install

For install all dependencies

    npm install

# Usage

For create user groups before synchronize users
  
    node phpbb create -g 'FILOSOFIA (ESC)'

For synchronize users (by college)

    node phpbb users -s -c 'FILOSOFIA (ESC)' -g 'FILOSOFIA (ESC)'

The college could be or not the group. In the example above is the same.

###ToDo

* Synchronize users (faculty by college)
* Synchronize all users (both faculty and students)
* Mass mailing of password and by each one
* Register from HTTP Server