"""
RUN WITH: 
python click_1.py <minutes> <streaming_service>
"""

import subprocess
import time
import sys

first = True
TARGET_FRAMES = 200

if len(sys.argv) != 3:
    print("Usage: python click_1.py <minutes> <streaming_service>")
    sys.exit(1)

minutes = float(sys.argv[1])
service = sys.argv[2]
min_between_each_frame = minutes / TARGET_FRAMES
if service not in ["NETFLIX", "HBOMAX"]:
    print("Streaming service not recognized!")
    sys.exit(1)

print(f"This script will capture {minutes//min_between_each_frame} frames.\n")

time.sleep(10)

if service == "NETFLIX":
    X = 1150
    Y = 838
    end_time = time.time() + minutes * 60 / 1.5
    time_to_sleep_between_captures = min_between_each_frame*60/1.5-1
else:
    X = 1203
    Y = 848
    end_time = time.time() + minutes * 60
    time_to_sleep_between_captures = min_between_each_frame*60-1

while time.time() < end_time:

    if service == "NETFLIX":
        if not first:
            subprocess.run(["cliclick", f"c:{X},{Y-200}"])
            time.sleep(1)
    else:
        if first:
            subprocess.run(["cliclick", f"c:{X},{Y-200}"])
            time.sleep(1)

    subprocess.run(["cliclick", f"c:{X},{Y-200}"])
    time.sleep(1)
    subprocess.run(["cliclick", f"c:{X},{Y}"])

    time.sleep(time_to_sleep_between_captures)
    first = False

print("Done.")
