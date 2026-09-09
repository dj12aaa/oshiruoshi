import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RUNTIME_EXTENSION=/\.(?:js|mjs|cjs|jsx|ts|mts|cts|tsx|py|rb|go)$/i;
const DECLARATION_FILE=/\.d\.(?:ts|mts|cts)$/i;

export function listVercelFunctions(apiDirectory){
  const directoryPath=apiDirectory instanceof URL ? fileURLToPath(apiDirectory) : apiDirectory;
  const root=path.resolve(directoryPath);
  const functions=[];

  function walk(directory){
    for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
      // Vercel treats underscore/dot-prefixed API files and folders as helpers.
      if(/^[_.]/.test(entry.name))continue;
      const absolute=path.join(directory,entry.name);
      if(entry.isDirectory()){
        walk(absolute);
      }else if(entry.isFile()&&RUNTIME_EXTENSION.test(entry.name)&&!DECLARATION_FILE.test(entry.name)){
        functions.push(path.relative(root,absolute).split(path.sep).join('/'));
      }
    }
  }

  walk(root);
  return functions.sort();
}

export function assertVercelFunctionBudget(apiDirectory,{max=12,reserve=1}={}){
  const functions=listVercelFunctions(apiDirectory);
  const allowed=max-reserve;
  if(functions.length>allowed){
    throw new Error(`Vercel function budget exceeded: ${functions.length}/${max}; ${reserve} slot reserve required; ${functions.join(', ')}`);
  }
  return {count:functions.length,max,reserve,functions};
}

const invokedPath=process.argv[1] ? path.resolve(process.argv[1]) : '';
if(invokedPath===fileURLToPath(import.meta.url)){
  const result=assertVercelFunctionBudget(path.resolve('api'));
  console.log(JSON.stringify(result));
}
