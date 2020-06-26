import {Node} from 'unist';
import {VFile} from 'vfile';
interface CFile extends VFile {
  data: {
    title: string;
  };
}
export declare function attacher(): (tree: Node, file: CFile) => void;
export {};
