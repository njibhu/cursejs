# cursejs

A nodeJS based implementation of the CurseAPI for bot and third party apps developers.
**The library is not considered yet to be stable**.

If you want to join the project, or just discuss about Curse implementations you can join us in the [Curse unofficial API dev server](https://curse.com/invite/61EMImhMj0GJcXz8xBkoGg).

## Documentation

[Library documentation](https://njibhu.github.io/cursejs)

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
