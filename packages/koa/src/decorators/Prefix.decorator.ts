import { Metadata } from '@augejs/core';

export function Prefix(path?:string): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: Function) => {
    Prefix.defineMetadata(target, path || '');
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
Prefix.defineMetadata = (target: object, path: string) => {
  Metadata.defineMetadata(Prefix, path, target);
}

// eslint-disable-next-line @typescript-eslint/ban-types
Prefix.getMetadata = (target: object): string => {
  return Metadata.getMetadata(Prefix, target) as string || '';
}
