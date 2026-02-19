import re

with open('src/server.js', 'r') as f:
    content = f.read()

# Remove strings
content = re.sub(r'\"(?:\\.|[^\"\\])*\"', '', content)
content = re.sub(r"\'(?:\\.|[^\'\\])*\'", '', content)
content = re.sub(r'\`(?:\\.|[^\`\\])*\`', '', content)
# Remove comments
content = re.sub(r'//.*', '', content)
content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)

open_braces = content.count('{')
close_braces = content.count('}')

print(f"Open: {open_braces}, Close: {close_braces}")
if open_braces != close_braces:
    print("Braces mismatch!")
else:
    print("Braces matched.")

# Also check balance at marker lines
lines = content.splitlines()
balance = 0
for i, line in enumerate(lines):
    balance += line.count('{') - line.count('}')
    # Check lines around marks
    # We strip empty lines for printing
    if "MARK 2000" in line or "MARK 8000" in line or "app.listen" in line:
        print(f"Line {i+1}: Balance {balance}")
    if balance < 0:
        print(f"Line {i+1}: Negative balance {balance}!")

