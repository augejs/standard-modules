import { ScanNode } from "@augejs/core";

export interface FileConfigOpts {
  filePath?: string
  processor?: (result: any, scanNode?: ScanNode) => any | Promise<any>
}
