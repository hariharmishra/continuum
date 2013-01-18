import {
  ToObject,
  ToPropertyKey,
  ToString,
  ToUint32
} from '@@operations';

import {
  ObjectCreate,
  Type
} from '@@types';

import {
  builtinClass,
  builtinFunction,
  call
} from '@@utilities';

import {
  $$Get,
  $$Invoke
} from '@@internals';


export class Proxy {
  constructor(target, handler){
    ensureObject(target, 'Proxy');
    ensureObject(handler, 'Proxy');
    return $__ProxyCreate(target, handler);
  }
}

builtinClass(Proxy);

$__delete(Proxy, 'prototype');

const normal = { writable: true,
                 enumerable: true,
                 configurable: true };

export class Handler {
  getOwnPropertyDescriptor(target, propertyKey){
    //throw $__Exception('missing_fundamental_trap', ['getOwnPropertyDescriptor']);
    return getOwnPropertyDescriptor(target, propertyKey);
  }

  getOwnPropertyNames(target){
    //throw $__Exception('missing_fundamental_trap', ['getOwnPropertyNames']);
    return getOwnPropertyNames(target);
  }

  getPrototypeOf(target){
    //throw $__Exception('missing_fundamental_trap', ['getPrototypeOf']);
    return getPrototypeOf(target);
  }

  setPrototypeOf(target, proto){
    //throw $__Exception('missing_fundamental_trap', ['setPrototypeOf']);
    return setPrototypeOf(target, proto);
  }

  defineProperty(target, propertyKey, desc){
    //throw $__Exception('missing_fundamental_trap', ['defineProperty']);
    return defineProperty(target, propertyKey, desc);
  }

  deleteProperty(target, propertyKey){
    //throw $__Exception('missing_fundamental_trap', ['deleteProperty']);
    return deleteProperty(target, propertyKey);
  }

  preventExtensions(target){
    //throw $__Exception('missing_fundamental_trap', ['preventExtensions']);
    return preventExtensions(target);
  }

  isExtensible(target){
    //throw $__Exception('missing_fundamental_trap', ['isExtensible']);
    return isExtensible(target);
  }

  apply(target, thisArg, args){
    //throw $__Exception('missing_fundamental_trap', ['apply']);
    return apply(target, thisArg, args);
  }

  seal(target) {
    if (!this.preventExtensions(target)) return false;

    const props = this.getOwnPropertyNames(target),
          len   = ToUint32(props.length);

    for (var i = 0; i < len; i++) {
      success = success && this.defineProperty(target, props[i], { configurable: false });
    }
    return success;
  }

  freeze(target){
    if (!this.preventExtensions(target)) return false;

    const props = this.getOwnPropertyNames(target),
          len   = ToUint32(props.length);

    for (var i = 0; i < len; i++) {
      const propertyKey = props[i];
      let desc = this.getOwnPropertyDescriptor(target, propertyKey);

      if (desc) {
        desc = 'writable' in desc || 'value' in desc
              ? { configurable: false, writable: false }
              : { configurable: false };
        success = success && this.defineProperty(target, propertyKey, desc);
      }
    }

    return success;
  }

  isSealed(target){
    const props = this.getOwnPropertyNames(target),
          len   = ToUint32(props.length);

    for (var i = 0; i < len; i++) {
      const desc = this.getOwnPropertyDescriptor(target, props[i]);

      if (desc && desc.configurable) {
        return false;
      }
    }

    return !this.isExtensible(target);
  }

  isFrozen(target){
    const props = this.getOwnPropertyNames(target),
          len   = ToUint32(props.length);

    for (var i = 0; i < len; i++) {
      const desc = this.getOwnPropertyDescriptor(target, props[i]);

      if (desc.configurable || ('writable' in desc || 'value' in desc) && desc.writable) {
        return false;
      }
    }

    return !this.isExtensible(target);
  }

  has(target, propertyKey){
    const desc = this.getOwnPropertyDescriptor(target, propertyKey);
    if (desc) {
      return true;
    }

    const proto = $$Invoke(target, 'GetInheritance');
    return proto === null ? false : this.has(proto, propertyKey);
  }

