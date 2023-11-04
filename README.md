# rewrite-imports-es6

A tool that uses [recast](https://github.com/benjamn/recast) to rewrite imports in ES6 modules to use a different path.

Rewrites the import to remove the specified import name and replace it with a specified path.

## What it does
For example if you are importing a module like this, where the feature import is from a top-level directory:

```jsx
import {
  AnotherFeature,
  CoolFeature,
  OneMoreFeature,
} from "./features";

console.log(AnotherFeature());
console.log(CoolFeature());
console.log(OneMoreFeature());
```

You can use this tool to change it to a more specific path like this:

```jsx
import { AnotherFeature, OneMoreFeature } from "./features";
import CoolFeature from "features/cool_feature/CoolFeature";

console.log(AnotherFeature());
console.log(CoolFeature());
console.log(OneMoreFeature());
```
