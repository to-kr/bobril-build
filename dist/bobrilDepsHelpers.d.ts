import * as compilationCache from './compilationCache';
export declare function tslibSource(): string;
export declare function systemJsPath(): string;
export declare function systemJsFiles(): string[];
export declare function loaderJsPath(): string;
export declare function loaderJsFiles(): string[];
export declare function numeralJsPath(): string;
export declare function numeralJsFiles(): string[];
export declare function momentJsPath(): string;
export declare function momentJsFiles(): string[];
export declare function systemJsBasedIndexHtml(project: compilationCache.IProject): string;
export declare function bundleBasedIndexHtml(project: compilationCache.IProject): string;
export declare function examplesListIndexHtml(fileNames: string[], project: compilationCache.IProject): string;
export declare function getModuleMap(project: compilationCache.IProject): string;
export declare function fastBundleBasedIndexHtml(project: compilationCache.IProject): string;
export declare function fastBundleBasedTestHtml(project: compilationCache.IProject): string;
export declare function updateIndexHtml(project: compilationCache.IProject): void;
export declare function updateTestHtml(project: compilationCache.IProject): void;
export declare function writeTranslationFile(g11nVersion: number, locale: string, translationMessages: string[], filename: string, write: (fn: string, b: Buffer) => void): void;
export declare function updateSystemJsByCC(cc: compilationCache.CompilationCache, write: (fn: string, b: Buffer) => void): void;
export declare function updateLoaderJsByCC(cc: compilationCache.CompilationCache, write: (fn: string, b: Buffer) => void, prependDestPath: string): void;