  hasOwn(target, propertyKey){
    return this.getOwnPropertyDescriptor(target, propertyKey) !== undefined;
  }

  get(target, propertyKey, receiver = target){
    const desc = this.getOwnPropertyDescriptor(target, propertyKey);

    if (desc === undefined) {
      const proto = $$Invoke(target, 'GetInheritance');
      return proto === null ? undefined : this.get(proto, propertyKey, receiver);
    }

    if ('writable' in desc || 'value' in desc) {
      return desc.value;
    }

    const getter = desc.get;
    return getter === undefined ? undefined : call(getter, receiver);
  }

  set(target, propertyKey, value, receiver) {
    const ownDesc = this.getOwnPropertyDescriptor(target, propertyKey);

    if (ownDesc !== undefined) {
      if ('get' in ownDesc || 'set' in ownDesc) {
        const setter = ownDesc.set;
        if (setter === undefined) {
          return false;
        }
        call(setter, receiver, [value]);
        return true;
      } else if (ownDesc.writable === false) {
        return false;
      } else if (receiver === target) {
        $__DefineOwnProperty(receiver, propertyKey, { value: value });
        return true;
      } else if (!$__IsExtensible(receiver)) {
        return false;
      }
      normal.value = value;
      $__DefineOwnProperty(receiver, propertyKey, normal);
      normal.value = undefined;
      return true;
    }

    const proto = $$Invoke(target, 'GetInheritance');
    if (proto === null) {
      if (!$__IsExtensible(receiver)) {
        return false;
      }
      normal.value = value;
      $__DefineOwnProperty(receiver, propertyKey, normal);
      normal.value = undefined;
      return true;
    }

    return this.set(proto, propertyKey, value, receiver);
  }

  enumerate(target){
    const result = this.getOwnPropertyNames(target),
          len    = ToUint32(result.length),
          result = [];

    for (var i = 0; i < len; i++) {
      const propertyKey = ToString(result[i]),
            desc = this.getOwnPropertyDescriptor(propertyKey);

      if (desc != null && desc.enumerable) {
        result.push(propertyKey);
      }
    }

    const proto = $$Invoke(target, 'GetInheritance');

    return proto === null ? result : result.concat(enumerate(proto));
  }

  keys(target){
    const result = this.getOwnPropertyNames(target),
          len    = ToUint32(result.length);
          result = [];

    for (var i = 0; i < len; i++) {
      const propertyKey = ToString(result[i]),
            desc = this.getOwnPropertyDescriptor(propertyKey);

      if (desc != null && desc.enumerable) {
        result.push(propertyKey);
      }
    }

    return result;
  }

  construct(target, args) {
    const proto    = this.get(target, 'prototype', target),
          instance = Type(proto) === 'Object' ? ObjectCreate(proto) : {},
          result   = this.apply(target, instance, args);

    return Type(result) === 'Object' ? result : instance;
  }
}

builtinClass(Handler);



export function apply(target, thisArg, args){
  ensureFunction(target, '@reflect.apply');
  return $$Invoke(target, 'Call', thisArg, $$Get(ensureArgs(args), 'array'));
}

builtinFunction(apply);


export function construct(target, args){
  ensureFunction(target, '@reflect.construct');
  return $$Invoke(target, 'Construct', $$Get(ensureArgs(args), 'array'));
}

builtinFunction(construct);


export function defineProperty(target, propertyKey, attributes){
  ensureObject(target, '@reflect.defineProperty');
  ensureDescriptor(attributes);
  return $__DefineOwnProperty(target, ToPropertyKey(propertyKey), attributes);
}

builtinFunction(defineProperty);


export function deleteProperty(target, propertyKey){
  ensureObject(target, '@reflect.deleteProperty');
  return $__Delete(target, ToPropertyKey(propertyKey), false);
}

builtinFunction(deleteProperty);


export function enumerate(target){
  return $__Enumerate(ToObject(target), true, true);
}

builtinFunction(enumerate);


