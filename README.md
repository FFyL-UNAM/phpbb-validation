# PHPBB3 External Validation

Customized user synchronization for PHPBB depending on current students and faculty of the Facultad de Filosofía y Letras, UNAM. 

# Install

For install all dependencies

    npm install

Create default user groups

    node phpbb create -g 'Profesores'

    node phpbb create -g 'Estudiantes'

# Usage

For create user groups before synchronize users
  
    node phpbb create -g 'FILOSOFIA (ESC)'

For synchronize users (students by college)

    node phpbb sync -s -c 'FILOSOFIA (ESC)' -g 'FILOSOFIA (ESC)'

The college could be or not the group. In the example above is the same.

For synchronize sync (faculty by college)

    node phpbb sync -f -c 'FILOSOFIA' -d 'DIV EST SUA' -g 'FILOSOFIA (SUA)'

###ToDo

* Synchronize all users (both faculty and students)
* Mass mailing of password and by each one
* Register from HTTP Server