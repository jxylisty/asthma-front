f = open(" src/views/Settings.vue\, \r\, encoding=\utf-8\)
lines = f.readlines()
f.close()
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if i == 55:
        new_lines.append(" \\n\)
