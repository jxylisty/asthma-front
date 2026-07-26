import re
f = open(" src/composables/useSettings.js\, \r\, encoding=\utf-8\)
c = f.read()
f.close()
c = c.replace(" fontSize:  default,\, \fontSize:  default,\n mouseTrail: false,\)
f = open(" src/composables/useSettings.js\, \w\, encoding=\utf-8\)
f.write(c)
f.close()
print(" Done\)
