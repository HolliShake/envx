
# DTO-ENVX

## A dynamic environment variable evaluator that compiles to bytecode (simple array of bytes or not 😄) with a custom language and vm.

### Support
- [x] Vite support
- [ ] Webpack support

### Features
- [x] if/else statement
- [ ] switch statement and expression
- [ ] class declairation
- [x] function declairation
- [x] number
- [x] string
- [x] boolean
- [x] null
- [ ] undefined
- [x] array
- [x] method call
- [x] function call
- [x] attribute access
- [ ] index
- [ ] object/hashmap
- [x] while loop
- [x] do-while loop
- [ ] for loop
- [x] type prototypes for method
- [x] JS interoperability

### How to use

```js
/**** vite.config.js **/
// ...other imports
import envxPluginVite from 'dto-envx/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    envxPluginVite()
  ]
});

/**** page.(vue | jsx | tsx) **/
import { envx, envxCall } from 'env:dto-envx'; // import 'env:dto-envx' instead of 'dto-envx'

// Get variable defined inside env file
envx("SOME_VARIABLE_DEFINED_INSIDE_ENV_FILE");

// Call function inside env file
envxCall("someFunctionDefine", "arg0", "arg1");
```

### Example code:

<span>file: development.envx</span>
```js
var REACT_APP_API_URL="https://public-domain.com/api";

fn fact(n) {
    if (n <= 1) 
        return 1;
    return n * fact(n - 1);
}

fn add(a, b) {
    return a + b;
}

const PRIVATE_HASH = "qsdad123q3";

fn getHash() {
    return PRIVATE_HASH;
}

fn printArray(arr) {
    println(arr);
    return arr.toString();
}
```

### Example code: Javascript interoperability
```js
const { envx, envxCall } = require('dto-envx');

console.log("JS:>>", envx    ('REACT_APP_API_URL'));
console.log("JS:>>", envxCall("fact", 5));
console.log("JS:>>", envxCall("add" , 69, 420));
console.log("JS:>>", envx    ('PRIVATE_HASH')); // hidden private variable basta nag start sa 'PRIVATE_'
console.log("JS:>>", envxCall("getHash")); // Need ug getter para ma access ang private variable
console.log("JS:>>", envxCall("println", "From dto-envx :>>", 1, 2, 4, 5, 6, "Hello!"));
console.log("JS:>>", envxCall("printArray", [6,9,4,2,0]));
```