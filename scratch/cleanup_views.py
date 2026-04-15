import os
import re

file_path = r'c:\Users\usuario\Documents\GitHub\NaturalV0.5\src\views\Views.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix malformed starting tags: < tag -> <tag
content = re.sub(r'<\s+([a-zA-Z0-9]+)', r'<\1', content)
# Fix malformed closing tags: </ tag -> </tag
content = re.sub(r'</\s+([a-zA-Z0-9]+)', r'</\1', content)
# Fix combined malformed tags: </ tag > -> </tag>
content = re.sub(r'</\s+([a-zA-Z0-9]+)\s+>', r'</\1>', content)
# Fix specific comment artifacts: -- tag -- > -> --tag-->
content = re.sub(r'--\s+>', r'-->', content)

# Fix specific stray artifacts found in previous steps
content = content.replace('</div >', '</div>')
content = content.replace('</tr >', '</tr>')
content = content.replace('</span >', '</span>')

# Handle the specific duplicate/stray block that was causing issues
# Pattern: }; [whitespace] `; }
content = re.sub(r'};\s+`;\s+}', r'};\n', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Comprehensive file cleanup completed.")
