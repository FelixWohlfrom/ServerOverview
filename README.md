# ServerOverview
Nodejs based real time server status overview page. Collects and displays the current status
of servers. Server information is collected from json format. Currently, the nodejs format
of https://github.com/FelixWohlfrom/ServerStatus is supported.
Communication between website and overview collection server is done using websockets to
update the information in real time.

## Usage
Configure the overview page in config.js.
Install dependencies using "npm install".
Start the server using "npm start".
With the default configuration, it you can open your browser on http://localhost:8080 and see
the overview.

## Requirements
npm 2.9.1
nodejs 0.10
