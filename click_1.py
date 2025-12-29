"""
RUN WITH: 
python click_1.py <minutes>
"""

import subprocess
import time
import sys

X = 1150
Y = 838
first = True

if len(sys.argv) != 2:
    print("Usage: python click_1.py <minutes>")
    sys.exit(1)

minutes = float(sys.argv[1])
end_time = time.time() + minutes * 60

time.sleep(10)

while time.time() < end_time:

    if not first:
        subprocess.run(["cliclick", f"c:{X},{Y-200}"])

    time.sleep(1)
    subprocess.run(["cliclick", f"c:{X},{Y-200}"])

    time.sleep(1)
    subprocess.run(["cliclick", f"c:{X},{Y}"])

    time.sleep(79)
    first = False

print("Done.")
