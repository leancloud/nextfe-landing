module.exports ={
  "root" : true,
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module"
  },
  "env": {
    "es6": true,
    "node": true
  },
  "extends": "airbnb",
  "rules": {
    'strict': 0,
    'no-var': 'error',
    "no-console": "off",
    'semi': [2, 'always'],
    'quotes': ['error', 'single'],
    'linebreak-style': ['error', 'unix'],
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    // 数组和对象键值对最后一个逗号， never参数：不能带末尾的逗号, always参数：必须带末尾的逗号，
    'comma-dangle': [2, 'never'],
    'no-multi-spaces': 1,
    'react/jsx-tag-spacing': 1, // 总是在自动关闭的标签前加一个空格，正常情况下也不需要换行
    'jsx-quotes': 1,
    'react/jsx-boolean-value': 1, // 如果属性值为 true, 可以直接省略
    'react/self-closing-comp': 1, // 对于没有子元素的标签来说总是自己关闭标签
    'jsx-a11y/href-no-hash': 'off' // 关闭这条规则　版本冲突导致规则缺失
  }
}
