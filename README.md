# empower.js

Empower regular JavaScript objects with shorthand routines

## Getting Started

empower.js works in Node and browsers, and supports amd loaders.

Install it via Yarn:

	yarn add empowerjs

Install it via NPM:

	npm install empowerjs

or with Bower:

	bower install empowerjs

## Functions


#### *Empower(object|string|number|array|function)*

Creates an empowered version of the passed object

```js
var man = {
  name: 'superman',
  age: 29,
  spouse: undefined,
  faceMask: null,
  species: 'kryptonians',
  father: {
  	name: 'Zor-El'
  },
  category: 'superhero',
  grow: function() {
  	this.age++;
  }
};

$man = Empower(man);
$man.value(); //return original man object
$man.name; //superman
$man.clean(); //undefined and null values will be removed (e.g. spouse, faceMask)
$man.$name.spaceOut(); // man.name = s u p e r m a n
$man.$name.reverse();  // man.name = n a m r e p u s
$man.$father.$name.reverse();  // man.father.name = 'lE-roZ'
$man.$species.singularize();  // man.species = 'kryptonian'
$man.$category.pluralize();  // man.category = 'superheroes'
$man.$grow.run();  // man.age = 30
$man.$grow.runEvery(2000);  // will run man.grow() every 2 seconds
$man.$grow.cancelRuns();  // will cancel previous periodic run
```

## Documentation

Coming soon.


## Running the tests

empower.js comes with automated tests that can be run by installing `devDependencies` and running:

	npm test

## Contributing

Please feel free to add more functions to the suite and submit pull requests to us. If you have a better version of an existing function, that will be highly valued, too.

## Authors

* **Riten Vagadiya** [ritenv](https://github.com/ritenv)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
