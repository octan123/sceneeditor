#!/usr/bin/env bash

cd /home/tj/workspace/poc/visualize
source devel/setup.bash

nohup roslaunch rosbridge_server rosbridge_websocket.launch &

rosclean check
echo y | rosclean purge
# y
rosbag play -l 2020-12-27-13-41-42.bag