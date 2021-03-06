var Stack = (function(module){
  var objects   = require('./objects'),
      functions = require('./functions'),
      iteration = require('./iteration');

  var define        = objects.define,
      inherit       = objects.inherit,
      toArray       = functions.toArray,
      iterate       = iteration.iterate,
      Iterator      = iteration.Iterator,
      StopIteration = iteration.StopIteration;


  function StackIterator(stack){
    this.stack = stack;
    this.index = stack.length;
  }

  inherit(StackIterator, Iterator, [
    function next(){
      if (!this.index) {
        throw StopIteration;
      }
      return this.stack[--this.index];
    }
  ]);

  function Stack(iterable){
    this.empty();
    if (iterable != null) {
      iterate(iterable, this.push, this);
    }
  }

  define(Stack.prototype, [
    function push(item){
      this.items.push(item);
      this.length++;
      this.top = item;
      return this;
    },
    function pop(){
      this.length--;
      this.top = this.items[this.length - 1];
      return this.items.pop();
    },
    function empty(){
      this.length = 0;
      this.items = [];
      this.top = undefined;
    },
    function find(callback, context){
      var i = this.length;
      context || (context = this);
      while (i--) {
        if (callback.call(context, this.items[i], i, this)) {
          return this.items[i];
        }
      }
    },
    function filter(callback, context){
      var i = this.length,
          out = new Stack;

      context || (context = this);

      for (var i=0; i < this.length; i++) {
        if (callback.call(context, this[i], i, this)) {
          out.push(this[i]);
        }
      }

      return out;
    },
    function __iterator__(){
      return new StackIterator(this);
    }
  ]);

  return module.exports = Stack;
})(typeof module !== 'undefined' ? module : {});
