# cursejs

A nodeJS based implementation of the CurseAPI for bot developers.
**This is far from being any close to stable**

There is no documentation yet, for now the focus is on having basic features ready, but doc should come soon!
If you want to join the project, or just discuss about Curse implementations you can join the curse server in the related projects section below.

## Installing

```
npm install git://github.com/njibhu/cursejs.git
```

## Use of library

```javascript
var cursejs = require('cursejs');
var client = new cursejs.Client;

//This is a very basic command handling
client.on('message_received', function(message){
    if(message.content === "!ping"){
        message.reply("pong!");
    }
});

client.run("LOGIN", "PASSWORD");
```

## Requirements

- NodeJS 4+
- `ws` library
- `winston` library

Usually `npm` will handle these for you.

## Related Projects

- [Curse unofficial API dev server](https://curse.com/invite/61EMImhMj0GJcXz8xBkoGg)
- [Java CurseLib](https://github.com/AlexMog/CurseLib)
