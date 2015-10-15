---
title: Setting Up Mocha for Test Driven Development (TDD)
category: node,javascript,tdd
tags: javascript,node.js,node,tdd,mocha
---

# {{ page.title }}

## Node.js

{% highlight bash %}
npm init
npm install --save-dev mocha
npm install --save expect.js
{% endhighlight %}

Modify `scripts` list in package.json:
{% highlight json %}
  "scripts": {
    "test": "mocha -u bdd -R spec -t 500 --recursive",
    "watch": "mocha -u bdd -R spec -t 500 --recursive --watch"
  },
{% endhighlight %}

For convenience you can create a `watch.cmd` file:

```bat
npm run watch
```



