// Type declarations for modules without type definitions

declare module 'connect-timeout' {
  import { RequestHandler } from 'express';
  function timeout(time: string | number, options?: {
    respond?: boolean;
    disable?: Record<string, boolean>;
  }): RequestHandler;
  export = timeout;
}

declare module 'compression' {
  import { RequestHandler } from 'express';
  function compression(options?: {
    threshold?: number;
    level?: number;
    filter?: (req: any, res: any) => boolean;
  }): RequestHandler;
  export = compression;
}

declare module 'swagger-ui-express' {
  import { RequestHandler, Router } from 'express';
  
  export function serve(path?: string, options?: any): RequestHandler[];
  export function setup(spec: any, options?: any, fileOptions?: any): RequestHandler;
  export function serveFiles(fileOptions?: any): RequestHandler;
  export function serveWithOptions(options?: any): RequestHandler[];
  export const serveStatic: RequestHandler;
  
  export interface SwaggerOptions {
    explorer?: boolean;
    customCss?: string;
    customCssUrl?: string;
    customJs?: string;
    customJsUrl?: string;
    swaggerUrl?: string;
    swaggerUrls?: string[];
    swaggerOptions?: any;
    showExplorer?: boolean;
    swaggerVersion?: string;
    swaggerDocumentOptions?: any;
    customSiteTitle?: string;
    customfavIcon?: string;
    isExplorer?: boolean;
  }
}

// Add custom properties to Express Request
declare namespace Express {
  export interface Request {
    timedout?: boolean;
    on(event: 'timeout', listener: () => void): this;
  }
}