export function freeze(target){
  if (Type(target) !== 'Object' || !$$Invoke(target, 'PreventExtensions')) {
    return false;
  }

  const props = $__Enumerate(target, false, false),
        len   = props.length;

  letsuccess = true;

  for (var i = 0; i < len; i++) {
    const desc = $__GetOwnProperty(target, props[i]),
          attrs = 'writable' in desc || 'value' in desc
            ? { configurable: false, writable: false }
            : desc !== undefined
              ? { configurable: false }
              : null;

    if (attrs !== null) {
      success = success && $__DefineOwnProperty(target, props[i], attrs);
    }
  }

  return success;
}

builtinFunction(freeze);


export function get(target, propertyKey, receiver = target){
  return $__GetP(ToObject(target), ToPropertyKey(propertyKey), ToObject(receiver));
}

builtinFunction(get);


export function getOwnPropertyDescriptor(target, propertyKey){
  ensureObject(target, '@reflect.getOwnPropertyDescriptor');
  return $__GetOwnProperty(target, ToPropertyKey(propertyKey));
}

builtinFunction(getOwnPropertyDescriptor);


export function getOwnPropertyNames(target){
  ensureObject(target, '@reflect.getOwnPropertyNames');
  return $__Enumerate(target, false, false);
}

builtinFunction(getOwnPropertyNames);


export function ownKeys(target){
  ensureObject(target, '@reflect.ownKeys');
  // TODO implement OwnPropertyKeys
  //return $__OwnPropertyKeys(target, false, false);
}

builtinFunction(getOwnPropertyNames);

export function getPrototypeOf(target){
  ensureObject(target, '@reflect.getPrototypeOf');
  return $$Invoke(target, 'GetInheritence');
}

export function setPrototypeOf(target, proto){
  ensureObject(target, '@reflect.setPrototypeOf');
  ensureProto(proto, '@reflect.setPrototypeOf');
  return $$Invoke(target, 'SetInheritance', proto);
}

builtinFunction(getPrototypeOf);


export function has(target, propertyKey){
  return $$Invoke(ToObject(target), 'HasProperty', ToPropertyKey(propertyKey));
}

builtinFunction(has);


export function hasOwn(target, propertyKey){
  return $$Invoke(ToObject(target), 'HasOwnProperty', ToPropertyKey(propertyKey));
}

builtinFunction(hasOwn);


export function isFrozen(target){
  ensureObject(target, '@reflect.isFrozen');

  if ($$Invoke(target, 'IsExtensible')) {
    return false;
  }

  const props = $__Enumerate(target, false, false);

  for (var i=0; i < props.length; i++) {
    const desc = $__GetOwnProperty(target, props[i]);
    if (desc && desc.configurable || 'writable' in desc && desc.writable) {
      return false;
    }
  }

  return true;
}

builtinFunction(isFrozen);


export function isSealed(target){
  ensureObject(target, '@reflect.isSealed');

  if ($$Invoke(target, 'IsExtensible')) {
    return false;
  }

  const props = $__Enumerate(target, false, false);

  for (var i=0; i < props.length; i++) {
    const desc = $__GetOwnProperty(target, props[i]);
    if (desc && desc.configurable) {
      return false;
    }
  }

  return true;
}

builtinFunction(isSealed);


export function isExtensible(target){
  ensureObject(target, '@reflect.isExtensible');
  return $$Invoke(target, 'IsExtensible');
}

builtinFunction(isExtensible);


export function keys(target){
  ensureObject(target, '@reflect.keys');
  return $__Enumerate(target, false, true);
}

builtinFunction(keys);


export function preventExtensions(target){
  return Type(target) === 'Object' ? $$Invoke(target, 'PreventExtensions') : false;
}

builtinFunction(preventExtensions);


export function seal(target){
  if (Type(target) !== 'Object') {
    return false;
  }

  let success = $$Invoke(target, 'PreventExtensions');
  if (!success) {
    return success;
  }

  const props = $__Enumerate(target, false, false),
        len   = props.length,
        desc  = { configurable: false };

  for (var i = 0; i < len; i++) {
    success = success && $__DefineOwnProperty(target, props[i], desc);
  }

  return success;
}

builtinFunction(seal);


export function set(target, propertyKey, value, receiver = target){
  return $__SetP(ToObject(target), ToPropertyKey(propertyKey), value, ToObject(receiver));
}

builtinFunction(set);
