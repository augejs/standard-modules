import { Metadata } from '@augejs/module-core';

export function Prefix(path?:string): ClassDecorator {
  return (target: Function) => {
    Prefix.defineMetadata(target, path || '');
  }
}

Prefix.defineMetadata = (target: object, path: string) => {
  Metadata.defineMetadata(Prefix, path, target);
}

Prefix.getMetadata = (target: object): string => {
  return Metadata.getMetadata(Prefix, target) || '';
}
