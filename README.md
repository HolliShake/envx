
# DTO-ENVX

## A dynamic environment variable evaluator with a custom language and vm.

### Support
- [x] Vite support
- [ ] React support


### Example code:

<span>file: development.envx</span>
```js
var REACT_APP_API_URL="https://madafaka.io/api";

const KKL = REACT_APP_API_URL + "<<" + ">>";

println(KKL);

fn fact(n) {
    if (n <= 1) 
        return 1;
    return n * fact(n - 1);
}

fn add(a, b) {
    return a + b;
}

println(add(50, 2));

println("\"Hello" + " " + "World!!!\"");

const x = 2 + "asd";

println(x);

println(fact(
    100
));

println(":>>", REACT_APP_API_URL);

fn bark() {
    local sound = "ArF!!";
    println(">>", sound, REACT_APP_API_URL);
}

const h = bark();
println(h);

println(">>:", fact(5));

2 / 1;

println(2 % 2, 4 + 1);

2 << 2;

println(2 == 2);
```

### Example code: Javascript interpolation
```js
const { envx, runTest, envxCall } = require('dto-envx/src/app.js');

runTest();

console.log("JS:>>", envx    ('REACT_APP_API_URL'));
console.log("JS:>>", envxCall("fact", 5));
console.log("JS:>>", envxCall("add" , 69, 420));
console.log("JS:>>", envx    ('PRIVATE_HASH')); // hidden private variable bast nag start sa 'PRIVATE_'
console.log("JS:>>", envxCall("getHash")); // Need ug getter para ma access ang private variable
console.log("JS:>>", envxCall("println", "From dto-envx :>>", 1, 2, 4, 5, 6, "Hello!"));

console.log("JS:>>", envxCall("printArray", [6,9,4,2,0]));
```