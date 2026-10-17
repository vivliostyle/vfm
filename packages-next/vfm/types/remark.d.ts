declare module 'md-attr-parser' {
  export default function (
    value: string,
    indexNext?: number,
  ): {
    prop: {
      id?: string;
      class?: string[];
      [key: string]: unknown;
    };
    eaten: string;
  };
}

/** Key/Value pair. */
type KeyValue = { [key: string]: any };
